// game.js — Project Acecent
// Game state, phase management, redraw logic

import { getDailyDeck, getDailyDateString } from './deck.js';
import { calculateLaunch } from './effects.js';

const HAND_SIZE = 5;
const BASE_REDRAWS = 2;

const PHASES = {
  NAME_ENTRY: 'name_entry',
  HAND:       'hand',
  LAUNCH:     'launch',
  RESULT:     'result',
};

class GameState {
  constructor() {
    this.phase = PHASES.NAME_ENTRY;
    this.playerName = '';
    this.dateString = getDailyDateString();

    const { deck, rng } = getDailyDeck();
    this.deck = deck;
    this.rng = rng;
    this.drawIndex = 0; // next card to draw from deck

    this.hand = [];        // current 5-card hand (held)
    this.burnedCards = []; // cards discarded as fuel
    this.selectedForDiscard = []; // ordered array of card ids — order = burn order

    this.redraws = BASE_REDRAWS;
    this.redrawsUsed = 0;
    this.extraPeeks = 0; // extra cards revealed in peek strip

    this.launchResult = null; // { altitude, tier, log }

    this.listeners = []; // UI update callbacks
  }

  // --- Setup ---

  setPlayerName(name) {
    this.playerName = name.trim();
    localStorage.setItem('acecent_player_name', this.playerName);
  }

  startGame() {
    this.phase = PHASES.HAND;
    this.dealInitialHand();
    this.emit('stateChange');
  }

  dealInitialHand() {
    this.hand = [];
    for (let i = 0; i < HAND_SIZE; i++) {
      this.hand.push(this.drawCard());
    }
  }

  drawCard() {
    if (this.drawIndex >= this.deck.length) {
      // Deck exhausted — shouldn't happen in normal play
      console.warn('Deck exhausted');
      return null;
    }
    return this.deck[this.drawIndex++];
  }

  // --- Selection ---

  toggleSelectCard(cardId) {
    if (this.phase !== PHASES.HAND) return;
    const idx = this.selectedForDiscard.indexOf(cardId);
    if (idx !== -1) {
      // Deselect — remove and shift everything after it down
      this.selectedForDiscard.splice(idx, 1);
    } else {
      // Select — append to end
      this.selectedForDiscard.push(cardId);
    }
    this.emit('stateChange');
  }

  // Get burn order number for a card (1-based), or 0 if not selected
  burnOrderOf(cardId) {
    const idx = this.selectedForDiscard.indexOf(cardId);
    return idx === -1 ? 0 : idx + 1;
  }

  // --- Redraw ---

  canRedraw() {
    return this.redraws > 0 && this.selectedForDiscard.length > 0 && this.phase === PHASES.HAND;
  }

  doRedraw() {
    if (!this.canRedraw()) return;

    const discardedIds = [...this.selectedForDiscard];

    // Build discard list in selection order, kept list preserves hand order
    const discarded = discardedIds.map(id => this.hand.find(c => c.id === id)).filter(Boolean);
    const kept = this.hand.filter(c => !discardedIds.includes(c.id));

    // Burn in selection order
    for (const card of discarded) {
      this.burnedCards.push(card);
      if (card.burnEffect) {
        const result = card.burnEffect.fn();
        if (result.redraws) {
          this.redraws += result.redraws;
          this.emit('redrawBonus', { card, bonus: result.redraws, message: result.message });
        }
        if (result.extraPeek) {
          this.extraPeeks += result.extraPeek;
          this.emit('redrawBonus', { card, bonus: 0, message: result.message });
        }
      }
    }

    this.redraws--;
    this.redrawsUsed++;

    // Always draw exactly discardedIds.length replacements — not discarded.length
    // discardedIds.length is the source of truth for how many cards left the hand
    const newCards = [];
    for (let i = 0; i < discardedIds.length; i++) {
      const drawn = this.drawCard();
      if (drawn) newCards.push(drawn);
    }

    this.hand = [...kept, ...newCards];
    this.selectedForDiscard = [];

    this.emit('stateChange');
  }

  // --- Launch ---

  canLaunch() {
    return this.phase === PHASES.HAND && this.hand.length === HAND_SIZE;
  }

  doLaunch() {
    if (!this.canLaunch()) return;

    this.phase = PHASES.LAUNCH;
    this.emit('stateChange');

    // Calculate result
    this.launchResult = calculateLaunch(this.hand, this.burnedCards, this.rng);

    // Save to localStorage
    this.saveResult();

    this.emit('launchComplete', this.launchResult);
  }

  // --- Persistence ---

  saveResult() {
    const data = {
      date: this.dateString,
      playerName: this.playerName,
      altitude: this.launchResult.altitude,
      tier: this.launchResult.tier,
      hand: this.hand.map(c => c.id),
      burned: this.burnedCards.map(c => c.id),
      log: this.launchResult.log,
    };
    localStorage.setItem('acecent_result', JSON.stringify(data));
    localStorage.setItem('acecent_result_date', this.dateString);
  }

  loadTodayResult() {
    const savedDate = localStorage.getItem('acecent_result_date');
    if (savedDate !== this.dateString) return null;
    const raw = localStorage.getItem('acecent_result');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  hasTodayResult() {
    return this.loadTodayResult() !== null;
  }

  // --- Event System ---

  on(event, cb) {
    this.listeners.push({ event, cb });
  }

  emit(event, data) {
    for (const l of this.listeners) {
      if (l.event === event) l.cb(data);
    }
  }
}

// Build share card text
function buildShareCard(result, url = 'niz8.github.io/acecent') {
  const { playerName, altitude, tier, date } = result;
  const dateFormatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  return [
    `🚀 Project Acecent — ${dateFormatted}`,
    `👤 ${playerName}`,
    `${tier.emoji} ${tier.name} — ${altitude.toLocaleString()} ft`,
    `🎴 Play at ${url}`,
  ].join('\n');
}

export { GameState, PHASES, buildShareCard };

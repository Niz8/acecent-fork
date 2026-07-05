// deck.js — Project Acecent
// Seeded deck generation, card definitions, daily seed

// --- Seeded PRNG (sfc32) ---
function sfc32(a, b, c, d) {
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < dateStr.length; i++) {
    h1 = Math.imul(h1 ^ dateStr.charCodeAt(i), 0x9e3779b9);
    h2 = Math.imul(h2 ^ dateStr.charCodeAt(i), 0x5f4a0bc5);
  }
  return [h1 >>> 0, h2 >>> 0, (h1 ^ h2) >>> 0, (h1 + h2) >>> 0];
}

function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Card Definitions ---
const SUITS = {
  spades:   { name: 'Spades',   symbol: '♠', emoji: '🖤', theme: 'Thrust' },
  hearts:   { name: 'Hearts',   symbol: '♥', emoji: '❤️', theme: 'Life Support' },
  diamonds: { name: 'Diamonds', symbol: '♦', emoji: '💎', theme: 'Engineering' },
  clubs:    { name: 'Clubs',    symbol: '♣', emoji: '🍀', theme: 'Mission Control' },
};

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

const BURN_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 15
};

// Diamonds burn for floor(face/2) — holding them is the play
const DIAMOND_BURN_VALUES = {
  '2': 1, '3': 1, '4': 2, '5': 2, '6': 3,
  '7': 3, '8': 4, '9': 4, '10': 5,
  'J': 5, 'Q': 6, 'K': 6, 'A': 7
};

const CARD_EFFECTS = {

  // ============================================================
  // SPADES — Thrust: raw power, spade combos, fuel multipliers
  // Face cards add +1 tank slot
  // ============================================================

  'A_spades': {
    emoji: '🚀',
    holdEffect: {
      desc: '✖️1.6x altitude if no pairs + ⛽ +1 tank slot',
      emoji: '✖️',
      condition: (gs) => !gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { tankSlots: 1, message: '🚀 Ace of Spades: pair detected, multiplier lost — but +1 tank slot' }
        : { altitudeMult: 1.6, tankSlots: 1, message: '🚀 Ace of Spades: NO PAIRS — ✖️1.6x THRUST! +1 tank slot' }
    }
  },

  'K_spades': {
    emoji: '👑',
    holdEffect: {
      desc: '✖️2x spade fuel + ⛽ +1 tank slot',
      emoji: '✖️',
      fn: () => ({ tankSlots: 1, message: '👑 King of Spades: Spade fuel DOUBLED! +1 tank slot' })
    }
  },

  'Q_spades': {
    emoji: '⚡',
    holdEffect: {
      desc: '✖️1.4x if 3+ ♠️ held + ⛽ +1 tank slot',
      emoji: '✖️',
      condition: (gs) => gs.heldSuitCount('spades') >= 3,
      fn: (gs) => gs.heldSuitCount('spades') >= 3
        ? { altitudeMult: 1.4, tankSlots: 1, message: '⚡ Queen of Spades: Full Thrust Array! ✖️1.4x altitude + 1 tank slot' }
        : { tankSlots: 1, message: '⚡ Queen of Spades: Need 3 spades — no multiplier, but +1 tank slot' }
    }
  },

  'J_spades': {
    emoji: '💥',
    holdEffect: {
      desc: '✖️1.35x altitude + ⛽ +1 tank slot',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.25, tankSlots: 1, message: '💥 Jack of Spades: Booster ignition! ✖️1.25x altitude + 1 tank slot' })
    }
  },

  '10_spades': {
    emoji: '🔥',
    holdEffect: {
      desc: '✖️1.5x fuel from all burned ♠️',
      emoji: '✖️',
      fn: () => ({ message: '🔥 10 of Spades: Auxiliary thrusters! Spade fuel ✖️1.5x' })
    }
  },

  '7_spades': {
    emoji: '🛸',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold any other ♠️',
      emoji: '🚀',
      condition: (gs) => gs.heldSuitCount('spades') >= 2,
      fn: (gs) => gs.heldSuitCount('spades') >= 2
        ? { altitudeFlat: 5000, message: '🛸 7 of Spades: Spade formation! +5,000 ft' }
        : { message: '🛸 7 of Spades: No spade wingman — no bonus' }
    }
  },

  '2_spades': {
    burnValue: 8,
    emoji: '⛽',
    burnEffect: {
      desc: '🔥 Burns for boosted fuel value',
      emoji: '🔥',
      fn: () => ({ message: '⛽ 2 of Spades: High-octane fuel!' })
    }
  },

  // ============================================================
  // HEARTS — Life Support: tank expansion and crew synergy
  // Penalty blocking REMOVED. Hearts expand the fuel tank.
  // Face cards add +1 or +2 tank slots.
  // ============================================================

  'A_hearts': {
    emoji: '💗',
    holdEffect: {
      desc: '⛽ +2 tank slots + ✖️1.3x altitude',
      emoji: '⛽',
      fn: () => ({ altitudeMult: 1.3, tankSlots: 2, message: '💗 Ace of Hearts: Life support online! ✖️1.3x altitude + 2 tank slots' })
    }
  },

  'K_hearts': {
    emoji: '🫀',
    holdEffect: {
      desc: '⛽ +2 tank slots + ✖️1.25x altitude',
      emoji: '⛽',
      fn: () => ({ altitudeMult: 1.25, tankSlots: 2, message: '🫀 King of Hearts: Full life support! ✖️1.25x altitude + 2 tank slots' })
    }
  },

  'Q_hearts': {
    emoji: '🌹',
    holdEffect: {
      desc: '⛽ +1 tank slot + 🚀 +10,000 ft',
      emoji: '⛽',
      fn: () => ({ altitudeFlat: 10000, tankSlots: 1, message: '🌹 Queen of Hearts: Extended reserves! +10,000 ft + 1 tank slot' })
    }
  },

  'J_hearts': {
    emoji: '🩺',
    holdEffect: {
      desc: '⛽ +1 tank slot + ✖️1.2x altitude',
      emoji: '⛽',
      fn: () => ({ altitudeMult: 1.2, tankSlots: 1, message: '🩺 Jack of Hearts: Medic on deck! ✖️1.2x altitude + 1 tank slot' })
    }
  },

  '9_hearts': {
    emoji: '💞',
    holdEffect: {
      desc: '✖️1.1x altitude per ♥️ held + ⛽ +1 tank slot',
      emoji: '✖️',
      fn: (gs) => {
        const count = gs.heldSuitCount('hearts');
        const mult = parseFloat((1 + count * 0.1).toFixed(2));
        return { altitudeMult: mult, tankSlots: 1, message: `💞 9 of Hearts: Crew synergy! ✖️${mult}x altitude + 1 tank slot` };
      }
    }
  },

  '6_hearts': {
    emoji: '🛡️',
    holdEffect: {
      desc: '⛽ +1 tank slot',
      emoji: '⛽',
      fn: () => ({ tankSlots: 1, message: '🛡️ 6 of Hearts: Emergency reserves! +1 tank slot' })
    }
  },

  '5_hearts': {
    emoji: '🛡️',
    holdEffect: {
      desc: '⛽ +1 tank slot',
      emoji: '⛽',
      fn: () => ({ tankSlots: 1, message: '🛡️ 5 of Hearts: Backup reserves! +1 tank slot' })
    }
  },

  '4_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 4 of Hearts: Reserve systems! +1 Redraw' })
    }
  },

  '3_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Hearts: Backup O2 tank! +1 Redraw' })
    }
  },

  '2_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Hearts: Contingency fuel! +1 Redraw' })
    }
  },

  // ============================================================
  // DIAMONDS — Engineering: synergy and pairs, low burn value
  // All diamonds burn for floor(face/2)
  // ============================================================

  'A_diamonds': {
    emoji: '💠',
    holdEffect: {
      desc: '🚀 +30,000 ft if you hold 2+ other ♦️',
      emoji: '🚀',
      condition: (gs) => gs.heldCards.filter(c => c.suit === 'diamonds' && c.id !== 'A_diamonds').length >= 2,
      fn: (gs) => {
        const otherDiamonds = gs.heldCards.filter(c => c.suit === 'diamonds' && c.id !== 'A_diamonds').length;
        return otherDiamonds >= 2
          ? { altitudeFlat: 30000, message: '💠 Ace of Diamonds: Diamond formation! +30,000 ft' }
          : { message: '💠 Ace of Diamonds: Need 2+ other ♦️ — no bonus' };
      }
    }
  },

  'K_diamonds': {
    emoji: '🔬',
    holdEffect: {
      desc: '✖️1.5x altitude — only if you burned zero ♦️',
      emoji: '✖️',
      condition: (gs) => gs.burnedSuitCount('diamonds') === 0,
      fn: (gs) => gs.burnedSuitCount('diamonds') === 0
        ? { altitudeMult: 1.5, message: '🔬 King of Diamonds: Pure engineering! ✖️1.5x altitude' }
        : { message: '🔬 King of Diamonds: Burned diamonds detected — bonus lost' }
    }
  },

  'Q_diamonds': {
    emoji: '⚙️',
    holdEffect: {
      desc: '✖️1.3x altitude if you hold any other ♦️',
      emoji: '✖️',
      condition: (gs) => gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== 'Q_diamonds'),
      fn: (gs) => {
        const hasDiamond = gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== 'Q_diamonds');
        return hasDiamond
          ? { altitudeMult: 1.3, message: '⚙️ Queen of Diamonds: Diamond sync! ✖️1.3x altitude' }
          : { message: '⚙️ Queen of Diamonds: Need another ♦️ — no bonus' };
      }
    }
  },

  'J_diamonds': {
    emoji: '🛠️',
    holdEffect: {
      desc: '✖️1.25x altitude if you hold no ♠️',
      emoji: '✖️',
      condition: (gs) => gs.heldSuitCount('spades') === 0,
      fn: (gs) => gs.heldSuitCount('spades') === 0
        ? { altitudeMult: 1.25, message: '🛠️ Jack of Diamonds: Clean integration! ✖️1.25x altitude' }
        : { message: '🛠️ Jack of Diamonds: Spade interference — no bonus' }
    }
  },

  '10_diamonds': {
    emoji: '📡',
    holdEffect: {
      desc: '🚀 +12,000 ft if you hold 3+ of same suit',
      emoji: '🚀',
      condition: (gs) => {
        const suitCounts = {};
        for (const c of gs.heldCards) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
        return Object.values(suitCounts).some(v => v >= 3);
      },
      fn: (gs) => {
        const suitCounts = {};
        for (const c of gs.heldCards) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
        const qualifies = Object.values(suitCounts).some(v => v >= 3);
        return qualifies
          ? { altitudeFlat: 12000, message: '📡 10 of Diamonds: Formation lock! +12,000 ft' }
          : { message: '📡 10 of Diamonds: Need 3 of same suit — no bonus' };
      }
    }
  },

  '3_diamonds': {
    emoji: '💎',
    holdEffect: {
      desc: '🚀 +8,000 ft if you hold any other ♦️',
      emoji: '🚀',
      condition: (gs) => gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== '3_diamonds'),
      fn: (gs) => {
        const hasDiamond = gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== '3_diamonds');
        return hasDiamond
          ? { altitudeFlat: 8000, message: '💎 3 of Diamonds: Diamond resonance! +8,000 ft' }
          : { message: '💎 3 of Diamonds: Need another ♦️ — no bonus' };
      }
    }
  },

  '2_diamonds': {
    emoji: '💎',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold any other ♦️',
      emoji: '🚀',
      condition: (gs) => gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== '2_diamonds'),
      fn: (gs) => {
        const hasDiamond = gs.heldCards.some(c => c.suit === 'diamonds' && c.id !== '2_diamonds');
        return hasDiamond
          ? { altitudeFlat: 5000, message: '💎 2 of Diamonds: Diamond calibration! +5,000 ft' }
          : { message: '💎 2 of Diamonds: Need another ♦️ — no bonus' };
      }
    }
  },

  // ============================================================
  // CLUBS — Mission Control: redraws, burn bonuses, peek
  // Hold face cards add +1 tank slot
  // ============================================================

  'A_clubs': {
    emoji: '🎲',
    burnEffect: {
      desc: '🔄 +2 redraws when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 2, message: '🎲 Ace of Clubs: Mission reset! +2 Redraws' })
    }
  },

  'K_clubs': {
    emoji: '📻',
    holdEffect: {
      desc: '✖️1.3x altitude + ⛽ +1 tank slot',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.3, tankSlots: 1, message: '📻 King of Clubs: Mission Control confirms! ✖️1.3x altitude + 1 tank slot' })
    }
  },

  'Q_clubs': {
    emoji: '🗺️',
    burnEffect: {
      desc: '🔭 Reveals one additional next card suit for rest of game',
      emoji: '🔭',
      fn: () => ({ extraPeek: 1, message: '🗺️ Queen of Clubs: Extended scan! +1 card peek for rest of game' })
    }
  },

  'J_clubs': {
    emoji: '🧭',
    holdEffect: {
      desc: '✖️1.35x altitude + ⛽ +1 tank slot',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.35, tankSlots: 1, message: '🧭 Jack of Clubs: Optimal trajectory locked! ✖️1.35x altitude + 1 tank slot' })
    }
  },

  '8_clubs': {
    emoji: '🌐',
    holdEffect: {
      desc: '✖️1.15x altitude per 2 ♣️ held',
      emoji: '✖️',
      fn: (gs) => {
        const clubCount = gs.heldSuitCount('clubs');
        const mult = parseFloat((1 + Math.floor(clubCount / 2) * 0.15).toFixed(2));
        return { altitudeMult: mult, message: `🌐 8 of Clubs: Network effect! ✖️${mult}x altitude` };
      }
    }
  },

  '5_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 5 of Clubs: Systems redundancy! +1 Redraw' })
    }
  },

  '4_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 4 of Clubs: Contingency protocol! +1 Redraw' })
    }
  },

  '3_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Clubs: Ground control assist! +1 Redraw' })
    }
  },

  '2_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Clubs: Comm check! +1 Redraw' })
    }
  },

  // ============================================================
  // JOKERS
  // ============================================================

  'JOKER_red': {
    emoji: '🃏',
    suit: 'joker',
    holdEffect: {
      desc: '🚀 +50,000 ft — ALL SYSTEMS GO',
      emoji: '🚀',
      fn: () => ({ altitudeFlat: 50000, message: '🃏 RED JOKER: ALL SYSTEMS GO! +50,000 ft' })
    }
  },

  'JOKER_black': {
    emoji: '🃏',
    suit: 'joker',
    holdEffect: {
      desc: '🎲 Random event — could be great or catastrophic',
      emoji: '🎲',
      fn: (gs) => {
        const roll = gs.rng();
        if (roll < 0.2) return { altitudeMult: 2.0, message: '🃏 BLACK JOKER: ANOMALY — DOUBLE THRUST! ✖️2x' };
        if (roll < 0.5) return { altitudeFlat: 25000, message: '🃏 BLACK JOKER: Anomaly contained! +25,000 ft' };
        if (roll < 0.75) return { altitudeFlat: -15000, message: '🃏 BLACK JOKER: ⚠️ SYSTEM FAILURE! -15,000 ft' };
        return { altitudeMult: 0.5, message: '🃏 BLACK JOKER: ⚠️ CATASTROPHIC ANOMALY! ✖️0.5x altitude' };
      }
    }
  },
};

function buildDeck() {
  const cards = [];

  for (const suit of Object.keys(SUITS)) {
    for (const rank of RANKS) {
      const id = `${rank}_${suit}`;
      const baseEffect = CARD_EFFECTS[id] || {};
      const burnValue = baseEffect.burnValue ||
        (suit === 'diamonds' ? DIAMOND_BURN_VALUES[rank] : BURN_VALUES[rank]);
      cards.push({
        id,
        rank,
        suit,
        suitSymbol: SUITS[suit].symbol,
        suitEmoji: SUITS[suit].emoji,
        burnValue,
        holdEffect: baseEffect.holdEffect || null,
        burnEffect: baseEffect.burnEffect || null,
        emoji: baseEffect.emoji || '🂠',
        isNegative: baseEffect.negative || false,
      });
    }
  }

  cards.push({
    id: 'JOKER_red', rank: 'JOKER', suit: 'joker',
    suitSymbol: '🃏', suitEmoji: '🔴', burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_red'].holdEffect,
    burnEffect: null, emoji: '🃏', isNegative: false,
  });
  cards.push({
    id: 'JOKER_black', rank: 'JOKER', suit: 'joker',
    suitSymbol: '🃏', suitEmoji: '⚫', burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_black'].holdEffect,
    burnEffect: null, emoji: '🃏', isNegative: false,
  });

  return cards;
}

function getDailyDeck() {
  const [a, b, c, d] = getDailySeed();
  const rng = sfc32(a, b, c, d);
  const deck = buildDeck();
  return { deck: seededShuffle(deck, rng), rng };
}

function getDailyDateString() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

export { getDailyDeck, getDailyDateString, SUITS, RANKS, CARD_EFFECTS, DIAMOND_BURN_VALUES };

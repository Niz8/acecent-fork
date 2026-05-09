// ui.js — Project Acecent
// Rendering, card display, animation, phase transitions

import { copyShareCard } from './share.js';
import { showReadme } from './readme.js';
import { VERSION } from './config.js';
import { getTankSize, detectPokerHand, BASE_TANK_SIZE, TANK_SLOT_CARDS } from './effects.js';

// --- Suit helpers ---
// Force emoji presentation variant with U+FE0F to avoid black-on-black on iOS
const SUIT_DISPLAY = {
  spades:   { symbol: '♠️', color: '#3a7bd5' },   // blue so it's visible on dark
  hearts:   { symbol: '♥️', color: '#e8334a' },
  diamonds: { symbol: '♦️', color: '#e8334a' },
  clubs:    { symbol: '♣️', color: '#3a7bd5' },
  joker:    { symbol: '🃏', color: '#cc88ff' },
};

function getSuitSymbol(suit) {
  return SUIT_DISPLAY[suit]?.symbol || '?';
}

function getSuitColor(suit) {
  return SUIT_DISPLAY[suit]?.color || '#aaa';
}

function buildLightGS(gameState) {
  const heldSuitCounts = {};
  const rankCounts = {};
  for (const c of gameState.hand) {
    heldSuitCounts[c.suit] = (heldSuitCounts[c.suit] || 0) + 1;
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  }
  return {
    heldCards: gameState.hand,
    burnedCards: gameState.burnedCards,
    handHasPair: Object.values(rankCounts).some(v => v >= 2),
    heldSuitCount: (suit) => heldSuitCounts[suit] || 0,
    burnedSuitCount: (suit) => gameState.burnedCards.filter(c => c.suit === suit).length, //ADD THIS
    rng: gameState.rng || null,
  };
}

function getConditionStatus(card, gameState) {
  if (!card.holdEffect && !card.burnEffect) return 'neutral';
  if (!card.holdEffect?.condition) return 'neutral';
  return card.holdEffect.condition(buildLightGS(gameState)) ? 'active' : 'inactive';
}

// --- Quick-view chip (top strip) ---
function renderChip(card, gameState, isSelected) {
  const el = document.createElement('div');
  const conditionStatus = getConditionStatus(card, gameState);
  let cls = 'hand-chip';
  if (isSelected) cls += ' chip-selected';
  if (conditionStatus === 'active') cls += ' chip-active';
  el.className = cls;
  el.dataset.cardId = card.id;

  const sym = getSuitSymbol(card.suit);
  const col = getSuitColor(card.suit);

  el.innerHTML = `
    <span class="chip-rank">${card.rank}</span><span class="chip-suit" style="color:${col}">${sym}</span>
    ${isSelected ? '<span class="chip-burn-tag">🔥</span>' : ''}
  `;
  return el;
}

// --- Full detail card (horizontal scroll area) ---
function renderDetailCard(card, gameState, isSelected, burnOrder = 0) {
  const el = document.createElement('div');
  const conditionStatus = getConditionStatus(card, gameState);
  let cls = 'detail-card';
  if (isSelected) cls += ' detail-selected';
  if (conditionStatus === 'active' && !isSelected) cls += ' detail-condition-met';
  if (conditionStatus === 'inactive') cls += ' detail-condition-unmet';
  el.className = cls;
  el.dataset.cardId = card.id;

  const sym = getSuitSymbol(card.suit);
  const col = getSuitColor(card.suit);

  const holdHTML = card.holdEffect
    ? `<div class="detail-effect hold-effect">
        <span class="effect-tag">HOLD ${card.holdEffect.emoji}</span>
        <span class="effect-desc">${card.holdEffect.desc}</span>
       </div>`
    : '';

  const burnHTML = card.burnEffect
    ? `<div class="detail-effect burn-effect">
        <span class="effect-tag">BURN ${card.burnEffect.emoji}</span>
        <span class="effect-desc">${card.burnEffect.desc}</span>
       </div>`
    : '';

  const noEffect = !card.holdEffect && !card.burnEffect
    ? `<div class="detail-no-effect">No special effect — solid fuel value</div>`
    : '';

  const burnBadge = burnOrder > 0
    ? `<div class="burn-order-badge">${burnOrder}</div>`
    : '';

  el.innerHTML = `
    <div class="detail-card-inner">
      ${burnBadge}
      <div class="detail-header">
        <span class="detail-rank" style="color:${col}">${card.rank}</span>
        <span class="detail-suit" style="color:${col}">${sym}</span>
        <span class="detail-emoji">${card.emoji}</span>
      </div>
      <div class="detail-effects">
        ${holdHTML}
        ${burnHTML}
        ${noEffect}
      </div>
      <div class="detail-footer">
        <span class="detail-burn-val">🔥 Fuel: ${card.burnValue}</span>
        ${isSelected ? '<span class="detail-selected-tag">BURNING ⛽</span>' : '<span class="detail-tap-hint">tap to select</span>'}
      </div>
    </div>
  `;

  return el;
}

// --- Phase Renderers ---

function renderNameEntry(container, gameState, onStart) {
  const savedName = localStorage.getItem('acecent_player_name') || '';

  container.innerHTML = `
    <div class="screen name-entry-screen">
      <div class="title-block">
        <div class="title-emoji">🚀</div>
        <h1 class="game-title">Project Acecent</h1>
        <p class="game-subtitle">Five cards. One shot. How high can you go?</p>
      </div>
      <div class="name-form">
        <label class="name-label">PILOT NAME</label>
        <input type="text" id="player-name-input" class="name-input"
          placeholder="Enter your callsign..."
          value="${savedName}"
          maxlength="20"
          autocomplete="off"
        />
        <p class="name-disclaimer">👤 Your name will be saved locally and displayed publicly on the daily leaderboard.</p>
        <button id="launch-btn" class="btn-primary">
          🚀 BEGIN MISSION
        </button>
      </div>
      <div class="name-entry-footer">
        <div class="scoreboard-notice">📡 Daily Leaderboard — Live</div>
        <div class="version-footer">v${VERSION} · vibe coded · use at your own risk</div>
      </div>
    </div>
  `;

  const input = container.querySelector('#player-name-input');
  const btn = container.querySelector('#launch-btn');
  input.focus();

  const tryStart = () => {
    const name = input.value.trim();
    if (!name) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      return;
    }
    gameState.setPlayerName(name);
    onStart();
  };

  btn.addEventListener('click', tryStart);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryStart(); });
}

function renderHand(container, gameState, onRedraw, onLaunch) {
  const gs = gameState;
  const hand = gs.hand;
  const selectedCount = gs.selectedForDiscard.length;

  // Save scroll position before re-render
  const existingScroll = container.querySelector('#detail-scroll');
  const savedScrollLeft = existingScroll ? existingScroll.scrollLeft : 0;

  // Build status bar
  const penaltyStatus = getStatusBar(gs);

  container.innerHTML = `
    <div class="screen hand-screen">

      <div class="hand-header">
        <div class="pilot-tag">👤 ${gs.playerName}</div>
        <div class="redraw-counter">
          <span class="redraw-label">REDRAWS</span>
          <span class="redraw-count">${gs.redraws}</span>
        </div>
      </div>

      <div class="hand-instructions">
        Tap a card below to select it for burning as ⛽ fuel, then redraw or launch.
      </div>

      <!-- Status bar -->
      <div class="penalty-bar" id="penalty-bar">
        ${penaltyStatus.map(p => `<div class="penalty-pill ${p.type}">${p.icon} ${p.text}</div>`).join('')}
      </div>

      <!-- Fuel tank strip -->
      <div class="tank-strip-wrap">
        <div class="tank-strip-label">⛽ FUEL TANK</div>
        <div class="tank-strip" id="tank-strip"></div>
      </div>

      <!-- Quick-view strip -->
      <div class="quickview-strip-wrap">
        <div class="quickview-strip" id="quickview-strip"></div>
      </div>

      <!-- Horizontal scroll detail cards -->
      <div class="detail-scroll-wrap">
        <div class="detail-scroll" id="detail-scroll"></div>
      </div>

      <!-- Actions -->
      <div class="hand-actions">
        <div class="redraw-wrap">
          <button id="redraw-btn" class="btn-secondary" ${!gs.canRedraw() ? 'disabled' : ''}>
            🔄 Redraw (${gs.redraws} left)
          </button>
          ${selectedCount > 0 ? `<span class="selected-count">${selectedCount} card${selectedCount !== 1 ? 's' : ''} selected</span>` : ''}
        </div>
        <button id="do-launch-btn" class="btn-primary">
          🚀 LAUNCH
        </button>
      </div>

    </div>
  `;

  // Quick-view strip — tap scrolls detail to that card, does NOT select
  const strip = container.querySelector('#quickview-strip');
  hand.forEach((card, index) => {
    const isSelected = gs.selectedForDiscard.includes(card.id);
    const chip = renderChip(card, gameState, isSelected);
    chip.addEventListener('click', () => {
      const scroll = container.querySelector('#detail-scroll');
      if (scroll) {
        const cardWidth = 200 + 12;
        scroll.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
      }
    });
    strip.appendChild(chip);
  });

  // Next card peek — base 1 + any extraPeeks from Q_clubs burns
  const peekCount = 1 + (gs.extraPeeks || 0);
  for (let p = 0; p < peekCount; p++) {
    const peekedCard = gs.deck[gs.drawIndex + p] || null;
    if (!peekedCard) break;
    const peekChip = document.createElement('div');
    peekChip.className = 'hand-chip chip-peek';
    const sym = getSuitSymbol(peekedCard.suit);
    const col = getSuitColor(peekedCard.suit);
    peekChip.innerHTML = `<span class="chip-peek-label">${p === 0 ? 'NEXT' : 'NEXT+' + p}</span><span style="color:${col}">${sym}</span>`;
    strip.appendChild(peekChip);
  }

  // Detail scroll — tap DOES select/deselect, shows burn order number
  const scroll = container.querySelector('#detail-scroll');
  hand.forEach((card) => {
    const isSelected = gs.selectedForDiscard.includes(card.id);
    const burnOrder = gs.burnOrderOf(card.id);
    const detailCard = renderDetailCard(card, gameState, isSelected, burnOrder);
    detailCard.addEventListener('click', () => {
      gs.toggleSelectCard(card.id);
      renderHand(container, gameState, onRedraw, onLaunch);
    });
    scroll.appendChild(detailCard);
  });

  // Restore scroll position after re-render
  if (scroll && savedScrollLeft > 0) {
    scroll.scrollLeft = savedScrollLeft;
  }

  // Tank strip — wrapped in try/catch so upstream errors don't silently prevent rendering
  try {
    const tankStrip = container.querySelector('#tank-strip');
    if (tankStrip) {
      const tankSize = getTankSize(gs.hand);
      const burned = gs.burnedCards;
      const overflow = Math.max(0, burned.length - tankSize);

      for (let i = 0; i < Math.max(tankSize, burned.length); i++) {
        const slot = document.createElement('div');
        const card = burned[i];
        const isOverflow = card && i < overflow;
        if (card) {
          slot.className = `tank-slot tank-filled${isOverflow ? ' tank-overflow' : ''}`;
          const sym = getSuitSymbol(card.suit);
          const col = getSuitColor(card.suit);
          slot.innerHTML = `${card.emoji}<span style="color:${col};font-size:0.6rem">${card.rank}${sym}</span>`;
          if (isOverflow) slot.title = 'Over tank limit — fuel lost';
        } else {
          slot.className = 'tank-slot tank-empty';
          slot.textContent = '·';
        }
        tankStrip.appendChild(slot);
      }
    }
  } catch (e) {
    console.warn('Tank strip render error:', e);
  }

  container.querySelector('#redraw-btn').addEventListener('click', () => {
    if (gs.canRedraw()) onRedraw();
  });

  container.querySelector('#do-launch-btn').addEventListener('click', () => {
    if (gs.canLaunch()) onLaunch();
  });
}

// --- Status Bar ---
function getStatusBar(gs) {
  const pills = [];
  const heldCards = gs.hand;
  const burnedCount = gs.burnedCards.length;
  const tankSize = getTankSize(heldCards);
  const overflow = Math.max(0, burnedCount - tankSize);

  // Tank status
  if (overflow > 0) {
    pills.push({ type: 'pill-danger', icon: '💨', text: `Tank full! ${overflow} card${overflow > 1 ? 's' : ''} overflowing` });
  } else if (burnedCount >= tankSize - 1 && tankSize > burnedCount) {
    pills.push({ type: 'pill-warn', icon: '⛽', text: `Tank: ${burnedCount}/${tankSize} — almost full` });
  } else {
    pills.push({ type: 'pill-safe', icon: '⛽', text: `Tank: ${burnedCount}/${tankSize} slots` });
  }

  // Poker hand on current held hand
  const pokerHand = detectPokerHand(heldCards);
  if (pokerHand) {
    pills.push({ type: 'pill-poker', icon: pokerHand.emoji, text: `${pokerHand.name} +${(pokerHand.bonus / 1000).toFixed(0)}k ft` });
  }

  return pills;
}

// --- Rocket Animation ---

function playRocketAnimation(container, onComplete) {
  container.innerHTML = `
    <div class="screen launch-animation-screen">
      <div class="launch-bg">
        <div class="stars" id="stars"></div>
        <div class="rocket-wrapper" id="rocket-wrapper">
          <div class="rocket-ship">🚀</div>
          <div class="exhaust">🔥</div>
        </div>
        <div class="launch-text" id="launch-text">T-MINUS ZERO</div>
      </div>
    </div>
  `;

  const stars = container.querySelector('#stars');
  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = (Math.random() * 2) + 's';
    stars.appendChild(star);
  }

  const rocketWrapper = container.querySelector('#rocket-wrapper');
  const launchText = container.querySelector('#launch-text');

  setTimeout(() => { launchText.textContent = 'IGNITION'; }, 300);
  setTimeout(() => { launchText.textContent = '🔥🔥🔥'; }, 800);
  setTimeout(() => {
    rocketWrapper.classList.add('hop');
    launchText.textContent = '🚀✨';
  }, 1200);
  setTimeout(() => { onComplete(); }, 2400);
}

// --- Results ---

function renderLaunchSequence(container, result, gameState, onLeaderboard) {
  container.innerHTML = `
    <div class="screen result-screen">
      <div class="result-header">
        <div class="result-tier-emoji">${result.tier.emoji}</div>
        <div class="result-tier-name">${result.tier.name}</div>
        <div class="result-altitude">${result.altitude.toLocaleString()} ft</div>
        <div class="result-pilot">👤 ${gameState.playerName}</div>
      </div>

      <div class="launch-log" id="launch-log"></div>

      <div class="result-actions">
        <button id="share-btn" class="btn-primary">📋 Copy Share Card</button>
        <button id="leaderboard-btn" class="btn-secondary">📡 View Leaderboard</button>
        <div id="share-confirm" class="share-confirm" style="display:none">✅ Copied!</div>
      </div>

      <div class="scoreboard-notice">📡 Daily Leaderboard — scores may take a moment to appear</div>
    </div>
  `;

  const logContainer = container.querySelector('#launch-log');
  result.log.forEach((line, i) => {
    setTimeout(() => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = line;
      logContainer.appendChild(entry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }, i * 280);
  });

  container.querySelector('#share-btn').addEventListener('click', async () => {
    const todayResult = gameState.loadTodayResult();
    if (todayResult) {
      const { success } = await copyShareCard(todayResult);
      const confirm = container.querySelector('#share-confirm');
      confirm.style.display = 'block';
      confirm.textContent = success ? '✅ Copied!' : '📋 Copy failed — try manually';
      setTimeout(() => { confirm.style.display = 'none'; }, 2500);
    }
  });

  const lbBtn = container.querySelector('#leaderboard-btn');
  if (lbBtn && onLeaderboard) {
    lbBtn.addEventListener('click', onLeaderboard);
  }
}

export {
  renderNameEntry,
  renderHand,
  renderLaunchSequence,
  playRocketAnimation,
};

// leaderboard.js — Project Acecent
// Leaderboard screen renderer

import { fetchDailyLeaderboard, fetchHallOfFame } from './firebase.js';

const DAILY_QUOTES = [
  'That's one small step for man, one giant leap for mankind.',
  'Man must explore and this is exploration at its greatest.',
  'Houston, Tranquility Base here, the Eagle has landed.',
  'From space, I saw Earth not as a collection of nations, but as a single entity with one destiny.',
  'Planet Earth: You. Are. A. Crew.',
  'The stars don't look bigger, but they do look brighter.',
  'Amaze, amaze, amaze.',
];

function getDailyQuote() {
  const day = new Date().getDay();
  return DAILY_QUOTES[day];
}

// Sanitize user-supplied strings before inserting into innerHTML
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseCardId(id) {
  if (!id) return null;
  if (id === 'JOKER_red')   return { rank: '🃏', suitSymbol: 'Red', colorClass: 'lb-card-joker' };
  if (id === 'JOKER_black') return { rank: '🃏', suitSymbol: 'Blk', colorClass: 'lb-card-joker' };

  const parts = id.split('_');
  if (parts.length < 2) return null;
  const rank = parts[0];
  const suit = parts.slice(1).join('_');

  const suitMap = {
    spades:   { symbol: '♠️', colorClass: '' },
    hearts:   { symbol: '♥️', colorClass: 'lb-card-red' },
    diamonds: { symbol: '♦️', colorClass: 'lb-card-red' },
    clubs:    { symbol: '♣️', colorClass: 'lb-card-blue' },
  };

  const s = suitMap[suit];
  if (!s) return null;
  return { rank, suitSymbol: s.symbol, colorClass: s.colorClass };
}

// Check if non-joker rank indices can form a straight with N jokers filling gaps
function canFormStraightWithJokers(rankIndices, jokerCount) {
  if (rankIndices.length === 0) return jokerCount >= 5;
  if (new Set(rankIndices).size !== rankIndices.length) return false;

  const sorted = [...rankIndices].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0];
  const gapsNeeded = span - (sorted.length - 1);
  const slotsNeeded = 4 - span;
  const highAceWorks = span <= 4 && gapsNeeded + slotsNeeded <= jokerCount;

  let lowAceWorks = false;
  if (rankIndices.includes(12)) {
    const lowSorted = sorted.map(i => i === 12 ? -1 : i).sort((a, b) => a - b);
    const lowSpan = lowSorted[lowSorted.length - 1] - lowSorted[0];
    const lowGaps = lowSpan - (lowSorted.length - 1);
    const lowSlots = 4 - lowSpan;
    lowAceWorks = lowSpan <= 4 && lowGaps + lowSlots <= jokerCount;
  }

  return highAceWorks || lowAceWorks;
}

function detectHandName(handIds) {
  if (!handIds || handIds.length === 0) return null;

  const nonJokers = handIds.filter(id => !id.startsWith('JOKER'));
  const jokerCount = handIds.length - nonJokers.length;

  const ranks = nonJokers.map(id => id.split('_')[0]);
  const suits = nonJokers.map(id => id.split('_').slice(1).join('_'));

  const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const rankCounts = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isFlush = handIds.length === 5 && (
    nonJokers.length === 0 || suits.every(s => s === suits[0])
  );

  const rankIndices = ranks.map(r => rankOrder.indexOf(r));
  const isStraight = handIds.length === 5 && canFormStraightWithJokers(rankIndices, jokerCount);
  const isStraightFlush = isFlush && isStraight;

  const allCounts = jokerCount > 0
    ? (() => {
        const c = [...counts];
        if (c.length === 0) c.push(0);
        c[0] += jokerCount;
        return c.sort((a, b) => b - a);
      })()
    : counts;

  if (isStraightFlush) return jokerCount > 0 ? 'Straight Flush 🌟 (Joker wild)' : 'Straight Flush 🌟';
  if (allCounts[0] >= 4)                       return 'Four of a Kind 💫';
  if (allCounts[0] >= 3 && allCounts[1] >= 2) return 'Full House 🏠';
  if (isFlush)   return jokerCount > 0 ? 'Flush ♻️ (Joker wild)' : 'Flush ♻️';
  if (isStraight) return jokerCount > 0 ? 'Straight 📈 (Joker wild)' : 'Straight 📈';
  if (allCounts[0] >= 3)                       return 'Three of a Kind 🎯';
  if (allCounts[0] >= 2 && allCounts[1] >= 2) return 'Two Pair 👯';
  if (allCounts[0] >= 2)                       return 'One Pair ✌️';
  return null;
}

function renderHandExpand(handIds, entryId) {
  const cards = (handIds || []).map(parseCardId).filter(Boolean);
  const handName = detectHandName(handIds);

  return `
    <div class="lb-expand-panel" id="expand-${entryId}" style="display:none;">
      <div class="lb-expand-inner">
        ${cards.map(c => `
          <div class="lb-mini-card ${c.colorClass}">
            <span class="lb-mc-rank">${c.rank}</span>
            <span class="lb-mc-suit">${c.suitSymbol}</span>
          </div>
        `).join('')}
        ${handName ? `<span class="lb-hand-name">${handName}</span>` : ''}
      </div>
    </div>
  `;
}

function attachExpandListeners(container) {
  container.querySelectorAll('.lb-entry-expandable').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.expandId;
      const panel = container.querySelector(`#expand-${id}`);
      const chevron = row.querySelector('.lb-chevron');
      if (!panel) return;
      const isOpen = panel.style.display !== 'none';
      container.querySelectorAll('.lb-expand-panel').forEach(p => p.style.display = 'none');
      container.querySelectorAll('.lb-chevron').forEach(c => c.textContent = '▼');
      container.querySelectorAll('.lb-entry-expandable').forEach(r => r.classList.remove('lb-entry-expanded'));
      if (!isOpen) {
        panel.style.display = 'block';
        chevron.textContent = '▲';
        row.classList.add('lb-entry-expanded');
      }
    });
  });
}

function renderLeaderboard(container, playerName, playerAltitude, onClose) {
  container.innerHTML = `
    <div class="screen leaderboard-screen">
      <div class="leaderboard-header">
        <h2 class="leaderboard-title">📡 Daily Leaderboard</h2>
        <button class="readme-close-btn" id="leaderboard-close">✕</button>
      </div>
      <div class="leaderboard-date" id="leaderboard-date"></div>
      <div class="leaderboard-list" id="leaderboard-list">
        <div class="leaderboard-loading">Loading scores...</div>
      </div>
      <div class="leaderboard-quote" id="leaderboard-quote"></div>
      <div class="hall-of-fame" id="hall-of-fame">
        <div class="leaderboard-loading">Loading hall of fame...</div>
      </div>
    </div>
  `;

  const now = new Date();
  container.querySelector('#leaderboard-date').textContent =
    now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  container.querySelector('#leaderboard-close').addEventListener('click', onClose);

  fetchDailyLeaderboard(20).then(({ success, scores }) => {
    const list = container.querySelector('#leaderboard-list');
    if (!success || scores.length === 0) {
      list.innerHTML = `<div class="leaderboard-empty">No scores yet today. You could be first! 🚀</div>`;
      return;
    }

    const hasHand = entry => Array.isArray(entry.hand) && entry.hand.length > 0;

    list.innerHTML = scores.map((entry, i) => {
      const isPlayer = entry.playerName === playerName && entry.altitude === playerAltitude;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const expandable = hasHand(entry);
      const entryId = `lb-${i}`;
      const safeName = escapeHTML(entry.playerName);
      const safeTier = escapeHTML(entry.tierName);

      return `
        <div class="leaderboard-entry ${isPlayer ? 'leaderboard-you' : ''} ${expandable ? 'lb-entry-expandable' : ''}"
             ${expandable ? `data-expand-id="${entryId}"` : ''}>
          <span class="leaderboard-rank">${medal}</span>
          <span class="leaderboard-name">${safeName}</span>
          <span class="leaderboard-tier">${safeTier}</span>
          <span class="leaderboard-altitude">${entry.altitude.toLocaleString()} ft</span>
          ${expandable ? `<span class="lb-chevron">▼</span>` : ''}
        </div>
        ${expandable ? renderHandExpand(entry.hand, entryId) : ''}
      `;
    }).join('');

    attachExpandListeners(list);
  });

  fetchHallOfFame().then(({ success, scores }) => {
    const hof = container.querySelector('#hall-of-fame');
    if (!success) {
      hof.innerHTML = '';
      return;
    }

    const entriesHTML = scores.length === 0
      ? `<div class="leaderboard-empty">No records yet.</div>`
      : scores.map(score => `
          <div class="leaderboard-entry hof-entry">
            <span class="leaderboard-rank">🏆</span>
            <span class="leaderboard-name">${escapeHTML(score.playerName)}</span>
            <span class="leaderboard-tier">${escapeHTML(score.tierName)}</span>
            <span class="leaderboard-altitude">${score.altitude.toLocaleString()} ft</span>
          </div>
        `).join('');

    hof.innerHTML = `
      <div class="hof-title">🏆 All-Time Record</div>
      ${entriesHTML}
      <div class="leaderboard-quote"><em>${getDailyQuote()}</em></div>
      <div class="hof-disclaimer">Scores tracked since May 2, 2026</div>
    `;
  });
}

export { renderLeaderboard };

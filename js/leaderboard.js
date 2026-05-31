// leaderboard.js — Project Acecent
// Leaderboard screen renderer

import { fetchDailyLeaderboard, fetchHallOfFame } from './firebase.js';

const DAILY_QUOTES = [
  'That\'s one small step for man, one giant leap for mankind.',       // Sunday
  'Man must explore and this is exploration at its greatest.',          // Monday
  'Houston, Tranquility Base here, the Eagle has landed.',             // Tuesday
  'From space, I saw Earth not as a collection of nations, but as a single entity with one destiny.', // Wednesday
  'Planet Earth: You. Are. A. Crew.',                                  // Thursday
  'The stars don\'t look bigger, but they do look brighter.',          // Friday
  'Amaze, amaze, amaze.',                                              // Saturday
];

function getDailyQuote() {
  const day = new Date().getDay(); // 0 = Sunday
  return DAILY_QUOTES[day];
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

  // Set date
  const now = new Date();
  container.querySelector('#leaderboard-date').textContent =
    now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  container.querySelector('#leaderboard-close').addEventListener('click', onClose);

  // Fetch daily leaderboard
  fetchDailyLeaderboard(20).then(({ success, scores }) => {
    const list = container.querySelector('#leaderboard-list');
    if (!success || scores.length === 0) {
      list.innerHTML = `<div class="leaderboard-empty">No scores yet today. You could be first! 🚀</div>`;
      return;
    }

    list.innerHTML = scores.map((entry, i) => {
      const isPlayer = entry.playerName === playerName && entry.altitude === playerAltitude;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      return `
        <div class="leaderboard-entry ${isPlayer ? 'leaderboard-you' : ''}">
          <span class="leaderboard-rank">${medal}</span>
          <span class="leaderboard-name">${entry.playerName}</span>
          <span class="leaderboard-tier">${entry.tierName}</span>
          <span class="leaderboard-altitude">${entry.altitude.toLocaleString()} ft</span>
        </div>
      `;
    }).join('');
  });

  // Fetch hall of fame
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
            <span class="leaderboard-name">${score.playerName}</span>
            <span class="leaderboard-tier">${score.tierName}</span>
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

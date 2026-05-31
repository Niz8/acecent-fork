// leaderboard.js — Project Acecent
// Leaderboard screen renderer

import { fetchDailyLeaderboard } from './firebase.js';

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
    </div>
  `;

  // Set date
  const now = new Date();
  container.querySelector('#leaderboard-date').textContent =
    now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  container.querySelector('#leaderboard-close').addEventListener('click', onClose);

  // Fetch and render
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
}

export { renderLeaderboard };

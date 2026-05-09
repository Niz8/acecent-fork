// share.js — Project Acecent
// Share card generation, clipboard, display name persistence

import { buildShareCard } from './game.js';

function getSavedPlayerName() {
  return localStorage.getItem('acecent_player_name') || '';
}

function savePlayerName(name) {
  localStorage.setItem('acecent_player_name', name.trim());
}

async function copyShareCard(result) {
  const text = buildShareCard(result);
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, text };
  } catch (e) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(ta);
      return { success: true, text };
    } catch {
      document.body.removeChild(ta);
      return { success: false, text };
    }
  }
}

export { getSavedPlayerName, savePlayerName, copyShareCard };

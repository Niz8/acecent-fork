// readme.js — Project Acecent
// README modal overlay: first load, version bump, and manual open

import { VERSION, README } from './config.js';

const LS_README_VERSION = 'acecent_readme_version';

function getSeenVersion() {
  return localStorage.getItem(LS_README_VERSION) || null;
}

function markAsSeen() {
  localStorage.setItem(LS_README_VERSION, VERSION);
}

function shouldShow() {
  const seen = getSeenVersion();
  return seen !== VERSION;
}

function isVersionBump() {
  const seen = getSeenVersion();
  return seen !== null && seen !== VERSION;
}

function showReadme(scrollToPatch = false) {
  // Remove any existing modal
  const existing = document.getElementById('readme-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'readme-modal';
  overlay.className = 'readme-overlay';

  overlay.innerHTML = `
    <div class="readme-modal">
      <div class="readme-modal-header">
        <span class="readme-title">🚀 Project Acecent</span>
        <button class="readme-close-btn" id="readme-close">✕</button>
      </div>
      <div class="readme-body" id="readme-body">
        ${renderReadmeBody()}
      </div>
      <div class="readme-modal-footer">
        <span class="readme-version">v${VERSION} · vibe coded · use at your own risk</span>
        <button class="btn-primary readme-dismiss-btn" id="readme-dont-show">
          Got it — don't show again
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  document.getElementById('readme-close').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('readme-dont-show').addEventListener('click', () => {
    markAsSeen();
    overlay.remove();
  });

  // Dismiss on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Scroll to patch notes if version bump
  if (scrollToPatch) {
    setTimeout(() => {
      const patchSection = document.getElementById('readme-section-patchnotes');
      if (patchSection) {
        patchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}

function renderReadmeBody() {
  return README.sections.map(section => {
    if (section.id === 'cards') return renderCardsSection(section);
    if (section.id === 'patchnotes') return renderPatchSection(section);
    return `
      <div class="readme-section" id="readme-section-${section.id}">
        <h2 class="readme-section-title">${section.title}</h2>
        <p class="readme-section-content">${section.content.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  }).join('');
}

function renderCardsSection(section) {
  const suitsHTML = section.suits.map(suit => `
    <div class="readme-suit-group">
      <div class="readme-suit-header" style="color: ${suit.color}">
        ${suit.name}
        <span class="readme-suit-theme">${suit.theme}</span>
      </div>
      <div class="readme-card-list">
        ${suit.cards.map(c => `
          <div class="readme-card-entry">
            <span class="readme-card-name">${c.card}</span>
            <span class="readme-effect-type ${c.type === 'HOLD' ? 'type-hold' : 'type-burn'}">${c.type}</span>
            <span class="readme-card-desc">${c.desc}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="readme-section" id="readme-section-cards">
      <h2 class="readme-section-title">${section.title}</h2>
      <p class="readme-section-subtitle">${section.subtitle}</p>
      ${suitsHTML}
    </div>
  `;
}

function renderPatchSection(section) {
  const patchHTML = section.patches.map(patch => `
    <div class="readme-patch">
      <div class="readme-patch-header">
        <span class="readme-patch-version">v${patch.version}</span>
        <span class="readme-patch-date">${patch.date}</span>
      </div>
      <ul class="readme-patch-notes">
        ${patch.notes.map(n => `<li>${n}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return `
    <div class="readme-section" id="readme-section-patchnotes">
      <h2 class="readme-section-title">${section.title}</h2>
      ${patchHTML}
    </div>
  `;
}

export { showReadme, shouldShow, isVersionBump };

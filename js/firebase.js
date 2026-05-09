// firebase.js — Project Acecent
// Daily leaderboard read/write via Firestore

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { getDailyDateString } from './deck.js';
import { VERSION } from './config.js';

const firebaseConfig = {
  apiKey: "AIzaSyAp_zaKsyGfm_CKwzVuFCG_pWrk1zj9Df8",
  authDomain: "acecent.firebaseapp.com",
  projectId: "acecent",
  storageBucket: "acecent.firebasestorage.app",
  messagingSenderId: "825278282058",
  appId: "1:825278282058:web:bd33a484aa3229fbe9a9b3"
};

let db = null;

function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase init failed:', e);
    db = null;
  }
}

// Submit score to Firestore
// Returns { success, error }
async function submitScore(playerName, altitude, tierName) {
  if (!db) return { success: false, error: 'No database connection' };
  try {
    const dateString = getDailyDateString();
    await addDoc(collection(db, 'scores'), {
      playerName,
      altitude,
      tierName,
      date: dateString,
      version: VERSION,
      submittedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.warn('Score submission failed:', e);
    return { success: false, error: e.message };
  }
}

// Fetch top scores for today
// Returns array of { playerName, altitude, tierName } sorted by altitude desc
async function fetchDailyLeaderboard(maxEntries = 10) {
  if (!db) return { success: false, scores: [] };
  try {
    const dateString = getDailyDateString();
    const q = query(
      collection(db, 'scores'),
      where('date', '==', dateString),
      orderBy('altitude', 'desc'),
      limit(maxEntries)
    );
    const snapshot = await getDocs(q);
    const scores = snapshot.docs.map(doc => doc.data());
    return { success: true, scores };
  } catch (e) {
    console.warn('Leaderboard fetch failed:', e);
    return { success: false, scores: [] };
  }
}

// Get the player's rank on the leaderboard for today
// Returns rank (1-based) or null if not found
async function getPlayerRank(playerName, altitude) {
  if (!db) return null;
  try {
    const dateString = getDailyDateString();
    const q = query(
      collection(db, 'scores'),
      where('date', '==', dateString),
      where('altitude', '>', altitude)
    );
    const snapshot = await getDocs(q);
    return snapshot.size + 1;
  } catch (e) {
    console.warn('Rank fetch failed:', e);
    return null;
  }
}

export { initFirebase, submitScore, fetchDailyLeaderboard, getPlayerRank };

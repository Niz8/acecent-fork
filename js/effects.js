// effects.js — Project Acecent
// Launch calculation engine: fuel tank, poker hands, held effects

const FUEL_PER_BURN_UNIT = 1000;
const BASE_TANK_SIZE = 3;

// Altitude tiers
const ALTITUDE_TIERS = [
  { name: 'Launch Failure',  emoji: '📉', min: 0,       max: 9999   },
  { name: 'Troposphere',     emoji: '🌤️', min: 10000,   max: 49999  },
  { name: 'Stratosphere',    emoji: '🌥️', min: 50000,   max: 99999  },
  { name: 'Mesosphere',      emoji: '🌌', min: 100000,  max: 249999 },
  { name: 'Thermosphere',    emoji: '🔥', min: 250000,  max: 499999 },
  { name: 'Exosphere',       emoji: '🌠', min: 500000,  max: 899999 },
  { name: 'Orbital',         emoji: '🛸', min: 900000,  max: Infinity },
];

function getTier(altitude) {
  return ALTITUDE_TIERS.find(t => altitude >= t.min && altitude <= t.max) || ALTITUDE_TIERS[0];
}

function getTankSize(heldCards) {
  let size = BASE_TANK_SIZE;
  for (const card of heldCards) {
    if (card.holdEffect) {
      if (TANK_SLOT_CARDS[card.id]) {
        size += TANK_SLOT_CARDS[card.id];
      }
    }
  }
  return size;
}

const TANK_SLOT_CARDS = {
  'A_spades': 1, 'K_spades': 1, 'Q_spades': 1, 'J_spades': 1,
  'A_hearts': 2, 'K_hearts': 2,
  'Q_hearts': 1, 'J_hearts': 1, '9_hearts': 1, '6_hearts': 1, '5_hearts': 1,
  'K_clubs': 1, 'J_clubs': 1,
};

function buildGameStateContext(heldCards, burnedCards, rng) {
  const heldSuitCounts = {};
  for (const card of heldCards) {
    heldSuitCounts[card.suit] = (heldSuitCounts[card.suit] || 0) + 1;
  }
  const rankCounts = {};
  for (const card of heldCards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  const handHasPair = Object.values(rankCounts).some(v => v >= 2);
  const tankSize = getTankSize(heldCards);

  return {
    heldCards,
    burnedCards,
    rng,
    handHasPair,
    _tankSize: tankSize,
    heldSuitCount: (suit) => heldSuitCounts[suit] || 0,
    burnedSuitCount: (suit) => burnedCards.filter(c => c.suit === suit).length,
  };
}

function applyFuelTank(burnedCards, tankSize, log) {
  if (burnedCards.length <= tankSize) {
    log.push(`\u26fd Tank: ${burnedCards.length}/${tankSize} slots used \u2014 all fuel counts`);
    return burnedCards;
  }
  const overflow = burnedCards.length - tankSize;
  const dropped = burnedCards.slice(0, overflow);
  const kept = burnedCards.slice(overflow);
  dropped.forEach(c => log.push(`\💨 ${c.emoji} ${c.rank}${c.suitSymbol} overflowed tank \u2014 fuel lost`));
  log.push(`\u26fd Tank: ${kept.length}/${tankSize} slots \u2014 oldest ${overflow} card${overflow > 1 ? 's' : ''} dropped`);
  return kept;
}

function calculateFuel(keptBurnedCards, heldCards, log) {
  let fuel = 0;
  const hasKingSpades = heldCards.some(c => c.id === 'K_spades');
  const has10Spades = heldCards.some(c => c.id === '10_spades');

  for (const card of keptBurnedCards) {
    let cardFuel = card.burnValue * FUEL_PER_BURN_UNIT;
    let multiplier = 1;
    if (card.suit === 'spades') {
      if (hasKingSpades) multiplier *= 2;
      if (has10Spades) multiplier *= 1.5;
    }
    const finalFuel = Math.round(cardFuel * multiplier);
    fuel += finalFuel;
    const multNote = multiplier > 1 ? ` (\u2716\ufe0f${multiplier.toFixed(2)}x boosted)` : '';
    log.push(`\u26fd ${card.emoji} ${card.rank}${card.suitSymbol} burned: +${finalFuel.toLocaleString()} ft${multNote}`);
  }
  return fuel;
}

// Check if non-joker rank indices can form a straight with N jokers filling gaps
// Also handles ace-low (A-2-3-4-5)
function canFormStraightWithJokers(rankIndices, jokerCount) {
  if (rankIndices.length === 0) return jokerCount >= 5; // all jokers
  if (new Set(rankIndices).size !== rankIndices.length) return false; // duplicate ranks — jokers can't fix

  const sorted = [...rankIndices].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0];

  // High-ace check: span must be <= 4 and gaps fillable with available jokers
  const gapsNeeded = span - (sorted.length - 1); // gaps between existing cards
  const slotsNeeded = 4 - span; // slots needed to reach 5 cards total
  const highAceWorks = span <= 4 && gapsNeeded + slotsNeeded <= jokerCount;

  // Low-ace check: treat A (index 12) as index -1
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

// Poker hand detection on held hand
// Jokers are wild for flushes, straights, and rank combos
function detectPokerHand(heldCards) {
  const nonJokers = heldCards.filter(c => c.suit !== 'joker');
  const jokerCount = heldCards.length - nonJokers.length;

  const ranks = nonJokers.map(c => c.rank);
  const suits = nonJokers.map(c => c.suit);

  const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const rankCounts = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  // Flush: jokers wild — all non-joker cards share a suit
  const isFlush = heldCards.length === 5 && (
    nonJokers.length === 0 || suits.every(s => s === suits[0])
  );

  // Straight: jokers now wild
  const rankIndices = ranks.map(r => rankOrder.indexOf(r));
  const isStraight = heldCards.length === 5 && canFormStraightWithJokers(rankIndices, jokerCount);

  // Straight flush: both conditions met
  const isStraightFlush = isFlush && isStraight;

  // Rank combos: jokers boost highest count
  const allCounts = jokerCount > 0
    ? (() => {
        const c = [...counts];
        if (c.length === 0) c.push(0);
        c[0] += jokerCount;
        return c.sort((a, b) => b - a);
      })()
    : counts;

  if (isStraightFlush) return { name: 'Straight Flush', emoji: '\🌟', bonus: 400000, jokerAssisted: jokerCount > 0 };
  if (allCounts[0] >= 4) return { name: 'Four of a Kind', emoji: '\💫', bonus: 200000 };
  if (allCounts[0] >= 3 && allCounts[1] >= 2) return { name: 'Full House', emoji: '\🏠', bonus: 120000 };
  if (isFlush) return { name: 'Flush', emoji: '\u267b\ufe0f', bonus: 200000, jokerAssisted: jokerCount > 0 };
  if (isStraight) return { name: 'Straight', emoji: '\📈', bonus: 150000, jokerAssisted: jokerCount > 0 };
  if (allCounts[0] >= 3) return { name: 'Three of a Kind', emoji: '\🎯', bonus: 80000 };
  if (allCounts[0] >= 2 && allCounts[1] >= 2) return { name: 'Two Pair', emoji: '\👯', bonus: 40000 };
  if (allCounts[0] >= 2) return { name: 'One Pair', emoji: '\u270c\ufe0f', bonus: 10000 };
  return null;
}

function processHeldEffects(heldCards, gs) {
  const log = [];
  let flatBonus = 0;
  let multipliers = [];

  for (const card of heldCards) {
    if (!card.holdEffect) continue;
    const result = card.holdEffect.fn(gs);
    if (result.altitudeFlat) flatBonus += result.altitudeFlat;
    if (result.altitudeMult) multipliers.push(result.altitudeMult);
    log.push(result.message);
  }

  return { flatBonus, multipliers, log };
}

function calculateLaunch(heldCards, burnedCards, rng) {
  const gs = buildGameStateContext(heldCards, burnedCards, rng);
  const fullLog = [];

  fullLog.push('\🔧 ENGINE CHECK...');

  const tankSize = getTankSize(heldCards);
  fullLog.push(`\u26fd Fuel tank capacity: ${tankSize} slots`);

  const keptBurned = applyFuelTank(burnedCards, tankSize, fullLog);
  const fuel = calculateFuel(keptBurned, heldCards, fullLog);
  fullLog.push(`\u26fd Total fuel: ${fuel.toLocaleString()} ft`);

  const pokerHand = detectPokerHand(heldCards);
  let pokerBonus = 0;
  if (pokerHand) {
    pokerBonus = pokerHand.bonus;
    const jokerNote = pokerHand.jokerAssisted ? ' (Joker wild)' : '';
    fullLog.push(`${pokerHand.emoji} ${pokerHand.name.toUpperCase()}!${jokerNote} +${pokerBonus.toLocaleString()} ft`);
  }

  const { flatBonus, multipliers, log: effectLog } = processHeldEffects(heldCards, gs);
  fullLog.push(...effectLog);

  let altitude = fuel + pokerBonus + flatBonus;
  const totalFlat = pokerBonus + flatBonus;
  if (totalFlat > 0) fullLog.push(`\🚀 Flat bonuses: +${totalFlat.toLocaleString()} ft \u2192 ${altitude.toLocaleString()} ft`);

  for (const mult of multipliers) {
    altitude = Math.round(altitude * mult);
    fullLog.push(`\u2716\ufe0f Multiplier \u2716\ufe0f${mult}x \u2192 ${altitude.toLocaleString()} ft`);
  }

  altitude = Math.max(0, altitude);

  const tier = getTier(altitude);
  fullLog.push(`\🎯 FINAL ALTITUDE: ${altitude.toLocaleString()} ft`);
  fullLog.push(`${tier.emoji} ${tier.name.toUpperCase()}`);

  return { altitude, tier, log: fullLog };
}

export { calculateLaunch, getTier, ALTITUDE_TIERS, FUEL_PER_BURN_UNIT, BASE_TANK_SIZE, getTankSize, detectPokerHand, TANK_SLOT_CARDS };

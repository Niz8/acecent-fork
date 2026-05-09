// config.js — Project Acecent
// Version and readme content live here

const VERSION = '0.6.7-alpha';

const README = {
  version: VERSION,
  sections: [
    {
      id: 'about',
      title: '🚀 What is Project Acecent?',
      content: `Project Acecent is a daily five-card strategy game with a space launch theme. Every day a new deck is seeded — the same for everyone. You get five cards, a fuel tank, and a limited number of redraws. Your goal: get as high as possible.

Compare your altitude with friends and see who reaches Orbital.`
    },
    {
      id: 'howtoplay',
      title: '🎴 How to Play',
      content: `1. You are dealt five cards from the daily deck.
2. Each card has a BURN value — cards you discard become rocket fuel.
3. Some cards have HOLD effects — keep them in your hand and they trigger at launch (multipliers, flat bonuses, tank slots).
4. Some cards have BURN effects — discard them for a bonus like an extra redraw or extended peek.
5. Tap a detail card to select it for burning, then hit Redraw to burn selected cards and draw replacements.
6. You start with 2 redraws. Some cards give you more when burned.
7. When you are happy with your hand, hit LAUNCH.
8. Your final altitude is calculated from your tank fuel, poker hand bonus, held card effects, and multipliers.
9. You get one launch per day. Make it count.`
    },
    {
      id: 'tank',
      title: '⛽ Fuel Tank',
      content: `Your fuel tank has a base capacity of 3 card slots. Only fuel from cards within the tank counts toward your altitude — burns beyond the limit overflow and are lost.

Holding face cards (Jack, Queen, King, Ace) of Spades, Hearts, or Clubs expands your tank. Hearts face cards give the most expansion — Ace and King of Hearts add 2 slots each. All other non-Diamond face cards add 1 slot each.

The tank strip at the top of your hand screen shows which cards are in range and which are overflowing. Oldest burns overflow first.

Strategy: decide early whether you are building a deep-burn deck (hold tank-expanding face cards) or a tight hold deck (burn fewer cards, rely on multipliers).`
    },
    {
      id: 'poker',
      title: '🃏 Poker Hand Bonuses',
      content: `Your held hand at launch is evaluated for poker hands. Bonuses are flat altitude additions applied before multipliers — so they feed into your multiplier chain.

✌️ One Pair — +10,000 ft
👯 Two Pair — +25,000 ft
🎯 Three of a Kind — +50,000 ft
📈 Straight (5 consecutive ranks) — +100,000 ft
♻️ Flush (5 same suit) — +150,000 ft
🏠 Full House — +80,000 ft
💫 Four of a Kind — +200,000 ft
🌟 Straight Flush — +400,000 ft

The status bar shows your current best poker hand live as you redraw. Stop burning when you hit a strong hand — more burns expand your tank but may break your poker configuration.`
    },
    {
      id: 'tiers',
      title: '🌌 Altitude Tiers',
      content: `📉 Launch Failure — 0 to 9,999 ft
🌤️ Troposphere — 10,000 to 49,999 ft
🌥️ Stratosphere — 50,000 to 99,999 ft
🌌 Mesosphere — 100,000 to 249,999 ft
🔥 Thermosphere — 250,000 to 499,999 ft
🌠 Exosphere — 500,000 to 899,999 ft
🛸 Orbital — 900,000 ft and above

Orbital requires near-perfect play. Most players land in Stratosphere or Mesosphere on a good day.`
    },
    {
      id: 'cards',
      title: '⭐ Special Cards',
      subtitle: 'Note: Only cards with special effects are listed here. All cards have fuel (burn) value. More effects coming in future updates.',
      suits: [
        {
          name: 'Spades ♠️',
          theme: 'Thrust — raw power, spade combos, fuel multipliers',
          color: '#3a7bd5',
          cards: [
            { card: 'A♠️', type: 'HOLD', desc: '✖️1.5x altitude if no pairs + ⛽ +1 tank slot' },
            { card: 'K♠️', type: 'HOLD', desc: '✖️2x spade fuel + ⛽ +1 tank slot' },
            { card: 'Q♠️', type: 'HOLD', desc: '✖️1.3x if 3+ Spades held + ⛽ +1 tank slot' },
            { card: 'J♠️', type: 'HOLD', desc: '✖️1.15x altitude + ⛽ +1 tank slot' },
            { card: '10♠️', type: 'HOLD', desc: '✖️1.5x fuel from all burned Spades — stacks with King' },
            { card: '7♠️', type: 'HOLD', desc: '+5,000 ft if you hold any other Spade' },
            { card: '2♠️', type: 'BURN', desc: 'Burns for boosted fuel value' },
          ]
        },
        {
          name: 'Hearts ♥️',
          theme: 'Life Support — fuel tank expansion and crew synergy',
          color: '#e8334a',
          cards: [
            { card: 'A♥️', type: 'HOLD', desc: '⛽ +2 tank slots + ✖️1.2x altitude' },
            { card: 'K♥️', type: 'HOLD', desc: '⛽ +2 tank slots + ✖️1.15x altitude' },
            { card: 'Q♥️', type: 'HOLD', desc: '⛽ +1 tank slot + 🚀 +10,000 ft' },
            { card: 'J♥️', type: 'HOLD', desc: '⛽ +1 tank slot + ✖️1.1x altitude' },
            { card: '9♥️', type: 'HOLD', desc: '⛽ +1 tank slot + ✖️1.1x per Heart held' },
            { card: '6♥️', type: 'HOLD', desc: '⛽ +1 tank slot' },
            { card: '5♥️', type: 'HOLD', desc: '⛽ +1 tank slot' },
            { card: '4♥️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '3♥️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '2♥️', type: 'BURN', desc: '+1 redraw when burned' },
          ]
        },
        {
          name: 'Diamonds ♦️',
          theme: 'Engineering — synergy and pairs. All Diamonds burn for half value.',
          color: '#e8334a',
          cards: [
            { card: 'A♦️', type: 'HOLD', desc: '+30,000 ft if you hold 3 of a kind OR 4 of the same suit' },
            { card: 'K♦️', type: 'HOLD', desc: '✖️1.4x altitude — only if you burned zero Diamonds all game' },
            { card: 'Q♦️', type: 'HOLD', desc: '✖️1.2x altitude if you hold a pair' },
            { card: 'J♦️', type: 'HOLD', desc: '✖️1.15x altitude if you hold no Spades' },
            { card: '10♦️', type: 'HOLD', desc: '✖️1.1x altitude per unique suit in your held hand' },
            { card: '3♦️', type: 'HOLD', desc: '+8,000 ft if you hold a pair' },
            { card: '2♦️', type: 'HOLD', desc: '+5,000 ft if you hold a pair' },
          ]
        },
        {
          name: 'Clubs ♣️',
          theme: 'Mission Control — redraws, burn bonuses, extended peek',
          color: '#3a7bd5',
          cards: [
            { card: 'A♣️', type: 'BURN', desc: '+2 redraws when burned' },
            { card: 'K♣️', type: 'HOLD', desc: '✖️1.2x final altitude' },
            { card: 'Q♣️', type: 'BURN', desc: 'Reveals one additional next card suit for the rest of the game' },
            { card: 'J♣️', type: 'HOLD', desc: '✖️1.25x final altitude' },
            { card: '8♣️', type: 'HOLD', desc: '✖️1.15x altitude per 2 Clubs held' },
            { card: '5♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '4♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '3♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '2♣️', type: 'BURN', desc: '+1 redraw when burned' },
          ]
        },
        {
          name: 'Jokers 🃏',
          theme: 'Wild — high risk, high reward',
          color: '#cc88ff',
          cards: [
            { card: 'Red Joker 🃏', type: 'HOLD', desc: 'ALL SYSTEMS GO — +50,000 ft flat' },
            { card: 'Black Joker 🃏', type: 'HOLD', desc: 'ANOMALY — random effect ranging from 2x altitude to a significant penalty. Risky.' },
          ]
        }
      ]
    },
    {
      id: 'penalties',
      title: '⚠️ Watch Out For',
      content: `TANK OVERFLOW: If you burn more cards than your tank holds, the oldest burns are lost. Watch the tank strip — overflowing slots show with a 💨 icon. Expand your tank by holding face cards before burning aggressively.

BLACK JOKER: The Black Joker held effect is random. It could double your altitude or cut it in half. High risk, high reward.

POKER HAND BREAKS: Adding or removing a card from your hand can break a poker hand configuration. The status bar shows your current best hand live — check it before hitting redraw.

DIAMOND BURN VALUE: All Diamond cards burn for half their face value. They are designed to be held, not burned.`
    },
    {
      id: 'patchnotes',
      title: '📋 Patch Notes',
      patches: [
        {
          version: '0.6.7-alpha',
          date: 'May 2026',
          notes: [
            'Fixed bug where burning cards did not draw replacements correctly',
            'Fixed tank strip not rendering after a burn',
            'Added null safety guards to scroll position restore and tank strip render',
          ]
        },
        {
          version: '0.6.6-alpha',
          date: 'May 2026',
          notes: [
            'Burn order numbers shown on detail cards — first selected burns first',
            'Deselecting a card renumbers all subsequent selections downward',
            'Burn order determines which card overflows the tank if you exceed capacity',
            'Oldest burns (lowest numbers) overflow first — clear visibility of what gets dropped',
          ]
        },
        {
          version: '0.6.5-alpha',
          date: 'May 2026',
          notes: [
            'Version stamp added to all score submissions for auditability',
            'Force refresh banner shown to players on cached older versions',
            'Help screen fully updated — removed all penalty blocking references',
            'Added Fuel Tank and Poker Hand Bonus sections to help screen',
            'Hearts card list updated to reflect tank slot mechanics',
            'Watch Out For section replaces old Penalties section',
            'Tank overflow UI fixed — oldest cards now correctly shown as overflowing',
          ]
        },
        {
          version: '0.6.0-alpha',
          date: 'April 2026',
          notes: [
            'Fuel tank system — base 3 slots, face cards expand the tank',
            'Burns beyond tank capacity overflow — oldest card fuel is lost',
            'Tank strip UI shows filled and overflow slots in real time',
            'Poker hand bonuses on held hand — One Pair through Straight Flush',
            'Poker hand shown live in status bar so you know when to stop burning',
            'Hearts fully reworked — penalty blocking removed, now provide tank slots and altitude bonuses',
            'A♥️ and K♥️ give +2 tank slots, other Hearts face cards give +1',
            'All Spades/Clubs face cards give +1 tank slot on hold',
            'Signal interference penalty removed entirely',
            'Engine stress penalty removed — tank system replaces it',
            '10♦️ reworked — +12,000 ft if you hold 3+ of same suit',
            'Status bar now shows tank status and current poker hand bonus',
          ]
        },
        {
          version: '0.5.0-alpha',
          date: 'April 2026',
          notes: [
            'Major balance rework — holding cards now meaningfully beats burning everything',
            'All face card hold effects converted from flat bonuses to multipliers',
            'Q♠️: now ✖️1.3x if 3+ spades (was +15,000 ft)',
            'J♠️: now ✖️1.15x flat (was +8,000 ft)',
            'K♦️: now ✖️1.4x if zero diamonds burned (was +20,000 ft)',
            'Q♦️: now ✖️1.2x if pair held (was +8,000 ft)',
            'J♦️: now ✖️1.15x if no spades (was +6,000 ft)',
            '10♦️: now ✖️1.1x per unique suit (was +4,000 ft per suit)',
            '9♥️: now ✖️1.1x per heart held (was +3,000 ft per heart)',
            'A♥️: now block + ✖️1.2x (was block + +10,000 ft)',
            'J♥️: now block + ✖️1.1x (was block + +4,000 ft)',
            'K♣️: now ✖️1.2x flat (was +10,000 ft)',
            'J♣️: now ✖️1.25x flat — wildcard removed, always fires',
            '8♣️: bumped to ✖️1.15x per 2 clubs (was ✖️1.1x)',
            '2♦️ and 3♦️ pair bonuses bumped to +5,000 and +8,000 ft',
            '2♠️ burn value bumped to 8 (was 6)',
            'Engine stress penalty increased to ✖️0.75x (was ✖️0.85x)',
            'Fixed processHeldEffects priority sort bug',
          ]
        },
        {
          version: '0.4.0-alpha',
          date: 'April 2026',
          notes: [
            'Major card rework across all suits',
            'Diamonds: all burn for half value — holding is the strategy',
            'Diamonds: 2 and 3 now HOLD pair bonuses, Queen reworked to pair bonus',
            'Diamonds: King gives +20,000 ft but only if zero diamonds burned',
            'Diamonds: Ace gives +30,000 ft for 3 of a kind or 4 of same suit',
            'Diamonds: Jack reworked — +6,000 ft if no spades held',
            'Spades: 10 now HOLD 1.5x spade fuel (stacks multiplicatively with King)',
            'Spades: 7 reworked — +5,000 ft if you hold any other spade',
            'Clubs: Queen reworked — BURN to gain permanent extra peek for rest of game',
            'Clubs: 4 now gives +1 redraw on burn',
            'Hearts: Jack reworked — blocks one penalty + 4,000 ft',
            'Hearts: 5 and 6 now block one penalty each',
            'Multiplicative stacking — holding multiple synergy cards compounds correctly',
            'Firestore security rules locked down',
          ]
        },
        {
          version: '0.3.0-alpha',
          date: 'April 2026',
          notes: [
            'Chip tap now scrolls to card in detail view — no longer selects for burn',
            'Only tapping detail card selects it for burning',
            'Selected card count shown near redraw button',
            'Orange selected state now overwrites green condition glow on chips and cards',
            'Detail scroll position preserved after selecting a card',
            'Penalty status bar shows engine stress and signal interference warnings live',
            'Next card suit peek shown at end of quick-view strip',
            'Leaderboard close button now returns to result screen correctly',
            'Already-played screen now has View Leaderboard button',
            'Removed debug Script started text',
          ]
        },
        {
          version: '0.2.0-alpha',
          date: 'April 2026',
          notes: [
            'New quick-view strip showing hand at a glance',
            'Horizontal scrolling detail cards with light background',
            'Suit symbols now visible on dark backgrounds',
            'Firebase daily leaderboard — scores submitted after launch',
            'README/patch notes modal on first load and version bumps',
            'Floating help button accessible from any screen',
            'Privacy disclaimer on name entry screen',
            'Vibe code disclaimer and version number in footer',
            'Launch Failure no longer implies casualties',
          ]
        },
        {
          version: '0.1.0-alpha',
          date: 'April 2026',
          notes: [
            'Initial alpha release',
            'Full 54-card deck with seeded daily shuffle',
            'Five card draw with hold and burn effects',
            'Two base redraws, expandable via burn cards',
            'Seven altitude tiers from Launch Failure to Orbital',
            'Rocket hop launch animation',
            'Share card copied to clipboard',
            'Display name saved between sessions',
            'Already-played screen with share card for return visits',
          ]
        }
      ]
    }
  ]
};

export { VERSION, README };

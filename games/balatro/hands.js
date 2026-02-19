// hands.js - Hand evaluation (poker hands, best-play finder)
// Ported from TUIClassics/games/balatro/hands.go

(function() {
  const B = window.Balatro;

  // Hand types ordered lowest to highest
  const HIGH_CARD=0, PAIR=1, TWO_PAIR=2, THREE_OF_KIND=3, STRAIGHT=4,
        FLUSH=5, FULL_HOUSE=6, FOUR_OF_KIND=7, STRAIGHT_FLUSH=8, ROYAL_FLUSH=9;

  B.HandType = { HIGH_CARD, PAIR, TWO_PAIR, THREE_OF_KIND, STRAIGHT, FLUSH, FULL_HOUSE, FOUR_OF_KIND, STRAIGHT_FLUSH, ROYAL_FLUSH };

  B.handTypeName = t => [
    'High Card','Pair','Two Pair','Three of a Kind','Straight',
    'Flush','Full House','Four of a Kind','Straight Flush','Royal Flush'
  ][t] || '?';

  // Base values per hand type
  const baseValues = [
    { chips: 5,   mult: 1 },  // High Card
    { chips: 10,  mult: 2 },  // Pair
    { chips: 20,  mult: 2 },  // Two Pair
    { chips: 30,  mult: 3 },  // Three of a Kind
    { chips: 30,  mult: 4 },  // Straight
    { chips: 35,  mult: 4 },  // Flush
    { chips: 40,  mult: 4 },  // Full House
    { chips: 60,  mult: 7 },  // Four of a Kind
    { chips: 100, mult: 8 },  // Straight Flush
    { chips: 100, mult: 8 },  // Royal Flush
  ];
  B.baseHandValues = baseValues;

  // Planet card level-up values (chips added, mult added per level)
  const levelUpValues = [
    { chips: 10, mult: 1 },  // High Card
    { chips: 15, mult: 1 },  // Pair
    { chips: 20, mult: 1 },  // Two Pair
    { chips: 20, mult: 2 },  // Three of a Kind
    { chips: 30, mult: 3 },  // Straight
    { chips: 15, mult: 2 },  // Flush
    { chips: 25, mult: 2 },  // Full House
    { chips: 30, mult: 3 },  // Four of a Kind
    { chips: 40, mult: 4 },  // Straight Flush
    { chips: 40, mult: 4 },  // Royal Flush
  ];
  B.levelUpValues = levelUpValues;

  // Hand levels (modified by planet cards)
  B.handLevels = [1,1,1,1,1,1,1,1,1,1]; // start at level 1

  B.getHandBaseValues = type => {
    const bv = baseValues[type];
    const level = B.handLevels[type];
    const lv = levelUpValues[type];
    return {
      chips: bv.chips + (level - 1) * lv.chips,
      mult: bv.mult + (level - 1) * lv.mult,
    };
  };

  // --- Helpers ---
  function rankCounts(cards) {
    const counts = {};
    for (const c of cards) counts[c.rank] = (counts[c.rank] || 0) + 1;
    return counts;
  }

  function getRanks(cards) {
    return cards.map(c => c.rank);
  }

  function isFlush(cards) {
    if (cards.length === 0) return false;
    const s = cards[0].suit;
    return cards.every(c => c.suit === s);
  }

  function isStraight(cards) {
    if (cards.length !== 5) return false;
    const ranks = getRanks(cards).sort((a,b) => a - b);
    // Regular straight
    let straight = true;
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i-1] + 1) { straight = false; break; }
    }
    if (straight) return true;
    // Wheel: A-2-3-4-5
    if (ranks[0]===1 && ranks[1]===2 && ranks[2]===3 && ranks[3]===4 && ranks[4]===5) return true;
    // Broadway: 10-J-Q-K-A
    if (ranks[0]===1 && ranks[1]===10 && ranks[2]===11 && ranks[3]===12 && ranks[4]===13) return true;
    return false;
  }

  function isRoyalFlush(cards) {
    if (!isStraight(cards) || !isFlush(cards)) return false;
    const ranks = getRanks(cards).sort((a,b) => a - b);
    return ranks[0]===1 && ranks[1]===10 && ranks[2]===11 && ranks[3]===12 && ranks[4]===13;
  }

  function isFourOfKind(cards) {
    const counts = rankCounts(cards);
    return Object.values(counts).some(c => c === 4);
  }

  function isFullHouse(cards) {
    const vals = Object.values(rankCounts(cards));
    return vals.includes(3) && vals.includes(2);
  }

  function isThreeOfKind(cards) {
    return Object.values(rankCounts(cards)).some(c => c === 3);
  }

  function isTwoPair(cards) {
    return Object.values(rankCounts(cards)).filter(c => c === 2).length === 2;
  }

  function isPair(cards) {
    return Object.values(rankCounts(cards)).some(c => c === 2);
  }

  // Evaluate exactly 5 cards
  B.evaluateHand = cards => {
    if (cards.length !== 5) {
      const bv = B.getHandBaseValues(HIGH_CARD);
      return { type: HIGH_CARD, cards, baseChips: bv.chips, baseMult: bv.mult, level: B.handLevels[HIGH_CARD] };
    }

    let type;
    if (isRoyalFlush(cards)) type = ROYAL_FLUSH;
    else if (isStraight(cards) && isFlush(cards)) type = STRAIGHT_FLUSH;
    else if (isFourOfKind(cards)) type = FOUR_OF_KIND;
    else if (isFullHouse(cards)) type = FULL_HOUSE;
    else if (isFlush(cards)) type = FLUSH;
    else if (isStraight(cards)) type = STRAIGHT;
    else if (isThreeOfKind(cards)) type = THREE_OF_KIND;
    else if (isTwoPair(cards)) type = TWO_PAIR;
    else if (isPair(cards)) type = PAIR;
    else type = HIGH_CARD;

    const bv = B.getHandBaseValues(type);
    return { type, cards, baseChips: bv.chips, baseMult: bv.mult, level: B.handLevels[type] };
  };

  // Evaluate any number of cards (1-5) for preview display
  B.evaluatePartialHand = cards => {
    if (cards.length === 0) return null;
    if (cards.length === 5) return B.evaluateHand(cards);
    if (cards.length > 5) return null;

    // For < 5 cards, check what we can detect
    const counts = rankCounts(cards);
    const vals = Object.values(counts);

    let type = HIGH_CARD;
    if (vals.includes(4)) type = FOUR_OF_KIND;
    else if (vals.includes(3) && vals.includes(2)) type = FULL_HOUSE;
    else if (vals.includes(3)) type = THREE_OF_KIND;
    else if (vals.filter(v => v === 2).length === 2) type = TWO_PAIR;
    else if (vals.includes(2)) type = PAIR;

    const bv = B.getHandBaseValues(type);
    return { type, cards, baseChips: bv.chips, baseMult: bv.mult, level: B.handLevels[type] };
  };

  // Generate C(n,k) combinations
  function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
    const withoutFirst = combinations(rest, k);
    return withFirst.concat(withoutFirst);
  }
  B.combinations = combinations;

  // Find the best 5-card hand from a larger hand
  B.findBestPlay = hand => {
    if (hand.length <= 5) {
      const info = B.evaluateHand(hand);
      return { cards: hand, info };
    }
    const combos = combinations(hand, 5);
    let bestCards = null, bestInfo = { type: HIGH_CARD, baseChips: 0, baseMult: 0 };
    for (const combo of combos) {
      const info = B.evaluateHand(combo);
      if (info.type > bestInfo.type || (info.type === bestInfo.type && info.baseChips > bestInfo.baseChips)) {
        bestInfo = info;
        bestCards = [...combo];
      }
    }
    return { cards: bestCards, info: bestInfo };
  };
})();

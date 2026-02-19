// cards.js - Card data model, deck, suits, ranks, enhancements, editions, seals
// Ported from TUIClassics/games/balatro/cards.go

(function() {
  const B = window.Balatro = window.Balatro || {};

  // --- SUITS ---
  const CLUBS = 0, DIAMONDS = 1, HEARTS = 2, SPADES = 3;
  B.Suit = { CLUBS, DIAMONDS, HEARTS, SPADES };

  B.suitSymbol = s => ['♣','♦','♥','♠'][s] || '?';
  B.suitName = s => ['Clubs','Diamonds','Hearts','Spades'][s] || '?';
  B.suitColor = s => ['#22c55e','#f97316','#ec4899','#06b6d4'][s] || '#fff';

  // --- RANKS (1=Ace through 13=King) ---
  const ACE=1,TWO=2,THREE=3,FOUR=4,FIVE=5,SIX=6,SEVEN=7,EIGHT=8,NINE=9,TEN=10,JACK=11,QUEEN=12,KING=13;
  B.Rank = { ACE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,TEN,JACK,QUEEN,KING };

  B.rankShort = r => {
    if (r === ACE) return 'A';
    if (r === JACK) return 'J';
    if (r === QUEEN) return 'Q';
    if (r === KING) return 'K';
    return String(r);
  };

  B.rankName = r => {
    const names = {1:'Ace',10:'Ten',11:'Jack',12:'Queen',13:'King'};
    return names[r] || String(r);
  };

  B.rankChipValue = r => {
    if (r === ACE) return 11;
    if (r >= TEN) return 10;
    return r;
  };

  // --- ENHANCEMENTS ---
  const NO_ENHANCEMENT=0, BONUS=1, MULT=2, GLASS=3, STEEL=4, STONE=5, GOLD=6, LUCKY=7;
  B.Enhancement = { NONE: NO_ENHANCEMENT, BONUS, MULT, GLASS, STEEL, STONE, GOLD, LUCKY };

  B.enhancementName = e => ['None','Bonus','Mult','Glass','Steel','Stone','Gold','Lucky'][e] || '?';
  B.enhancementDesc = e => [
    'No enhancement','+30 chips when scored','+4 mult when scored',
    'x2 mult, destroys when scored','+50 chips while in hand',
    '+50 chips, no rank/suit','$3 at end of round','1 in 5 chance for +20 mult'
  ][e] || '?';
  B.enhancementColor = e => [
    '#9ca3af','#facc15','#ec4899','#06b6d4','#94a3b8','#92400e','#fbbf24','#22c55e'
  ][e] || '#9ca3af';

  // --- EDITIONS ---
  const NO_EDITION=0, FOIL=1, HOLOGRAPHIC=2, POLYCHROME=3;
  B.Edition = { NONE: NO_EDITION, FOIL, HOLOGRAPHIC, POLYCHROME };
  B.editionName = e => ['None','Foil','Holographic','Polychrome'][e] || '?';

  // --- SEALS ---
  const NO_SEAL=0, RED_SEAL=1, BLUE_SEAL=2, GOLD_SEAL=3, PURPLE_SEAL=4;
  B.Seal = { NONE: NO_SEAL, RED: RED_SEAL, BLUE: BLUE_SEAL, GOLD: GOLD_SEAL, PURPLE: PURPLE_SEAL };
  B.sealName = s => ['None','Red','Blue','Gold','Purple'][s] || '?';

  // --- CARD ---
  B.createCard = (suit, rank) => ({
    suit, rank,
    enhancement: NO_ENHANCEMENT,
    edition: NO_EDITION,
    seal: NO_SEAL,
    selected: false,
    played: false,
    id: suit * 13 + rank  // unique ID within a standard deck
  });

  B.cardChipValue = card => {
    let chips = B.rankChipValue(card.rank);
    if (card.enhancement === BONUS) chips += 30;
    if (card.enhancement === STEEL) chips += 50;
    if (card.enhancement === STONE) chips += 50;
    if (card.edition === FOIL) chips += 50;
    return chips;
  };

  B.cardDisplay = card => B.rankShort(card.rank) + B.suitSymbol(card.suit);

  B.copyCard = c => ({ ...c });

  // --- DECK ---
  B.newDeck = () => {
    const deck = [];
    for (let suit = CLUBS; suit <= SPADES; suit++) {
      for (let rank = ACE; rank <= KING; rank++) {
        deck.push(B.createCard(suit, rank));
      }
    }
    return deck;
  };

  B.shuffle = deck => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  // --- SORTING ---
  B.sortBySuit = cards => {
    return [...cards].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit - b.suit;
      return a.rank - b.rank;
    });
  };

  B.sortByRank = cards => {
    return [...cards].sort((a, b) => {
      // Ace is highest
      const ra = a.rank === ACE ? 14 : a.rank;
      const rb = b.rank === ACE ? 14 : b.rank;
      if (ra !== rb) return rb - ra; // descending
      return a.suit - b.suit;
    });
  };
})();

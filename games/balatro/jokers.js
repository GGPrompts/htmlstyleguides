// jokers.js - All joker definitions and effect application
// Ported from TUIClassics/games/balatro/jokers.go

(function() {
  const B = window.Balatro;

  // Effect types
  const NO_EFFECT=0, ADD_CHIPS=1, ADD_MULT=2, MULT_IF_PAIR=3, MULT_IF_SUIT=4,
        CHIPS_PER_CARD=5, RETRIGGER_FIRST=6, MULT_PERCENTAGE=7;

  B.JokerEffect = { NO_EFFECT, ADD_CHIPS, ADD_MULT, MULT_IF_PAIR, MULT_IF_SUIT, CHIPS_PER_CARD, RETRIGGER_FIRST, MULT_PERCENTAGE };

  // Rarity
  const COMMON=0, UNCOMMON=1, RARE=2, LEGENDARY=3;
  B.Rarity = { COMMON, UNCOMMON, RARE, LEGENDARY };

  B.rarityName = r => ['Common','Uncommon','Rare','Legendary'][r] || '?';
  B.rarityColor = r => ['#d4d4d8','#22c55e','#06b6d4','#facc15'][r] || '#d4d4d8';
  B.rarityCost = r => [5,7,10,20][r] || 5;

  // All joker definitions
  B.allJokers = [
    { id:'joker_basic', name:'Joker', desc:'+4 Mult', rarity:COMMON, effect:ADD_MULT, value:4 },
    { id:'greedy_joker', name:'Greedy Joker', desc:'Played Diamonds give +3 Mult each', rarity:COMMON, effect:MULT_IF_SUIT, value:3, targetSuit:B.Suit.DIAMONDS },
    { id:'lusty_joker', name:'Lusty Joker', desc:'Played Hearts give +3 Mult each', rarity:COMMON, effect:MULT_IF_SUIT, value:3, targetSuit:B.Suit.HEARTS },
    { id:'wrathful_joker', name:'Wrathful Joker', desc:'Played Spades give +3 Mult each', rarity:COMMON, effect:MULT_IF_SUIT, value:3, targetSuit:B.Suit.SPADES },
    { id:'gluttonous_joker', name:'Gluttonous Joker', desc:'Played Clubs give +3 Mult each', rarity:COMMON, effect:MULT_IF_SUIT, value:3, targetSuit:B.Suit.CLUBS },
    { id:'jolly_joker', name:'Jolly Joker', desc:'+8 Mult if hand contains a Pair', rarity:COMMON, effect:MULT_IF_PAIR, value:8 },
    { id:'zany_joker', name:'Zany Joker', desc:'+12 Mult if hand contains Three of a Kind', rarity:COMMON, effect:MULT_IF_PAIR, value:12 },
    { id:'mad_joker', name:'Mad Joker', desc:'+10 Mult if hand contains Two Pair', rarity:COMMON, effect:MULT_IF_PAIR, value:10 },
    { id:'crazy_joker', name:'Crazy Joker', desc:'+12 Mult if hand contains Straight', rarity:COMMON, effect:MULT_IF_PAIR, value:12 },
    { id:'half_joker', name:'Half Joker', desc:'+20 Mult if hand has 3 or fewer cards', rarity:COMMON, effect:ADD_MULT, value:20, condition:'max3cards' },
    { id:'banner', name:'Banner', desc:'+30 Chips per discard remaining', rarity:COMMON, effect:ADD_CHIPS, value:30, condition:'perDiscard' },
    { id:'mystic_summit', name:'Mystic Summit', desc:'+15 Mult when 0 discards remain', rarity:COMMON, effect:ADD_MULT, value:15, condition:'noDiscards' },
    { id:'sly_joker', name:'Sly Joker', desc:'+50 Chips if hand contains a Pair', rarity:COMMON, effect:ADD_CHIPS, value:50, condition:'ifPair' },
    { id:'wily_joker', name:'Wily Joker', desc:'+100 Chips if hand contains Three of a Kind', rarity:COMMON, effect:ADD_CHIPS, value:100, condition:'ifThree' },
    { id:'clever_joker', name:'Clever Joker', desc:'+80 Chips if hand contains Two Pair', rarity:COMMON, effect:ADD_CHIPS, value:80, condition:'ifTwoPair' },
    { id:'devious_joker', name:'Devious Joker', desc:'+100 Chips if hand contains Straight', rarity:COMMON, effect:ADD_CHIPS, value:100, condition:'ifStraight' },
    { id:'crafty_joker', name:'Crafty Joker', desc:'+80 Chips if hand contains Flush', rarity:COMMON, effect:ADD_CHIPS, value:80, condition:'ifFlush' },
    { id:'stencil', name:'Joker Stencil', desc:'x1 Mult per empty joker slot', rarity:UNCOMMON, effect:MULT_PERCENTAGE, value:100, condition:'emptySlots' },
    { id:'four_fingers', name:'Four Fingers', desc:'Flushes and Straights can be made with 4 cards', rarity:UNCOMMON, effect:NO_EFFECT, passive:true },
    { id:'mime', name:'Mime', desc:'Retrigger all cards held in hand', rarity:UNCOMMON, effect:RETRIGGER_FIRST, value:0 },
    { id:'steel_joker', name:'Steel Joker', desc:'+20 Chips for every Steel card in your full deck', rarity:UNCOMMON, effect:ADD_CHIPS, value:20, condition:'steelCards' },
    { id:'abstract_joker', name:'Abstract Joker', desc:'+3 Mult for each Joker you have', rarity:COMMON, effect:ADD_MULT, value:3, condition:'perJoker' },
    { id:'hack', name:'Hack', desc:'Retrigger each played 2, 3, 4, or 5', rarity:UNCOMMON, effect:RETRIGGER_FIRST, value:0, condition:'lowCards' },
    { id:'blue_joker', name:'Blue Joker', desc:'+2 Chips per remaining card in deck', rarity:COMMON, effect:ADD_CHIPS, value:2, condition:'deckSize' },
  ];

  B.getJokerById = id => {
    const j = B.allJokers.find(j => j.id === id);
    return j ? { ...j, counter: 0 } : null;
  };

  B.getRandomJoker = (maxRarity = UNCOMMON) => {
    const available = B.allJokers.filter(j => (j.rarity || 0) <= maxRarity && !j.passive);
    if (!available.length) return null;
    const j = available[Math.floor(Math.random() * available.length)];
    return { ...j, counter: 0 };
  };

  B.getJokerCost = joker => B.rarityCost(joker.rarity || 0);
  B.getJokerSellValue = joker => Math.floor(B.getJokerCost(joker) / 2);

  // Apply a single joker's effect to score calculation
  B.applyJoker = (joker, calc, handInfo, playedCards) => {
    const HT = B.HandType;
    switch (joker.effect) {
      case ADD_CHIPS: {
        let chips = joker.value;
        // Conditional chips
        if (joker.condition === 'ifPair' && handInfo.type < HT.PAIR) return;
        if (joker.condition === 'ifThree' && handInfo.type < HT.THREE_OF_KIND) return;
        if (joker.condition === 'ifTwoPair' && handInfo.type !== HT.TWO_PAIR && handInfo.type < HT.FULL_HOUSE) return;
        if (joker.condition === 'ifStraight' && handInfo.type !== HT.STRAIGHT && handInfo.type !== HT.STRAIGHT_FLUSH && handInfo.type !== HT.ROYAL_FLUSH) return;
        if (joker.condition === 'ifFlush' && handInfo.type !== HT.FLUSH && handInfo.type !== HT.STRAIGHT_FLUSH && handInfo.type !== HT.ROYAL_FLUSH) return;
        if (joker.condition === 'perDiscard' && B.gameState) chips = joker.value * B.gameState.roundState.discardsRemaining;
        if (joker.condition === 'deckSize' && B.gameState) chips = joker.value * B.gameState.deck.length;
        calc.totalChips += chips;
        calc.chipMods.push(`+${chips} (${joker.name})`);
        break;
      }
      case ADD_MULT: {
        let mult = joker.value;
        if (joker.condition === 'max3cards' && playedCards.length > 3) return;
        if (joker.condition === 'noDiscards' && B.gameState && B.gameState.roundState.discardsRemaining > 0) return;
        if (joker.condition === 'perJoker' && B.gameState) mult = joker.value * B.gameState.jokers.length;
        calc.totalMult += mult;
        calc.multMods.push(`+${mult} (${joker.name})`);
        break;
      }
      case MULT_IF_PAIR:
        if (handInfo.type >= B.HandType.PAIR) {
          calc.totalMult += joker.value;
          calc.multMods.push(`+${joker.value} (${joker.name})`);
        }
        break;
      case MULT_IF_SUIT: {
        let count = 0;
        for (const c of playedCards) {
          if (c.suit === joker.targetSuit) count++;
        }
        if (count > 0) {
          const bonus = joker.value * count;
          calc.totalMult += bonus;
          calc.multMods.push(`+${bonus} (${joker.name} - ${count} cards)`);
        }
        break;
      }
      case CHIPS_PER_CARD: {
        let count = 0;
        for (const c of playedCards) {
          if (c.rank === joker.targetRank) count++;
        }
        if (count > 0) {
          const bonus = joker.value * count;
          calc.totalChips += bonus;
          calc.chipMods.push(`+${bonus} (${joker.name} - ${count} cards)`);
        }
        break;
      }
      case RETRIGGER_FIRST:
        if (playedCards.length > 0) {
          const card = playedCards[0];
          const chips = B.cardChipValue(card);
          calc.totalChips += chips;
          calc.chipMods.push(`+${chips} (${joker.name} retrigger)`);
          if (card.enhancement === B.Enhancement.MULT) {
            calc.totalMult += 4;
            calc.multMods.push(`+4 (${joker.name} retrigger)`);
          }
        }
        break;
      case MULT_PERCENTAGE:
        if (joker.value > 100) {
          calc.totalMult = Math.floor(calc.totalMult * joker.value / 100);
          calc.multMods.push(`x${(joker.value/100).toFixed(2)} (${joker.name})`);
        }
        break;
    }
  };
})();

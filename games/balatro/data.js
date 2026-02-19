// data.js - Planet cards, tarot cards, voucher definitions

(function() {
  const B = window.Balatro;
  const HT = B.HandType;

  // Planet cards - each levels up one hand type
  B.planetCards = [
    { id:'mercury', name:'Mercury', desc:'Level up High Card', handType: HT.HIGH_CARD, cost: 3 },
    { id:'venus',   name:'Venus',   desc:'Level up Pair', handType: HT.PAIR, cost: 3 },
    { id:'earth',   name:'Earth',   desc:'Level up Two Pair', handType: HT.TWO_PAIR, cost: 3 },
    { id:'mars',    name:'Mars',    desc:'Level up Three of a Kind', handType: HT.THREE_OF_KIND, cost: 3 },
    { id:'jupiter', name:'Jupiter', desc:'Level up Straight', handType: HT.STRAIGHT, cost: 3 },
    { id:'saturn',  name:'Saturn',  desc:'Level up Flush', handType: HT.FLUSH, cost: 3 },
    { id:'uranus',  name:'Uranus',  desc:'Level up Full House', handType: HT.FULL_HOUSE, cost: 3 },
    { id:'neptune', name:'Neptune', desc:'Level up Four of a Kind', handType: HT.FOUR_OF_KIND, cost: 3 },
    { id:'pluto',   name:'Pluto',   desc:'Level up Straight Flush', handType: HT.STRAIGHT_FLUSH, cost: 3 },
  ];

  B.usePlanetCard = planet => {
    B.handLevels[planet.handType]++;
    return B.handLevels[planet.handType];
  };

  // Tarot cards - deck manipulation
  B.tarotCards = [
    { id:'the_fool',      name:'The Fool',      desc:'Create a copy of last Tarot/Planet used', cost: 3, action:'copyLast' },
    { id:'the_magician',  name:'The Magician',   desc:'Enhance 1 selected card to Lucky', cost: 3, action:'enhance', enhancement: B.Enhancement.LUCKY },
    { id:'the_empress',   name:'The Empress',    desc:'Enhance 2 selected cards to Mult', cost: 3, action:'enhance', enhancement: B.Enhancement.MULT, count: 2 },
    { id:'the_hierophant', name:'The Hierophant', desc:'Enhance 2 selected cards to Bonus', cost: 3, action:'enhance', enhancement: B.Enhancement.BONUS, count: 2 },
    { id:'the_lovers',    name:'The Lovers',     desc:'Enhance 1 selected card to Gold', cost: 3, action:'enhance', enhancement: B.Enhancement.GOLD },
    { id:'the_chariot',   name:'The Chariot',    desc:'Enhance 1 selected card to Steel', cost: 3, action:'enhance', enhancement: B.Enhancement.STEEL },
    { id:'justice',       name:'Justice',        desc:'Enhance 1 selected card to Glass', cost: 3, action:'enhance', enhancement: B.Enhancement.GLASS },
    { id:'the_hermit',    name:'The Hermit',     desc:'Double your money (max $20)', cost: 3, action:'doubleMoney', max: 20 },
    { id:'the_wheel',     name:'Wheel of Fortune', desc:'1 in 4 chance to add Foil, Holo, or Poly to a random Joker', cost: 3, action:'randomEdition' },
    { id:'strength',      name:'Strength',       desc:'Increase rank of up to 2 selected cards by 1', cost: 3, action:'increaseRank', count: 2 },
    { id:'the_tower',     name:'The Tower',      desc:'Enhance 1 selected card to Stone', cost: 3, action:'enhance', enhancement: B.Enhancement.STONE },
    { id:'death',         name:'Death',          desc:'Select 2 cards - left card becomes copy of right card', cost: 3, action:'copyCard' },
  ];

  B.useTarotCard = (tarot, selectedCards, state) => {
    if (!state) state = B.gameState;
    if (!state) return false;

    switch (tarot.action) {
      case 'enhance':
        const count = tarot.count || 1;
        for (let i = 0; i < Math.min(count, selectedCards.length); i++) {
          selectedCards[i].enhancement = tarot.enhancement;
        }
        return true;
      case 'doubleMoney':
        const gain = Math.min(tarot.max || 20, state.roundState.money);
        state.roundState.money += gain;
        return true;
      case 'increaseRank':
        for (let i = 0; i < Math.min(tarot.count || 1, selectedCards.length); i++) {
          if (selectedCards[i].rank < 13) selectedCards[i].rank++;
        }
        return true;
      case 'copyCard':
        if (selectedCards.length >= 2) {
          selectedCards[0].suit = selectedCards[1].suit;
          selectedCards[0].rank = selectedCards[1].rank;
          selectedCards[0].id = selectedCards[1].id + 100;
        }
        return true;
      default:
        return false;
    }
  };

  // Vouchers - permanent upgrades
  B.vouchers = [
    { id:'overstock', name:'Overstock', desc:'+1 card slot in shop', cost: 10, effect:'shopSlot' },
    { id:'clearance', name:'Clearance Sale', desc:'All shop items 25% off', cost: 10, effect:'discount' },
    { id:'hone', name:'Hone', desc:'Foil/Holo/Poly cards appear 2x more', cost: 10, effect:'editionBoost' },
    { id:'reroll_surplus', name:'Reroll Surplus', desc:'Rerolls cost $3 instead of $5', cost: 10, effect:'cheapReroll' },
    { id:'crystal_ball', name:'Crystal Ball', desc:'+1 consumable slot', cost: 10, effect:'consumableSlot' },
    { id:'telescope', name:'Telescope', desc:'Celestial cards appear 2x more in shop', cost: 10, effect:'planetBoost' },
    { id:'grabber', name:'Grabber', desc:'+1 hand per round', cost: 10, effect:'extraHand' },
    { id:'wasteful', name:'Wasteful', desc:'+1 discard per round', cost: 10, effect:'extraDiscard' },
    { id:'seed_money', name:'Seed Money', desc:'Interest cap goes to $25', cost: 10, effect:'interestCap' },
    { id:'blank', name:'Blank', desc:'+1 Joker slot', cost: 10, effect:'jokerSlot' },
  ];

  B.getRandomPlanet = () => {
    const planets = B.planetCards;
    return { ...planets[Math.floor(Math.random() * planets.length)], cardType: 'planet' };
  };

  B.getRandomTarot = () => {
    const tarots = B.tarotCards;
    return { ...tarots[Math.floor(Math.random() * tarots.length)], cardType: 'tarot' };
  };

  B.getRandomVoucher = (owned = []) => {
    const available = B.vouchers.filter(v => !owned.includes(v.id));
    if (!available.length) return null;
    return { ...available[Math.floor(Math.random() * available.length)] };
  };
})();

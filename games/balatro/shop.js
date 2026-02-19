// shop.js - Shop logic (jokers, planet cards, tarot cards, vouchers)

(function() {
  const B = window.Balatro;

  B.generateShop = () => {
    const state = B.gameState;
    if (!state) return null;

    const shop = {
      jokers: [],
      consumables: [],
      voucher: null,
      rerollCost: 5,
      ownedVouchers: state.ownedVouchers || [],
    };

    // 2 joker slots
    for (let i = 0; i < 2; i++) {
      const j = B.getRandomJoker(B.Rarity.UNCOMMON);
      if (j) {
        j.cost = B.getJokerCost(j);
        // Don't offer jokers player already has
        if (!state.jokers.find(oj => oj.id === j.id)) {
          shop.jokers.push(j);
        } else {
          // Try once more
          const j2 = B.getRandomJoker(B.Rarity.UNCOMMON);
          if (j2 && !state.jokers.find(oj => oj.id === j2.id)) {
            j2.cost = B.getJokerCost(j2);
            shop.jokers.push(j2);
          }
        }
      }
    }

    // 2 consumable slots (mix of planet and tarot)
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.5) {
        shop.consumables.push(B.getRandomPlanet());
      } else {
        shop.consumables.push(B.getRandomTarot());
      }
    }

    // 1 voucher
    shop.voucher = B.getRandomVoucher(shop.ownedVouchers);

    state.currentShop = shop;
    return shop;
  };

  B.buyJoker = index => {
    const state = B.gameState;
    if (!state || !state.currentShop) return false;
    const shop = state.currentShop;
    const joker = shop.jokers[index];
    if (!joker) return false;
    if (state.roundState.money < joker.cost) return false;
    if (state.jokers.length >= B.MAX_JOKERS) return false;

    state.roundState.money -= joker.cost;
    state.jokers.push(joker);
    shop.jokers.splice(index, 1);
    return true;
  };

  B.buyConsumable = index => {
    const state = B.gameState;
    if (!state || !state.currentShop) return false;
    const shop = state.currentShop;
    const item = shop.consumables[index];
    if (!item) return false;
    if (state.roundState.money < (item.cost || 3)) return false;

    state.roundState.money -= (item.cost || 3);

    // Use planet cards immediately
    if (item.cardType === 'planet') {
      const newLevel = B.usePlanetCard(item);
      shop.consumables.splice(index, 1);
      return { type: 'planet', name: item.name, handType: item.handType, newLevel };
    }

    // Tarot cards go to consumable slots (max 2)
    if (state.consumables.length >= 2) return false;
    state.consumables.push(item);
    shop.consumables.splice(index, 1);
    return { type: 'tarot', name: item.name };
  };

  B.buyVoucher = () => {
    const state = B.gameState;
    if (!state || !state.currentShop) return false;
    const shop = state.currentShop;
    if (!shop.voucher) return false;
    if (state.roundState.money < shop.voucher.cost) return false;

    state.roundState.money -= shop.voucher.cost;
    if (!state.ownedVouchers) state.ownedVouchers = [];
    state.ownedVouchers.push(shop.voucher.id);

    // Apply voucher effect
    const v = shop.voucher;
    if (v.effect === 'cheapReroll') shop.rerollCost = 3;

    shop.voucher = null;
    return true;
  };

  B.sellJoker = index => {
    const state = B.gameState;
    if (!state) return false;
    const joker = state.jokers[index];
    if (!joker) return false;

    state.roundState.money += B.getJokerSellValue(joker);
    state.jokers.splice(index, 1);
    return true;
  };

  B.rerollShop = () => {
    const state = B.gameState;
    if (!state || !state.currentShop) return false;
    const cost = state.currentShop.rerollCost || 5;
    if (state.roundState.money < cost) return false;

    state.roundState.money -= cost;

    // Regenerate jokers and consumables
    state.currentShop.jokers = [];
    for (let i = 0; i < 2; i++) {
      const j = B.getRandomJoker(B.Rarity.UNCOMMON);
      if (j) {
        j.cost = B.getJokerCost(j);
        state.currentShop.jokers.push(j);
      }
    }
    state.currentShop.consumables = [];
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.5) {
        state.currentShop.consumables.push(B.getRandomPlanet());
      } else {
        state.currentShop.consumables.push(B.getRandomTarot());
      }
    }
    return true;
  };

  B.enterShop = () => {
    const state = B.gameState;
    if (!state) return;
    B.generateShop();
    state.phase = B.Phase.SHOP;
  };

  B.leaveShop = () => {
    const state = B.gameState;
    if (!state) return;
    state.currentShop = null;
    state.phase = B.Phase.SELECT_CARDS;
    state.lastScore = null;
  };
})();

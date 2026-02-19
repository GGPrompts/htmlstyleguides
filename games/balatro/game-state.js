// game-state.js - Round state machine, game phases, save/load
// Ported from TUIClassics/games/balatro/round.go + model.go

(function() {
  const B = window.Balatro;

  // Game phases
  const PHASE_MENU=0, PHASE_SELECT_CARDS=1, PHASE_SCORING=2,
        PHASE_BLIND_COMPLETE=3, PHASE_SHOP=4, PHASE_GAME_OVER=5, PHASE_WIN=6;
  B.Phase = { MENU: PHASE_MENU, SELECT_CARDS: PHASE_SELECT_CARDS, SCORING: PHASE_SCORING,
              BLIND_COMPLETE: PHASE_BLIND_COMPLETE, SHOP: PHASE_SHOP, GAME_OVER: PHASE_GAME_OVER, WIN: PHASE_WIN };

  // Sort modes
  const SORT_NONE=0, SORT_SUIT=1, SORT_RANK=2;
  B.SortMode = { NONE: SORT_NONE, SUIT: SORT_SUIT, RANK: SORT_RANK };

  const STARTING_HANDS = 4;
  const STARTING_DISCARDS = 3;
  const STARTING_MONEY = 4;
  const HAND_SIZE = 8;
  const MAX_JOKERS = 5;
  const MAX_PLAY = 5;
  const MAX_ANTE = 8; // Win condition

  B.MAX_JOKERS = MAX_JOKERS;
  B.MAX_PLAY = MAX_PLAY;
  B.HAND_SIZE = HAND_SIZE;

  B.newGame = () => {
    const deck = B.shuffle(B.newDeck());
    const hand = deck.splice(0, HAND_SIZE);
    const starterJoker = B.getJokerById('joker_basic');

    // Reset hand levels
    B.handLevels = [1,1,1,1,1,1,1,1,1,1];

    const state = {
      phase: PHASE_SELECT_CARDS,
      deck,
      hand,
      playedCards: [],
      jokers: starterJoker ? [starterJoker] : [],
      consumables: [], // tarot/planet cards held
      roundState: {
        ante: 1,
        blindProgress: 0, // 0=small, 1=big, 2=boss
        currentScore: 0,
        handsRemaining: STARTING_HANDS,
        discardsRemaining: STARTING_DISCARDS,
        money: STARTING_MONEY,
      },
      sortMode: SORT_RANK,
      currentHandInfo: null,
      lastScore: null,
      handTypesPlayed: [], // for boss blind "no repeat" tracking
      firstHandType: null, // for boss blind "one hand type" tracking
      bossHandSizeReduction: 0,
    };

    state.roundState.currentBlind = B.getBlind(1, B.BlindType.SMALL);
    state.roundState.targetScore = state.roundState.currentBlind.targetScore;

    // Sort initial hand
    state.hand = B.sortByRank(state.hand);

    B.gameState = state;
    return state;
  };

  B.getEffectiveHandSize = () => {
    const state = B.gameState;
    let size = HAND_SIZE;
    if (state && state.bossHandSizeReduction) size -= state.bossHandSizeReduction;
    // Voucher bonuses could increase this
    return Math.max(size, 1);
  };

  B.toggleCardSelection = index => {
    const state = B.gameState;
    if (!state || state.phase !== PHASE_SELECT_CARDS) return;
    const card = state.hand[index];
    if (!card) return;

    if (card.selected) {
      card.selected = false;
    } else {
      // Count currently selected
      const selectedCount = state.hand.filter(c => c.selected).length;
      if (selectedCount >= MAX_PLAY) return; // Can't select more than 5
      card.selected = true;
    }
    B.updateCurrentHandInfo();
  };

  B.updateCurrentHandInfo = () => {
    const state = B.gameState;
    const selected = state.hand.filter(c => c.selected);
    if (selected.length === 0) {
      state.currentHandInfo = null;
    } else if (selected.length === 5) {
      state.currentHandInfo = B.evaluateHand(selected);
    } else {
      state.currentHandInfo = B.evaluatePartialHand(selected);
    }
  };

  B.playHand = () => {
    const state = B.gameState;
    if (!state || state.phase !== PHASE_SELECT_CARDS) return null;

    let selected = state.hand.filter(c => c.selected);
    if (selected.length === 0) return null;
    if (state.roundState.handsRemaining <= 0) return null;

    // If < 5 cards selected, just play what's selected
    // Evaluate the hand
    let handInfo;
    if (selected.length === 5) {
      handInfo = B.evaluateHand(selected);
    } else {
      handInfo = B.evaluatePartialHand(selected);
    }

    // Boss blind: no repeat hands check
    const blind = state.roundState.currentBlind;
    if (blind.bossEffect) {
      if (blind.bossEffect.effect === 'noRepeatHands' && state.handTypesPlayed.includes(handInfo.type)) {
        return { error: 'Cannot repeat hand types against ' + blind.name };
      }
      if (blind.bossEffect.effect === 'oneHandType' && state.firstHandType !== null && handInfo.type !== state.firstHandType) {
        return { error: 'Can only play ' + B.handTypeName(state.firstHandType) + ' against ' + blind.name };
      }
      if (blind.bossEffect.effect === 'oneHand' && state.roundState.handsRemaining < STARTING_HANDS) {
        return { error: 'Only 1 hand allowed against ' + blind.name };
      }
    }

    // Track hand types for boss blinds
    if (!state.handTypesPlayed.includes(handInfo.type)) {
      state.handTypesPlayed.push(handInfo.type);
    }
    if (state.firstHandType === null) {
      state.firstHandType = handInfo.type;
    }

    // Calculate score
    const scoreCalc = B.calculateScore(handInfo, selected, state.jokers);

    // Remove played cards from hand
    const selectedIds = new Set(selected.map(c => c.id));
    state.hand = state.hand.filter(c => !selectedIds.has(c.id));

    // Apply glass destruction
    state.hand = B.applyGlassDestruction(state.hand, selected);

    // Boss blind: The Hook discards random cards after play
    if (blind.bossEffect && blind.bossEffect.effect === 'discardRandom') {
      const n = blind.bossEffect.value || 2;
      for (let i = 0; i < n && state.hand.length > 0; i++) {
        const idx = Math.floor(Math.random() * state.hand.length);
        state.hand.splice(idx, 1);
      }
    }

    // Draw back to hand size
    const effectiveSize = B.getEffectiveHandSize();
    while (state.hand.length < effectiveSize && state.deck.length > 0) {
      state.hand.push(state.deck.pop());
    }

    // Apply sorting
    if (state.sortMode === SORT_SUIT) state.hand = B.sortBySuit(state.hand);
    else if (state.sortMode === SORT_RANK) state.hand = B.sortByRank(state.hand);

    // Update round state
    state.roundState.currentScore += scoreCalc.finalScore;
    state.roundState.handsRemaining--;
    state.lastScore = scoreCalc;

    // Check win/loss
    if (state.roundState.currentScore >= state.roundState.targetScore) {
      state.phase = PHASE_BLIND_COMPLETE;
    } else if (state.roundState.handsRemaining <= 0) {
      state.phase = PHASE_GAME_OVER;
    }

    state.currentHandInfo = null;
    return scoreCalc;
  };

  B.discardCards = () => {
    const state = B.gameState;
    if (!state || state.phase !== PHASE_SELECT_CARDS) return false;

    const selected = state.hand.filter(c => c.selected);
    if (selected.length === 0) return false;
    if (state.roundState.discardsRemaining <= 0) return false;

    // Remove selected cards
    const selectedIds = new Set(selected.map(c => c.id));
    state.hand = state.hand.filter(c => !selectedIds.has(c.id));

    // Draw replacements
    const effectiveSize = B.getEffectiveHandSize();
    while (state.hand.length < effectiveSize && state.deck.length > 0) {
      state.hand.push(state.deck.pop());
    }

    state.roundState.discardsRemaining--;

    // Apply sorting
    if (state.sortMode === SORT_SUIT) state.hand = B.sortBySuit(state.hand);
    else if (state.sortMode === SORT_RANK) state.hand = B.sortByRank(state.hand);

    state.currentHandInfo = null;
    return true;
  };

  B.advanceBlind = () => {
    const state = B.gameState;
    if (!state) return;

    // Award money
    state.roundState.money += state.roundState.currentBlind.reward;

    // Gold card earnings
    state.roundState.money += B.calculateGoldEarnings(state.hand);

    // Interest: $1 per $5, max $5
    const interest = Math.min(5, Math.floor(state.roundState.money / 5));
    state.roundState.money += interest;

    // Advance blind progress
    state.roundState.blindProgress++;
    if (state.roundState.blindProgress > 2) {
      state.roundState.ante++;
      state.roundState.blindProgress = 0;

      // Win condition
      if (state.roundState.ante > MAX_ANTE) {
        state.phase = PHASE_WIN;
        return;
      }
    }

    // Get new blind
    const blindType = state.roundState.blindProgress;
    state.roundState.currentBlind = B.getBlind(state.roundState.ante, blindType);
    state.roundState.targetScore = state.roundState.currentBlind.targetScore;

    // Reset for new blind
    state.roundState.currentScore = 0;
    state.roundState.handsRemaining = STARTING_HANDS;
    state.roundState.discardsRemaining = STARTING_DISCARDS;
    state.handTypesPlayed = [];
    state.firstHandType = null;
    state.bossHandSizeReduction = 0;

    // Boss blind hand size reduction
    if (state.roundState.currentBlind.bossEffect &&
        state.roundState.currentBlind.bossEffect.effect === 'reduceHandSize') {
      state.bossHandSizeReduction = state.roundState.currentBlind.bossEffect.value || 1;
    }

    // Reshuffle deck if needed
    if (state.deck.length < HAND_SIZE) {
      state.deck = B.shuffle(B.newDeck());
    }

    // Deal new hand
    state.hand = [];
    const effectiveSize = B.getEffectiveHandSize();
    while (state.hand.length < effectiveSize && state.deck.length > 0) {
      state.hand.push(state.deck.pop());
    }

    if (state.sortMode === SORT_SUIT) state.hand = B.sortBySuit(state.hand);
    else if (state.sortMode === SORT_RANK) state.hand = B.sortByRank(state.hand);

    state.phase = PHASE_SHOP;
  };

  B.skipShop = () => {
    const state = B.gameState;
    if (!state) return;
    state.phase = PHASE_SELECT_CARDS;
    state.lastScore = null;
  };

  B.cycleSortMode = () => {
    const state = B.gameState;
    if (!state) return;
    state.sortMode = (state.sortMode + 1) % 3;
    if (state.sortMode === SORT_SUIT) state.hand = B.sortBySuit(state.hand);
    else if (state.sortMode === SORT_RANK) state.hand = B.sortByRank(state.hand);
    // SORT_NONE leaves as-is
  };

  // Save/Load
  B.saveGame = () => {
    const state = B.gameState;
    if (!state) return;
    try {
      localStorage.setItem('balatro_save', JSON.stringify({
        deck: state.deck,
        hand: state.hand,
        jokers: state.jokers,
        consumables: state.consumables,
        roundState: state.roundState,
        sortMode: state.sortMode,
        handLevels: B.handLevels,
        phase: state.phase,
      }));
    } catch(e) { /* ignore */ }
  };

  B.loadGame = () => {
    try {
      const data = JSON.parse(localStorage.getItem('balatro_save'));
      if (!data) return false;

      B.handLevels = data.handLevels || [1,1,1,1,1,1,1,1,1,1];

      const state = {
        phase: data.phase || PHASE_SELECT_CARDS,
        deck: data.deck,
        hand: data.hand,
        playedCards: [],
        jokers: data.jokers || [],
        consumables: data.consumables || [],
        roundState: data.roundState,
        sortMode: data.sortMode || SORT_RANK,
        currentHandInfo: null,
        lastScore: null,
        handTypesPlayed: [],
        firstHandType: null,
        bossHandSizeReduction: 0,
      };

      B.gameState = state;
      return true;
    } catch(e) { return false; }
  };

  B.deleteSave = () => {
    try { localStorage.removeItem('balatro_save'); } catch(e) { /* ignore */ }
  };
})();

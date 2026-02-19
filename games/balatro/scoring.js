// scoring.js - Chips x Mult engine, enhancement/edition/joker application
// Ported from TUIClassics/games/balatro/scoring.go

(function() {
  const B = window.Balatro;
  const E = B.Enhancement;

  B.calculateScore = (handInfo, playedCards, jokers) => {
    const calc = {
      baseChips: handInfo.baseChips,
      baseMult: handInfo.baseMult,
      chipMods: [],
      multMods: [],
      totalChips: handInfo.baseChips,
      totalMult: handInfo.baseMult,
      finalScore: 0,
    };

    // Per-card scoring
    for (const card of playedCards) {
      const rankChips = B.rankChipValue(card.rank);

      // Enhancement chip bonuses
      if (card.enhancement === E.STONE) {
        // Stone: +50 chips, no rank
        calc.totalChips += 50;
        calc.chipMods.push('+50 (Stone)');
      } else {
        calc.totalChips += rankChips;
        calc.chipMods.push(`+${rankChips} (${B.rankShort(card.rank)})`);

        if (card.enhancement === E.BONUS) {
          calc.totalChips += 30;
          calc.chipMods.push('+30 (Bonus)');
        }
        if (card.enhancement === E.STEEL) {
          calc.totalChips += 50;
          calc.chipMods.push('+50 (Steel)');
        }
      }

      // Edition chip bonuses
      if (card.edition === B.Edition.FOIL) {
        calc.totalChips += 50;
        calc.chipMods.push('+50 (Foil)');
      }

      // Enhancement mult bonuses
      if (card.enhancement === E.MULT) {
        calc.totalMult += 4;
        calc.multMods.push('+4 (Mult)');
      }
      if (card.enhancement === E.LUCKY) {
        if (Math.random() < 0.2) {
          calc.totalMult += 20;
          calc.multMods.push('+20 (Lucky!)');
        }
      }

      // Edition mult bonuses
      if (card.edition === B.Edition.HOLOGRAPHIC) {
        calc.totalMult += 10;
        calc.multMods.push('+10 (Holo)');
      }
    }

    // Multiplicative pass (Glass, Polychrome)
    let multMultiplier = 1.0;
    for (const card of playedCards) {
      if (card.enhancement === E.GLASS) {
        multMultiplier *= 2.0;
        calc.multMods.push('x2 (Glass)');
      }
      if (card.edition === B.Edition.POLYCHROME) {
        multMultiplier *= 1.5;
        calc.multMods.push('x1.5 (Poly)');
      }
    }
    if (multMultiplier !== 1.0) {
      calc.totalMult = Math.floor(calc.totalMult * multMultiplier);
    }

    // Jokers applied in order
    for (const joker of jokers) {
      B.applyJoker(joker, calc, handInfo, playedCards);
    }

    calc.finalScore = calc.totalChips * calc.totalMult;
    return calc;
  };

  // Post-scoring: remove glass cards that were played
  B.applyGlassDestruction = (hand, playedCards) => {
    const glassPlayed = new Set();
    for (const c of playedCards) {
      if (c.enhancement === E.GLASS) glassPlayed.add(c.id);
    }
    return hand.filter(c => !glassPlayed.has(c.id));
  };

  // Gold card earnings at end of round
  B.calculateGoldEarnings = hand => {
    let money = 0;
    for (const c of hand) {
      if (c.enhancement === E.GOLD) money += 3;
    }
    return money;
  };
})();

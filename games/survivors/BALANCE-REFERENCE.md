# Survivors — Balance Reference Sheet

## Class Comparison

| Stat | Gunner (Cyberpunk) | Dark Knight (Gothic) | Ranger (Forest) | Warlock (Cosmic) |
|------|-------------------|---------------------|-----------------|-----------------|
| HP | 80 | 120 | 90 | 70 |
| Speed | 160 | 140 | 180 | 150 |
| Damage | 1.2x | 1.0x | 1.0x | 1.3x |
| Defense | 0.9 (10% less dmg) | 1.2 (20% MORE dmg) | 1.0 | 0.8 (20% less dmg) |
| Victory Time | 5 min | 7 min | 9 min | 12 min |
| Primary Weapons | projectile, beam, chain | area, chain, field | boomerang, rain, field | orbit, field, area |
| Secondary Weapons | rain, boomerang | orbit, beam | projectile, chain | beam, rain |
| Playstyle | Ranged precision | Melee bruiser / lifesteal | Fast DoT / traps | AoE caster / gravity |

**Weapon Affinity Damage:** Primary +25%, Secondary 1.0x, Off-class -25%
**Upgrade Appearance Weights:** Primary 3x, Secondary 1.5x, Off-class 0.5x

---

## Class Passives & Signature Abilities

| Class | Passive | Signature (Cooldown) |
|-------|---------|---------------------|
| Gunner | Targeting System: +10% crit, +15% projectile speed | Overclock: 2x fire rate, +2 pierce for 5s (45s CD) |
| Dark Knight | Blood Pact: +8% lifesteal, +10% AoE size | Blood Ritual: Sacrifice 20% HP, 6 blood explosions (60s CD) |
| Ranger | Wild Stride: +15% move speed, +10% evasion | Nature's Veil: Stealth + 30% speed for 6s, ambush 3x dmg (40s CD) |
| Warlock | Arcane Attunement: +15% ability power, -10% cooldowns | Singularity Rift: Pull + DoT vortex 4s, burst on collapse (50s CD) |

---

## Weapon Types

All weapons share these base mechanics. L = level (max 5), DM = player damage mult, AS = player attack speed.

| Type | Cooldown | Base Dmg | Key Stats | Notes |
|------|----------|----------|-----------|-------|
| projectile | 0.8/AS | 8×L×DM | Speed 350, Life 1.5s, Count min(1+floor(L/2), 4) | Targets nearest enemy |
| orbit | passive | 5×L×DM | Radius 60+L×15, Count 2+L, Speed 2+L×0.3 | Always active |
| area | 3/AS | 12×L×DM | Radius 80+L×20, Life 0.3s | Expanding nova |
| chain | 1.2/AS | 6×L×DM | Bounces 2+L, Range 150+L×20 | 80% damage per bounce |
| beam | 4/AS | 3×L×DM | Duration 0.8+L×0.2, Width 6+L×2, Range 200+L×40 | Ticks over duration |
| rain | 2.5/AS | 10×L×DM | Count 3+L, Radius 100+L×20 | Projectiles from above |
| boomerang | 1.5/AS | 7×L×DM | Speed 250, Range 180+L×30 | Returns to player |
| field | 5/AS | 4×L×DM | Radius 70+L×15, Duration 3+L×0.5 | Persistent zone |

---

## In-Run Level-Up Passives

Each level presents 3 choices: upgrade weapon, new weapon, or passive. These passives stack.

| Passive | Effect |
|---------|--------|
| Max HP | +20% Max HP (×1.2) |
| Move Speed | +15% Move Speed (×1.15) |
| Pickup Range | +40% Pickup Range (×1.4) |
| Damage | +20% Damage (×1.2) |
| Attack Speed | +15% Attack Speed (×1.15) |
| Defense | -15% Damage Taken (×0.85) |

---

## XP & Leveling

- **Formula:** Level N requires `floor(5 × 1.4^(N-1))` XP
- **Skill Points:** 1 per 5 levels (persistent across runs)

| Level | XP Needed |
|-------|-----------|
| 1 | 5 |
| 2 | 7 |
| 3 | 9 |
| 5 | 19 |
| 10 | 134 |
| 15 | 952 |
| 20 | 6,769 |

---

## Combat Formulas

**Contact Damage:**
- Normal: `(5 + gameTime × 0.02) × defense × worldDiffMult × fortifyMult`
- Boss: `(15 + gameTime × 0.05) × defense × worldDiffMult × fortifyMult`
- Invulnerability on hit: 0.5s

**Enemy HP Scaling (time):**
- Normal: `baseHP × (1.3 + time/80 + (time/300)^1.5 × 0.5)`
- Boss: `baseHP × (1.3 + time/60) × 1.5`

**Player Power Scaling:** +3% enemy HP per upgrade/skill/item (normal), +5% (bosses)

**World Difficulty:** +12% HP and speed per completed world (multiplicative)

**Elites:** After 3 min, 5-35% chance. +60% HP, +25% speed, +30% size, 2× XP.

---

## Dash

| Stat | Value |
|------|-------|
| Speed | 4× player speed |
| Duration | 0.15s |
| Cooldown | 1.6s base |
| Invulnerability | 0.15s (0.6s with Shield on Dash skill) |
| Max cooldown reduction | 50% |

---

## Spawn Rates

- Base interval: 1.5s, decreasing to 0.3s over 10 minutes
- 40s wave cycle: 30s intense, 10s breather (0.4× rate)
- During boss: 0.4× spawn rate
- Early speed boost: +15% for first 2 min
- Late speed scaling: after 5 min, up to +40% bonus speed

---

## Gold Economy

| Source | Amount |
|--------|--------|
| Passive income | 1g / 10 seconds |
| Normal enemy kill | max(1, floor(xpValue)) gold |
| Boss kill | 50g |
| Gem gold drops | 2g each |
| Salvage (Common) | 5g |
| Salvage (Rare) | 15g |
| Salvage (Epic) | 40g |
| Salvage (Legendary) | 100g |

---

## Loot System

**Drop Rates:** Boss 100%, Normal 2%

| Rarity | Chance | Items |
|--------|--------|-------|
| Common (60%) | | Rusty Shield (+5 HP), Old Boots (+5% Speed), Cracked Lens (+10 Pickup), Torn Gloves (+5% Dmg), Dull Whetstone (+5% AS) |
| Rare (25%) | | Vampiric Ring (2% Lifesteal), Marksman Scope (+10% Crit), Iron Plate (+10% Def), Swift Cloak (+15% Speed), Emerald Charm (+20% XP) |
| Epic (12%) | | Berserker Gauntlet (+30% Dmg <50% HP), Magnet Core (+50 Pickup), Crimson Heart (+40 HP +Regen), Quicksilver Vial (-25% Dash CD), War Drum (+25% AS) |
| Legendary (3%) | | Phoenix Feather (auto-revive), Crown of Thorns (reflect 20%), Void Orb (+50% Dmg, -20% HP) |

**Inventory Slots:** 6 free → 8 (300g) → 10 (750g) → 12 (1500g) → 16 (3000g) → 20 (6000g)
**Max Equipped:** 3

---

## Shop Stat Upgrades (5 tiers each)

**Costs per tier:** 150 → 400 → 1,000 → 2,000 → 4,000 gold

### Gothic Shop
| Track | Per Level |
|-------|-----------|
| Blood Tonic (HP) | +20 Max HP |
| Ossuary Ward (Defense) | ×0.90 damage taken |
| Blight Edge (Damage) | ×1.15 damage |
| Grave Reach (Pickup) | +15 pickup range |

### Forest Shop
| Track | Per Level |
|-------|-----------|
| Deer Sprint (Speed) | ×1.10 speed |
| Thorn Strike (Damage) | ×1.15 damage |
| Root Reach (Pickup) | +15 pickup range |

### Cosmic Shop
| Track | Per Level |
|-------|-----------|
| Arcane Flux (Damage) | ×1.15 damage |
| Stellar Core (HP) | +20 Max HP |
| Warp Drive (Speed) | ×1.10 speed |
| Gravity Well (Pickup) | +15 pickup range |

---

## Shop Starting Weapons

Each shop offers 8 weapons at 400/600/800g tiers, one of each weapon type.

---

## Shop Passives

| Slot | Gothic | Forest | Cosmic | Cost |
|------|--------|--------|--------|------|
| 1 | 1% Lifesteal | +5% Crit | Regen 1 HP/5s | 400 |
| 2 | Regen 1 HP/5s | +10% XP | +10% XP | 400 |
| 3 | +10% XP | Regen 1 HP/5s | 1% Lifesteal | 600 |
| 4 | +5% Crit | 1% Lifesteal | +5% Crit | 800 |

---

## Generic Skill Tree (Shop)

All shops share the same structure. 1 skill point per 5 levels earned. 12 nodes total.

### Offense Branch
| Node | Cost | Effect |
|------|------|--------|
| Critical Eye | 1 SP | +8% crit chance |
| Lethal Strikes | 2 SP | +50% crit damage |
| Multi-Projectile | 3 SP | +2 projectile count |
| Piercing Shots | 4 SP | +3 pierce |

### Defense Branch
| Node | Cost | Effect |
|------|------|--------|
| Regeneration | 1 SP | Regen 1 HP/5s |
| Dash Shield | 2 SP | Extended dash invuln (0.6s) |
| Damage Reduction | 3 SP | -15% damage taken |
| Second Life | 4 SP | Revive at 30% HP once per run |

### Utility Branch
| Node | Cost | Effect |
|------|------|--------|
| Long Dash | 1 SP | +40% dash distance |
| Quick Recovery | 2 SP | -30% dash cooldown |
| Magnet Range | 3 SP | +40 pickup radius |
| XP Multiplier | 4 SP | +25% XP gain |

---

## In-Game Class Skill Trees

### Gunner (Cyberpunk)
*[Not explicitly in theme file — uses generic tree]*

### Dark Knight (Gothic)
| Branch | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|--------|--------|--------|--------|--------|
| Blood | +8% Lifesteal | Blood Frenzy (+15% AS on kill 3s) | Thorns (reflect 20%) | Death Aura (3/s AoE) |
| Shadow | Summon 1 Skeleton | Pack (3 Skeletons) | Skeleton Mage (ranged) | Army of Darkness (8 for 10s, 45s CD) |
| Undying | -15% Damage Taken | Fortify (stand 2s = +25% def) | Second Life (revive 30%) | Vampiric Nova (<30% HP = heal + AoE) |

### Ranger (Forest)
| Branch | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|--------|--------|--------|--------|--------|
| Nature | Poison (3/s DoT 3s) | Virulent (spread on death) | Root Snare (25% slow 50% for 2s) | Overgrowth (toxic ground) |
| Agility | +12% Speed | +15% Evasion | Double Dash (2 charges, -40% CD) | Phantom Step (dash decoy 3s) |
| Trapper | Bear Trap (1/15s) | More Traps (up to 3) | +50% Trap Damage | Net Launcher (AoE slow/20s) |

### Warlock (Cosmic)
| Branch | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|--------|--------|--------|--------|--------|
| Gravity | Pull Aura (slow pull) | Gravity Well (vortex/25s) | +25% dmg to pulled | Black Hole (massive pull/60s) |
| Time | -15% All Cooldowns | Time Bubble (dash slow field) | Rewind (undo 5s dmg, once/run) | Temporal Loop (15% no CD consumed) |
| Void | +20% All Damage | Void Bolt (projectile/3s) | Void Armor (+def per ability power) | Singularity (massive AoE/45s) |

---

## Enemy Movement Types

| Type | Behavior |
|------|----------|
| chase | Beeline to player, +20% speed within 150px |
| strafe | Orbit at 150px, dash in at 2.8× speed periodically |
| charge | Approach to 250px, telegraph 1s, dash at 3× speed |
| orbit | Spiral inward toward player |
| ambush | Approach then wait/pounce |
| flanker | Approach from the side |
| divebomber | Aerial hover, dive attacks |
| shieldbearer | Slow, tanky, frontal shield angle |

---

## Enemies by World

### Cyberpunk
| Name | Size | Speed | HP | XP | Appears | Movement |
|------|------|-------|----|----|---------|----------|
| Drone | 12 | 65 | 3 | 1 | 0s | strafe |
| Mech | 18 | 30 | 8 | 2 | 0s | chase |
| Glitch Bug | 11 | 85 | 2 | 2 | 30s | ambush |
| Cyber-wolf | 14 | 95 | 4 | 3 | 90s | charge |
| Stealth Flanker | 13 | 90 | 5 | 3 | 120s | flanker |
| Heavy Tank | 20 | 25 | 12 | 5 | 180s | shieldbearer |
| Bomber Drone | 14 | 70 | 6 | 4 | 180s | divebomber |
| Rogue AI | 16 | 70 | 18 | 8 | 300s | orbit |

### Gothic
| Name | Size | Speed | HP | XP | Appears | Movement |
|------|------|-------|----|----|---------|----------|
| Skeleton | 14 | 55 | 3 | 1 | 0s | chase |
| Zombie | 16 | 35 | 6 | 2 | 0s | chase |
| Ghost | 13 | 70 | 2 | 2 | 30s | orbit |
| Wraith | 15 | 80 | 4 | 3 | 90s | strafe |
| Shadow Stalker | 14 | 88 | 5 | 3 | 120s | flanker |
| Vampire | 15 | 90 | 8 | 5 | 180s | ambush |
| Gargoyle | 16 | 60 | 7 | 4 | 180s | divebomber |
| Dark Knight | 18 | 35 | 15 | 5 | 240s | shieldbearer |
| Lich | 17 | 60 | 15 | 8 | 300s | charge |

### Forest
| Name | Size | Speed | HP | XP | Appears | Movement |
|------|------|-------|----|----|---------|----------|
| Beetle | 12 | 50 | 3 | 1 | 0s | chase |
| Wasp | 10 | 90 | 2 | 1 | 0s | strafe |
| Spider | 15 | 55 | 6 | 2 | 30s | ambush |
| Thorned Vine | 14 | 40 | 8 | 3 | 90s | orbit |
| Fox Hunter | 13 | 95 | 4 | 3 | 120s | flanker |
| Wolf Pack | 14 | 100 | 5 | 3 | 180s | charge |
| Hawk | 13 | 75 | 5 | 4 | 180s | divebomber |
| Corrupted Treant | 22 | 25 | 25 | 8 | 240s | shieldbearer |
| Forest Warden | 18 | 50 | 20 | 6 | 300s | chase |

### Cosmic
| Name | Size | Speed | HP | XP | Appears | Movement |
|------|------|-------|----|----|---------|----------|
| Alien Spore | 10 | 50 | 2 | 1 | 0s | chase |
| Swarm Drone | 12 | 75 | 3 | 1 | 0s | orbit |
| Asteroid Beast | 20 | 30 | 10 | 3 | 30s | charge |
| Void Wraith | 14 | 85 | 5 | 3 | 90s | strafe |
| Phase Stalker | 13 | 92 | 4 | 3 | 120s | flanker |
| Hive Swarm | 11 | 100 | 3 | 2 | 180s | ambush |
| Meteor Fiend | 15 | 65 | 6 | 4 | 180s | divebomber |
| Sentinel | 19 | 30 | 18 | 5 | 240s | shieldbearer |
| Cosmic Horror | 18 | 55 | 20 | 8 | 300s | orbit |

---

## Bosses by World

All bosses use the time-based HP formula: `baseHP × (1.3 + time/60) × 1.5`

### Cyberpunk
| Name | Size | Speed | HP | XP | Spawns At | Attack |
|------|------|-------|----|----|-----------|--------|
| Mega Drone | 50 | 35 | 200 | 50 | 2:00 | beam |
| War Mech | 48 | 40 | 400 | 80 | 4:00 | charge |
| Virus Core | 45 | 55 | 700 | 120 | 6:00 | summon |
| Singularity | 55 | 50 | 1200 | 200 | 8:00 | shockwave |

### Gothic
| Name | Size | Speed | HP | XP | Spawns At | Attack |
|------|------|-------|----|----|-----------|--------|
| Bone Colossus | 50 | 30 | 200 | 50 | 2:00 | shockwave |
| Death Knight | 45 | 45 | 400 | 80 | 4:00 | charge |
| Arch-Lich | 48 | 50 | 700 | 120 | 6:00 | summon |
| The Pale One | 55 | 55 | 1200 | 200 | 8:00 | beam |

### Forest
| Name | Size | Speed | HP | XP | Spawns At | Attack |
|------|------|-------|----|----|-----------|--------|
| Giant Spider Queen | 50 | 30 | 200 | 50 | 2:00 | summon |
| Thorned Titan | 55 | 25 | 400 | 80 | 4:00 | shockwave |
| Alpha Wolf | 40 | 65 | 600 | 120 | 6:00 | charge |
| The Blight | 60 | 35 | 1200 | 200 | 8:00 | beam |

### Cosmic
| Name | Size | Speed | HP | XP | Spawns At | Attack |
|------|------|-------|----|----|-----------|--------|
| Hive Queen | 50 | 30 | 200 | 50 | 2:00 | summon |
| Void Leviathan | 55 | 35 | 400 | 80 | 4:00 | beam |
| Star Eater | 50 | 45 | 700 | 120 | 6:00 | shockwave |
| The Singularity | 60 | 40 | 1200 | 200 | 8:00 | charge |

---

## World Progression

```
Cyberpunk (5 min) → Shop → Gothic (7 min) → Shop → Forest (9 min) → Shop → Cosmic (12 min) → Victory
```

Each completed world: +12% enemy HP and speed for all subsequent worlds.

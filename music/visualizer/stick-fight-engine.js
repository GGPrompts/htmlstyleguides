// ── Stick Fight Engine ─────────────────────────────────────────────
// Shared skeleton + pose + ragdoll toolkit for stick-figure music videos.
// Load via <script src="stick-fight-engine.js"></script> before your renderer.
// ES5 IIFE — exposes window.StickFight
//
// Usage:
//   var fig = StickFight.create({ x: 100, y: 400, figH: 120, facing: 1, color: '#8898c8' });
//   StickFight.setPose(fig, 'guard');
//   StickFight.updateAll([fig], dt);
//   StickFight.drawAll(ctx, [fig]);

(function() {
    "use strict";

    // ── Bone proportions (fractions of figH) ──────────────────────────
    var BONE = {
        headR:    0.07,
        neck:     0.06,
        shoulder: 0.09,
        torso:    0.28,
        upperArm: 0.13,
        forearm:  0.12,
        thigh:    0.20,
        shin:     0.19
    };

    // ── Pose parameter defaults ───────────────────────────────────────
    function defaultParams() {
        return {
            bounce:    0,      // -1..1  vertical bob
            lean:      0,      // -1..1  torso lean (positive = forward)
            armLAngle: 0.4,    // radians from shoulder-down, left arm
            armRAngle: 0.4,    // radians from shoulder-down, right arm
            elbowLBend: 0.3,   // 0..1  forearm bend
            elbowRBend: 0.3,
            legSpread:  0,     // 0..1  stance width
            kneeL:      0,     // -1..1 knee offset (negative = forward)
            kneeR:      0,
            swordAngle: 0,     // radians, if the figure holds a weapon
            swordLen:   0      // 0 = no sword, fraction of figH
        };
    }

    // ── Named pose library ────────────────────────────────────────────
    var POSES = {
        idle: {
            bounce: 0, lean: 0,
            armLAngle: 0.4, armRAngle: 0.4,
            elbowLBend: 0.3, elbowRBend: 0.3,
            legSpread: 0.1, kneeL: 0, kneeR: 0
        },
        guard: {
            bounce: -0.05, lean: 0.1,
            armLAngle: 0.1, armRAngle: -0.3,
            elbowLBend: 0.6, elbowRBend: 0.5,
            legSpread: 0.3, kneeL: -0.1, kneeR: 0
        },
        lunge: {
            bounce: -0.1, lean: 0.5,
            armLAngle: -0.1, armRAngle: 0.2,
            elbowLBend: 0.15, elbowRBend: 0.4,
            legSpread: 0.6, kneeL: -0.3, kneeR: 0.1
        },
        punch: {
            bounce: -0.05, lean: 0.35,
            armLAngle: -0.1, armRAngle: 0.3,
            elbowLBend: 0.05, elbowRBend: 0.6,
            legSpread: 0.35, kneeL: -0.15, kneeR: 0
        },
        kick: {
            bounce: 0.05, lean: -0.15,
            armLAngle: 0.3, armRAngle: -0.2,
            elbowLBend: 0.4, elbowRBend: 0.5,
            legSpread: 0.5, kneeL: -0.6, kneeR: 0.1
        },
        block: {
            bounce: -0.08, lean: -0.15,
            armLAngle: -0.6, armRAngle: -0.5,
            elbowLBend: 0.7, elbowRBend: 0.6,
            legSpread: 0.25, kneeL: 0, kneeR: 0.05
        },
        recoil: {
            bounce: 0.1, lean: -0.4,
            armLAngle: 0.6, armRAngle: 0.5,
            elbowLBend: 0.5, elbowRBend: 0.4,
            legSpread: 0.15, kneeL: 0.1, kneeR: 0.15
        },
        dance_basic: {
            bounce: 0.2, lean: 0,
            armLAngle: -0.3, armRAngle: -0.3,
            elbowLBend: 0.5, elbowRBend: 0.5,
            legSpread: 0.15, kneeL: -0.1, kneeR: -0.1
        },
        arms_up: {
            bounce: 0.1, lean: 0,
            armLAngle: -1.2, armRAngle: -1.2,
            elbowLBend: 0.3, elbowRBend: 0.3,
            legSpread: 0.1, kneeL: 0, kneeR: 0
        },
        kneel: {
            bounce: -0.3, lean: 0.1,
            armLAngle: 0.5, armRAngle: 0.3,
            elbowLBend: 0.4, elbowRBend: 0.5,
            legSpread: 0.2, kneeL: 0.4, kneeR: 0.5
        },
        fallen: {
            bounce: -0.5, lean: 0.6,
            armLAngle: 0.8, armRAngle: 1.0,
            elbowLBend: 0.2, elbowRBend: 0.1,
            legSpread: 0.4, kneeL: 0.3, kneeR: 0.2
        },
        salute: {
            bounce: 0, lean: 0,
            armLAngle: -1.0, armRAngle: 0.3,
            elbowLBend: 0.15, elbowRBend: 0.4,
            legSpread: 0.05, kneeL: 0, kneeR: 0
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────
    function lerpExp(cur, tgt, speed, dt) {
        return cur + (tgt - cur) * (1 - Math.exp(-speed * dt));
    }

    // ── Create figure ─────────────────────────────────────────────────
    function create(opts) {
        opts = opts || {};
        var p = defaultParams();
        var t = defaultParams();
        return {
            // position & identity
            x:      opts.x      || 0,
            y:      opts.y      || 0,       // ground-level y (feet)
            figH:   opts.figH   || 100,
            facing: opts.facing || 1,       // 1 = right, -1 = left
            color:  opts.color  || '#ffffff',
            lineWidth: opts.lineWidth || 3,

            // pose animation
            params:  p,
            targets: t,
            poseSpeed: opts.poseSpeed || 10,   // lerp speed (higher = snappier)

            // mode: 'pose' or 'ragdoll'
            mode: 'pose',
            ragdoll: null,

            // combat state
            hp:          opts.hp || 100,
            attacking:   null,
            combo:       0,
            lastHitTime: 0
        };
    }

    // ── Compute 13 joint positions ────────────────────────────────────
    // Returns positions relative to (0,0) at the figure's feet.
    // y-axis: negative is up (canvas convention).
    function computeJoints(fig) {
        var p = fig.params;
        var fH = fig.figH;
        var facing = fig.facing;

        // Scaled bone lengths
        var headR    = BONE.headR    * fH;
        var neckLen  = BONE.neck     * fH;
        var shouldW  = BONE.shoulder * fH;
        var torsoLen = BONE.torso    * fH;
        var uArm     = BONE.upperArm * fH;
        var fArm     = BONE.forearm  * fH;
        var thigh    = BONE.thigh    * fH;
        var shin     = BONE.shin     * fH;

        var bounceOff = p.bounce * fH * 0.06;
        var leanOff   = p.lean   * fH * 0.08 * facing;

        // Leg spread in pixels
        var spread = p.legSpread * fH * 0.15;

        // Ankles at y=0
        var ankleL = { x: -spread - fH * 0.02, y: 0 };
        var ankleR = { x:  spread + fH * 0.02, y: 0 };

        // Knees
        var kneeBaseY = -shin + bounceOff;
        var kneeL = {
            x: ankleL.x * 0.6 + leanOff * 0.3 + p.kneeL * fH * 0.06 * facing,
            y: kneeBaseY + Math.abs(p.kneeL) * fH * 0.03
        };
        var kneeR = {
            x: ankleR.x * 0.6 + leanOff * 0.3 + p.kneeR * fH * 0.06 * facing,
            y: kneeBaseY + Math.abs(p.kneeR) * fH * 0.03
        };

        // Hip
        var hipY = kneeBaseY - thigh + bounceOff;
        var hip = { x: leanOff, y: hipY };

        // Neck
        var neckY = hipY - torsoLen;
        var neck = { x: leanOff * 1.2, y: neckY };

        // Head
        var head = { x: leanOff * 1.3, y: neckY - neckLen - headR };

        // Shoulders
        var shY = neckY + neckLen * 0.3;
        var shoulderL = { x: neck.x - shouldW, y: shY };
        var shoulderR = { x: neck.x + shouldW, y: shY };

        // Arms — angles from straight-down (0 = hanging), negative = forward/up
        var laAng = p.armLAngle;
        var raAng = p.armRAngle;

        var elbowL = {
            x: shoulderL.x + Math.sin(laAng) * uArm * facing,
            y: shoulderL.y + Math.cos(laAng) * uArm
        };
        var elbowR = {
            x: shoulderR.x + Math.sin(raAng) * uArm * facing,
            y: shoulderR.y + Math.cos(raAng) * uArm
        };

        var lBend = laAng + p.elbowLBend * 1.2;
        var rBend = raAng + p.elbowRBend * 1.2;
        var handL = {
            x: elbowL.x + Math.sin(lBend) * fArm * facing,
            y: elbowL.y + Math.cos(lBend) * fArm
        };
        var handR = {
            x: elbowR.x + Math.sin(rBend) * fArm * facing,
            y: elbowR.y + Math.cos(rBend) * fArm
        };

        return {
            head: head, headR: headR,
            neck: neck,
            shoulderL: shoulderL, shoulderR: shoulderR,
            elbowL: elbowL, elbowR: elbowR,
            handL: handL, handR: handR,
            hip: hip,
            kneeL: kneeL, kneeR: kneeR,
            ankleL: ankleL, ankleR: ankleR
        };
    }

    // ── Draw a posed figure ───────────────────────────────────────────
    function drawFigure(ctx, fig, joints) {
        if (!joints) joints = computeJoints(fig);
        var color = fig.color;
        var lw = fig.lineWidth;

        ctx.save();
        ctx.translate(fig.x, fig.y);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        function line(a, b) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // Torso
        line(joints.hip, joints.neck);

        // Legs
        line(joints.hip,   joints.kneeL);
        line(joints.kneeL, joints.ankleL);
        line(joints.hip,   joints.kneeR);
        line(joints.kneeR, joints.ankleR);

        // Shoulders
        line(joints.shoulderL, joints.shoulderR);

        // Arms
        line(joints.shoulderL, joints.elbowL);
        line(joints.elbowL,    joints.handL);
        line(joints.shoulderR, joints.elbowR);
        line(joints.elbowR,    joints.handR);

        // Head
        ctx.beginPath();
        ctx.arc(joints.head.x, joints.head.y, joints.headR, 0, Math.PI * 2);
        ctx.stroke();

        // Weapon (if any)
        if (fig.params.swordLen > 0) {
            var sLen = fig.params.swordLen * fig.figH;
            var sAng = fig.params.swordAngle;
            var hand = joints.handL; // lead hand (left relative, but facing flips)
            var tipX = hand.x + Math.cos(sAng) * sLen * fig.facing;
            var tipY = hand.y + Math.sin(sAng) * sLen;

            ctx.strokeStyle = '#c0c8e0';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#e0e8ff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(hand.x, hand.y);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            // Guard crossbar
            var gLen = fig.figH * 0.03;
            var gAng = sAng + Math.PI * 0.5;
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(hand.x + Math.cos(gAng) * gLen, hand.y + Math.sin(gAng) * gLen);
            ctx.lineTo(hand.x - Math.cos(gAng) * gLen, hand.y - Math.sin(gAng) * gLen);
            ctx.stroke();
        }

        ctx.restore();
    }

    // ── Set a named pose ──────────────────────────────────────────────
    function setPose(fig, name) {
        var pose = POSES[name];
        if (!pose) return;
        var t = fig.targets;
        for (var k in pose) {
            if (pose.hasOwnProperty(k)) {
                t[k] = pose[k];
            }
        }
    }

    // ── Set individual target parameter ───────────────────────────────
    function setTarget(fig, key, val) {
        fig.targets[key] = val;
    }

    // ── Update (lerp params toward targets) ───────────────────────────
    function updateFigure(fig, dt) {
        if (fig.mode === 'ragdoll') {
            if (fig.ragdoll) stepRagdoll(fig.ragdoll, dt);
            return;
        }
        // Drive attack animation if active
        if (fig.attacking) {
            updateAttack(fig, dt);
        }
        var speed = fig.poseSpeed;
        var p = fig.params;
        var t = fig.targets;
        for (var k in p) {
            if (p.hasOwnProperty(k) && t.hasOwnProperty(k) && typeof p[k] === 'number') {
                p[k] = lerpExp(p[k], t[k], speed, dt);
            }
        }
    }

    // ── Batch helpers ─────────────────────────────────────────────────
    function updateAll(figs, dt) {
        for (var i = 0; i < figs.length; i++) {
            updateFigure(figs[i], dt);
        }
    }

    function drawAll(ctx, figs) {
        for (var i = 0; i < figs.length; i++) {
            var fig = figs[i];
            if (fig.mode === 'ragdoll' && fig.ragdoll) {
                drawRagdoll(ctx, fig);
            } else {
                drawFigure(ctx, fig, computeJoints(fig));
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  PHASE 2 — Ragdoll Physics (Verlet point-mass)
    // ══════════════════════════════════════════════════════════════════

    // Joint name order — must match constraint pairs
    var JOINT_NAMES = [
        'head', 'neck', 'shoulderL', 'shoulderR',
        'elbowL', 'elbowR', 'handL', 'handR',
        'hip', 'kneeL', 'kneeR', 'ankleL', 'ankleR'
    ];

    // Constraint pairs: indices into JOINT_NAMES
    var CONSTRAINTS = [
        [0, 1],   // head-neck
        [1, 2],   // neck-shoulderL
        [1, 3],   // neck-shoulderR
        [2, 4],   // shoulderL-elbowL
        [3, 5],   // shoulderR-elbowR
        [4, 6],   // elbowL-handL
        [5, 7],   // elbowR-handR
        [1, 8],   // neck-hip  (torso)
        [8, 9],   // hip-kneeL
        [8, 10],  // hip-kneeR
        [9, 11],  // kneeL-ankleL
        [10, 12]  // kneeR-ankleR
    ];

    function createPoint(x, y) {
        return { x: x, y: y, px: x, py: y };
    }

    // ── Go ragdoll ────────────────────────────────────────────────────
    // Snapshots current joint positions into Verlet point masses.
    function goRagdoll(fig, groundY, impulseX, impulseY) {
        var joints = computeJoints(fig);
        var pts = [];
        var dists = [];

        // Create points (world coords)
        for (var i = 0; i < JOINT_NAMES.length; i++) {
            var name = JOINT_NAMES[i];
            var j = joints[name];
            var pt = createPoint(fig.x + j.x, fig.y + j.y);
            // Apply impulse (slightly random per point for tumble)
            var jitter = 0.7 + Math.random() * 0.6;
            pt.px = pt.x - (impulseX || 0) * 0.016 * jitter;
            pt.py = pt.y - (impulseY || 0) * 0.016 * jitter;
            pts.push(pt);
        }

        // Measure rest distances for each constraint
        for (var c = 0; c < CONSTRAINTS.length; c++) {
            var a = pts[CONSTRAINTS[c][0]];
            var b = pts[CONSTRAINTS[c][1]];
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            dists.push(Math.sqrt(dx * dx + dy * dy));
        }

        var rdoll = {
            pts: pts,
            dists: dists,
            groundY: groundY,
            gravity: 1200,
            bounce: 0.3,
            friction: 0.85,
            headR: joints.headR,
            settled: false,
            settleTimer: 0
        };

        fig.mode = 'ragdoll';
        fig.ragdoll = rdoll;
        return rdoll;
    }

    // ── Step ragdoll ──────────────────────────────────────────────────
    function stepRagdoll(rdoll, dt) {
        if (rdoll.settled) return;

        var pts = rdoll.pts;
        var g = rdoll.gravity;
        var groundY = rdoll.groundY;
        var bounce = rdoll.bounce;
        var friction = rdoll.friction;

        // Verlet integration
        for (var i = 0; i < pts.length; i++) {
            var p = pts[i];
            var vx = p.x - p.px;
            var vy = p.y - p.py;
            p.px = p.x;
            p.py = p.y;
            p.x += vx * 0.99;   // slight damping
            p.y += vy * 0.99 + g * dt * dt;
        }

        // Constraint projection (6 iterations)
        for (var iter = 0; iter < 6; iter++) {
            for (var c = 0; c < CONSTRAINTS.length; c++) {
                var ai = CONSTRAINTS[c][0];
                var bi = CONSTRAINTS[c][1];
                var a = pts[ai];
                var b = pts[bi];
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var target = rdoll.dists[c];
                if (dist < 0.001) dist = 0.001;
                var diff = (dist - target) / dist * 0.5;
                var ox = dx * diff;
                var oy = dy * diff;
                a.x += ox;
                a.y += oy;
                b.x -= ox;
                b.y -= oy;
            }
        }

        // Ground collision
        var totalVel = 0;
        for (var gi = 0; gi < pts.length; gi++) {
            var p2 = pts[gi];
            if (p2.y > groundY) {
                p2.y = groundY;
                var vy2 = p2.y - p2.py;
                p2.py = p2.y + vy2 * bounce;
                // Friction on horizontal
                var vx2 = p2.x - p2.px;
                p2.px = p2.x - vx2 * friction;
            }
            // Measure total velocity for settle detection
            var dvx = p2.x - p2.px;
            var dvy = p2.y - p2.py;
            totalVel += dvx * dvx + dvy * dvy;
        }

        // Settle detection
        if (totalVel < 0.5) {
            rdoll.settleTimer += dt;
            if (rdoll.settleTimer > 0.5) {
                rdoll.settled = true;
            }
        } else {
            rdoll.settleTimer = 0;
        }
    }

    // ── Draw ragdoll ──────────────────────────────────────────────────
    function drawRagdoll(ctx, fig) {
        var rdoll = fig.ragdoll;
        if (!rdoll) return;
        var pts = rdoll.pts;
        var color = fig.color;
        var lw = fig.lineWidth;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        // Draw each constraint as a line
        for (var c = 0; c < CONSTRAINTS.length; c++) {
            var a = pts[CONSTRAINTS[c][0]];
            var b = pts[CONSTRAINTS[c][1]];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // Head circle
        var headPt = pts[0];
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, rdoll.headR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  PHASE 3 — Combat System
    // ══════════════════════════════════════════════════════════════════

    // ── Move Library ─────────────────────────────────────────────────
    var MOVES = {
        punch_r: {
            duration: 0.22, hitAt: 0.12, hitRange: 0.18,
            damage: 15, impulseX: 400, impulseY: -150,
            keyframes: [
                { t: 0.0,  pose: { lean: 0.1, armRAngle: 0.3, elbowRBend: 0.6 } },
                { t: 0.45, pose: { lean: 0.35, armRAngle: -0.1, elbowRBend: 0.05 } },
                { t: 0.75, pose: { lean: 0.35, armRAngle: -0.1, elbowRBend: 0.05 } },
                { t: 1.0,  pose: { lean: 0.1, armRAngle: 0.3, elbowRBend: 0.3 } }
            ]
        },
        punch_l: {
            duration: 0.22, hitAt: 0.12, hitRange: 0.18,
            damage: 15, impulseX: 400, impulseY: -150,
            keyframes: [
                { t: 0.0,  pose: { lean: 0.1, armLAngle: 0.3, elbowLBend: 0.6 } },
                { t: 0.45, pose: { lean: 0.35, armLAngle: -0.1, elbowLBend: 0.05 } },
                { t: 0.75, pose: { lean: 0.35, armLAngle: -0.1, elbowLBend: 0.05 } },
                { t: 1.0,  pose: { lean: 0.1, armLAngle: 0.3, elbowLBend: 0.3 } }
            ]
        },
        kick_high: {
            duration: 0.30, hitAt: 0.18, hitRange: 0.22,
            damage: 20, impulseX: 300, impulseY: -250,
            keyframes: [
                { t: 0.0,  pose: { bounce: 0, lean: -0.1, legSpread: 0.2, kneeL: 0 } },
                { t: 0.35, pose: { bounce: 0.05, lean: -0.15, legSpread: 0.5, kneeL: -0.6 } },
                { t: 0.7,  pose: { bounce: 0.05, lean: -0.15, legSpread: 0.5, kneeL: -0.6 } },
                { t: 1.0,  pose: { bounce: 0, lean: 0, legSpread: 0.2, kneeL: 0 } }
            ]
        },
        slash: {
            duration: 0.28, hitAt: 0.14, hitRange: 0.25,
            damage: 25, impulseX: 500, impulseY: -200,
            keyframes: [
                { t: 0.0,  pose: { lean: 0.1, armLAngle: -0.8, elbowLBend: 0.2, swordAngle: -1.2 } },
                { t: 0.4,  pose: { lean: 0.4, armLAngle: 0.2, elbowLBend: 0.1, swordAngle: 0.5 } },
                { t: 0.7,  pose: { lean: 0.4, armLAngle: 0.3, elbowLBend: 0.15, swordAngle: 0.6 } },
                { t: 1.0,  pose: { lean: 0.1, armLAngle: 0.1, elbowLBend: 0.3, swordAngle: 0 } }
            ]
        },
        lunge: {
            duration: 0.35, hitAt: 0.20, hitRange: 0.30,
            damage: 30, impulseX: 600, impulseY: -180,
            keyframes: [
                { t: 0.0,  pose: { lean: 0.1, legSpread: 0.2, armLAngle: 0.1, elbowLBend: 0.4 } },
                { t: 0.5,  pose: { lean: 0.5, legSpread: 0.6, armLAngle: -0.1, elbowLBend: 0.15 } },
                { t: 0.75, pose: { lean: 0.5, legSpread: 0.6, armLAngle: -0.1, elbowLBend: 0.15 } },
                { t: 1.0,  pose: { lean: 0.1, legSpread: 0.3, armLAngle: 0.1, elbowLBend: 0.3 } }
            ]
        },
        block: {
            duration: 0.40,
            keyframes: [
                { t: 0.0, pose: { lean: -0.1, armLAngle: -0.6, armRAngle: -0.5, elbowLBend: 0.7, elbowRBend: 0.6 } },
                { t: 0.3, pose: { lean: -0.15, armLAngle: -0.6, armRAngle: -0.5, elbowLBend: 0.7, elbowRBend: 0.6 } },
                { t: 1.0, pose: { lean: 0, armLAngle: 0.4, armRAngle: 0.4, elbowLBend: 0.3, elbowRBend: 0.3 } }
            ]
        },
        grab: {
            duration: 0.50, hitAt: 0.25, hitRange: 0.12,
            damage: 10, impulseX: 200, impulseY: -100,
            keyframes: [
                { t: 0.0,  pose: { lean: 0.2, armLAngle: 0.1, armRAngle: 0.1, elbowLBend: 0.4, elbowRBend: 0.4 } },
                { t: 0.4,  pose: { lean: 0.4, armLAngle: -0.3, armRAngle: -0.3, elbowLBend: 0.2, elbowRBend: 0.2 } },
                { t: 0.6,  pose: { lean: 0.4, armLAngle: -0.3, armRAngle: -0.3, elbowLBend: 0.5, elbowRBend: 0.5 } },
                { t: 1.0,  pose: { lean: 0.1, armLAngle: 0.4, armRAngle: 0.4, elbowLBend: 0.3, elbowRBend: 0.3 } }
            ]
        }
    };

    // ── Interpolate keyframes at a given progress (0..1) ─────────────
    function sampleKeyframes(keyframes, progress) {
        if (progress <= 0) return keyframes[0].pose;
        if (progress >= 1) return keyframes[keyframes.length - 1].pose;

        // Find surrounding keyframes
        var i;
        for (i = 0; i < keyframes.length - 1; i++) {
            if (progress < keyframes[i + 1].t) break;
        }
        var kA = keyframes[i];
        var kB = keyframes[i + 1];
        var segLen = kB.t - kA.t;
        var localT = segLen > 0 ? (progress - kA.t) / segLen : 0;

        // Lerp pose values between kA and kB
        var result = {};
        var k;
        for (k in kA.pose) {
            if (kA.pose.hasOwnProperty(k)) {
                var a = kA.pose[k];
                var b = kB.pose.hasOwnProperty(k) ? kB.pose[k] : a;
                result[k] = a + (b - a) * localT;
            }
        }
        // Include any keys only in kB
        for (k in kB.pose) {
            if (kB.pose.hasOwnProperty(k) && !result.hasOwnProperty(k)) {
                result[k] = kB.pose[k];
            }
        }
        return result;
    }

    // ── Start an attack ──────────────────────────────────────────────
    function attack(attacker, moveName, target) {
        if (attacker.attacking) return false;
        var move = MOVES[moveName];
        if (!move) return false;
        attacker.attacking = {
            move: move,
            moveName: moveName,
            target: target || null,
            elapsed: 0,
            hit: false
        };
        return true;
    }

    // ── Update attack animation ──────────────────────────────────────
    function updateAttack(fig, dt) {
        var atk = fig.attacking;
        if (!atk) return;

        atk.elapsed += dt;
        var move = atk.move;
        var progress = Math.min(atk.elapsed / move.duration, 1);

        // Drive pose targets from keyframes
        if (move.keyframes) {
            var posed = sampleKeyframes(move.keyframes, progress);
            for (var k in posed) {
                if (posed.hasOwnProperty(k)) {
                    fig.targets[k] = posed[k];
                }
            }
        }

        // Check hit at the hitAt timing (once)
        if (!atk.hit && move.hitAt && atk.elapsed >= move.hitAt && atk.target) {
            checkHit(fig, atk.target);
            atk.hit = true;
        }

        // Attack finished
        if (atk.elapsed >= move.duration) {
            fig.attacking = null;
        }
    }

    // ── Hit detection ────────────────────────────────────────────────
    function checkHit(attacker, target) {
        if (target.mode === 'ragdoll') return;

        var atk = attacker.attacking;
        if (!atk) return;
        var move = atk.move;

        var aJoints = computeJoints(attacker);
        var tJoints = computeJoints(target);

        // Determine weapon tip: sword tip for slash/lunge with sword, handL for punches, handR for punch_r
        var tipX, tipY;
        if ((atk.moveName === 'slash' || atk.moveName === 'lunge') && attacker.params.swordLen > 0) {
            var sLen = attacker.params.swordLen * attacker.figH;
            var sAng = attacker.params.swordAngle;
            var hand = aJoints.handL;
            tipX = attacker.x + hand.x + Math.cos(sAng) * sLen * attacker.facing;
            tipY = attacker.y + hand.y + Math.sin(sAng) * sLen;
        } else if (atk.moveName === 'punch_r') {
            tipX = attacker.x + aJoints.handR.x;
            tipY = attacker.y + aJoints.handR.y;
        } else if (atk.moveName === 'kick_high') {
            tipX = attacker.x + aJoints.ankleL.x;
            tipY = attacker.y + aJoints.ankleL.y;
        } else {
            tipX = attacker.x + aJoints.handL.x;
            tipY = attacker.y + aJoints.handL.y;
        }

        // Target torso center (midpoint between hip and neck)
        var tHip = tJoints.hip;
        var tNeck = tJoints.neck;
        var tcX = target.x + (tHip.x + tNeck.x) * 0.5;
        var tcY = target.y + (tHip.y + tNeck.y) * 0.5;

        var dx = tipX - tcX;
        var dy = tipY - tcY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var range = move.hitRange * attacker.figH;

        if (dist < range) {
            applyHit(target, move, attacker);
        }
    }

    // ── Apply hit damage and reactions ───────────────────────────────
    function applyHit(target, move, attacker) {
        var damage = move.damage;

        // Block check: is target currently in block pose?
        var t = target.targets;
        var isBlocking = (
            t.armLAngle < -0.4 && t.armRAngle < -0.3 &&
            t.elbowLBend > 0.5 && t.elbowRBend > 0.4 &&
            t.lean < 0
        );
        if (isBlocking) {
            damage = Math.round(damage * 0.4);
        }

        target.hp -= damage;

        // Update attacker combo
        var now = (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
        if (now - attacker.lastHitTime < 0.8) {
            attacker.combo += 1;
        } else {
            attacker.combo = 1;
        }
        attacker.lastHitTime = now;

        // Apply recoil pose to target (if not already ragdolled)
        if (target.hp <= 0) {
            var dir = attacker.facing;
            goRagdoll(target, target.y, move.impulseX * dir, move.impulseY);
        } else {
            setPose(target, 'recoil');
        }
    }

    // ══════════════════ PHASE 4 — Gore & Effects ══════════════════

    // ── Blood particle pool ────────────────────────────────────────
    var _bloodParticles = [];

    function spawnBlood(x, y, count, impulseX, impulseY) {
        for (var i = 0; i < count; i++) {
            var spread = 0.6 + Math.random() * 0.8;
            var angle = Math.random() * Math.PI * 2;
            _bloodParticles.push({
                x: x,
                y: y,
                vx: (impulseX || 0) * spread + Math.cos(angle) * 60 * Math.random(),
                vy: (impulseY || 0) * spread + Math.sin(angle) * 60 * Math.random(),
                radius: 1 + Math.random() * 2,
                alpha: 1,
                grounded: false,
                life: 3
            });
        }
    }

    function updateBloodParticles(dt, groundY) {
        var gravity = 1200;
        var i = _bloodParticles.length;
        while (i--) {
            var p = _bloodParticles[i];
            if (p.grounded) {
                p.life -= dt;
                p.alpha = Math.max(0, p.life / 3);
                if (p.life <= 0) {
                    _bloodParticles.splice(i, 1);
                }
                continue;
            }
            p.vy += gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.y >= groundY) {
                p.y = groundY;
                p.grounded = true;
                p.vx = 0;
                p.vy = 0;
            }
        }
    }

    function drawBloodParticles(ctx) {
        for (var i = 0; i < _bloodParticles.length; i++) {
            var p = _bloodParticles[i];
            ctx.fillStyle = 'rgba(180, 20, 20, ' + p.alpha + ')';
            if (p.grounded) {
                // Flatten to ellipse splat
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.radius * 2, p.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Dismemberment system ───────────────────────────────────────
    var _detachedLimbs = [];

    // Limb definitions: which joints form each limb
    var LIMB_JOINTS = {
        armR:  ['shoulderR', 'elbowR', 'handR'],
        armL:  ['shoulderL', 'elbowL', 'handL'],
        legR:  ['hip', 'kneeR', 'ankleR'],
        legL:  ['hip', 'kneeL', 'ankleL'],
        head:  ['neck', 'head']
    };

    function detachLimb(fig, limbName, groundY) {
        var jointNames = LIMB_JOINTS[limbName];
        if (!jointNames) return;

        var joints = computeJoints(fig);
        var pts = [];
        var dists = [];

        for (var i = 0; i < jointNames.length; i++) {
            var j = joints[jointNames[i]];
            var pt = createPoint(fig.x + j.x, fig.y + j.y);
            // Random detach impulse
            pt.px = pt.x - (Math.random() - 0.5) * 3;
            pt.py = pt.y + Math.random() * 2;
            pts.push(pt);
        }

        for (var c = 0; c < pts.length - 1; c++) {
            var a = pts[c];
            var b = pts[c + 1];
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            dists.push(Math.sqrt(dx * dx + dy * dy));
        }

        _detachedLimbs.push({
            pts: pts,
            dists: dists,
            groundY: groundY,
            gravity: 1200,
            bounce: 0.3,
            friction: 0.85,
            color: fig.color,
            lineWidth: fig.lineWidth,
            headR: (limbName === 'head') ? joints.headR : 0,
            settled: false,
            settleTimer: 0
        });

        // Spawn blood at detach point
        var base = pts[0];
        spawnBlood(base.x, base.y, 8, (Math.random() - 0.5) * 100, -150);
    }

    function updateDetachedLimbs(dt) {
        for (var li = 0; li < _detachedLimbs.length; li++) {
            var limb = _detachedLimbs[li];
            if (limb.settled) continue;

            var pts = limb.pts;
            var g = limb.gravity;
            var groundY = limb.groundY;

            // Verlet integration
            for (var i = 0; i < pts.length; i++) {
                var p = pts[i];
                var vx = p.x - p.px;
                var vy = p.y - p.py;
                p.px = p.x;
                p.py = p.y;
                p.x += vx * 0.99;
                p.y += vy * 0.99 + g * dt * dt;
            }

            // Constraint projection (4 iterations)
            for (var iter = 0; iter < 4; iter++) {
                for (var c = 0; c < limb.dists.length; c++) {
                    var a = pts[c];
                    var b = pts[c + 1];
                    var dx = b.x - a.x;
                    var dy = b.y - a.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var target = limb.dists[c];
                    if (dist < 0.001) dist = 0.001;
                    var diff = (dist - target) / dist * 0.5;
                    var ox = dx * diff;
                    var oy = dy * diff;
                    a.x += ox;
                    a.y += oy;
                    b.x -= ox;
                    b.y -= oy;
                }
            }

            // Ground collision + settle detection
            var totalVel = 0;
            for (var gi = 0; gi < pts.length; gi++) {
                var p2 = pts[gi];
                if (p2.y > groundY) {
                    p2.y = groundY;
                    var vy2 = p2.y - p2.py;
                    p2.py = p2.y + vy2 * limb.bounce;
                    var vx2 = p2.x - p2.px;
                    p2.px = p2.x - vx2 * limb.friction;
                }
                var dvx = p2.x - p2.px;
                var dvy = p2.y - p2.py;
                totalVel += dvx * dvx + dvy * dvy;
            }

            if (totalVel < 0.5) {
                limb.settleTimer += dt;
                if (limb.settleTimer > 0.5) limb.settled = true;
            } else {
                limb.settleTimer = 0;
            }
        }
    }

    function drawDetachedLimbs(ctx) {
        for (var li = 0; li < _detachedLimbs.length; li++) {
            var limb = _detachedLimbs[li];
            var pts = limb.pts;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = limb.color;
            ctx.lineWidth = limb.lineWidth;
            ctx.shadowColor = limb.color;
            ctx.shadowBlur = 8;

            for (var c = 0; c < pts.length - 1; c++) {
                ctx.beginPath();
                ctx.moveTo(pts[c].x, pts[c].y);
                ctx.lineTo(pts[c + 1].x, pts[c + 1].y);
                ctx.stroke();
            }

            // Draw head circle if this is a detached head
            if (limb.headR > 0) {
                var headPt = pts[pts.length - 1];
                ctx.beginPath();
                ctx.arc(headPt.x, headPt.y, limb.headR, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // ── Death types ────────────────────────────────────────────────
    function applyDeath(fig, type, groundY) {
        var limbNames = ['armR', 'armL', 'legR', 'legL', 'head'];

        if (type === 'collapse') {
            spawnBlood(fig.x, fig.y - fig.figH * 0.4, 5, 0, -80);
            goRagdoll(fig, groundY, 50, -100);

        } else if (type === 'flung') {
            spawnBlood(fig.x, fig.y - fig.figH * 0.4, 15,
                fig.facing * -200, -150);
            // Maybe detach a random limb
            if (Math.random() < 0.6) {
                var pick = limbNames[Math.floor(Math.random() * limbNames.length)];
                detachLimb(fig, pick, groundY);
            }
            goRagdoll(fig, groundY, 400 * fig.facing * -1, -350);

        } else if (type === 'dramatic') {
            spawnBlood(fig.x, fig.y - fig.figH * 0.4, 8, 0, -60);
            setPose(fig, 'kneel');
            // Delayed ragdoll via a closure-based timer flag
            fig._dramaticTimer = 0.5;
            fig._dramaticGroundY = groundY;
            // The actual ragdoll trigger happens in updateEffects

        } else {
            // Default: treat as collapse
            spawnBlood(fig.x, fig.y - fig.figH * 0.4, 5, 0, -80);
            goRagdoll(fig, groundY, 50, -100);
        }
    }

    // Track dramatic-death figures
    var _dramaticDeaths = [];

    // ── Batch update / draw ────────────────────────────────────────
    function updateEffects(dt, groundY) {
        updateBloodParticles(dt, groundY);
        updateDetachedLimbs(dt);

        // Process dramatic death timers
        var i = _dramaticDeaths.length;
        while (i--) {
            var fig = _dramaticDeaths[i];
            if (fig._dramaticTimer !== undefined && fig._dramaticTimer > 0) {
                fig._dramaticTimer -= dt;
                if (fig._dramaticTimer <= 0) {
                    fig._dramaticTimer = undefined;
                    goRagdoll(fig, fig._dramaticGroundY, 30, -60);
                    fig._dramaticGroundY = undefined;
                    _dramaticDeaths.splice(i, 1);
                }
            } else {
                _dramaticDeaths.splice(i, 1);
            }
        }
    }

    function drawEffects(ctx) {
        drawBloodParticles(ctx);
        drawDetachedLimbs(ctx);
    }

    // Patch applyDeath to register dramatic deaths for timer processing
    var _origApplyDeath = applyDeath;
    function applyDeathWrapped(fig, type, groundY) {
        _origApplyDeath(fig, type, groundY);
        if (type === 'dramatic') {
            _dramaticDeaths.push(fig);
        }
    }

    // ── Public API ────────────────────────────────────────────────────
    window.StickFight = {
        BONE:       BONE,
        POSES:      POSES,
        MOVES:      MOVES,

        create:         create,
        computeJoints:  computeJoints,
        drawFigure:     drawFigure,
        setPose:        setPose,
        setTarget:      setTarget,
        updateFigure:   updateFigure,
        updateAll:      updateAll,
        drawAll:        drawAll,

        goRagdoll:      goRagdoll,
        attack:         attack,

        // Phase 4 — Gore & Effects
        spawnBlood:     spawnBlood,
        detachLimb:     detachLimb,
        applyDeath:     applyDeathWrapped,
        updateEffects:  updateEffects,
        drawEffects:    drawEffects,

        // Expose for custom use
        lerpExp:        lerpExp,
        defaultParams:  defaultParams
    };
})();

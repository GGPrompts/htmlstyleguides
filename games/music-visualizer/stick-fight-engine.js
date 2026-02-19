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
            ragdoll: null
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

    // ── Public API ────────────────────────────────────────────────────
    window.StickFight = {
        BONE:       BONE,
        POSES:      POSES,

        create:         create,
        computeJoints:  computeJoints,
        drawFigure:     drawFigure,
        setPose:        setPose,
        setTarget:      setTarget,
        updateFigure:   updateFigure,
        updateAll:      updateAll,
        drawAll:        drawAll,

        goRagdoll:      goRagdoll,

        // Expose for custom use
        lerpExp:        lerpExp,
        defaultParams:  defaultParams
    };
})();

/**
 * Pixel Platform Runner Renderer
 * A tiny auto-runner that jumps between pitch-driven platforms.
 *
 * Channel roles:
 * - lead: primary path generation
 * - harmony: parallax skyline motion
 * - bass: ground pulse + camera bob
 * - percussion: landing dust / beat sparks
 */
window.Renderers["pixel-platform-runner"] = (function () {
  "use strict";

  var w = 0;
  var h = 0;
  var analysis = null;

  var roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
  var styles = [];

  var path = [];
  var segIndex = 0;
  var lastSegIndex = -1;

  var t = 0;
  var energySmooth = 0;
  var beatFlash = 0;
  var bassPulse = 0;
  var camBob = 0;
  var idlePhase = 0;
  var lastBeatSeen = -1;

  var skyline = [];
  var dust = [];
  var stars = [];
  var MAX_DUST = 220;

  var runnerFrame = 0;
  var runnerBlink = 0;
  var danceTimer = 0;
  var danceCooldown = 0;
  var danceStyle = 0;
  var leadHold = 0;
  var lastLeadMidi = -1;

  var STYLE_ROLE = {
    lead: { top: "#8bd3ff", side: "#3f78a6", glow: "rgba(139,211,255," },
    harmony: { top: "#c79dff", side: "#5f4c8a", glow: "rgba(199,157,255," },
    bass: { top: "#ffb36b", side: "#8b5b32", glow: "rgba(255,179,107," },
    percussion: { top: "#a2ffd2", side: "#4d846a", glow: "rgba(162,255,210," }
  };
  var FALLBACK = [
    STYLE_ROLE.lead,
    STYLE_ROLE.harmony,
    STYLE_ROLE.bass,
    STYLE_ROLE.percussion
  ];

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function lerp(a, b, t0) {
    return a + (b - a) * t0;
  }

  function cappedPush(arr, obj, maxLen) {
    if (arr.length >= maxLen) arr.shift();
    arr.push(obj);
  }

  function rebuildRoles() {
    var numCh = 4;
    var i;
    var role;

    if (analysis && analysis.numChannels) {
      numCh = analysis.numChannels;
      if (numCh < 1) numCh = 1;
      if (numCh > 4) numCh = 4;
    }

    roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
    for (i = 0; i < 4; i++) styles[i] = FALLBACK[i];

    if (analysis && analysis.channelRoles) {
      for (i = 0; i < numCh; i++) {
        role = analysis.channelRoles[i] && analysis.channelRoles[i].role;
        if (STYLE_ROLE[role]) {
          styles[i] = STYLE_ROLE[role];
          roleMap[role] = i;
        }
      }
    }

    if (roleMap.lead >= numCh) roleMap.lead = 0;
    if (roleMap.harmony >= numCh) roleMap.harmony = numCh > 1 ? 1 : 0;
    if (roleMap.bass >= numCh) roleMap.bass = numCh > 2 ? 2 : 0;
    if (roleMap.percussion >= numCh) roleMap.percussion = numCh > 3 ? 3 : (numCh - 1);
  }

  function styleOf(ch) {
    return styles[ch] || FALLBACK[ch % 4];
  }

  function noteNorm(note) {
    if (note && typeof note.normalized === "number") return note.normalized;
    return 0.5;
  }

  function buildPath() {
    var i;
    var row;
    var rows;
    var pick;
    var lead;
    var harmony;
    var bass;
    var perc;
    var lastRow = -999;
    var lastNorm = 0.5;
    var gap;
    var steps;
    var s;
    var midNorm;

    path = [];
    if (!analysis || !analysis.timeline || analysis.timeline.length === 0) return;

    rows = analysis.timeline.length;

    for (row = 0; row < rows; row++) {
      pick = null;
      lead = analysis.timeline[row][roleMap.lead];
      harmony = analysis.timeline[row][roleMap.harmony];
      bass = analysis.timeline[row][roleMap.bass];
      perc = analysis.timeline[row][roleMap.percussion];

      if (lead) pick = { note: lead, ch: roleMap.lead };
      else if (harmony) pick = { note: harmony, ch: roleMap.harmony };
      else if (bass) pick = { note: bass, ch: roleMap.bass };
      else if (perc) pick = { note: perc, ch: roleMap.percussion };

      if (!pick) continue;

      if (row - lastRow < 2) continue;

      gap = row - lastRow;
      if (lastRow > -10 && gap > 8) {
        steps = Math.min(3, Math.floor(gap / 4));
        for (s = 1; s <= steps; s++) {
          midNorm = lerp(lastNorm, noteNorm(pick.note), s / (steps + 1));
          path.push({
            row: lastRow + Math.floor((gap * s) / (steps + 1)),
            norm: midNorm,
            vol: 0.25,
            ch: roleMap.harmony
          });
        }
      }

      path.push({
        row: row,
        norm: noteNorm(pick.note),
        vol: pick.note.vol || 0.4,
        ch: pick.ch
      });
      lastRow = row;
      lastNorm = noteNorm(pick.note);
    }

    if (path.length === 0) {
      path.push({ row: 0, norm: 0.5, vol: 0.4, ch: roleMap.lead });
      path.push({ row: 4, norm: 0.55, vol: 0.4, ch: roleMap.harmony });
      path.push({ row: 8, norm: 0.48, vol: 0.4, ch: roleMap.bass });
    }

    path.sort(function (a, b) { return a.row - b.row; });

    for (i = path.length - 2; i >= 0; i--) {
      if (path[i].row === path[i + 1].row) path.splice(i, 1);
    }
  }

  function buildSkyline() {
    var x = -20;
    var i = 0;
    var bw;
    var bh;
    skyline = [];
    while (x < w + 40 && i < 120) {
      bw = 10 + Math.random() * 24;
      bh = h * (0.08 + Math.random() * 0.16);
      skyline.push({
        x: x,
        w: bw,
        h: bh,
        phase: Math.random() * Math.PI * 2
      });
      x += bw + 2 + Math.random() * 4;
      i++;
    }
  }

  function buildStars() {
    var count;
    var i;
    stars = [];
    count = clamp(((w * h) / 18000) | 0, 45, 140);
    for (i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.52,
        s: 0.7 + Math.random() * 1.3,
        p: Math.random() * Math.PI * 2,
        t: 0.5 + Math.random() * 1.6
      });
    }
  }

  function platformY(norm) {
    var top = h * 0.2;
    var bottom = h * 0.79;
    var q = Math.round(norm * 8) / 8;
    return lerp(bottom, top, q);
  }

  function spawnDust(x, y, style, amount, lift) {
    var i;
    var n = amount || 8;
    var vyBase = lift || -18;
    for (i = 0; i < n; i++) {
      cappedPush(dust, {
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 60,
        vy: vyBase - Math.random() * 48,
        life: 0,
        maxLife: 0.24 + Math.random() * 0.48,
        s: 1 + Math.random() * 2.4,
        c: style.glow
      }, MAX_DUST);
    }
  }

  function findSegment(rrow) {
    if (path.length < 2) return 0;

    if (segIndex >= path.length - 1) segIndex = path.length - 2;
    if (segIndex < 0) segIndex = 0;

    while (segIndex < path.length - 2 && rrow >= path[segIndex + 1].row) segIndex++;
    while (segIndex > 0 && rrow < path[segIndex].row) segIndex--;

    return segIndex;
  }

  function getPose(rrow) {
    var idx;
    var a;
    var b;
    var span;
    var jt;
    var baseY;
    var jumpH;
    var y;
    var air;

    if (path.length === 0) {
      return {
        y: h * 0.68,
        groundY: h * 0.68,
        seg: 0,
        t: 0,
        air: false,
        ch: roleMap.lead
      };
    }

    if (path.length === 1) {
      y = platformY(path[0].norm);
      return {
        y: y,
        groundY: y,
        seg: 0,
        t: 0,
        air: false,
        ch: path[0].ch
      };
    }

    idx = findSegment(rrow);
    a = path[idx];
    b = path[idx + 1];

    span = Math.max(1, b.row - a.row);
    jt = clamp((rrow - a.row) / span, 0, 1);

    baseY = lerp(platformY(a.norm), platformY(b.norm), jt);
    jumpH = 10 + span * 3.5 + Math.abs(b.norm - a.norm) * 70;
    if (span <= 2) jumpH *= 0.45;
    y = baseY - Math.sin(jt * Math.PI) * jumpH;
    air = Math.sin(jt * Math.PI) > 0.16;

    return {
      y: y,
      groundY: baseY,
      seg: idx,
      t: jt,
      air: air,
      ch: b.ch
    };
  }

  function drawBackground(ctx, energy, scrollRow) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    var i;
    var st;
    var a;
    var skylineStyle = styleOf(roleMap.harmony);
    var sx;
    var sy;
    var bh;
    var beatA;

    g.addColorStop(0, "#111327");
    g.addColorStop(0.55, "#1a1c33");
    g.addColorStop(1, "#181321");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (i = 0; i < stars.length; i++) {
      st = stars[i];
      a = (0.08 + (Math.sin(t * st.t + st.p) * 0.5 + 0.5) * 0.18) * (0.6 + energy * 0.8);
      ctx.fillStyle = "rgba(210,220,255," + a + ")";
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }

    // Far skyline
    for (i = 0; i < skyline.length; i++) {
      sx = (skyline[i].x - (scrollRow * 2.2) % (w + 80));
      if (sx < -40) sx += (w + 80);
      sy = h * 0.72;
      bh = skyline[i].h * (0.86 + harmonyPulse() * 0.12 + Math.sin(t * 0.5 + skyline[i].phase) * 0.05);
      ctx.fillStyle = "rgba(58,52,84,0.5)";
      ctx.fillRect(Math.floor(sx), Math.floor(sy - bh), Math.floor(skyline[i].w), Math.floor(bh));
      ctx.fillStyle = skylineStyle.glow + (0.05 + energy * 0.08) + ")";
      ctx.fillRect(Math.floor(sx), Math.floor(sy - bh), Math.floor(skyline[i].w), 1);
    }

    // Ground glow
    ctx.fillStyle = styleOf(roleMap.bass).glow + (0.06 + bassPulse * 0.14 + energy * 0.08) + ")";
    ctx.fillRect(0, h * 0.8, w, h * 0.2);

    // Beat flash
    if (beatFlash > 0.001) {
      beatA = clamp(beatFlash * 0.12, 0, 0.14);
      ctx.fillStyle = "rgba(255,255,255," + beatA + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  function harmonyPulse() {
    return Math.sin(t * 1.2) * 0.5 + 0.5;
  }

  function drawPlatforms(ctx, worldRow, rowW) {
    var i;
    var p;
    var next;
    var x;
    var y;
    var span;
    var platW;
    var px;
    var py;
    var thickness;
    var st;
    var minRow = worldRow - (w * 0.5) / rowW - 10;
    var maxRow = worldRow + (w * 0.8) / rowW + 14;
    var start = segIndex;

    while (start > 0 && path[start].row > minRow) start--;
    while (start < path.length - 1 && path[start].row < minRow) start++;

    for (i = start; i < path.length; i++) {
      p = path[i];
      if (p.row > maxRow) break;
      next = path[i + 1];
      if (!next) next = { row: p.row + 2 };

      span = clamp((next.row - p.row) * 0.72, 0.8, 4.2);
      platW = span * rowW;

      x = w * 0.32 + (p.row - worldRow) * rowW - platW * 0.25;
      if (x > w + 80 || x < -160) continue;
      y = platformY(p.norm) + camBob;

      px = Math.floor(x);
      py = Math.floor(y);
      thickness = 8;
      st = styleOf(p.ch);

      ctx.fillStyle = st.side;
      ctx.fillRect(px, py, Math.floor(platW), thickness);

      ctx.fillStyle = st.top;
      ctx.fillRect(px, py - 3, Math.floor(platW), 3);

      // top highlight pixels
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(px + 2, py - 3, Math.max(1, Math.floor(platW * 0.28)), 1);
      ctx.fillRect(px + Math.floor(platW * 0.6), py - 2, Math.max(1, Math.floor(platW * 0.18)), 1);
    }
  }

  function drawRunner(ctx, x, y, air, style, dance, danceMode) {
    var px = Math.floor(x);
    var py = Math.floor(y);
    var danceOn = dance > 0.001 && !air;
    var kick = (((t * 18) | 0) % 2) ? 1 : -1;
    var bounce = danceOn ? (((Math.sin(t * 20) * 1.4) | 0)) : 0;
    var legBob = air ? 0 : ((runnerFrame % 2) ? 1 : 0);
    var armLY = 0;
    var armRY = 0;
    var eye = (runnerBlink > 0.92) ? 0 : 1;
    var legL = legBob;
    var legR = -legBob;

    py += bounce;

    if (danceOn) {
      if (danceMode === 0) {
        legL = kick * 2;
        legR = -kick * 1;
        armLY = -kick * 1;
        armRY = kick * 2;
      } else if (danceMode === 1) {
        legL = kick;
        legR = kick;
        armLY = kick * 2;
        armRY = -kick * 2;
      } else {
        legL = kick * 2;
        legR = kick * 2;
        armLY = -2;
        armRY = -2;
      }
    }

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px - 6, py + 9, 14, 3);

    // body
    ctx.fillStyle = "#111722";
    ctx.fillRect(px - 2, py - 7, 6, 8);
    ctx.fillStyle = style.top;
    ctx.fillRect(px - 1, py - 6, 4, 5);

    // head
    ctx.fillStyle = "#f6d7b0";
    ctx.fillRect(px - 2, py - 13, 6, 6);
    ctx.fillStyle = "#2d1d16";
    ctx.fillRect(px - 3, py - 14, 8, 2);

    // eye
    if (eye) {
      ctx.fillStyle = "#1a232f";
      ctx.fillRect(px + 1, py - 11, 1, 1);
    }

    // arms
    ctx.fillStyle = style.side;
    ctx.fillRect(px - 4, py - 5 + armLY, 2, 4);
    ctx.fillRect(px + 4, py - 5 + (air ? -1 : 0) + armRY, 2, 4);

    // legs
    ctx.fillStyle = "#0b121a";
    ctx.fillRect(px - 1, py + 1 + legL, 2, 5);
    ctx.fillRect(px + 1, py + 1 + legR, 2, 5);
  }

  function updateAndDrawDust(ctx, dt) {
    var i;
    var d;
    var lf;

    for (i = dust.length - 1; i >= 0; i--) {
      d = dust[i];
      d.life += dt;
      if (d.life >= d.maxLife) {
        dust.splice(i, 1);
        continue;
      }

      d.vy += 160 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      lf = 1 - d.life / d.maxLife;

      ctx.fillStyle = d.c + clamp(lf * 0.45, 0, 0.5) + ")";
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), Math.max(1, Math.floor(d.s * lf)), Math.max(1, Math.floor(d.s * lf)));
    }
  }

  return {
    name: "Pixel Platform Runner",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;

      rebuildRoles();
      buildPath();
      buildSkyline();
      buildStars();

      segIndex = 0;
      lastSegIndex = -1;
      t = 0;
      energySmooth = 0;
      beatFlash = 0;
      bassPulse = 0;
      camBob = 0;
      idlePhase = 0;
      lastBeatSeen = -1;
      runnerFrame = 0;
      runnerBlink = 0;
      danceTimer = 0;
      danceCooldown = 0;
      danceStyle = 0;
      leadHold = 0;
      lastLeadMidi = -1;
      dust = [];
    },

    resize: function (width, height) {
      w = width;
      h = height;
      buildSkyline();
      buildStars();
    },

    render: function (fd) {
      var ctx = fd.ctx;
      var dt = fd.dt || (1 / 60);
      var cursor = fd.cursor;
      var currentNotes = fd.currentNotes || [];
      var energy = 0;
      var rowW = clamp(w / 26, 20, 44);
      var worldRow = 0;
      var pose;
      var runnerX = w * 0.32;
      var runnerStyle;
      var percNow;
      var bassNow;
      var leadNow;

      w = fd.width;
      h = fd.height;

      if (!analysis && fd.analysis) {
        analysis = fd.analysis;
        rebuildRoles();
        buildPath();
      }

      t += dt;
      idlePhase += dt;
      runnerBlink = Math.sin(t * 1.7) * 0.5 + 0.5;

      if (analysis && cursor && analysis.energy) {
        energy = analysis.energy[cursor.timelineIndex] || 0;
      }
      energySmooth += (energy - energySmooth) * Math.min(1, dt * 6);
      beatFlash = Math.max(0, beatFlash - dt * 2.4);
      bassPulse = Math.max(0, bassPulse - dt * 1.6);

      if (analysis && cursor && analysis.rpb) {
        var beatFrac = (cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.1) {
          beatFlash = Math.max(beatFlash, 1 - beatFrac / 0.1);
        }
      }

      if (cursor) {
        worldRow = cursor.totalFracRow + 2.1;
      } else {
        worldRow = (path.length > 0) ? path[0].row : 0;
      }

      percNow = currentNotes[roleMap.percussion];
      bassNow = currentNotes[roleMap.bass];
      leadNow = currentNotes[roleMap.lead];
      if (bassNow) {
        bassPulse = Math.max(bassPulse, 0.16 + (bassNow.vol || 0.3) * 0.35);
      }

      camBob = Math.sin(t * (2.4 + bassPulse * 2.5)) * (1.2 + bassPulse * 1.6);

      drawBackground(ctx, energySmooth, worldRow);
      drawPlatforms(ctx, worldRow, rowW);

      pose = getPose(worldRow);
      runnerStyle = styleOf(pose.ch);

      danceTimer = Math.max(0, danceTimer - dt);
      danceCooldown = Math.max(0, danceCooldown - dt);

      if (pose.seg !== lastSegIndex && pose.seg > lastSegIndex && cursor) {
        spawnDust(runnerX, pose.groundY + camBob + 1, runnerStyle, 8 + ((energySmooth * 10) | 0), -26);
        bassPulse = Math.max(bassPulse, 0.25 + energySmooth * 0.55);
        lastSegIndex = pose.seg;
      } else if (pose.seg < lastSegIndex) {
        lastSegIndex = pose.seg - 1;
      } else if (!cursor) {
        lastSegIndex = -1;
      }

      if (cursor && percNow && Math.random() < (0.05 + (percNow.vol || 0.3) * 0.12)) {
        spawnDust(runnerX + 10, pose.groundY + camBob + 2, styleOf(roleMap.percussion), (2 + ((percNow.vol || 0.3) * 5)) | 0, -14);
      }

      if (cursor && leadNow && !pose.air) {
        if (lastLeadMidi === leadNow.midi) leadHold += dt;
        else leadHold = dt;
        lastLeadMidi = leadNow.midi;
      } else {
        leadHold = Math.max(0, leadHold - dt * 2.5);
        if (!leadNow) lastLeadMidi = -1;
      }

      if (pose.air && danceTimer > 0) {
        danceTimer = Math.max(0, danceTimer - dt * 4);
      } else if (cursor && leadNow && !pose.air && danceTimer <= 0 && danceCooldown <= 0 && leadHold > 0.34) {
        danceTimer = 0.45 + (leadNow.vol || 0.3) * 0.75;
        danceCooldown = 0.5;
        danceStyle = ((cursor.beat || 0) + pose.seg) % 3;
        spawnDust(runnerX, pose.groundY + camBob + 1, styleOf(roleMap.lead), (6 + ((leadNow.vol || 0.3) * 8)) | 0, -22);
      }

      if (cursor) {
        if (cursor.beat !== lastBeatSeen) {
          if (danceTimer > 0.001 && !pose.air) {
            spawnDust(runnerX + 2, pose.groundY + camBob + 2, styleOf(roleMap.lead), (3 + ((energySmooth * 5) | 0)), -12);
          }
          lastBeatSeen = cursor.beat;
        }
      } else {
        lastBeatSeen = -1;
        danceTimer = 0;
      }

      if (!cursor) {
        pose.y = platformY(0.52) - Math.sin(idlePhase * 3) * 2;
        pose.air = false;
      }

      runnerFrame += dt * (cursor ? (8 + energySmooth * 10) : 3);
      drawRunner(ctx, runnerX, pose.y + camBob - 6, pose.air, runnerStyle, danceTimer, danceStyle);
      updateAndDrawDust(ctx, dt);

      if (!cursor) {
        ctx.fillStyle = "rgba(235,235,245,0.28)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Press play to run", w * 0.5, h * 0.9);
        ctx.textAlign = "start";
      }
    },

    destroy: function () {
      analysis = null;
      path = [];
      dust = [];
      skyline = [];
      stars = [];
      segIndex = 0;
      lastSegIndex = -1;
      danceTimer = 0;
      danceCooldown = 0;
      leadHold = 0;
      lastLeadMidi = -1;
      lastBeatSeen = -1;
    }
  };
})();

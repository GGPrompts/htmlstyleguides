/**
 * Mycelium Network Renderer
 * An organic bioluminescent fungal network where notes grow branching tendrils
 * that pulse with light, decay into spores, and weave a living web of sound.
 *
 * Created by Sonnet.
 */
window.Renderers['mycelium-network'] = (function () {
  'use strict';

  var w = 0, h = 0;
  var analysis = null;

  // Persistent network nodes — junction points in the web
  var nodes = [];
  // Active growing tendrils
  var tendrils = [];
  // Floating spore particles
  var spores = [];
  // Persistent glow pools that fade slowly
  var glowPools = [];

  var MAX_NODES = 80;
  var MAX_TENDRILS = 120;
  var MAX_SPORES = 300;
  var MAX_GLOW_POOLS = 40;

  var lastBeat = -1;
  var time = 0;

  // Channel → bioluminescent color palette
  var CH_PALETTES = [
    { core: '#b0f4ff', mid: '#38d8f5', dim: '#0a5c6e', spore: '#7aeeff' },  // lead: cyan-white
    { core: '#d4ffb0', mid: '#7de84a', dim: '#2a5c0a', spore: '#aeff7a' },  // harmony: acid-green
    { core: '#ffb0e8', mid: '#f04fc8', dim: '#6e0a50', spore: '#ff7ae0' },  // bass: magenta
    { core: '#fff4b0', mid: '#f5c438', dim: '#6e500a', spore: '#ffe07a' }   // percussion: amber
  ];

  function palette(ch) {
    return CH_PALETTES[ch % CH_PALETTES.length];
  }

  function sc() {
    return Math.min(w, h) / 900;
  }

  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  // ─── Node ───────────────────────────────────────────────────────────────────
  // A static junction in the network. Lights up when a tendril reaches it.
  function makeNode(x, y, ch) {
    return {
      x: x, y: y,
      ch: ch,
      brightness: 0,   // 0..1
      size: rand(1.5, 4) * sc(),
      connections: []  // indices into nodes[]
    };
  }

  // ─── Tendril ─────────────────────────────────────────────────────────────────
  // A growing branch from a source point. Records its path as a polyline.
  function spawnTendril(ox, oy, angle, ch, note) {
    if (tendrils.length >= MAX_TENDRILS) return;
    var s = sc();
    var speed = rand(60, 160) * s * (0.5 + note.vol * 1.5);
    var len = rand(80, 280) * s * (0.4 + note.normalized * 0.8);
    tendrils.push({
      ch: ch,
      x: ox, y: oy,
      angle: angle,
      wobble: rand(-0.4, 0.4),
      wobbleSpeed: rand(1.5, 4),
      wobbleAmp: rand(0.04, 0.18),
      speed: speed,
      maxLen: len,
      life: 1,
      decay: rand(0.18, 0.45),
      vol: note.vol,
      normalized: note.normalized,
      path: [{ x: ox, y: oy }],
      growing: true,
      travelled: 0,
      brightness: 0.8 + note.vol * 0.2
    });
  }

  // Seed a cluster of tendrils from a channel origin
  function bloom(ch, note) {
    var s = sc();
    // Channel anchor positions spread across canvas
    var anchors = [
      { x: w * 0.22, y: h * 0.28 },
      { x: w * 0.78, y: h * 0.28 },
      { x: w * 0.28, y: h * 0.72 },
      { x: w * 0.72, y: h * 0.72 }
    ];
    var origin = anchors[ch % anchors.length];
    // Jitter from anchor
    var ox = origin.x + rand(-60, 60) * s;
    var oy = origin.y + rand(-60, 60) * s;

    // Add or reinforce a node at origin
    var nearNode = null;
    for (var ni = 0; ni < nodes.length; ni++) {
      var nd = nodes[ni];
      var dx = nd.x - ox, dy = nd.y - oy;
      if (Math.sqrt(dx * dx + dy * dy) < 30 * s) {
        nearNode = nd;
        break;
      }
    }
    if (!nearNode && nodes.length < MAX_NODES) {
      nearNode = makeNode(ox, oy, ch);
      nodes.push(nearNode);
    }
    if (nearNode) nearNode.brightness = Math.min(1, nearNode.brightness + note.vol * 0.8);

    var count = 1 + Math.floor(note.vol * 4);
    for (var i = 0; i < count; i++) {
      var angle = rand(0, Math.PI * 2);
      spawnTendril(ox, oy, angle, ch, note);
    }
  }

  // ─── Spore ───────────────────────────────────────────────────────────────────
  function emitSpore(x, y, ch, vol) {
    if (spores.length >= MAX_SPORES) return;
    var s = sc();
    var angle = rand(0, Math.PI * 2);
    var speed = rand(8, 40) * s;
    spores.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ch: ch,
      size: rand(1, 3.5) * s * (0.3 + vol * 0.7),
      life: 1,
      decay: rand(0.3, 1.2),
      alpha: 0.5 + vol * 0.5
    });
  }

  // ─── Glow Pool ───────────────────────────────────────────────────────────────
  function addGlowPool(x, y, ch, radius, alpha) {
    if (glowPools.length >= MAX_GLOW_POOLS) {
      // Replace oldest
      glowPools.shift();
    }
    glowPools.push({ x: x, y: y, ch: ch, radius: radius, alpha: alpha, decay: 0.4 });
  }

  // ─── Init / Resize ───────────────────────────────────────────────────────────
  function resetState() {
    nodes = [];
    tendrils = [];
    spores = [];
    glowPools = [];
    lastBeat = -1;
    time = 0;

    // Seed a sparse background network of dormant nodes
    var s = sc();
    for (var i = 0; i < 28; i++) {
      var nx = rand(w * 0.05, w * 0.95);
      var ny = rand(h * 0.05, h * 0.95);
      var nd = makeNode(nx, ny, Math.floor(rand(0, 4)));
      nd.size = rand(1, 2.5) * s;
      nodes.push(nd);
    }
    // Connect nearby dormant nodes
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var ddx = nodes[a].x - nodes[b].x;
        var ddy = nodes[a].y - nodes[b].y;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 160 * s && nodes[a].connections.length < 4 && nodes[b].connections.length < 4) {
          nodes[a].connections.push(b);
          nodes[b].connections.push(a);
        }
      }
    }
  }

  // ─── Drawing helpers ─────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return r + ',' + g + ',' + b;
  }

  var _rgbCache = {};
  function rgb(hex) {
    if (!_rgbCache[hex]) _rgbCache[hex] = hexToRgb(hex);
    return _rgbCache[hex];
  }

  function rgba(hex, a) {
    return 'rgba(' + rgb(hex) + ',' + a + ')';
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return {
    name: 'Mycelium Network',

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      resetState();
    },

    resize: function (width, height) {
      w = width;
      h = height;
    },

    render: function (fd) {
      var ctx = fd.ctx;
      w = fd.width;
      h = fd.height;
      var dt = fd.dt || 0.016;
      time += dt;

      var s = sc();

      // ── Background — deep organic darkness ──────────────────────────────────
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, w, h);

      // Very subtle organic texture overlay (animated mottled dark)
      var noiseAlpha = 0.03;
      ctx.fillStyle = 'rgba(10,20,15,' + noiseAlpha + ')';
      for (var tx = 0; tx < w; tx += 60 * s) {
        for (var ty = 0; ty < h; ty += 60 * s) {
          var phase = Math.sin(tx * 0.008 + time * 0.3) * Math.cos(ty * 0.009 + time * 0.22);
          if (phase > 0.3) {
            ctx.fillRect(tx, ty, 60 * s, 60 * s);
          }
        }
      }

      // ── Idle state ──────────────────────────────────────────────────────────
      if (!fd.cursor) {
        // Draw dormant network faintly
        ctx.strokeStyle = 'rgba(30,80,50,0.15)';
        ctx.lineWidth = 0.5;
        for (var ni = 0; ni < nodes.length; ni++) {
          var nd = nodes[ni];
          var pal = palette(nd.ch);
          for (var ci = 0; ci < nd.connections.length; ci++) {
            var nb = nodes[nd.connections[ci]];
            ctx.beginPath();
            ctx.moveTo(nd.x, nd.y);
            ctx.lineTo(nb.x, nb.y);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, nd.size, 0, Math.PI * 2);
          ctx.fillStyle = rgba(pal.dim, 0.25);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(120,200,160,0.12)';
        ctx.font = Math.round(13 * s) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('press play', w / 2, h / 2);
        ctx.textAlign = 'start';
        return;
      }

      // ── Musical input ────────────────────────────────────────────────────────
      var energy = (analysis && fd.cursor) ? (analysis.energy[fd.cursor.timelineIndex] || 0) : 0;
      var beatFrac = (analysis && fd.cursor) ? ((fd.cursor.totalFracRow % analysis.rpb) / analysis.rpb) : 0;
      var currentBeat = fd.cursor.beat;

      // Beat pulse: add a diffuse glow pool at center
      if (currentBeat !== lastBeat) {
        lastBeat = currentBeat;
        var poolR = Math.min(w, h) * (0.08 + energy * 0.18);
        addGlowPool(w / 2, h / 2, currentBeat % 4, poolR, 0.06 + energy * 0.12);
      }

      // Trigger blooms from active notes
      var notes = fd.currentNotes;
      if (notes) {
        for (var ci2 = 0; ci2 < notes.length; ci2++) {
          var note = notes[ci2];
          if (note && note.vol > 0.05) {
            bloom(ci2, note);
          }
        }
      }

      // ── Update glow pools ────────────────────────────────────────────────────
      for (var gi = glowPools.length - 1; gi >= 0; gi--) {
        var gp = glowPools[gi];
        gp.alpha -= gp.decay * dt * 0.5;
        gp.radius *= (1 + dt * 0.3);
        if (gp.alpha <= 0.002) {
          glowPools.splice(gi, 1);
          continue;
        }
        var gpPal = palette(gp.ch);
        var grad = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, gp.radius);
        grad.addColorStop(0, rgba(gpPal.mid, gp.alpha));
        grad.addColorStop(1, rgba(gpPal.dim, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Draw dormant network connections ────────────────────────────────────
      for (var na = 0; na < nodes.length; na++) {
        var nodeA = nodes[na];
        var palA = palette(nodeA.ch);
        for (var cb = 0; cb < nodeA.connections.length; cb++) {
          var idx = nodeA.connections[cb];
          if (idx <= na) continue; // draw each edge once
          var nodeB = nodes[idx];
          var brt = (nodeA.brightness + nodeB.brightness) * 0.5;
          var lineAlpha = 0.04 + brt * 0.3;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.strokeStyle = rgba(palA.mid, lineAlpha);
          ctx.lineWidth = 0.5 + brt * 1.5;
          ctx.stroke();
        }
      }

      // ── Update & draw tendrils ───────────────────────────────────────────────
      for (var ti = tendrils.length - 1; ti >= 0; ti--) {
        var t = tendrils[ti];
        var tPal = palette(t.ch);

        if (t.growing) {
          // Advance tip
          t.wobble += dt * t.wobbleSpeed;
          var eff = t.angle + Math.sin(t.wobble) * t.wobbleAmp;
          var step = t.speed * dt;
          var nx2 = t.x + Math.cos(eff) * step;
          var ny2 = t.y + Math.sin(eff) * step;
          t.x = nx2;
          t.y = ny2;
          t.travelled += step;
          t.path.push({ x: nx2, y: ny2 });
          // Cap path length to prevent memory growth
          if (t.path.length > 120) t.path.shift();

          if (t.travelled >= t.maxLen) {
            t.growing = false;
            // Spawn node at tip if space allows
            if (nodes.length < MAX_NODES) {
              var tipNode = makeNode(nx2, ny2, t.ch);
              tipNode.brightness = t.brightness * 0.6;
              // Connect to nearby nodes
              for (var nn = 0; nn < nodes.length; nn++) {
                var dxn = nodes[nn].x - nx2, dyn = nodes[nn].y - ny2;
                var distn = Math.sqrt(dxn * dxn + dyn * dyn);
                if (distn < 120 * s && tipNode.connections.length < 3) {
                  tipNode.connections.push(nn);
                  if (nodes[nn].connections.length < 5) nodes[nn].connections.push(nodes.length);
                }
              }
              nodes.push(tipNode);
            }
            // Emit spores at tip
            var sporeCount = 2 + Math.floor(t.vol * 5);
            for (var sp = 0; sp < sporeCount; sp++) {
              emitSpore(nx2, ny2, t.ch, t.vol);
            }
            addGlowPool(nx2, ny2, t.ch, 40 * s * t.vol, 0.15 * t.brightness);
          }
        }

        // Decay life
        if (!t.growing) {
          t.life -= t.decay * dt;
        }
        if (t.life <= 0) {
          tendrils.splice(ti, 1);
          continue;
        }

        // Draw tendril as polyline
        var path = t.path;
        if (path.length < 2) continue;

        var baseAlpha = t.life * t.brightness;
        // Glow pass (wide, soft)
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (var pi2 = 1; pi2 < path.length; pi2++) {
          ctx.lineTo(path[pi2].x, path[pi2].y);
        }
        ctx.strokeStyle = rgba(tPal.mid, baseAlpha * 0.15);
        ctx.lineWidth = (3 + t.vol * 6) * s;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Core pass (thin, bright)
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (var pi3 = 1; pi3 < path.length; pi3++) {
          ctx.lineTo(path[pi3].x, path[pi3].y);
        }
        ctx.strokeStyle = rgba(tPal.core, baseAlpha * 0.85);
        ctx.lineWidth = (0.8 + t.vol * 1.8) * s;
        ctx.stroke();

        // Tip glow dot (only while growing)
        if (t.growing) {
          var tipX = path[path.length - 1].x;
          var tipY = path[path.length - 1].y;
          var tipR = (2 + t.vol * 5) * s;
          var tipGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, tipR * 2.5);
          tipGrad.addColorStop(0, rgba(tPal.core, baseAlpha * 0.9));
          tipGrad.addColorStop(0.4, rgba(tPal.mid, baseAlpha * 0.5));
          tipGrad.addColorStop(1, rgba(tPal.mid, 0));
          ctx.beginPath();
          ctx.arc(tipX, tipY, tipR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = tipGrad;
          ctx.fill();
        }
      }

      // ── Update & draw nodes ──────────────────────────────────────────────────
      for (var nj = 0; nj < nodes.length; nj++) {
        var node = nodes[nj];
        node.brightness *= Math.pow(0.92, dt * 60);

        var nPal = palette(node.ch);
        var nbrt = node.brightness;
        if (nbrt < 0.005) continue;

        // Outer glow
        var ngr = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 5 * (1 + nbrt * 2));
        ngr.addColorStop(0, rgba(nPal.mid, nbrt * 0.4));
        ngr.addColorStop(1, rgba(nPal.dim, 0));
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 5 * (1 + nbrt * 2), 0, Math.PI * 2);
        ctx.fillStyle = ngr;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * (1 + nbrt * 1.5), 0, Math.PI * 2);
        ctx.fillStyle = rgba(nPal.core, 0.3 + nbrt * 0.7);
        ctx.fill();
      }

      // ── Update & draw spores ─────────────────────────────────────────────────
      for (var si2 = spores.length - 1; si2 >= 0; si2--) {
        var sp2 = spores[si2];
        sp2.x += sp2.vx * dt;
        sp2.y += sp2.vy * dt;
        sp2.vx *= Math.pow(0.85, dt * 60);
        sp2.vy *= Math.pow(0.85, dt * 60);
        sp2.life -= sp2.decay * dt;
        if (sp2.life <= 0) {
          spores.splice(si2, 1);
          continue;
        }
        var sPal = palette(sp2.ch);
        var a2 = sp2.life * sp2.alpha;
        // Twinkle
        var twinkle = 0.6 + 0.4 * Math.sin(time * 8 + si2 * 1.7);
        ctx.beginPath();
        ctx.arc(sp2.x, sp2.y, sp2.size * sp2.life, 0, Math.PI * 2);
        ctx.fillStyle = rgba(sPal.spore, a2 * twinkle);
        ctx.fill();
      }

      // ── Beat flash ───────────────────────────────────────────────────────────
      if (beatFrac < 0.06 && currentBeat % 4 === 0) {
        var flash = (1 - beatFrac / 0.06) * 0.04 * (1 + energy);
        ctx.fillStyle = 'rgba(180,255,220,' + flash + ')';
        ctx.fillRect(0, 0, w, h);
      }

      // ── Subtle vignette ──────────────────────────────────────────────────────
      var vign = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.min(w, h) * 0.75);
      vign.addColorStop(0, 'rgba(0,0,0,0)');
      vign.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, w, h);

      // ── Song info ────────────────────────────────────────────────────────────
      if (fd.cursor) {
        var elapsed = fd.cursor.elapsed;
        var mins = Math.floor(elapsed / 60);
        var secs = Math.floor(elapsed % 60);
        var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        ctx.font = Math.round(11 * s) + 'px monospace';
        ctx.fillStyle = 'rgba(100,200,140,0.25)';
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, w - 12 * s, h - 12 * s);
        ctx.textAlign = 'start';
      }
    },

    destroy: function () {
      nodes = [];
      tendrils = [];
      spores = [];
      glowPools = [];
      analysis = null;
      lastBeat = -1;
      time = 0;
    }
  };
})();

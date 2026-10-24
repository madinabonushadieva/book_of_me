/* ============ INTERACTIVE WORLD: a tiny isometric (2.5D) engine, plain canvas, no libraries ============
   Tile (x, y) -> screen:  sx = (x - y) * 32,  sy = (x + y) * 16 - height
   Everything is drawn in code (no image files except the story posters), so it is light for a 4 GB RAM computer. */
(function () {
    'use strict';

    var B = window.BOOK;
    function $(s) { return document.querySelector(s); }

    var root = $('#world'), canvas = $('#worldCanvas'), ctx = canvas.getContext('2d');
    var siteEl = $('#site');
    var elPrompt = $('#wPrompt'), elAct = $('#wAct'), elPanel = $('#wPanel'), elIntro = $('#wIntro');
    var elMedia = $('#wMedia'), elBody = $('#wPanelBody'), elTitle = $('#wPanelTitle'), elEyebrow = $('#wPanelEyebrow');
    var elPlaces = $('#wPlaces'), elControls = $('#wControls');
    var banner = document.createElement('div');
    banner.className = 'w-banner';
    root.appendChild(banner);

    var SS = 1.75;                 // sprite sharpness for the island pictures
    var ready = false, running = false, raf = 0, last = 0;
    var W = 0, H = 0, scale = 1, zoom = 1;
    var islands = [], walk = {}, blocked = {}, ents = [], posters = {};
    var player = { x: 0, y: 0, face: 1, step: 0, moving: false, by: 0 };
    var cam = { x: 0, y: 0, snap: true };
    var keys = {}, joy = { x: 0, y: 0 };
    var modal = null;              // 'panel' | 'intro' | null
    var near = null, curIsland = null, bannerTimer = 0, lastFocus = null;
    var stars = [], bgGrad = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function key(x, y) { return x * 64 + y; }
    function P(x, y, z, by) { return [(x - y) * 32, (x + y) * 16 - (z || 0) + (by || 0)]; }

    /* ---------- drawing helpers ---------- */
    var tcache = {};
    function tone(hex, f) {
        var k = hex + f;
        if (tcache[k]) return tcache[k];
        var n = parseInt(hex.slice(1), 16);
        var r = Math.min(255, (n >> 16) * f) | 0, g = Math.min(255, ((n >> 8) & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
        return (tcache[k] = 'rgb(' + r + ',' + g + ',' + b + ')');
    }
    function poly(pts, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }
    // a box: left face = side facing down-left (y = y1), right face = side facing down-right (x = x1)
    function box(x0, y0, x1, y1, z0, z1, by, base) {
        poly([P(x0, y1, z0, by), P(x1, y1, z0, by), P(x1, y1, z1, by), P(x0, y1, z1, by)], tone(base, 0.82));
        poly([P(x1, y0, z0, by), P(x1, y1, z0, by), P(x1, y1, z1, by), P(x1, y0, z1, by)], tone(base, 0.6));
        poly([P(x0, y0, z1, by), P(x1, y0, z1, by), P(x1, y1, z1, by), P(x0, y1, z1, by)], tone(base, 1.12));
    }
    var glows = {};
    function glowImg(rgb) {
        if (glows[rgb]) return glows[rgb];
        var c = document.createElement('canvas'); c.width = c.height = 128;
        var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',0.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        return (glows[rgb] = c);
    }
    function glow(x, y, r, rgb, a) { ctx.globalAlpha = a; ctx.drawImage(glowImg(rgb), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }
    function shadow(e, by, grow) {
        var c = P((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, 0, by);
        var w = ((e.x1 - e.x0) + (e.y1 - e.y0)) * 17 * (grow || 1);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, w, w * 0.5, 0, 0, 6.2832); ctx.fill();
    }
    function sparkle(x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.35, y - r * 0.35); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.35, y + r * 0.35);
        ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.35, y + r * 0.35); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.35, y - r * 0.35); ctx.closePath(); ctx.fill();
    }
    function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

    /* ---------- the map: islands, bridges, objects ---------- */
    var SPEC = [
        { id: 'hub',      kind: 'island', rect: [12, 12, 19, 19], place: 'pl_hub',      spawn: [18.3, 18.3] },
        { id: 'about',    kind: 'island', rect: [12, 2, 19, 8],   place: 'pl_about',    spawn: [15.5, 7.5] },
        { id: 'skills',   kind: 'island', rect: [24, 12, 31, 19], place: 'pl_skills',   spawn: [25.5, 15.5] },
        { id: 'projects', kind: 'island', rect: [10, 24, 21, 32], place: 'pl_projects', spawn: [15.5, 25.5] },
        { id: 'edu',      kind: 'island', rect: [2, 12, 8, 19],   place: 'pl_edu',      spawn: [7.5, 15.5] },
        { id: 'contact',  kind: 'island', rect: [24, 2, 31, 8],   place: 'pl_contact',  spawn: [25.5, 5.5] },
        { id: 'story',    kind: 'island', rect: [24, 24, 31, 31], place: 'pl_story',    spawn: [25.5, 28.5] },
        { id: 'future',   kind: 'dark',   rect: [2, 2, 8, 8],     place: 'pl_future',   spawn: [6.5, 6.5] },
        { id: 'b1', kind: 'bridge', rect: [15, 9, 16, 11] },     // hub  <-> about
        { id: 'b2', kind: 'bridge', rect: [20, 15, 23, 16] },     // hub  <-> skills
        { id: 'b3', kind: 'bridge', rect: [15, 20, 16, 23] },     // hub  <-> projects
        { id: 'b4', kind: 'bridge', rect: [9, 15, 11, 16] },      // hub  <-> education
        { id: 'b5', kind: 'bridge', rect: [20, 4, 23, 5] },       // about <-> contact
        { id: 'b6', kind: 'bridge', rect: [22, 27, 23, 28] },     // projects <-> story
        { id: 'b7', kind: 'bridge', rect: [4, 9, 5, 11] }         // education <-> future
    ];

    var COLORS = { front: '#7fb2ff', back: '#a58bff', db: '#5fd1b8', lang: '#f0a96b', other: '#e58ab0', next: '#6fcf8a' };

    function addObj(o, isl) {
        o.x0 = o.x; o.y0 = o.y; o.x1 = o.x + (o.w || 1); o.y1 = o.y + (o.d || 1);
        o.isl = isl; o.phase = (o.x * 7 + o.y * 3) % 6;
        if (o.solid !== false) for (var i = o.x0; i < o.x1; i++) for (var j = o.y0; j < o.y1; j++) blocked[key(i, j)] = true;
        ents.push(o);
        return o;
    }

    function buildWorld() {
        var byId = {};
        SPEC.forEach(function (s, n) {
            var isl = { id: s.id, kind: s.kind, rect: s.rect, place: s.place, spawn: s.spawn, phase: n * 1.3, bob: 0, seed: 11 + n * 7 };
            byId[s.id] = isl;
            islands.push(isl);
            for (var x = s.rect[0]; x <= s.rect[2]; x++) for (var y = s.rect[1]; y <= s.rect[3]; y++) walk[key(x, y)] = isl;
        });
        var I = byId;

        // hub: the magic book
        addObj({ type: 'book', id: 'book', x: 15, y: 15, w: 2, d: 2, inter: 'book', label: 'book_t', lh: 78 }, I.hub);
        [[12, 12], [19, 12], [12, 19], [19, 19]].forEach(function (p) { addObj({ type: 'lamp', x: p[0], y: p[1] }, I.hub); });

        // about house
        addObj({ type: 'house', id: 'about', x: 14, y: 3, w: 3, d: 3, inter: 'about', label: 'nav_about', lh: 84 }, I.about);
        [[13, 7], [18, 7], [12, 2], [19, 2]].forEach(function (p) { addObj({ type: 'tree', x: p[0], y: p[1] }, I.about); });

        // skills: one crystal per group, a sapling for "next to learn"
        [['front', 25, 13, 'sg_front'], ['back', 29, 13, 'sg_back'], ['db', 25, 17, 'sg_db'], ['lang', 29, 17, 'sl_lang'], ['other', 27, 15, 'sl_other']].forEach(function (c) {
            addObj({ type: 'crystal', id: 'skill_' + c[0], x: c[1], y: c[2], color: COLORS[c[0]], inter: 'skill:' + c[0], label: c[3], lh: 56 }, I.skills);
        });
        addObj({ type: 'sapling', id: 'skill_next', x: 31, y: 15, color: COLORS.next, inter: 'skill:next', label: 'sg_next', lh: 48 }, I.skills);
        [[24, 12], [31, 12], [24, 19], [31, 19]].forEach(function (p) { addObj({ type: 'lamp', x: p[0], y: p[1] }, I.skills); });

        // projects
        addObj({ type: 'chess',  id: 'uzchess', x: 11, y: 27, w: 3, d: 3, inter: 'proj:uzchess', labelRaw: 'UzChess',    lh: 82 }, I.projects);
        addObj({ type: 'blocks', id: 'kids',    x: 15, y: 27, w: 3, d: 3, inter: 'proj:kids',    labelRaw: 'Smart Kids', lh: 72 }, I.projects);
        addObj({ type: 'clinic', id: 'doctor',  x: 19, y: 27, w: 3, d: 3, inter: 'proj:doctor',  labelRaw: 'DoctorUZ',   lh: 78 }, I.projects);
        [[10, 24], [21, 24], [10, 32], [21, 32], [13, 31], [18, 31]].forEach(function (p) { addObj({ type: 'tree', x: p[0], y: p[1] }, I.projects); });

        // education
        addObj({ type: 'uni',   id: 'uni',   x: 3, y: 13, w: 3, d: 3, inter: 'uni',   labelRaw: 'TATU', lh: 92 }, I.edu);
        addObj({ type: 'kiosk', id: 'kiosk', x: 3, y: 17, w: 2, d: 2, inter: 'kiosk', label: 'kiosk_t', lh: 58 }, I.edu);
        [[7, 18], [8, 13], [2, 12], [8, 19]].forEach(function (p) { addObj({ type: p[0] === 7 || p[0] === 8 && p[1] === 13 ? 'tree' : 'lamp', x: p[0], y: p[1] }, I.edu); });

        // contact
        addObj({ type: 'beacon', id: 'beacon', x: 27, y: 4, w: 2, d: 2, inter: 'contact', label: 'beacon_t', lh: 96 }, I.contact);
        [[24, 2], [31, 2], [24, 8], [31, 8]].forEach(function (p) { addObj({ type: 'lamp', x: p[0], y: p[1] }, I.contact); });

        // story frames (the five videos from the original version)
        [[25, 29], [27, 29], [27, 27], [29, 27], [29, 25]].forEach(function (p, i) {
            var s = B.STORY[i];
            addObj({ type: 'frame', id: 'story_' + s.id, x: p[0], y: p[1], inter: 'story:' + s.id, label: s.key, labelRaw: s.raw, story: s, lh: 66 }, I.story);
        });
        [[24, 24], [31, 24], [31, 31], [24, 31]].forEach(function (p) { addObj({ type: 'tree', x: p[0], y: p[1] }, I.story); });

        // the unwritten island
        addObj({ type: 'futurebook', id: 'future', x: 4, y: 4, w: 2, d: 2, inter: 'future', label: 'future_t', lh: 58 }, I.future);
        [[3, 3], [7, 3], [3, 7], [7, 7], [6, 5], [4, 7]].forEach(function (p) { addObj({ type: 'unlit', x: p[0], y: p[1], solid: false }, I.future); });

        islands.sort(function (a, b) {
            return (a.rect[0] + a.rect[2] + a.rect[1] + a.rect[3]) - (b.rect[0] + b.rect[2] + b.rect[1] + b.rect[3]);
        });
        islands.forEach(buildSprite);

        var sp = byId.hub.spawn;
        player.x = sp[0]; player.y = sp[1];
        curIsland = byId.hub;
        player.ent = { x0: 0, y0: 0, x1: 0, y1: 0, type: 'player' };
        ents.push(player.ent);
    }

    /* each island is painted once into a picture; then it is just moved up and down (floating) */
    function buildSprite(isl) {
        var r = isl.rect, x0 = r[0], y0 = r[1], x1 = r[2] + 1, y1 = r[3] + 1;
        var bridge = isl.kind === 'bridge';
        var slab = bridge ? 6 : 16;
        var rock = bridge ? 0 : ((x1 - x0) + (y1 - y0)) * 6.5;
        var top = P(x0, y0, 0), right = P(x1, y0, 0), bottom = P(x1, y1, 0), left = P(x0, y1, 0);
        var minX = left[0] - 6, maxX = right[0] + 6, minY = top[1] - 6, maxY = bottom[1] + slab + rock + 8;
        var cv = document.createElement('canvas');
        cv.width = Math.ceil((maxX - minX) * SS); cv.height = Math.ceil((maxY - minY) * SS);
        var main = ctx, g = cv.getContext('2d');
        g.scale(SS, SS); g.translate(-minX, -minY);
        ctx = g;
        ctx.lineJoin = 'round';

        if (rock) {                                     // the rock hanging under the island
            var Lp = P(x0, y1, -slab), Bp = P(x1, y1, -slab), Rp = P(x1, y0, -slab);
            var tx = (Lp[0] + Rp[0]) / 2, ty = Bp[1] + rock, rnd = seeded(isl.seed), pts = [Lp, Bp, Rp], i, t;
            for (i = 1; i <= 4; i++) { t = i / 5; pts.push([Rp[0] + (tx - Rp[0]) * t + (rnd() - 0.5) * 16, Rp[1] + (ty - Rp[1]) * t + (rnd() - 0.3) * 10]); }
            pts.push([tx, ty]);
            for (i = 4; i >= 1; i--) { t = i / 5; pts.push([Lp[0] + (tx - Lp[0]) * t + (rnd() - 0.5) * 16, Lp[1] + (ty - Lp[1]) * t + (rnd() - 0.3) * 10]); }
            var gr = ctx.createLinearGradient(0, Bp[1], 0, ty);
            gr.addColorStop(0, isl.kind === 'dark' ? '#25263f' : '#2b2560'); gr.addColorStop(1, '#090818');
            ctx.lineWidth = 1;
            poly(pts, gr, 'rgba(214,179,112,0.16)');
        }

        var cA, cB, edge;
        if (isl.kind === 'dark') { cA = '#1b1d3a'; cB = '#20233f'; edge = 'rgba(150,150,200,0.35)'; }
        else if (bridge) { cA = '#3b3466'; cB = '#443c74'; edge = 'rgba(214,179,112,0.55)'; }
        else { cA = '#222f6e'; cB = '#28377d'; edge = 'rgba(214,179,112,0.5)'; }
        var faceL = isl.kind === 'dark' ? '#14152b' : '#141c47', faceR = isl.kind === 'dark' ? '#0e0f20' : '#0e1538';
        ctx.lineWidth = 0.6;

        for (var y = r[1]; y <= r[3]; y++) {
            for (var x = r[0]; x <= r[2]; x++) {
                poly([P(x, y, 0), P(x + 1, y, 0), P(x + 1, y + 1, 0), P(x, y + 1, 0)], ((x + y) & 1) ? cA : cB, 'rgba(255,255,255,0.045)');
                if (!walk[key(x + 1, y)]) poly([P(x + 1, y, 0), P(x + 1, y + 1, 0), P(x + 1, y + 1, -slab), P(x + 1, y, -slab)], faceR);
                if (!walk[key(x, y + 1)]) poly([P(x, y + 1, 0), P(x + 1, y + 1, 0), P(x + 1, y + 1, -slab), P(x, y + 1, -slab)], faceL);
            }
        }
        ctx.lineWidth = 1.4; ctx.strokeStyle = edge;       // glowing rim on the outside edges
        ctx.beginPath();
        for (y = r[1]; y <= r[3]; y++) for (x = r[0]; x <= r[2]; x++) {
            var a;
            if (!walk[key(x + 1, y)]) { a = P(x + 1, y, 0); ctx.moveTo(a[0], a[1]); a = P(x + 1, y + 1, 0); ctx.lineTo(a[0], a[1]); }
            if (!walk[key(x, y + 1)]) { a = P(x, y + 1, 0); ctx.moveTo(a[0], a[1]); a = P(x + 1, y + 1, 0); ctx.lineTo(a[0], a[1]); }
            if (!walk[key(x - 1, y)]) { a = P(x, y, 0); ctx.moveTo(a[0], a[1]); a = P(x, y + 1, 0); ctx.lineTo(a[0], a[1]); }
            if (!walk[key(x, y - 1)]) { a = P(x, y, 0); ctx.moveTo(a[0], a[1]); a = P(x + 1, y, 0); ctx.lineTo(a[0], a[1]); }
        }
        ctx.stroke();

        ctx = main;
        isl.sprite = cv; isl.ox = minX; isl.oy = minY; isl.sw = cv.width / SS; isl.sh = cv.height / SS;
    }

    /* ---------- object painters ---------- */
    var DRAW = {};

    DRAW.lamp = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 0, by);
        shadow(e, by, 0.45);
        box(e.x0 + 0.42, e.y0 + 0.42, e.x0 + 0.58, e.y0 + 0.58, 0, 26, by, '#8a7a55');
        glow(c[0], c[1] - 30, 22, '243,220,174', 0.55 + 0.1 * Math.sin(t / 700 + e.phase));
        ctx.fillStyle = '#f3dcae'; ctx.beginPath(); ctx.arc(c[0], c[1] - 29, 3.2, 0, 6.2832); ctx.fill();
    };

    DRAW.tree = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 0, by);
        shadow(e, by, 0.8);
        box(e.x0 + 0.42, e.y0 + 0.42, e.x0 + 0.58, e.y0 + 0.58, 0, 16, by, '#5a4a52');
        var sway = Math.sin(t / 1400 + e.phase) * 1.2, cols = ['#2a6670', '#32797f', '#3f9690'], rs = [15, 12, 8], zs = [20, 31, 40];
        for (var i = 0; i < 3; i++) {
            ctx.fillStyle = cols[i];
            ctx.beginPath(); ctx.ellipse(c[0] + sway * (i + 1) * 0.5, c[1] - zs[i], rs[i], rs[i] * 0.8, 0, 0, 6.2832); ctx.fill();
        }
    };

    DRAW.book = function (e, t, by) {
        shadow(e, by);
        box(e.x0, e.y0, e.x1, e.y1, 0, 14, by, '#3a3a66');
        box(e.x0 + 0.15, e.y0 + 0.15, e.x1 - 0.15, e.y1 - 0.15, 14, 18, by, '#4a4a80');
        var c = P((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, 18, by);
        var f = Math.sin(t / 600) * 3, cx = c[0], cy = c[1] - 22 + f;
        glow(cx, cy, 58, '214,179,112', 0.5 + 0.15 * Math.sin(t / 500));
        poly([[cx, cy + 5], [cx - 28, cy - 6], [cx - 28, cy + 7], [cx, cy + 18]], '#efe6cf', '#d6b370');
        poly([[cx, cy + 5], [cx + 28, cy - 6], [cx + 28, cy + 7], [cx, cy + 18]], '#d9ceb2', '#d6b370');
        ctx.strokeStyle = 'rgba(120,100,70,0.5)'; ctx.lineWidth = 1;
        for (var i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(cx - 6, cy + 7 + i * 3 + 0.5); ctx.lineTo(cx - 24, cy - 1 + i * 3 + 0.5);
            ctx.moveTo(cx + 6, cy + 7 + i * 3 + 0.5); ctx.lineTo(cx + 24, cy - 1 + i * 3 + 0.5); ctx.stroke();
        }
        for (i = 0; i < 5; i++) {
            var a = t / 1100 + i * 1.2566;
            sparkle(cx + Math.cos(a) * 40, cy - 6 + Math.sin(a) * 14 - Math.abs(Math.sin(a * 0.5)) * 10, 3 + (i % 2), '#f3dcae');
        }
    };

    DRAW.house = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, 34, by, '#d9d2bd');
        poly([P(x0 + 1.05, y1, 0, by), P(x0 + 1.95, y1, 0, by), P(x0 + 1.95, y1, 20, by), P(x0 + 1.05, y1, 20, by)], '#3b2f57', '#8c6a3a');
        var fl = 0.75 + 0.2 * Math.sin(t / 400 + e.phase);
        poly([P(x1, y0 + 0.5, 12, by), P(x1, y0 + 1.2, 12, by), P(x1, y0 + 1.2, 24, by), P(x1, y0 + 0.5, 24, by)], 'rgba(243,220,174,' + fl + ')');
        poly([P(x1, y0 + 1.8, 12, by), P(x1, y0 + 2.5, 12, by), P(x1, y0 + 2.5, 24, by), P(x1, y0 + 1.8, 24, by)], 'rgba(243,220,174,' + fl + ')');
        poly([P(x0 + 0.2, y1, 12, by), P(x0 + 0.8, y1, 12, by), P(x0 + 0.8, y1, 24, by), P(x0 + 0.2, y1, 24, by)], 'rgba(243,220,174,' + fl + ')');
        var apex = P((x0 + x1) / 2, (y0 + y1) / 2, 62, by), o = 0.25;
        poly([P(x0 - o, y1 + o, 34, by), P(x1 + o, y1 + o, 34, by), apex], '#9a7640', '#6e5230');
        poly([P(x1 + o, y0 - o, 34, by), P(x1 + o, y1 + o, 34, by), apex], '#74592f', '#5a4326');
    };

    DRAW.crystal = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 8, by);
        shadow(e, by, 0.7);
        box(e.x0 + 0.1, e.y0 + 0.1, e.x1 - 0.1, e.y1 - 0.1, 0, 8, by, '#3a3a66');
        var b = Math.sin(t / 500 + e.phase) * 3, cx = c[0], cy = c[1] - 22 + b;
        glow(cx, cy, 34, hexRgb(e.color), 0.4 + 0.12 * Math.sin(t / 400 + e.phase));
        poly([[cx, cy - 21], [cx - 10, cy - 2], [cx, cy + 17], [cx, cy - 2]], tone(e.color, 0.95), tone(e.color, 1.2));
        poly([[cx, cy - 21], [cx + 10, cy - 2], [cx, cy + 17], [cx, cy - 2]], tone(e.color, 0.65), tone(e.color, 1.2));
    };

    DRAW.sapling = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 0, by), sw = Math.sin(t / 900 + e.phase) * 2;
        shadow(e, by, 0.6);
        box(e.x0 + 0.25, e.y0 + 0.25, e.x1 - 0.25, e.y1 - 0.25, 0, 9, by, '#7a5a3a');
        var bx = c[0], by2 = c[1] - 9;
        ctx.strokeStyle = '#4a8a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by2); ctx.quadraticCurveTo(bx + sw, by2 - 12, bx + sw, by2 - 22); ctx.stroke();
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.ellipse(bx + sw - 7, by2 - 20, 8, 4.5, -0.6, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx + sw + 7, by2 - 24, 8, 4.5, 0.6, 0, 6.2832); ctx.fill();
        glow(bx, by2 - 20, 24, '111,207,138', 0.22);
    };

    DRAW.chess = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1, h = 22;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, h, by, '#2b2f66');
        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
            var a = x0 + i * 0.75, b = y0 + j * 0.75;
            poly([P(a, b, h, by), P(a + 0.75, b, h, by), P(a + 0.75, b + 0.75, h, by), P(a, b + 0.75, h, by)], ((i + j) & 1) ? '#16162f' : '#e9e2cf');
        }
        var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        box(cx - 0.32, cy - 0.32, cx + 0.32, cy + 0.32, h, h + 24, by, '#efe6cf');
        box(cx - 0.42, cy - 0.42, cx + 0.42, cy + 0.42, h + 24, h + 30, by, '#e0d8c2');
        box(cx - 0.42, cy - 0.42, cx - 0.2, cy - 0.2, h + 30, h + 36, by, '#e0d8c2');
        box(cx + 0.2, cy + 0.2, cx + 0.42, cy + 0.42, h + 30, h + 36, by, '#e0d8c2');
        box(cx + 0.2, cy - 0.42, cx + 0.42, cy - 0.2, h + 30, h + 36, by, '#e0d8c2');
        box(cx - 0.42, cy + 0.2, cx - 0.2, cy + 0.42, h + 30, h + 36, by, '#e0d8c2');
    };

    DRAW.blocks = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0;
        shadow(e, by);
        box(x0 + 1.4, y0, x0 + 3, y0 + 1.6, 0, 32, by, '#6f8fd8');
        box(x0, y0 + 1.2, x0 + 1.6, y0 + 2.8, 0, 20, by, '#c8767a');
        box(x0 + 1.4, y0 + 1.6, x0 + 3, y0 + 3, 0, 14, by, '#d9b857');
        var c = P(x0 + 2.2, y0 + 0.8, 32, by), f = Math.sin(t / 500) * 3;
        glow(c[0], c[1] - 20 + f, 22, '243,220,174', 0.35);
        sparkle(c[0], c[1] - 20 + f, 9, '#f3dcae');
        var d = P(x0 + 0.8, y0 + 2, 20, by);
        ctx.fillStyle = '#efe6cf'; ctx.beginPath(); ctx.arc(d[0], d[1] - 7, 6, 0, 6.2832); ctx.fill();
    };

    DRAW.clinic = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1, h = 40, teal = '63,167,160';
        shadow(e, by, 0.9);
        box(x0, y0, x1, y1, 0, 3, by, '#2b3a55');                              // only the foundation is built
        ctx.save();
        ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(' + teal + ',0.85)';
        poly([P(x0, y1, 3, by), P(x1, y1, 3, by), P(x1, y1, h, by), P(x0, y1, h, by)], 'rgba(' + teal + ',0.1)', 'rgba(' + teal + ',0.85)');
        poly([P(x1, y0, 3, by), P(x1, y1, 3, by), P(x1, y1, h, by), P(x1, y0, h, by)], 'rgba(' + teal + ',0.06)', 'rgba(' + teal + ',0.85)');
        poly([P(x0, y0, h, by), P(x1, y0, h, by), P(x1, y1, h, by), P(x0, y1, h, by)], 'rgba(' + teal + ',0.12)', 'rgba(' + teal + ',0.85)');
        ctx.restore();
        var c = P((x0 + x1) / 2, (y0 + y1) / 2, h, by), p = 0.75 + 0.25 * Math.sin(t / 600);
        ctx.fillStyle = 'rgba(' + teal + ',' + p + ')';
        ctx.fillRect(c[0] - 3, c[1] - 11, 6, 22); ctx.fillRect(c[0] - 11, c[1] - 3, 22, 6);
    };

    DRAW.uni = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, 30, by, '#cfc7b0');
        for (var i = 0; i < 4; i++) box(x0 + 0.2 + i * 0.85, y1, x0 + 0.42 + i * 0.85, y1 + 0.22, 0, 30, by, '#efe6cf');
        box(x0 - 0.25, y0 - 0.25, x1 + 0.25, y1 + 0.25, 30, 37, by, '#e0d8c2');
        var c = P((x0 + x1) / 2, (y0 + y1) / 2, 37, by), fl = Math.sin(t / 300) * 2;
        ctx.strokeStyle = '#8a7a55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], c[1] - 30); ctx.stroke();
        poly([[c[0], c[1] - 30], [c[0] + 18 + fl, c[1] - 26], [c[0], c[1] - 21]], '#d6b370');
    };

    DRAW.kiosk = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, 14, by, '#3a3a66');
        var c = P((x0 + x1) / 2, (y0 + y1) / 2, 14, by), p = 0.7 + 0.2 * Math.sin(t / 500);
        glow(c[0], c[1] - 16, 34, '108,82,217', 0.4);
        ctx.fillStyle = '#10143a'; ctx.fillRect(c[0] - 17, c[1] - 34, 34, 24);
        ctx.strokeStyle = 'rgba(214,179,112,' + p + ')'; ctx.lineWidth = 1.5; ctx.strokeRect(c[0] - 17, c[1] - 34, 34, 24);
        ctx.fillStyle = '#d6b370'; ctx.font = '600 11px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
        ctx.fillText('</>', c[0], c[1] - 18); ctx.textAlign = 'start';
    };

    DRAW.beacon = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, 10, by, '#3a3a66');
        box(cx - 0.32, cy - 0.32, cx + 0.32, cy + 0.32, 10, 60, by, '#d9d2bd');
        var c = P(cx, cy, 64, by);
        glow(c[0], c[1], 36, '214,179,112', 0.7 + 0.2 * Math.sin(t / 300));
        ctx.fillStyle = '#f3dcae'; ctx.beginPath(); ctx.arc(c[0], c[1], 5, 0, 6.2832); ctx.fill();
        for (var k = 0; k < 3; k++) {                       // signal rings = "get in touch"
            var ph = ((t / 2200) + k / 3) % 1;
            ctx.strokeStyle = 'rgba(214,179,112,' + (0.55 * (1 - ph)) + ')'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(c[0], c[1], 8 + ph * 46, (8 + ph * 46) * 0.5, 0, 0, 6.2832); ctx.stroke();
        }
    };

    DRAW.frame = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 6, by);
        shadow(e, by, 0.6);
        box(e.x0 + 0.15, e.y0 + 0.15, e.x1 - 0.15, e.y1 - 0.15, 0, 6, by, '#3a3a66');
        var f = Math.sin(t / 700 + e.phase) * 2, fx = c[0] - 25, fy = c[1] - 52 + f;
        ctx.strokeStyle = '#8a7a55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], fy + 32); ctx.stroke();
        glow(c[0], fy + 16, 40, '214,179,112', e.near ? 0.5 : 0.22);
        ctx.fillStyle = '#d6b370'; ctx.fillRect(fx - 3, fy - 3, 56, 38);
        var img = posters[e.story.id];
        if (img && img.complete && img.naturalWidth) ctx.drawImage(img, fx, fy, 50, 32);
        else { ctx.fillStyle = '#10143a'; ctx.fillRect(fx, fy, 50, 32); }
    };

    DRAW.futurebook = function (e, t, by) {
        var x0 = e.x0, y0 = e.y0, x1 = e.x1, y1 = e.y1, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        shadow(e, by);
        box(x0, y0, x1, y1, 0, 12, by, '#2a2d4a');
        box(cx - 0.5, cy - 0.38, cx + 0.5, cy + 0.38, 12, 17, by, '#4a4a70');
        var c = P(cx, cy, 17, by);
        glow(c[0], c[1] - 10, 40, '140,150,210', 0.22 + 0.1 * Math.sin(t / 700));
    };

    DRAW.unlit = function (e, t, by) {
        var c = P(e.x0 + 0.5, e.y0 + 0.5, 12, by), f = Math.sin(t / 900 + e.phase) * 3, a = 0.35 + 0.15 * Math.sin(t / 700 + e.phase);
        ctx.globalAlpha = a; sparkle(c[0], c[1] - 10 + f, 7, '#8d93c4'); ctx.globalAlpha = 1;
    };

    function hexRgb(h) { var n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }

    DRAW.player = function (e, t, by) {
        var s = P(player.x, player.y, 0, by), x = s[0], y = s[1], f = player.face;
        var run = player.moving, sw = run ? Math.sin(player.step) : 0, bob = run ? Math.abs(Math.cos(player.step)) * 3 : Math.sin(t / 600) * 0.8;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 11, 5, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#2a2250';
        ctx.fillRect(x - 6 + sw * 3, y - 9 - bob * 0.4, 4.5, 9); ctx.fillRect(x + 1.5 - sw * 3, y - 9 - bob * 0.4, 4.5, 9);
        ctx.fillStyle = '#d6b370';                                                   // little star backpack
        sparkle(x - f * 10, y - 19 - bob, 5.5, '#d6b370');
        ctx.fillStyle = '#6c52d9';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 8, y - 25 - bob, 16, 17, 4) : ctx.rect(x - 8, y - 25 - bob, 16, 17); ctx.fill();
        ctx.fillStyle = '#d6b370'; ctx.fillRect(x - 8, y - 25 - bob, 16, 4);       // scarf
        ctx.fillStyle = '#2a1b3d'; ctx.beginPath(); ctx.arc(x - f * 5, y - 41 - bob, 4.2, 0, 6.2832); ctx.fill();   // hair bun
        ctx.fillStyle = '#efd3b6'; ctx.beginPath(); ctx.arc(x, y - 33 - bob, 8.5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#2a1b3d'; ctx.beginPath(); ctx.arc(x, y - 35 - bob, 8.8, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
        ctx.fillStyle = '#1a1030';
        ctx.beginPath(); ctx.arc(x + f * 3 - 2.2, y - 32 - bob, 1.2, 0, 6.2832); ctx.arc(x + f * 3 + 2.4, y - 32 - bob, 1.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#d6b370'; ctx.beginPath(); ctx.arc(x + f * 6, y - 38 - bob, 1.6, 0, 6.2832); ctx.fill();
    };

    /* ---------- sorting (things further away are painted first) ---------- */
    function behind(a, b) {                   // true if a must be painted before b
        var ax = a.x1 <= b.x0, bx = b.x1 <= a.x0, ay = a.y1 <= b.y0, by = b.y1 <= a.y0;
        if (ax && !by) return true;
        if (ay && !bx) return true;
        if (bx || by) return false;
        return (a.x0 + a.x1 + a.y0 + a.y1) < (b.x0 + b.x1 + b.y0 + b.y1);
    }
    function sortEnts(list) {
        var n = list.length, out = [], vis = new Array(n), i;
        for (i = 0; i < n; i++) vis[i] = 0;
        function visit(i) {
            if (vis[i]) return;
            vis[i] = 1;
            for (var j = 0; j < n; j++) if (j !== i && !vis[j] && behind(list[j], list[i])) visit(j);
            out.push(list[i]);
        }
        for (i = 0; i < n; i++) visit(i);
        return out;
    }

    /* ---------- update ---------- */
    function canStand(x, y) {
        var r = 0.2, c = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
        for (var i = 0; i < 4; i++) {
            var k = key(Math.floor(c[i][0]), Math.floor(c[i][1]));
            if (!walk[k] || blocked[k]) return false;
        }
        return true;
    }

    function update(dt, t) {
        var ix = 0, iy = 0;
        if (!modal) {
            if (keys.left) ix -= 1; if (keys.right) ix += 1; if (keys.up) iy -= 1; if (keys.down) iy += 1;
            ix += joy.x; iy += joy.y;
            var len = Math.sqrt(ix * ix + iy * iy);
            if (len > 1) { ix /= len; iy /= len; }
        }
        var mv = (ix * ix + iy * iy) > 0.02;
        player.moving = mv;
        if (mv) {
            var S = 170, vx = ix * S, vy = iy * S * 0.5;
            var dx = ((vx / 32) + (vy / 16)) / 2 * dt, dy = ((vy / 16) - (vx / 32)) / 2 * dt;
            if (canStand(player.x + dx, player.y + dy)) { player.x += dx; player.y += dy; }
            else if (canStand(player.x + dx, player.y)) player.x += dx;
            else if (canStand(player.x, player.y + dy)) player.y += dy;
            if (ix > 0.1) player.face = 1; else if (ix < -0.1) player.face = -1;
            player.step += dt * 10;
        }
        var e = player.ent;
        e.x0 = player.x - 0.25; e.x1 = player.x + 0.25; e.y0 = player.y - 0.25; e.y1 = player.y + 0.25;

        // floating islands
        islands.forEach(function (isl) { isl.bob = (isl.kind === 'bridge' || reduce) ? 0 : Math.sin(t / 1300 + isl.phase) * 2.5; });
        var here = walk[key(Math.floor(player.x), Math.floor(player.y))];
        var targetBy = here ? here.bob : 0;
        player.by += (targetBy - player.by) * Math.min(1, dt * 10);
        if (here && here.kind !== 'bridge' && here !== curIsland) { curIsland = here; showBanner(B.t(here.place)); }

        // camera
        var s = P(player.x, player.y, 0), ty = s[1] - 20;
        if (cam.snap || reduce) { cam.x = s[0]; cam.y = ty; cam.snap = false; }
        else { var k = 1 - Math.exp(-dt * 6); cam.x += (s[0] - cam.x) * k; cam.y += (ty - cam.y) * k; }

        // what can the player open?
        var best = null, bd = 1.05;
        for (var i = 0; i < ents.length; i++) {
            var o = ents[i];
            if (!o.inter) continue;
            var ddx = Math.max(o.x0 - player.x, 0, player.x - o.x1), ddy = Math.max(o.y0 - player.y, 0, player.y - o.y1);
            var d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < bd) { bd = d; best = o; }
        }
        if (best !== near) { if (near) near.near = false; near = best; if (near) near.near = true; refreshPrompt(); }
    }

    /* ---------- render ---------- */
    function draw(t) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
        for (var i = 0; i < stars.length; i++) {            // far stars drift slowly = depth
            var s = stars[i];
            var sx = (((s.x * W - cam.x * s.p) % W) + W) % W, sy = (((s.y * H - cam.y * s.p) % H) + H) % H;
            ctx.globalAlpha = reduce ? 0.7 : 0.35 + 0.5 * Math.abs(Math.sin(t / 1400 * s.sp + s.ph));
            ctx.fillStyle = s.gold ? '#f3dcae' : '#fff';
            ctx.fillRect(sx, sy, s.r, s.r);
        }
        ctx.globalAlpha = 1;

        ctx.setTransform(scale * zoom, 0, 0, scale * zoom, scale * (W / 2 - cam.x * zoom), scale * (H / 2 - cam.y * zoom));
        var vw = W / 2 / zoom + 160, vh = H / 2 / zoom + 160;

        islands.forEach(function (isl) {
            if (isl.ox + isl.sw < cam.x - vw || isl.ox > cam.x + vw || isl.oy + isl.sh < cam.y - vh - 40 || isl.oy > cam.y + vh) return;
            ctx.drawImage(isl.sprite, isl.ox, isl.oy + isl.bob, isl.sw, isl.sh);
        });

        var vis = [];
        for (i = 0; i < ents.length; i++) {
            var e = ents[i], c = P((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, 0);
            if (Math.abs(c[0] - cam.x) < vw + 60 && Math.abs(c[1] - cam.y) < vh + 100) vis.push(e);
        }
        vis = sortEnts(vis);
        for (i = 0; i < vis.length; i++) {
            var o = vis[i];
            DRAW[o.type](o, t, o.type === 'player' ? player.by : o.isl.bob);
        }

        // names above objects
        var fs = Math.round(12.5 / zoom * 10) / 10;
        ctx.font = '600 ' + fs + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
        for (i = 0; i < vis.length; i++) {
            o = vis[i];
            if (!o.inter) continue;
            var txt = o.labelRaw && !o.label ? o.labelRaw : (o.label ? B.t(o.label) : o.labelRaw);
            var p = P((o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2, o.lh, o.isl.bob);
            ctx.lineWidth = 4 / zoom; ctx.strokeStyle = 'rgba(5,8,22,0.9)'; ctx.strokeText(txt, p[0], p[1]);
            ctx.fillStyle = o.near ? '#d6b370' : '#ecebf7'; ctx.fillText(txt, p[0], p[1]);
            if (o.near) { sparkle(p[0], p[1] - fs - 5, 4, '#d6b370'); }
        }
        ctx.textAlign = 'start';
    }

    function frame(ts) {
        if (!running) return;
        var dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
        last = ts;
        update(dt, ts);
        draw(ts);
        raf = requestAnimationFrame(frame);
    }

    /* ---------- size ---------- */
    function resize() {
        W = root.clientWidth; H = root.clientHeight;
        scale = Math.min(window.devicePixelRatio || 1, 1.5);     // capped: sharp enough, light for weak computers
        canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
        zoom = Math.max(0.72, Math.min(1.15, Math.min(W, H * 1.15) / 640));
        bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#04061a'); bgGrad.addColorStop(0.55, '#0a1038'); bgGrad.addColorStop(1, '#171046');
        if (!stars.length) {
            var rnd = seeded(7);
            for (var i = 0; i < 110; i++) stars.push({ x: rnd(), y: rnd(), r: rnd() < 0.2 ? 2.2 : 1.3, p: 0.03 + rnd() * 0.12, ph: rnd() * 6, sp: 0.6 + rnd(), gold: rnd() < 0.2 });
        }
    }

    /* ---------- info windows ---------- */
    function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function chips(list, tag) {
        var ul = node('ul', 'w-chips');
        list.forEach(function (x) { ul.appendChild(node('li', null, x)); });
        if (tag) { var li = node('li', 'tag', tag); ul.insertBefore(li, ul.firstChild); }
        return ul;
    }
    function link(kind) {
        var a = node('a', 'btn-link');
        a.href = B.LINKS[kind]; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.appendChild(node('span', null, B.t('link_' + kind)));
        a.appendChild(node('span', null, '↗'));
        return a;
    }

    var videoEl = null;
    function stopMedia() {
        if (videoEl) { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load(); videoEl = null; }
        elMedia.textContent = ''; elMedia.hidden = true;
    }

    function buildPanel(o) {
        var id = o.inter, parts = id.split(':'), kind = parts[0], arg = parts[1];
        var eyebrow = '', title = '', nodes = [];
        if (kind === 'book') {
            eyebrow = B.t('pl_hub'); title = B.t('book_t');
            nodes.push(node('p', null, B.t('w_book_p')));
            var back = node('button', 'btn primary', B.t('w_back')); back.type = 'button';
            back.addEventListener('click', function () { closePanel(); World.exit(); });
            nodes.push(back);
        } else if (kind === 'about') {
            eyebrow = B.t('pl_about'); title = B.t('about_title');
            nodes.push(node('p', null, B.t('about_p1')), node('p', null, B.t('about_p2')), chips(['TATU', B.t('fact_field_v')]));
        } else if (kind === 'skill') {
            var g = B.SKILLS.filter(function (s) { return s.id === arg; })[0];
            eyebrow = B.t('pl_skills'); title = B.t(g.key);
            nodes.push(chips(g.items.map(B.item)));
            if (arg === 'next') nodes.push(node('p', null, B.t('sk_next_p')));
            else nodes.push(node('p', null, B.t('skills_note')));
        } else if (kind === 'proj') {
            var p = B.PROJECTS.filter(function (s) { return s.id === arg; })[0];
            eyebrow = B.t('pl_projects'); title = p.name;
            if (p.badgeKey) nodes.push(chips([], B.t(p.badgeKey)));
            nodes.push(node('p', null, B.t(p.descKey)));
            var l = node('div', 'w-links'); l.appendChild(link('github')); nodes.push(l);
        } else if (kind === 'uni') {
            eyebrow = B.t('pl_edu'); title = B.t('edu1_t'); nodes.push(node('p', null, B.t('edu1_d')));
        } else if (kind === 'kiosk') {
            eyebrow = B.t('pl_edu'); title = B.t('edu2_t'); nodes.push(node('p', null, B.t('edu2_d')));
        } else if (kind === 'contact') {
            eyebrow = B.t('pl_contact'); title = B.t('contact_title');
            nodes.push(node('p', null, B.t('contact_p')));
            var l2 = node('div', 'w-links'); l2.appendChild(link('github')); l2.appendChild(link('linkedin')); nodes.push(l2);
        } else if (kind === 'story') {
            var s = o.story, idx = B.STORY.indexOf(s) + 1;
            eyebrow = B.t('chapter') + ' 0' + idx; title = s.raw || B.t(s.key);
            nodes.push(node('p', null, B.t('w_story_p')));
            elMedia.hidden = false;
            var v = document.createElement('video');
            v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.autoplay = true;
            v.poster = 'assets/posters/' + s.id + '.jpg';
            v.src = 'assets/videos/' + s.id + '.mp4';
            elMedia.appendChild(v); videoEl = v;
            var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (kind === 'future') {
            eyebrow = B.t('pl_future'); title = B.t('future_t'); nodes.push(node('p', null, B.t('w_future_p')));
        }
        elEyebrow.textContent = eyebrow; elTitle.textContent = title;
        elBody.textContent = '';
        nodes.forEach(function (n) { elBody.appendChild(n); });
    }

    var panelObj = null;
    function openPanel(o) {
        stopMedia();
        panelObj = o; buildPanel(o);
        elPanel.hidden = false; modal = 'panel'; joy.x = joy.y = 0; keys = {};
        lastFocus = document.activeElement;
        refreshPrompt();
        setTimeout(function () { $('#wClose').focus(); }, 30);
    }
    function closePanel() {
        if (modal !== 'panel') return;
        elPanel.hidden = true; modal = null; panelObj = null; stopMedia();
        refreshPrompt();
        if (lastFocus && lastFocus.focus && root.contains(lastFocus)) lastFocus.focus(); else root.focus && root.focus();
    }

    function interact() { if (!modal && near) openPanel(near); }

    function refreshPrompt() {
        if (modal || !near) { elPrompt.hidden = true; elAct.classList.remove('ready'); return; }
        var name = near.labelRaw && !near.label ? near.labelRaw : (near.label ? B.t(near.label) : near.labelRaw);
        elPrompt.textContent = '';
        elPrompt.appendChild(node('kbd', null, 'E'));
        elPrompt.appendChild(node('span', null, B.t('w_open') + ': ' + name));
        elPrompt.hidden = false; elAct.classList.add('ready');
    }

    function showBanner(text) {
        banner.textContent = text; banner.classList.add('show');
        clearTimeout(bannerTimer); bannerTimer = setTimeout(function () { banner.classList.remove('show'); }, 2200);
    }

    function buildPlaces() {
        elPlaces.textContent = '';
        var o0 = node('option', null, B.t('w_places')); o0.value = ''; elPlaces.appendChild(o0);
        SPEC.forEach(function (s) { if (s.place) { var o = node('option', null, B.t(s.place)); o.value = s.id; elPlaces.appendChild(o); } });
        elPlaces.selectedIndex = 0;
    }

    /* ---------- input ---------- */
    var KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };

    document.addEventListener('keydown', function (e) {
        if (!running) return;
        var k = e.key;
        if (modal === 'intro') { if (k === 'Enter' || k === ' ' || k === 'e' || k === 'E' || k === 'Escape') { if (!(e.target && e.target.id === 'wStart')) { e.preventDefault(); startGame(); } } return; }
        if (modal === 'panel') { if (k === 'Escape' || k === 'e' || k === 'E') { e.preventDefault(); closePanel(); } return; }
        if (e.target && e.target.tagName === 'SELECT') return;
        if (KEYMAP[k]) { keys[KEYMAP[k]] = true; e.preventDefault(); return; }
        if (k === 'e' || k === 'E') { e.preventDefault(); interact(); }
        else if (k === 'Enter') { if (!(e.target && e.target.closest && e.target.closest('button,a'))) { e.preventDefault(); interact(); } }
        else if (k === 'Escape') { World.exit(); }
        else if (k === '?') { elControls.classList.remove('fade'); }
    });
    document.addEventListener('keyup', function (e) { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
    window.addEventListener('blur', function () { keys = {}; });

    var joyEl = $('#joy'), knob = $('#joyKnob'), joyId = null;
    function joyMove(e) {
        var r = joyEl.getBoundingClientRect(), R = r.width / 2;
        var dx = (e.clientX - (r.left + R)) / R, dy = (e.clientY - (r.top + R)) / R, l = Math.sqrt(dx * dx + dy * dy);
        if (l > 1) { dx /= l; dy /= l; l = 1; }
        knob.style.transform = 'translate(' + dx * R * 0.7 + 'px,' + dy * R * 0.7 + 'px)';
        if (l < 0.18) { joy.x = joy.y = 0; } else { joy.x = dx; joy.y = dy; }
    }
    function joyEnd() { joyId = null; joy.x = joy.y = 0; knob.style.transform = ''; }
    joyEl.addEventListener('pointerdown', function (e) { joyId = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); e.preventDefault(); });
    joyEl.addEventListener('pointermove', function (e) { if (e.pointerId === joyId) joyMove(e); });
    joyEl.addEventListener('pointerup', joyEnd);
    joyEl.addEventListener('pointercancel', joyEnd);

    elAct.addEventListener('click', interact);
    elPrompt.addEventListener('click', interact);
    $('#wClose').addEventListener('click', closePanel);
    elPanel.addEventListener('click', function (e) { if (e.target === elPanel) closePanel(); });
    $('#wBack').addEventListener('click', function () { World.exit(); });
    $('#wHelp').addEventListener('click', function () {
        elControls.classList.remove('fade'); showBanner(B.t('w_controls'));
    });
    $('#wStart').addEventListener('click', startGame);
    elPlaces.addEventListener('change', function () {
        var s = SPEC.filter(function (x) { return x.id === elPlaces.value; })[0];
        if (s && s.spawn) { player.x = s.spawn[0]; player.y = s.spawn[1]; cam.snap = true; elPlaces.blur(); }
        elPlaces.selectedIndex = 0;
    });
    window.addEventListener('resize', function () { if (ready) resize(); });
    document.addEventListener('visibilitychange', function () {
        if (!ready || root.hidden) return;
        if (document.hidden) { running = false; cancelAnimationFrame(raf); } else { start(); }
    });
    B.onLang(function () { if (!ready) return; buildPlaces(); refreshPrompt(); if (modal === 'panel' && panelObj) { stopMedia(); buildPanel(panelObj); } });

    function startGame() {
        elIntro.hidden = true; modal = null;
        try { localStorage.setItem('bookOfMeV2Intro', '1'); } catch (e) {}
        setTimeout(function () { elControls.classList.add('fade'); }, 7000);
        root.focus();
    }

    function start() {
        if (running) return;
        running = true; last = performance.now();
        raf = requestAnimationFrame(frame);
    }

    /* ---------- public ---------- */
    var World = window.World = {
        onExit: function () {},
        exit: function () { World.onExit(); },
        open: function () {
            root.hidden = false; root.setAttribute('aria-hidden', 'false'); root.tabIndex = -1;
            if (siteEl) siteEl.inert = true;
            if (!ready) {
                B.STORY.forEach(function (s) { var im = new Image(); im.src = 'assets/posters/' + s.id + '.jpg'; posters[s.id] = im; });
                buildWorld(); buildPlaces(); resize(); ready = true;
            } else { resize(); }
            cam.snap = true;
            var seen = false; try { seen = localStorage.getItem('bookOfMeV2Intro') === '1'; } catch (e) {}
            if (!seen) { elIntro.hidden = false; modal = 'intro'; setTimeout(function () { $('#wStart').focus(); }, 30); }
            else { elControls.classList.remove('fade'); setTimeout(function () { elControls.classList.add('fade'); }, 6000); root.focus(); }
            showBanner(B.t(curIsland.place));
            start();
        },
        close: function () {
            running = false; cancelAnimationFrame(raf);
            closePanel(); elIntro.hidden = true; modal = null; keys = {}; joyEnd();
            root.hidden = true; root.setAttribute('aria-hidden', 'true');
            if (siteEl) siteEl.inert = false;
        }
    };
})();

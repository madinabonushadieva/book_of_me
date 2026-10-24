(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function noop() {}

    /* ============ 1. LANGUAGE (EN / UZ) ============
       English text lives in index.html (inside each data-i18n element).
       Uzbek text lives here. Same key = same text block. */
    var uz = {
        nav_map: "Yulduz xaritasi",
        nav_story: "Mening hikoyam",
        nav_about: "Men haqimda",
        nav_skills: "Ko‘nikmalar va bilimlar",
        nav_projects: "Loyihalarim",
        nav_journey: "Sayohat davom etadi",

        intro_eyebrow: "Davom etayotgan hikoya",
        intro_sub: "Qiz, raketa va butun hikoyasini o‘zida saqlagan kitob.",
        intro_cta: "Kitobni ochish",

        story_title: "Besh sahna. Davom etayotgan bitta sayohat.",
        chapter: "Bob",
        sc1_t: "Bolalik",
        sc2_t: "Bog‘cha",
        sc3_t: "Maktab",
        sc4_t: "Bitiruv",
        sc4_tag: "Oltin medal",

        about_title: "Salom, men Madinabonuman.",
        about_p1: "Men Toshkent axborot texnologiyalari universiteti (TATU) Computer Engineering yo‘nalishi talabasiman. Dasturlashni o‘rganyapman va amaliy loyihalar ustida ishlaganda eng yaxshi o‘rganaman.",
        about_p2: "Frontend, backend va o‘yin (GameDev) yo‘nalishlariga qiziqaman. Kompyuter tarmoqlari va tarmoq protokollaridan ham bilimim bor, Arduino va Cisco Packet Tracer bilan ishlaganman. Ko‘nikmalarimni hali rivojlantiryapman va yangi texnologiyalarni o‘rganyapman.",
        fact_uni: "Universitet",
        fact_field: "Yo‘nalish",
        ph_field: "Computer Engineering",
        profiles: "Profillar",
        link_github: "GitHub profili",
        link_linkedin: "LinkedIn profili",

        skills_title: "Nimalarni bilaman va nimalarni hali o‘rganyapman.",
        skills_note: "Bu texnologiyalarni turli darajada bilaman. Ro‘yxat nimalar bilan ishlashimni ko‘rsatadi, reyting emas.",
        sg_front: "Frontend",
        sg_back: "Backend",
        sg_db: "Ma’lumotlar bazalari",
        sg_lang: "Dasturlash tillari",
        sg_other: "Boshqa texnik ko‘nikmalar",
        sg_next: "Keyingi o‘rganish rejam",
        sk_git: "Git va GitHub bilan ishlash",
        sk_net: "Kompyuter tarmoqlari va tarmoq protokollari",

        projects_title: "Ustida ishlagan loyihalarim va o‘rganayotgan g‘oyalarim.",
        proj1_desc: "O‘zbek tilidagi foydalanuvchilar uchun shaxmat loyihasi. Men asosan backend qismi ustida ishlaganman.",
        proj2_desc: "Bolalar uchun ta’limiy faoliyatlar va o‘yinlar joylashgan sayt.",
        proj3_desc: "Tibbiy xizmatlar bilan bog‘liq loyiha g‘oyasi.",
        badge_concept: "Konsepsiya",
        badge_dev: "Ishlab chiqilmoqda",
        badge_proto: "Prototip",
        btn_code: "Kodni ko‘rish",
        btn_demo: "Jonli demo",

        journey_title: "Hikoya hali yozilmoqda.",
        journey_p: "Hali o‘rganyapman. Hali yaratyapman. Keyingi boblar hali yozilmagan.",
        tbc: "DAVOM ETADI...",

        /* star map */
        map_eyebrow: "Yulduz xaritasi",
        map_title: "Har bir yulduz — bitta bob.",
        map_lit: "yulduz yondi",
        map_hint: "Ochish uchun yulduzni bosing.",
        lbl_about: "Men haqimda",
        lbl_skills: "Ko‘nikmalar",
        lbl_projects: "Loyihalar",
        lbl_journey: "Sayohat",
        future_hint: "Bu yulduz hali yozilmagan.",
        prev: "Oldingi",
        next: "Keyingi",
        to_map: "Xarita",
        sound: "Ovoz"
    };

    var lang = 'en';
    var enByKey = {};                      // English text for every key (read from index.html once)
    var i18nEls = $$('[data-i18n]');
    i18nEls.forEach(function (el) {
        if (!(el.dataset.i18n in enByKey)) enByKey[el.dataset.i18n] = el.textContent;
    });
    var ariaEls = $$('[data-i18n-aria]');
    ariaEls.forEach(function (el) { el.dataset.enAria = el.getAttribute('aria-label'); });

    function tr(key) { return (lang === 'uz' && uz[key]) ? uz[key] : enByKey[key]; }
    function applyLang(el) { el.textContent = tr(el.dataset.i18n); }

    var langButtons = $$('[data-lang]');

    function setLanguage(next) {
        lang = next;
        document.documentElement.lang = next;
        i18nEls.forEach(applyLang);
        ariaEls.forEach(function (el) {
            var key = el.dataset.i18nAria;
            el.setAttribute('aria-label', (lang === 'uz' && uz[key]) ? uz[key] : el.dataset.enAria);
        });
        langButtons.forEach(function (btn) {
            var active = btn.dataset.lang === next;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active);
        });
        try { localStorage.setItem('bookOfMeLang', next); } catch (e) {}
    }

    langButtons.forEach(function (btn) {
        btn.addEventListener('click', function () { setLanguage(btn.dataset.lang); });
    });

    var savedLang = 'en';
    try { savedLang = localStorage.getItem('bookOfMeLang') || 'en'; } catch (e) {}
    if (savedLang === 'uz') setLanguage('uz');

    /* ============ 2. MOBILE MENU ============ */
    var menuBtn = $('#menuBtn');
    var navLinks = $('#navLinks');

    function closeMenu() {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
    });
    $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });

    /* ============ 3. STORY DATA ============
       SEQ = the order of the chapters (same as the stars on the map). */
    var SEQ = ['childhood', 'kindergarten', 'school', 'graduation', 'tatu', 'about', 'skills', 'projects', 'journey'];

    var viewOf = { intro: $('#view-intro'), map: $('#view-map') };
    SEQ.forEach(function (id) { viewOf[id] = $('#view-' + id); });

    var allViews = Object.keys(viewOf).map(function (k) { return viewOf[k]; });
    allViews.forEach(function (v) { setView(v, false); });

    // stagger numbers for the text reveal animation
    allViews.forEach(function (v) {
        $$('.reveal', v).forEach(function (el, i) { el.style.setProperty('--i', i); });
    });

    function setView(el, on) {
        el.classList.toggle('is-on', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) el.removeAttribute('inert'); else el.setAttribute('inert', '');
    }

    /* ============ 4. VISITED STARS (remembered in the browser) ============ */
    var visited = {};
    try {
        JSON.parse(localStorage.getItem('bookOfMeSeen') || '[]').forEach(function (id) { visited[id] = true; });
    } catch (e) {}

    var progressBar = $('#progressBar');
    var litCount = $('#litCount');

    function markVisited(id) {
        if (visited[id]) return false;
        visited[id] = true;
        try { localStorage.setItem('bookOfMeSeen', JSON.stringify(Object.keys(visited))); } catch (e) {}
        return true;
    }

    /* ============ 5. THE STAR MAP ============ */
    var sky = $('#sky');
    var svg = $('#skyLines');
    var stars = $$('.star', sky);
    var starById = {};
    stars.forEach(function (s, i) {
        s.style.setProperty('--i', i);
        if (s.dataset.id) starById[s.dataset.id] = s;
    });
    var SVGNS = 'http://www.w3.org/2000/svg';
    var segments = [];
    var portraitQuery = window.matchMedia('(max-aspect-ratio: 1/1)');

    function layoutSky() {
        var portrait = portraitQuery.matches;
        var pts = stars.map(function (s) {
            var x = parseFloat(portrait ? s.dataset.px : s.dataset.lx);
            var y = parseFloat(portrait ? s.dataset.py : s.dataset.ly);
            y = portrait ? 33 + (y - 28) * 0.95 : y + 10;   // keep the stars below the title text
            s.style.left = x + '%';
            s.style.top = y + '%';
            s.dataset.side = portrait ? (x < 50 ? 'left' : 'right') : (y < 50 ? 'top' : 'bottom');
            return [x, y];
        });
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        segments = [];
        for (var i = 0; i < pts.length - 1; i++) {
            var line = document.createElementNS(SVGNS, 'line');
            line.setAttribute('x1', pts[i][0]);     line.setAttribute('y1', pts[i][1]);
            line.setAttribute('x2', pts[i + 1][0]); line.setAttribute('y2', pts[i + 1][1]);
            svg.appendChild(line);
            segments.push(line);
        }
        refreshSky();
    }

    function refreshSky() {
        var count = 0;
        stars.forEach(function (s) {
            var on = !!(s.dataset.id && visited[s.dataset.id]);
            s.classList.toggle('visited', on);
            if (on) count++;
        });
        segments.forEach(function (line, i) {
            var a = stars[i], b = stars[i + 1];
            var lit = a.classList.contains('visited') && b.classList.contains('visited');
            line.classList.toggle('lit', lit);
            line.classList.toggle('faint', a.classList.contains('future') || b.classList.contains('future'));
        });
        litCount.textContent = count;
        progressBar.style.transform = 'scaleX(' + (count / SEQ.length) + ')';
    }

    if (portraitQuery.addEventListener) portraitQuery.addEventListener('change', layoutSky);
    else if (portraitQuery.addListener) portraitQuery.addListener(layoutSky);
    layoutSky();

    // tapping an unwritten star
    var toast = $('#toast');
    var toastTimer = null;
    $$('.star.future', sky).forEach(function (s) {
        s.addEventListener('click', function () {
            toast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
        });
    });

    // camera zoom: the sky grows around the chosen star
    function setOrigin(id) {
        var s = starById[id];
        if (!s) { sky.style.setProperty('--ox', '50%'); sky.style.setProperty('--oy', '50%'); return; }
        sky.style.setProperty('--ox', s.style.left);
        sky.style.setProperty('--oy', s.style.top);
    }
    function silentSky(zoomed) {          // change the zoom state without animating
        sky.style.transition = 'none';
        sky.classList.toggle('zoom', zoomed);
        void sky.offsetWidth;
        sky.style.transition = '';
    }

    /* ============ 6. VIDEOS: only the open view plays, one at a time ============ */
    var soundOn = false;

    function startVideo(view) {
        var video = $('.scene-video', view);
        if (!video || reduceMotion) return;        // reduced motion: the poster picture stays
        if (!video.getAttribute('src') && !video.dataset.failed) {
            video.preload = 'auto';
            video.src = video.dataset.src;
        }
        video.muted = !soundOn;
        var p = video.play();
        if (p && p.catch) p.catch(function () {    // browser blocked sound → play muted
            video.muted = true;
            var q = video.play();
            if (q && q.catch) q.catch(noop);
        });
    }

    function stopVideo(view) {
        var video = $('.scene-video', view);
        if (!video) return;
        video.pause();
        setTimeout(function () {                   // free memory after the fade-out (4 GB RAM friendly)
            if (view.classList.contains('is-on')) return;
            if (video.getAttribute('src')) { video.removeAttribute('src'); video.load(); }
        }, 800);
    }

    $$('.scene-video').forEach(function (video) {
        video.addEventListener('error', function () {   // file missing → keep poster / gradient
            if (!video.getAttribute('src')) return;
            video.dataset.failed = '1';
            video.removeAttribute('src');
        });
    });

    var soundBtn = $('#soundBtn');
    soundBtn.addEventListener('click', function () {
        soundOn = !soundOn;
        soundBtn.classList.toggle('on', soundOn);
        soundBtn.setAttribute('aria-pressed', soundOn);
        var video = $('.scene-video', viewOf[current] || document);
        if (video) {
            video.muted = !soundOn;
            if (video.paused && !reduceMotion) { var p = video.play(); if (p && p.catch) p.catch(noop); }
        }
    });

    /* ============ 7. SPLINE SLOTS ============
       Put a Spline URL in data-spline-url="" on a .spline-slot and the scene
       loads the first time its view opens. Empty = nothing happens. */
    function loadSpline(view) {
        $$('.spline-slot', view).forEach(function (slot) {
            var url = slot.dataset.splineUrl;
            if (!url || slot.dataset.loaded) return;
            slot.dataset.loaded = '1';
            slot.classList.add('is-active');
            var frame = document.createElement('iframe');
            frame.src = url;
            frame.title = '3D scene';
            frame.loading = 'lazy';
            slot.appendChild(frame);
        });
    }

    /* ============ 8. ROUTER: #map, #childhood, #about ... (the Back button works) ============ */
    var current = null;
    var pending = [];                       // delayed steps; run at once if the user moves on quickly
    var body = document.body;
    var chapterNav = $('#chapterNav');
    var cnPrev = $('#cnPrev');
    var cnNext = $('#cnNext');
    var cnNextLabel = $('#cnNextLabel');
    var cnCount = $('#cnCount');
    var menuLinks = $$('a', navLinks);

    function later(ms, fn) {
        var item = { fn: fn, done: false };
        item.t = setTimeout(function () { item.done = true; fn(); }, ms);
        pending.push(item);
    }
    function flushPending() {
        pending.forEach(function (item) {
            if (item.done) return;
            clearTimeout(item.t);
            item.done = true;
            item.fn();
        });
        pending = [];
    }

    function swap(from, to) {
        if (from) { setView(viewOf[from], false); stopVideo(viewOf[from]); }
        var el = viewOf[to];
        setView(el, true);
        el.scrollTop = 0;
        startVideo(el);
        loadSpline(el);
        try { el.focus({ preventScroll: true }); } catch (e) {}
    }

    function show(id) {
        if (id === current) return;
        flushPending();
        var prev = current;
        current = id;

        var isChapter = SEQ.indexOf(id) > -1;
        var wasChapter = !!prev && SEQ.indexOf(prev) > -1;
        body.dataset.view = isChapter ? 'chapter' : id;
        viewOf.map.classList.toggle('fresh', !wasChapter);

        var newlyLit = isChapter ? markVisited(id) : false;
        if (isChapter) refreshSky();

        if (!reduceMotion && prev === 'map' && isChapter) {
            // fly into the star, then show the chapter
            setOrigin(id);
            sky.classList.add('zoom');
            later(380, function () { swap(prev, id); });
            later(1200, function () { silentSky(false); });
        } else if (!reduceMotion && wasChapter && id === 'map') {
            // fly back out from the star we just left
            setOrigin(prev);
            silentSky(true);
            swap(prev, id);
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { sky.classList.remove('zoom'); });
            });
            var popStar = starById[prev];
            if (popStar && wasNewlyLit(prev)) {
                popStar.classList.add('pop');
                later(1800, function () { popStar.classList.remove('pop'); });
            }
        } else {
            silentSky(false);
            swap(prev, id);
        }
        if (newlyLit) litNow[id] = true; else if (isChapter && !litNow[id]) litNow[id] = false;

        // menu highlight
        menuLinks.forEach(function (a) {
            var group = (a.dataset['for'] || a.getAttribute('href').slice(1)).split(' ');
            a.classList.toggle('active', group.indexOf(id) > -1);
        });

        // chapter controls
        if (isChapter) {
            var i = SEQ.indexOf(id);
            cnCount.textContent = (i + 1) + ' / ' + SEQ.length;
            cnPrev.classList.toggle('is-hidden', i === 0);
            cnPrev.setAttribute('href', i === 0 ? '#map' : '#' + SEQ[i - 1]);
            var last = i === SEQ.length - 1;
            cnNext.setAttribute('href', last ? '#map' : '#' + SEQ[i + 1]);
            cnNextLabel.dataset.i18n = last ? 'to_map' : 'next';
            applyLang(cnNextLabel);
        }
    }

    // remembers which chapters were opened for the first time in this visit (for the "pop" on the map)
    var litNow = {};
    function wasNewlyLit(id) {
        var r = litNow[id] === true;
        litNow[id] = false;
        return r;
    }

    function route() {
        var id = location.hash.replace('#', '');
        if (!viewOf[id]) id = 'intro';
        show(id);
    }
    window.addEventListener('hashchange', route);

    function go(step) {                   // step = +1 / -1 between chapters
        var i = SEQ.indexOf(current);
        if (i < 0) return;
        var n = i + step;
        if (n < 0) return;
        location.hash = (n >= SEQ.length) ? '#map' : '#' + SEQ[n];
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (navLinks.classList.contains('open')) { closeMenu(); return; }
            if (SEQ.indexOf(current) > -1) location.hash = '#map';
            return;
        }
        if (SEQ.indexOf(current) < 0) return;
        if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
    });

    // swipe left / right on a phone
    var tx = 0, ty = 0;
    $('#app').addEventListener('touchstart', function (e) {
        tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    $('#app').addEventListener('touchend', function (e) {
        if (SEQ.indexOf(current) < 0) return;
        var dx = e.changedTouches[0].clientX - tx;
        var dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 60) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    // first screen (wait one frame so the opening animation plays)
    requestAnimationFrame(function () { requestAnimationFrame(route); });
})();

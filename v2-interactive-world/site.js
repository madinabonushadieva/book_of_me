/* Portfolio page logic: language, menu, filled lists, opening / closing the world. */
(function () {
    'use strict';
    var B = window.BOOK;
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    /* ---- real links (single source: content.js) ---- */
    $$('[data-link]').forEach(function (a) { a.href = B.LINKS[a.dataset.link]; });

    /* ---- lists built from content.js ---- */
    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
    function renderLists() {
        var sg = $('#skillGroups');
        sg.textContent = '';
        B.SKILLS.forEach(function (g) {
            var box = el('div');
            box.appendChild(el('h3', 'list-title', B.t(g.key)));
            var ul = el('ul', 'list');
            g.items.forEach(function (it) { ul.appendChild(el('li', null, B.item(it))); });
            box.appendChild(ul);
            sg.appendChild(box);
        });

        var pl = $('#projectList');
        pl.textContent = '';
        B.PROJECTS.forEach(function (p, i) {
            var art = el('article', 'project');
            art.appendChild(el('span', 'project-no', '0' + (i + 1)));
            var d = el('div');
            var h = el('h3', null, p.name);
            if (p.badgeKey) h.appendChild(el('span', 'badge', B.t(p.badgeKey)));
            d.appendChild(h);
            d.appendChild(el('p', null, B.t(p.descKey)));
            art.appendChild(d);
            pl.appendChild(art);
        });
    }

    /* ---- language ---- */
    function applyLang() {
        $$('[data-i18n]').forEach(function (e) { e.textContent = B.t(e.dataset.i18n); });
        $$('[data-lang]').forEach(function (b) {
            var on = b.dataset.lang === B.lang;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on);
        });
        renderLists();
    }
    $$('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { B.setLang(b.dataset.lang); }); });
    B.onLang(applyLang);
    applyLang();
    document.documentElement.lang = B.lang;

    /* ---- menu ---- */
    var menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
    function closeMenu() { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    menuBtn.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
    });
    $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });

    /* ---- active link while scrolling ---- */
    var links = {};
    $$('a', navLinks).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                Object.keys(links).forEach(function (id) { links[id].classList.remove('active'); });
                if (links[en.target.id]) links[en.target.id].classList.add('active');
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        $$('main > section[id]').forEach(function (s) { io.observe(s); });
    }

    /* ---- the world: open with #world (Back button works) ---- */
    var worldEl = $('#world');
    var openedByClick = false;

    function syncWorld() {
        var want = location.hash === '#world';
        if (want && worldEl.hidden) {
            document.body.classList.add('world-open');
            window.World.open();
        } else if (!want && !worldEl.hidden) {
            document.body.classList.remove('world-open');
            window.World.close();
        }
    }
    window.addEventListener('hashchange', syncWorld);

    $$('[data-explore]').forEach(function (b) {
        b.addEventListener('click', function () { openedByClick = true; location.hash = '#world'; closeMenu(); });
    });
    window.World.onExit = function () {          // "Back to portfolio" inside the world
        if (openedByClick && location.hash === '#world') history.back();
        else location.hash = '#about';
        openedByClick = false;
    };
    syncWorld();
})();

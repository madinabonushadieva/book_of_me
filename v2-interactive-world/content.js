/* ============ CONTENT (one place for every text, EN + UZ) ============
   Both the portfolio page and the isometric world read from here.
   To change a text: edit it here once and it changes everywhere.
   Only facts you gave are used. Do not add links you do not have. */
(function () {
    'use strict';

    var LINKS = {
        github: 'https://github.com/madinabonushadieva',
        linkedin: 'https://www.linkedin.com/in/madinabonu-shadieva-617557445/'
    };

    /* Skills. Items starting with "@" are translated keys. No levels, no percentages. */
    var SKILLS = [
        { id: 'front', key: 'sg_front', items: ['HTML', 'CSS', 'JavaScript'] },
        { id: 'back',  key: 'sg_back',  items: ['Node.js', 'NestJS'] },
        { id: 'db',    key: 'sg_db',    items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Oracle Database'] },
        { id: 'lang',  key: 'sg_lang',  items: ['C', 'C++', 'Python'] },
        { id: 'other', key: 'sg_other', items: ['@sk_git', '@sk_net', 'Cisco Packet Tracer', 'Arduino', 'Blender'] },
        { id: 'next',  key: 'sg_next',  items: ['React'] }
    ];

    /* Projects. Add "repo" / "demo" ONLY when you have a real, working URL. */
    var PROJECTS = [
        { id: 'uzchess', name: 'UzChess',   descKey: 'proj1_desc' },
        { id: 'kids',    name: 'Smart Kids', descKey: 'proj2_desc' },
        { id: 'doctor',  name: 'DoctorUZ',  descKey: 'proj3_desc', badgeKey: 'badge_concept' }
    ];

    var STORY = [
        { id: 'childhood',    key: 'sc1_t' },
        { id: 'kindergarten', key: 'sc2_t' },
        { id: 'school',       key: 'sc3_t' },
        { id: 'graduation',   key: 'sc4_t' },
        { id: 'tatu',         raw: 'TATU' }
    ];

    var I18N = {
        en: {
            nav_about: 'About', nav_skills: 'Skills', nav_projects: 'Projects', nav_edu: 'Education', nav_contact: 'Contact',
            explore: 'Explore My World',
            hero_eyebrow: 'Computer Engineering student · TATU',
            hero_sub: 'I am learning to program, and I learn best by building practical projects. I am interested in frontend, backend and game development.',
            hero_cta2: 'View projects',
            hero_hint: 'Optional: everything is also in the portfolio below. The world is a creative way to explore it.',

            about_title: 'Hello, I’m Madinabonu.',
            about_p1: 'I am a Computer Engineering student at Tashkent University of Information Technologies (TATU). I am learning to program, and I learn best by working on practical projects.',
            about_p2: 'I am interested in frontend, backend and game development. I also have a foundation in computer networks and network protocols, and I have worked with Arduino and Cisco Packet Tracer. I am still building my skills and learning new technologies.',
            fact_uni: 'University', fact_field: 'Field', fact_field_v: 'Computer Engineering',

            skills_title: 'Skills & Knowledge',
            skills_note: 'I know these to different degrees. The list shows what I work with, not a ranking.',
            sg_front: 'Frontend', sg_back: 'Backend', sg_db: 'Databases', sg_lang: 'Programming languages',
            sg_other: 'Other technical skills', sg_next: 'Next to Learn',
            sk_git: 'Working with Git and GitHub', sk_net: 'Computer networks and network protocols',
            sk_next_p: 'I plan to learn React next.',
            sl_lang: 'Languages', sl_other: 'Other skills',

            projects_title: 'Projects',
            projects_note: 'Projects I have worked on and ideas I am exploring.',
            proj1_desc: 'A chess project for Uzbek-language users. My work on it focused on the backend.',
            proj2_desc: 'A website with educational activities and games for children.',
            proj3_desc: 'A project idea related to medical services.',
            badge_concept: 'Concept',

            edu_title: 'Education',
            edu1_t: 'Tashkent University of Information Technologies (TATU)',
            edu1_d: 'Computer Engineering. Currently studying.',
            edu2_t: 'Full Stack Web Development bootcamp',
            edu2_d: 'Currently enrolled.',

            contact_title: 'Contact',
            contact_p: 'You can find me on GitHub and LinkedIn.',
            link_github: 'GitHub Profile', link_linkedin: 'LinkedIn Profile',
            footer: 'The Book of Me — a story in progress.',

            /* world */
            w_back: 'Back to portfolio', w_places: 'Places', w_close: 'Close', w_help: 'Controls',
            w_controls: 'Move: WASD / arrows · Interact: E / Enter · Back: Esc',
            w_intro_t: 'Welcome to my world',
            w_intro_p: 'Walk between the floating islands to find my story, skills and projects. Stand next to an object and press E. You do not have to play: everything is also in the portfolio.',
            w_start: 'Start exploring',
            w_open: 'Open',
            w_book_p: 'This is a small world built from my story: a book, a galaxy and a few floating islands. Visit the islands to see my skills, projects and education. Visiting is optional: everything is also in the portfolio.',
            w_story_p: 'A moment from my story.',
            w_future_p: 'The next chapters are not written yet.',
            chapter: 'Chapter',
            pl_hub: 'The Magic Book', pl_about: 'About House', pl_skills: 'Skills Island', pl_projects: 'Projects Island',
            pl_edu: 'Education Island', pl_contact: 'Contact Island', pl_story: 'Story Island', pl_future: 'The Unwritten Island',
            book_t: 'The Book of Me',
            kiosk_t: 'Bootcamp',
            beacon_t: 'Contact',
            future_t: 'To be continued...',

            sc1_t: 'Childhood', sc2_t: 'Kindergarten', sc3_t: 'School', sc4_t: 'Graduation'
        },

        uz: {
            nav_about: 'Men haqimda', nav_skills: 'Ko‘nikmalar', nav_projects: 'Loyihalar', nav_edu: 'Ta’lim', nav_contact: 'Aloqa',
            explore: 'Mening dunyomni kashf etish',
            hero_eyebrow: 'Computer Engineering talabasi · TATU',
            hero_sub: 'Dasturlashni o‘rganyapman va amaliy loyihalar yaratish orqali eng yaxshi o‘rganaman. Frontend, backend va o‘yin ishlab chiqishga qiziqaman.',
            hero_cta2: 'Loyihalarni ko‘rish',
            hero_hint: 'Ixtiyoriy: kerakli hamma ma’lumot quyidagi portfolioda ham bor. Dunyo uni ijodiy tarzda kashf etish usuli.',

            about_title: 'Salom, men Madinabonuman.',
            about_p1: 'Men Toshkent axborot texnologiyalari universiteti (TATU) Computer Engineering yo‘nalishi talabasiman. Dasturlashni o‘rganyapman va amaliy loyihalar ustida ishlaganda eng yaxshi o‘rganaman.',
            about_p2: 'Frontend, backend va o‘yin (GameDev) yo‘nalishlariga qiziqaman. Kompyuter tarmoqlari va tarmoq protokollaridan ham bilimim bor, Arduino va Cisco Packet Tracer bilan ishlaganman. Ko‘nikmalarimni hali rivojlantiryapman va yangi texnologiyalarni o‘rganyapman.',
            fact_uni: 'Universitet', fact_field: 'Yo‘nalish', fact_field_v: 'Computer Engineering',

            skills_title: 'Ko‘nikmalar va bilimlar',
            skills_note: 'Bu texnologiyalarni turli darajada bilaman. Ro‘yxat nimalar bilan ishlashimni ko‘rsatadi, reyting emas.',
            sg_front: 'Frontend', sg_back: 'Backend', sg_db: 'Ma’lumotlar bazalari', sg_lang: 'Dasturlash tillari',
            sg_other: 'Boshqa texnik ko‘nikmalar', sg_next: 'Keyingi o‘rganish rejam',
            sk_git: 'Git va GitHub bilan ishlash', sk_net: 'Kompyuter tarmoqlari va tarmoq protokollari',
            sk_next_p: 'Keyingi rejam: React’ni o‘rganish.',
            sl_lang: 'Tillar', sl_other: 'Boshqa ko‘nikmalar',

            projects_title: 'Loyihalar',
            projects_note: 'Ustida ishlagan loyihalarim va o‘rganayotgan g‘oyalarim.',
            proj1_desc: 'O‘zbek tilidagi foydalanuvchilar uchun shaxmat loyihasi. Men asosan backend qismi ustida ishlaganman.',
            proj2_desc: 'Bolalar uchun ta’limiy faoliyatlar va o‘yinlar joylashgan sayt.',
            proj3_desc: 'Tibbiy xizmatlar bilan bog‘liq loyiha g‘oyasi.',
            badge_concept: 'Konsepsiya',

            edu_title: 'Ta’lim',
            edu1_t: 'Toshkent axborot texnologiyalari universiteti (TATU)',
            edu1_d: 'Computer Engineering yo‘nalishi. Hozir o‘qiyapman.',
            edu2_t: 'Full Stack web dasturlash bootcamp',
            edu2_d: 'Hozir o‘qiyapman.',

            contact_title: 'Aloqa',
            contact_p: 'Meni GitHub va LinkedIn’da topishingiz mumkin.',
            link_github: 'GitHub profili', link_linkedin: 'LinkedIn profili',
            footer: 'The Book of Me — davom etayotgan hikoya.',

            w_back: 'Portfolioga qaytish', w_places: 'Joylar', w_close: 'Yopish', w_help: 'Boshqaruv',
            w_controls: 'Harakat: WASD / strelkalar · Ochish: E / Enter · Orqaga: Esc',
            w_intro_t: 'Mening dunyomga xush kelibsiz',
            w_intro_p: 'Suzib yuruvchi orollar bo‘ylab yurib, hikoyam, ko‘nikmalarim va loyihalarimni toping. Obyekt yoniga kelib E tugmasini bosing. O‘ynash majburiy emas: hamma narsa portfolioda ham bor.',
            w_start: 'Kashf etishni boshlash',
            w_open: 'Ochish',
            w_book_p: 'Bu mening hikoyamdan qurilgan kichik dunyo: kitob, galaktika va bir nechta suzuvchi orol. Orollarga kirib, ko‘nikmalarim, loyihalarim va ta’limimni ko‘ring. Kirish ixtiyoriy: hamma narsa portfolioda ham bor.',
            w_story_p: 'Hikoyamdan bir lavha.',
            w_future_p: 'Keyingi boblar hali yozilmagan.',
            chapter: 'Bob',
            pl_hub: 'Sehrli kitob', pl_about: 'Men haqimda uyi', pl_skills: 'Ko‘nikmalar oroli', pl_projects: 'Loyihalar oroli',
            pl_edu: 'Ta’lim oroli', pl_contact: 'Aloqa oroli', pl_story: 'Hikoya oroli', pl_future: 'Yozilmagan orol',
            book_t: 'The Book of Me',
            kiosk_t: 'Bootcamp',
            beacon_t: 'Aloqa',
            future_t: 'Davom etadi...',

            sc1_t: 'Bolalik', sc2_t: 'Bog‘cha', sc3_t: 'Maktab', sc4_t: 'Bitiruv'
        }
    };

    var lang = 'en';
    var listeners = [];
    try { lang = localStorage.getItem('bookOfMeV2Lang') || 'en'; } catch (e) {}
    if (!I18N[lang]) lang = 'en';

    window.BOOK = {
        LINKS: LINKS, SKILLS: SKILLS, PROJECTS: PROJECTS, STORY: STORY, I18N: I18N,
        get lang() { return lang; },
        t: function (key) {
            var d = I18N[lang];
            return (d && d[key] != null) ? d[key] : (I18N.en[key] != null ? I18N.en[key] : key);
        },
        item: function (s) { return s.charAt(0) === '@' ? window.BOOK.t(s.slice(1)) : s; },
        setLang: function (l) {
            if (!I18N[l]) return;
            lang = l;
            try { localStorage.setItem('bookOfMeV2Lang', l); } catch (e) {}
            document.documentElement.lang = l;
            listeners.forEach(function (fn) { fn(l); });
        },
        onLang: function (fn) { listeners.push(fn); }
    };
})();

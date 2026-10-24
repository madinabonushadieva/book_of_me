# The Book of Me — ikki mustaqil versiya

```
book_of_me_versions/
├── index.html                  ← versiyani tanlash sahifasi (ustozga ko'rsatish uchun shu yerdan boshlang)
├── README.md                   ← shu yo'riqnoma
├── v1-original/                ← 1-VERSIYA: avvalgi portfolio, HECH QANDAY O'ZGARTIRISH YO'Q
│   ├── index.html, style.css, script.js
│   └── assets/ (videos, posters)
├── v1-original.sha256          ← v1 fayllarining nazorat yig'indilari (o'zgarmaganini tekshirish uchun)
└── v2-interactive-world/       ← 2-VERSIYA: portfolio + izometrik dunyo (yangi)
    ├── index.html              portfolio sahifasi + dunyo oynasi
    ├── style.css               portfolio dizayni
    ├── world.css               dunyo (o'yin) interfeysi
    ├── content.js              BARCHA matnlar (EN/UZ), havolalar, ko'nikmalar, loyihalar — bitta joyda
    ├── site.js                 portfolio mantig'i (til, menyu, dunyoni ochish/yopish)
    ├── world.js                izometrik dvigatel (canvas), personaj, orollar, oynalar
    └── assets/ (videos, posters)  ← hikoya orolidagi suratlar va videolar
```

Ikkala versiya bir-biriga bog'liq emas: har birining o'z fayllari va o'z `assets/` papkasi bor.
Faqat bittasini yuborsangiz ham ishlaydi.

## MUHIM: videolarni joyiga qo'yish (ZIP ikki qismga bo'lingan)

Fayl hajmi katta bo'lgani uchun videolar alohida arxivda (`book_of_me_videos.zip`) yuborildi.
Videolarning o'zi sizning mavjud videolaringiz (o'zgartirilmagan).

1. `book_of_me_code.zip` ni oching (papka: `book_of_me_versions`).
2. `book_of_me_videos.zip` ni oching: ichida `videos` papkasi bor (7 ta mp4).
3. Shu `videos` papkani ikki joyga nusxalang:
   - `book_of_me_versions/v1-original/assets/`  (ichida `videos` degan papka paydo bo'lishi kerak)
   - `book_of_me_versions/v2-interactive-world/assets/`
   (Eski `ai_project/assets/videos` papkangizdan ham nusxalashingiz mumkin, ular bir xil.)

Videolarsiz ham ikkala sayt ochiladi, faqat video o'rniga rasm (poster) ko'rinadi.

## Qanday ochish

1. ZIP ni oching.
2. `book_of_me_versions/index.html` ni brauzerda oching (ikki marta bosing). U yerdan istalgan versiyani tanlang.
   Yoki to'g'ridan-to'g'ri `v1-original/index.html` / `v2-interactive-world/index.html` ni oching.
3. Agar brauzer videoni ko'rsatmasa (ba'zan fayldan ochganda cheklov bo'ladi), shu papkada terminalda:
   `python -m http.server 8000` va brauzerda `http://localhost:8000` ni oching.

Hech narsa o'rnatish shart emas (framework, npm, kutubxona yo'q). Faqat HTML, CSS va oddiy JavaScript.

## Ikki versiyani qanday ajratish mumkin

| | 1-versiya (Original) | 2-versiya (Interactive World) |
|---|---|---|
| Sarlavha (tab) | The Book of Me | The Book of Me — Interactive World |
| Birinchi ekran | Galaktika, intro videosi, "Open the book" | Oddiy portfolio sahifasi (Madinabonu), suzuvchi orol rasmi |
| Navigatsiya | Yulduzlar xaritasi: har yulduz — bitta bob | Oddiy menyu: About, Skills, Projects, Education, Contact |
| Asosiy g'oya | Hikoya sifatida kinematik tajriba | Professional portfolio + ixtiyoriy o'yin dunyosi |
| O'yin | yo'q | "Explore My World" tugmasi — izometrik dunyo |

## 2-versiyada nima bor

**Portfolio sahifasi** (o'yinsiz ham to'liq): About, Skills, Projects, Education, Contact, GitHub va LinkedIn tugmalari, EN/UZ.

**Explore My World** (izometrik 2.5D dunyo):
- 8 ta suzuvchi orol, ko'priklar bilan bog'langan: Sehrli kitob (markaz), About uyi, Skills oroli (har guruh uchun kristall, React uchun ko'chat), Projects oroli (UzChess, Smart Kids, DoctorUZ), Education oroli (TATU, Bootcamp), Contact oroli (GitHub va LinkedIn), Story oroli (5 ta hikoya kadri, videolar), Yozilmagan orol ("Davom etadi...").
- Boshqaruv: **WASD yoki strelkalar** — yurish; **E yoki Enter** — obyektni ochish; **Esc** — portfolioga qaytish.
- Telefonda: chap pastda joystick, o'ngda "E" tugmasi (yoki yozuvni bosing).
- Yuqoridagi **Places** ro'yxati orqali istalgan orolga bir bosishda o'tish mumkin (o'yinni yurib o'ynash shart emas).
- **Back to portfolio** tugmasi, brauzerning Back tugmasi yoki Esc portfolioga qaytaradi.
- Til (EN/UZ) dunyo ichida ham almashadi.

## Ustozga ko'rsatish tartibi (taklif)

1. `book_of_me_versions/index.html` ni oching — ikkita versiyani ko'rsating.
2. **1-versiya**: intro, yulduzlar xaritasi, bir-ikki bob.
3. **2-versiya**: portfolio sahifasini aylantiring (About → Skills → Projects → Education → Contact).
4. "Explore My World" ni bosing: kitob yonida E ni bosing, WASD bilan boshqa orolga o'ting, Projects va Story orollaridagi obyektlarni oching.
5. UZ tugmasini bosib tilni almashtiring. Esc bilan qaytib chiqing.

## Qaysi ma'lumot sizniki (to'ldirishingiz kerak)

Kodga faqat siz bergan ma'lumotlar yozilgan. Quyidagilar yo'q, shuning uchun ko'rsatilmagan:
- UzChess, Smart Kids, DoctorUZ uchun repository va demo havolalari. Bo'lsa `v2-interactive-world/content.js` dagi `PROJECTS` ga `repo` / `demo` qo'shing (hozir ular uchun tugma yo'q, faqat umumiy GitHub profil tugmasi bor).
- Loyihalarning holat belgilari (`In Development`, `Prototype`): faqat DoctorUZ da `Concept` belgisi bor, chunki uni g'oya deb aytgansiz.
- Rasm, email yoki telefon.
- "Education" bo'limida faqat TATU (Computer Engineering) va Full Stack web dasturlash bootcamp yozilgan (oldingi suhbatlaringizdan). Bootcamp kerak bo'lmasa `content.js` dan `edu2_t` / `edu2_d` ni va `index.html` dagi ikkinchi `<li>` ni olib tashlang.

Matnni o'zgartirish: `v2-interactive-world/content.js` dagi tegishli `en` va `uz` qatorini tahrirlang, hamma joyda (portfolio va dunyoda) o'zgaradi.

## Texnik eslatmalar

- Dunyo faqat `<canvas>` bilan chiziladi (kutubxona yo'q). Orollar bir marta rasmga chiziladi va keyin faqat yuqoriga-pastga siljitiladi, shuning uchun 4 GB RAMli kompyuterda ham yengil ishlaydi. Bir vaqtda faqat bitta video ochiladi va yopilganda xotiradan olib tashlanadi.
- Dunyo faqat "Explore My World" bosilganda ishga tushadi. Portfolio sahifasi uni yuklamaydi.
- Brauzer tabi yashirilsa, o'yin avtomatik to'xtaydi.
- 1-versiya fayllari o'zgarmaganini tekshirish: `v1-original.sha256` dagi yig'indilar `v1-original/` fayllariniki bilan bir xil.

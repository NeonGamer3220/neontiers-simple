// Docs content, split into sections. Each entry in a *_SECTIONS array is
// a self-contained { title, body } block rendered as its own boxed card
// on the Dokumentumok page — add, remove, or edit a section by editing
// (or adding/removing) one object in the array below. `body` supports the
// same lightweight markdown as before (###, tables, **bold**, `code`,
// •/- bullet lists).

export const MODERN_RULES_TITLE = "📜 NeonTiers - Szabályzat & Útmutató";

export const MODERN_RULES_SECTIONS = [
  {
    title: "🛠️ 1. Modok és Kiegészítők",
    body: `
• **Engedélyezett:** Low fire, Consumable Optimizer, shield status mod, és minden olyan mod ami nem ad előnyt / nem automatizálja a játékmenetet.
• **Tiltott:** Mouse tweaks, Dura pack, Tweakaroo, Walksy/Marlow's Crystal Optimizer, Fire Client, Hack kliensek, pinget befolyásoló modok, Multi Keybinds, Health indicator, más kitett/plusz dolgok CPVP-ben.
`.trim(),
  },
  {
    title: "⚖️ 2. Tierlist Bannok & Büntetések",
    body: `
| Szabályszegés | Büntetés |
|---|---|
| Csalás / Tiltott mod | 1 hónap |
| Account sharing | 2 hónap mindkét félnek |
| Alt tesztelés | 1 hónap (alt törölve, eredeti ban) |
| Boostolás / Megegyezés | 1 hónap (+ gamemode tier wipe) |
| SS megtagadása | 1 hónap |
| Handcam megtagadása | 1 hónap (+ gamemode tier wipe) |
| Eredmény / videó hamisítás | 1 hónap |
| Staff megtévesztése | 1 hónap |
| Toxicitás / zaklatás | 14 nap |
| Sandbagging | 1 hónap |
| Megvesztegetés / Összejátszás | 2-3 hónap (mindkét félnek) |
`.trim(),
  },
  {
    title: "⚔️ 3. Teszt Közbeni Szabályzat",
    body: `
• Nincs időhúzás / menekülés.
• Mendelés / bújás / textúraváltás max 2 perc, utána a kör az ellenfélé (clip kell).
• Időkérés / shiftelés: állj meg, redó kérhető ha nem áll meg (clip kell).
• Lagg / DC: ha ledob a szerver, az ellenfélé a kör.
• Kifagyás: 1 hit elnézhető, többnél redó kérhető.
• Free hit tilos a kör elején.
• FFA szervereken harmadik fél beleszólásakor: újrakezdés.
• SpearMaceben tilos groundozni, ha kifogytok mindketten mindenből a kört újra kell kezdeni (ha volt totem vesztés, az a játékos a megfelelő mennyiséggel kezdjen.)
`.trim(),
  },
  {
    title: "🔄 4. Újratesztelés & Új Név",
    body: `
• Újratesztelés 14 naponta lehetséges. Első teszten max LT3.
• **Névváltás:** 1. Discordon: \`/unlink\` majd \`/link\`
  2. A kapott kódot 10 percen belül beírni a \`chaosffa.kinetic.host\` szerveren a \`/link [kód]\` paranccsal.
`.trim(),
  },
  {
    title: "📊 5. Gamemód Követelmények (LT3 alatt)",
    body: `
| Gamemód | LT3 felett | LT3 alatt |
|---|---|---|
| Vanilla / SMP / Cart | FT4 | FT3 |
| DiaSMP / OGV / NethPot / Mace / SpearMace / SpearElytra / Trident | FT4 | FT2 |
| Sword / Uhc / Pot / Creeper / ShieldlessUHC | FT10 | FT6 |
| Axe | FT20 | FT10 |
`.trim(),
  },
  {
    title: "🟣 6. UnRetire & Retired Rendszer",
    body: `
• **UnRetire:** Indulás a retire tierből. 75% winrate kell az azonos tierű ellen, ha nem sikerül, lefelé haladva HT3-ig. Ha ott sem, maradhat a retire vagy megy sima eval tesztre.
• **Retired feltételek:** Min. LT2 rang. 2 defenset kell szerezni saját tieredbeli vagy feljebb pályázó játékos legyőzésével (75% winrate). Az elmúlt 2 hónapban nem lehetett magasabb tier próbálkozásod.
• **Időtartamok:**
  - LT2 / HT2: 2 védelem + 40+ nap
  - LT1: 2 védelem + 60+ nap
  - HT1: 3 védelem + 90+ nap
`.trim(),
  },
  {
    title: "🏆 7. Eredmény Alapú Tier Besorolások",
    body: `
*(Ha a tesztered nagyobb tier, mint az LT3, a teszterek eltérhetnek ezektől).*
### • Vanilla / DiaSMP / OGV / NethPot / Mace / SpearMace / SpearElytra / Trident
| Gamemód | Eredmény | Kapott tier |
|---|---|---|
| Vanilla | 3-0, 3-1 | LT5, HT5, LT4 |
| Vanilla | 3-2 | HT4, LT3 |
| DiaSMP / OGV / NethPot / Mace | 2-0 | LT5, HT5, LT4 |
| DiaSMP / OGV / NethPot / Mace | 2-1 | LT4, HT4, LT3 |
| DiaSMP / OGV / NethPot / Mace | 3-2 | HT4, LT3 |
| SMP / Cart | 2-0 | LT5, HT5, LT4 |
| SMP / Cart | 3-1 | HT5, LT4 |
| SMP / Cart | 3-2 | HT4, LT3 |

*(Ha nyersz eval pass: LT3)*

### • Sword / Uhc / Pot / ShieldlessUHC / Creeper
| Eredmény | Kapott tier |
|---|---|
| 6-0 | LT5, HT5 |
| 6-1, 6-2 | HT5, LT4 |
| 6-3, 6-4 | HT4, LT3 |
| 6-5 | LT3 |

*(Ha nyersz eval pass: LT3)*

### • Axe
| Eredmény | Kapott tier |
|---|---|
| 10-0, 10-1, 10-2, 10-3 | LT5, HT5 |
| 10-4, 10-5, 10-6 | LT4, HT4 |
| 10-7, 10-8 | LT4, HT4, LT3 |
| 10-9, 9-10 | LT3 |

*(Ha nyersz eval pass: LT3)*
`.trim(),
  },
  {
    title: "🛠️ 8. Magas tesztek (LT3 és fölötte)",
    body: `
**Feltételek**
  - A játékosnak előzetesen meg kell felelnie a tesztelés feltételeinek, vagyis el kell érnie az LT3 tiert, mielőtt magasabb szintre léphet.
  - Az ellenfelet véletlenszerű sorsolás választja ki.
  - A kisorsolt teszternek 48 óra áll rendelkezésére a teszt lebonyolítására. Indokolt esetben további idő engedélyezhető.
  - A tesztek egy hét inaktivitás után automatikusan lezáródnak.
  
**Sikeres teszt**
  - A teszt akkor sikeres, ha a játékos legalább 7 kört nyer az ellenfele ellen. Példa: a 10:7 vagy jobb eredménnyel a játékos megkapja a nagyobb rangot, a 10:6 viszont már nem elegendő.

**Jogosultság magasabb tierre**
  - A játékos csak akkor mehet nagyobb tierű ellenfél ellen, ha tiergappeli a vele azonos szinten lévő ellenfelét, tehát az ellenfele nem nyeri meg ellene a körök 75%-át.
  | Formátum | Elegendő a továbbjutáshoz | Nem elengedő a továbbjutáshoz |
  |---|---|---|
  | FT4 | 4:2 | 4:3 |
  | FT10 | 10:6 | 10:7 |

**Kitspecifikus Szabályok**
  | Formátum | Érintett Kitek | Szabály |
  |---|---|---|
  | FT4 | Vanilla, SMP, NethPot, Cart, DiaSMP | A 4:3 vereség is elegendő ahhoz a tierhez, amiért harcoltál. A tiert megkapod, de tovább nem mehetsz. |
  | FT10 | Sword, Pot | A 10:7 vereség is elegendő a tierhez. A tiert megkapod, de tovább nem mehetsz. |
  | FT20 | Axe | A 20:16 elegendő, a 20:15 már nem. |

**Demote**
Demote-nak számít, ha a játékos nem nyeri meg a körök 25%-át. Rosszabb tierbe kerülhet, akinek nincs meg a minimum, vagy aki ezek alatt teljesít:
| Formátum | Minimum a demote elkerüléséhez |
|---|---|
| FT4 | 4:1 |
| FT10 | 10:3 |
| FT20 | 20:7 |
Példa: HT3 vs HT3 mérkőzésen 4:0 az eredmény, majd a továbbjutó játékos LT2 ellen veszít. Ilyenkor a korábbi ellenfele egy tierrel rosszabb helyre kerül.
`.trim(),
  },
];

export const LEGACY_RULES_TITLE = "📖 Tier Teszt Szabályok";

export const LEGACY_RULES_SECTIONS = [
  {
    title: "✅ Engedélyezett Módosítások",
    body: `
Olyan kliensmódosítások, amelyek kizárólag kozmetikai vagy teljesítménybeli előnyt nyújtanak, de nem biztosítanak tisztességtelen előnyt:
• Kozmetikai texture packok (pl. alacsony/kikapcsolt tűz, kisebb totem animáció, block overlayek)
• HUD modok, amelyek csak a saját adataidat jelenítik meg (Páncél, Effektek, Életerő, Telítettség, Tartósság, Totem számláló)
• Teljesítménynövelő modok (FPS boosterek, Marlow's & Hero's Optimizers)
• Kozmetikai modok (Köpenyek, Célkeresztek)
• ExitLag vagy VPN kizárólag jobb útvonalválasztásra (szükség esetén bizonyítani kell)
`.trim(),
  },
  {
    title: "❌ Tiltott Módosítások",
    body: `
Minden olyan mod vagy eszköz, amely befolyásolja a játékmenetet vagy tisztességtelen előnyt biztosít:
• Hack/Cheat kliensek (pl. Ghast, Snaptap, Optimal Aim)
• X-Ray texture packok
• Makrók, Auto-Clickerek, Automatizált bemenetek
• Mouse Tweaks, Item Scroller, Tweakaroo, Registry módosítások (Regedits)
• Mozgást vagy elérési távolságot (Reach) módosító modok
• Privát modok, amelyek bármilyen előnyt biztosítanak (nem nyilvánosan elérhetők)
• Inventory Movement, Auto Totem vagy blokklerakást módosító funkciók
• Ellenfél-információt megjelenítő modok (ESP, Radar, Páncél/Életerő/Telítettség kijelzése)
• Double-bind modok (kivéve, ha az egér szoftvere igényli)
• Olyan eszközök, amelyek mesterségesen befolyásolják a kapcsolatot vagy meghamisítják a pinget
`.trim(),
  },
  {
    title: "Teszt Közbeni Szabályzat",
    body: `
• Nincs időhúzás / menekülés.
• Mendelés / bújás / textúraváltás max 2 perc, utána a kör az ellenfélé (clip kell).
• Időkérés / shiftelés: állj meg, redó kérhető ha nem áll meg (clip kell).
• Lagg / DC: ha ledob a szerver, az ellenfélé a kör.
• Kifagyás: 1 hit elnézhető, többnél redó kérhető.
• Free hit tilos a kör elején.
• FFA szervereken harmadik fél beleszólásakor: újrakezdés.
`.trim(),
  },
  {
    title: "🔄 4. Újratesztelés & Új Név",
    body: `
• Újratesztelés 14 naponta lehetséges. Első teszten max LT3.
• **Névváltás:** 1. Discordon: \`/unlink\` majd \`/link\`
  2. A kapott kódot 10 percen belül beírni a \`chaosffa.kinetic.host\` szerveren a \`/link [kód]\` paranccsal.
`.trim(),
  },
  {
    title: "📊 5. Gamemód Követelmények (LT3 alatt)",
    body: `
| Gamemód | LT3 felett | LT3 alatt |
|---|---|---|
| Combo / Boxing | FT4 | FT2 |
| Fireball Fight / Soup / OP / No Debuff | FT4 | FT2 (ha nyersz teszter ellen kört, akkor FT3) |
| Bridge | FT10 | FT5 |
`.trim(),
  },
  {
    title: "🟣 6. UnRetire & Retired Rendszer",
    body: `
• **UnRetire:** Indulás a retire tierből. 75% winrate kell az azonos tierű ellen, ha nem sikerül, lefelé haladva HT3-ig. Ha ott sem, maradhat a retire vagy megy sima eval tesztre.
• **Retired feltételek:** Min. LT2 rang. 2 defenset kell szerezni saját tieredbeli vagy feljebb pályázó játékos legyőzésével (75% winrate). Az elmúlt 2 hónapban nem lehetett magasabb tier próbálkozásod.
• **Időtartamok:**
  - LT2 / HT2: 2 védelem + 40+ nap
  - LT1: 2 védelem + 60+ nap
  - HT1: 3 védelem + 90+ nap
`.trim(),
  },
  {
    title: "🏆 Eredmény Alapú Tier Besorolások",
    body: `
*(Ha a teszter nagyobb tier, mint az LT3, a teszterek eltérhetnek ezektől).*
### • Combo / Boxing
| Eredmény | Kapott tier |
|---|---|
| 2-0 | LT5, HT5, LT4 |
| 2-1 | LT4, HT4, LT3 |

*(Ha nyersz eval pass: LT3)*

### • Fireball Fight / Soup / OP / No Debuff
| Eredmény | Kapott tier |
|---|---|
| 2-0 | LT5, HT5 |
| 3-1 | LT4, HT4 |
| 3-2 | HT4, LT3 |

*(Ha nyersz eval pass: LT3)*

### • Bridge
| Eredmény | Kapott tier |
|---|---|
| 5-0 | LT5, HT5 |
| 5-1, 5-2 | HT5, LT4 |
| 5-3 | HT4, LT3 |
| 5-4 | HT4, LT3 |

*(Ha nyersz eval pass: LT3)*
`.trim(),
  },
];

export const PRIVACY_POLICY_TITLE = "Adatvédelmi tájékoztató";

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: "1. Az adatkezelő",
    body: `
Név: NeonTiers.hu
Weboldal: https://neontiers.hu
Az adatkezelő felelős azért, hogy a NeonTiers.hu használata során kezelt adatok kezelése jogszerűen, átláthatóan és biztonságosan történjen.
`.trim(),
  },
  {
    title: "2. Milyen adatokat kezelünk?",
    body: `
A NeonTiers.hu az alábbi adatokat kezelheti:

**Minecraft-fiókhoz kapcsolódó adatok**
• Minecraft UUID,
• Minecraft játékosnév,
• a játékoshoz kapcsolódó Minecraft PvP statisztikák,
• rangsorban, profiloldalon vagy statisztikai oldalon megjelenő teljesítményadatok.

**Discord-fiókhoz kapcsolódó adatok**
• Discord fiók azonosítója,
• a Discord-fiók és a Minecraft-fiók összekapcsolásához szükséges adatok.

**Weboldal használatához kapcsolódó technikai adatok**
• böngésző és eszköz alapadatai,
• látogatás időpontja,
• munkamenethez kapcsolódó technikai adatok,
• hibakereséshez és biztonsághoz szükséges naplóadatok.
`.trim(),
  },
  {
    title: "3. Nyilvánosan megjelenő adatok",
    body: `
A NeonTiers.hu egy Minecraft PvP statisztikai és rangsoroló weboldal, ezért bizonyos adatok nyilvánosan megjelenhetnek a weboldalon. Nyilvánosan megjelenhet például:
• Minecraft játékosnév,
• Minecraft UUID-hoz kapcsolódó profil,
• PvP statisztikák,
• ranglistán elfoglalt helyezés,
• győzelmek, vereségek, pontszámok vagy egyéb játékteljesítményhez kapcsolódó adatok.
`.trim(),
  },
  {
    title: "4. Az adatkezelés célja",
    body: `
Az adatokat az alábbi célokra kezeljük:
• Minecraft-játékosok azonosítása,
• Minecraft PvP statisztikák megjelenítése,
• ranglisták és játékosprofilok működtetése,
• Discord-fiók és Minecraft-fiók összekapcsolása,
• bejelentkezés és felhasználói azonosítás biztosítása,
• visszaélések, hibák és jogosulatlan hozzáférések megelőzése,
• a weboldal biztonságos működtetése,
• technikai hibák vizsgálata és javítása,
• felhasználói kérelmek kezelése.
`.trim(),
  },
  {
    title: "5. Minecraft PvP statisztikák kezelése",
    body: `
A NeonTiers.hu Minecraft PvP statisztikákat jeleníthet meg a weboldalon. Ezek a statisztikák a játékos Minecraft-profiljához kapcsolódhatnak. A statisztikák célja:
• játékosprofilok megjelenítése,
• ranglisták készítése,
• PvP teljesítmény összehasonlítása,
• közösségi és versenyszerű funkciók biztosítása.

A weboldalon közzétett PvP statisztikák nyilvánosan elérhetők lehetnek más látogatók számára is.
`.trim(),
  },
  {
    title: "6. Adatbiztonság",
    body: `
A NeonTiers.hu megfelelő technikai és szervezési intézkedéseket alkalmaz az adatok védelme érdekében. Ilyen intézkedések lehetnek:
• hozzáférések korlátozása,
• biztonságos bejelentkezés,
• tokenek és munkamenetek védelme,
• adatbázis-hozzáférések korlátozása,
• naplózás,
• hibák és visszaélések vizsgálata,
• jogosulatlan hozzáférés elleni védelem.
`.trim(),
  },
  {
    title: "7. Felhasználói jogok",
    body: `
A felhasználó jogosult:
• tájékoztatást kérni az adatkezelésről,
• hozzáférést kérni a róla kezelt adatokhoz,
• kérni a pontatlan adatok helyesbítését,
• kérni az adatok törlését,
• kérni az adatkezelés korlátozását,
• tiltakozni bizonyos adatkezelések ellen,
• hozzájárulását visszavonni, ha az adatkezelés hozzájáruláson alapul,
• panaszt tenni az illetékes adatvédelmi hatóságnál.

A kérelmeket discord hibajegyben teheted fel. A NeonTiers.hu a kérelmeket indokolatlan késedelem nélkül, a vonatkozó jogszabályi határidők szerint kezeli.
`.trim(),
  },
  {
    title: "8. Adatok törlésének kérése",
    body: `
A felhasználó kérheti a hozzá kapcsolódó adatok törlését, például:
• Discord-fiók összekapcsolásának megszüntetését,
• Discord azonosító törlését a NeonTiers.hu rendszeréből,
• Minecraft-profilhoz kapcsolódó személyes adatok törlését,
• nem szükséges technikai adatok törlését.

Fontos, hogy bizonyos nyilvános Minecraft PvP statisztikák törlése vagy elrejtése korlátozott lehet, ha azok a ranglista működéséhez, visszaélések megelőzéséhez vagy a szolgáltatás integritásának fenntartásához szükségesek.
`.trim(),
  },
  {
    title: "9. A tájékoztató módosulása",
    body: `
A NeonTiers.hu fenntartja a jogot, hogy ezt az adatvédelmi tájékoztatót módosítsa, különösen akkor, ha a weboldal működése, az adatkezelés módja, a használt szolgáltatók vagy a jogszabályi környezet megváltozik. A mindenkor hatályos adatvédelmi tájékoztató a NeonTiers.hu weboldalon érhető el.
`.trim(),
  },
];

// ---------------------------------------------------------------------------
// Tournament results
// ---------------------------------------------------------------------------
// The raw text pasted in used Discord mentions like "<@id> (Name)" or
// "@nickname (Name)". Per request, IDs/mentions are stripped and only the
// plain player name is kept. This is done generically below instead of by
// hand, to avoid transcription mistakes across ~14 tournaments.

const RAW_TOURNAMENT_TEXT = `
# SWORD TOURNAMENT EREDMÉNYEK:
Tournament Nyertes: Xqvpandaking
LT2:
<@778969084133376030> (Xqvpandaking)
HT3:
<@977577484008685699> (Ben21YT)
LT3:
<@1335330940980826122> (NeonGamer322)
<@1271222931984482315> (__Foxythatguy__)
HT4:
<@1449436923214172211> (JUSTYDANI)
<@1270082451934544003> (Jumpy13123)
<@1330294104784896061> (Matheus_Adelee)
@kilépett (Csigusz_)
LT4:
@Masgara (Masgara)
<@1342849563278704703> (Rmin75)
<@1238095569461968909> (adamkuka12)
@boldorix (Boldorix)
<@1143140317202235422> (Lord_Anura)
<@1330149309957541929> (Koni0722)
HT5:
@Csigusz (Csigusz_)

# AXE TOURNAMENT EREDMÉNYEK
Tournament Nyertes: Xqvpandaking
LT2:
<@778969084133376030> (Xqvpandaking)
HT3:
<@1149990834385723392> (Only_a_bee)
@kevin (1Disrrpt)
LT3:
<@977577484008685699> (Ben21YT)
<@1330149309957541929> (Koni0722)
HT4:
<@1335330940980826122> (NeonGamer322)
<@1206225583982383134> (Blesken250)
LT4:
<@1449436923214172211> (JUSTYDANI)
<@1238095569461968909> (adamkuka12)
HT5:
@boldorix (Boldorix)
<@1342849563278704703> (Rmin75)
<@1432708926511648858> (Andrisx969)

# MACE TOURNAMENT EREDMÉNYEK
Tournament Nyertes: Ben21YT (ki gondolta volna)
HT2:
<@977577484008685699> (Ben21YT)
LT2:
<@778969084133376030> (Xqvpandaking)
HT3:
<@1271222931984482315> (__Foxythatguy__)
<@1335330940980826122> (NeonGamer322)
LT3:
<@1188106714050998282> (Battasai)
<@896465601189519410> (Armmandoo)
@kevin (1Disrrpt)
HT4:
@Masgara (Masgara)
<@1330149309957541929> (Koni0722)
<@1330294104784896061> (Matheus_Adelee)
LT4:
<@1342849563278704703> (Rmin75)
<@1449436923214172211> (JUSTYDANI)
<@1272135990202470442> (LiverpoolKeszeg)
HT5:
<@1459887085925433356> (FrogMan015)
<@1270096345285398660> (axMystix)

# POT TOURNAMENT EREDMÉNYEK
Tournament Nyertes: Xqvpandaking
HT3:
<@778969084133376030> (Xqvpandaking)
LT3:
<@1335330940980826122> (NeonGamer322)
HT4:
<@1330149309957541929> (Koni0722)
<@1107174390115872818> (7H3pii)
<@977577484008685699> (Ben21YT)
LT4:
<@1449436923214172211> (JUSTYDANI)
@Masgara (Masgara)
@kevinreal (1Disrrpt)
HT5:
<@1270082451934544003> (Jumpy13123)
<@1330294104784896061> (Matheus_Adelee)
<@1417896542798614629> (f3lix375)

# NETHPOT TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
HT3:
<@778969084133376030> (Xqvpandaking)
LT3:
<@1335330940980826122> (NeonGamer322)
HT4:
<@1330294104784896061> (Matheus_Adelee)
@kevinreal (1Disrrpt)
LT4:
<@1270082451934544003> (Jumpy13123)
@masgara (Masgara)
<@977577484008685699> (Ben21YT)
<@1417896542798614629> (f3lix375)
HT5:
<@1330149309957541929> (Koni0722)
<@1143140317202235422> (Lord_Anura)
<@1449436923214172211> (JUSTYDANI)

# SMP TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
LT2:
<@778969084133376030> (Xqvpandaking)
HT3:
@kevinreal (1Disrrpt)
LT3:
<@977577484008685699> (Ben21YT)
<@1270082451934544003> (Jumpy13123)
HT4:
<@1272135990202470442> (LiverpoolKeszeg)
<@1335330940980826122> (NeonGamer322)
<@1330149309957541929> (Koni0722)
<@1326982004604141629> (BolyosAbel)
LT4:
<@1238095569461968909> (adamkuka12)
<@1330294104784896061> (Matheus_Adelee)
@masgara (Masgara)
<@1143140317202235422> (Lord_Anura)
HT5:
<@1449436923214172211> (JUSTYDANI)
@csigusz (Csigusz_)

# VANILLA TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
HT3:
<@778969084133376030> (Xqvpandaking)
LT3:
<@1335330940980826122> (NeonGamer322)
<@977577484008685699> (Ben21YT)
<@1387069849309806684> (K1pzy__)
HT4:
<@1188106714050998282> (Battasai)
@csigusz (Csigusz_)
@kevinreal (1Disrrpt)
LT4:
<@1366771748887986298> (ItzRealErikk_)
<@1330294104784896061> (Matheus_Adelee)
<@1330149309957541929> (Koni0722)
<@1272135990202470442> (LiverpoolKeszeg)
HT5:
<@1326982004604141629> (BolyosAbel)
<@1270082451934544003> (Jumpy13123)
@Masgara (Masgara)
<@1107174390115872818> (7H3pii)

# UHC TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
LT2:
<@778969084133376030> (Xqvpandaking)
HT3:
<@1107174390115872818> (7H3pii)
LT3:
<@977577484008685699> (Ben21YT)
@kevinreal (1Disrrpt)
HT4:
<@1270082451934544003> (Jumpy13123)
<@1272135990202470442> (LiverpoolKeszeg)
<@1143140317202235422> (Lord_Anura)
<@1335330940980826122> (NeonGamer322)
LT4:
@boldorix (Boldorix)
<@1330149309957541929> (Koni0722)
<@1330294104784896061> (Matheus_Adelee)
<@1417896542798614629> (f3lix375)
HT5:
<@1449436923214172211> (JUSTYDANI)
@masgara (Masgara)

# OGV TOURNAMENT EREDMÉNYEK
Tournament nyertes: Ben21YT
LT3:
<@977577484008685699> (Ben21YT)
HT4:
<@1335330940980826122> (NeonGamer322)
<@778969084133376030> (Xqvpandaking)
LT4:
@kevinreal (1Disrrpt)
HT5:
<@1330149309957541929> (Koni0722)
@Masgara (Masgara)

# SHIELDLESSUHC TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
LT3:
<@778969084133376030> (Xqvpandaking)
HT4:
<@977577484008685699> (Ben21YT)
<@1107174390115872818> (7H3pii)
LT4:
@kevinreal (1Disrrpt)
<@1335330940980826122> (NeonGamer322)
HT5:
<@1330149309957541929> (Koni0722)
@masgara (Masgara)

# CREEPER TOURNAMENT EREDMÉNYEK
Tournament nyertes: 7H3pii
HT3:
<@1107174390115872818> (7H3pii)
LT3:
<@649276313395396609> (1Disrrpt)
<@1272135990202470442> (LiverpoolKeszeg)
HT4:
<@1149990834385723392> (Only_a_bee)
<@778969084133376030> (Xqvpandaking)
<@1335330940980826122> (NeonGamer322)
LT4:
@masgara (Masgara)
<@1330294104784896061> (Matheus_Adelee)
<@977577484008685699> (Ben21YT)
HT5:
<@1330149309957541929> (Koni0722)

# CART TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
HT3:
<@778969084133376030> (Xqvpandaking)
LT3:
<@1335330940980826122> (NeonGamer322)
HT4:
<@1271222931984482315> (__Foxythatguy__)
<@649276313395396609> (1Disrrpt)
LT4:
<@977577484008685699> (Ben21YT)
<@1143140317202235422> (Lord_Anura)
<@1330149309957541929> (Koni0722)
<@1459887085925433356> (FrogMan015)
HT5:
<@1449436923214172211> (JUSTYDANI)
@masgara (Masgara)
@Ametiszt (Ametiszt)
<@1330294104784896061> (Matheus_Adelee)
<@1272135990202470442> (LiverpoolKeszeg)

# DIASMP TOURNAMENT EREDMÉNYEK
Tournament nyertes: Xqvpandaking
HT3:
<@778969084133376030> (Xqvpandaking)
LT3:
<@649276313395396609> (1Disrrpt)
HT4:
<@977577484008685699> (Ben21YT)
<@1272135990202470442> (LiverpoolKeszeg)
LT4:
<@1335330940980826122> (NeonGamer322)
<@1107174390115872818> (7H3pii)
<@1143140317202235422> (Lord_Anura)
<@1010836369716826144> (Csigusz_)
<@1270082451934534660> (Jumpy13123)
HT5:
<@1326982004604141629> (BolyosAbel)
<@1449436923214172211> (JUSTYDANI)
@masgara (Masgara)
<@1330294104784896061> (Matheus_Adelee)

# SPEARMACE TOURNAMENT EREDMÉNYEK
Tournament nyertes: ResiAkiralyom
HT3:
ResiAkiralyom
LT3:
NeonGamer322
HT4:
Phoenix_YTT
LT4:
AndowiTheGoat67
XBloome
Jump_lrewxy
SynT1c
HT5:
Battasai
Gagyihu
LorKar15
Krisionyt
Ben21YT
Xqvpandaking
`.trim();

function extractName(rawLine) {
  let line = rawLine.trim();
  // Strip Discord user mentions like <@123456789012345>
  line = line.replace(/<@\d+>\s*/g, "");
  // If there's a "(Name)" part, that's the real display name we want.
  const parenMatch = line.match(/\(([^)]+)\)/);
  let name = parenMatch ? parenMatch[1] : line;
  // Strip any leftover @nickname prefix (e.g. "@kevin (1Disrrpt)" already
  // handled above via parens, but guard for stray "@word" with no parens).
  name = name.replace(/^@\S+\s*/, "");
  // Clean stray markdown escape characters from copy-pasted text.
  name = name.replace(/\\_/g, "_").replace(/[`*]/g, "").trim();
  return name;
}

function parseTournamentBlock(block) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const titleLine = lines[0].replace(/^#\s*/, "");
  const title = titleLine.replace(/TOURNAMENT EREDMÉNYEK:?/i, "").trim();

  let winner = "";
  let startIdx = 1;
  const winnerLine = lines[1] || "";
  const winnerMatch = winnerLine.match(/^Tournament\s+nyertes:\s*(.+)$/i);
  if (winnerMatch) {
    winner = winnerMatch[1].trim();
    startIdx = 2;
  }

  const tiers = [];
  let current = null;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // A tier header line looks like "HT3:", "LT4:" etc — short, ends with colon,
    // and has no parentheses or mention (which player lines usually have).
    if (/^[A-Za-z]{2,4}\d?:$/.test(line)) {
      current = { tier: line.slice(0, -1), names: [] };
      tiers.push(current);
      continue;
    }
    const name = extractName(line);
    if (current) {
      current.names.push(name);
    } else {
      // Names appearing before any tier header (shouldn't normally happen)
      tiers.push({ tier: "", names: [name] });
      current = tiers[tiers.length - 1];
    }
  }

  return { title, winner, tiers };
}

export const TOURNAMENT_RESULTS = RAW_TOURNAMENT_TEXT
  .split(/\n(?=# )/)
  .map(parseTournamentBlock)
  .filter(Boolean);

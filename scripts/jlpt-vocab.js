/**
 * Met à jour le vocab de toutes les quêtes Tokyo avec du contenu JLPT N5/N4/N3
 * Usage: node scripts/jlpt-vocab.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Vocabulaire par quête ──────────────────────────────────────────────────────
// Format: { jp, kana, romaji, fr, jlpt }  jlpt: 5=N5, 4=N4, 3=N3

const QUEST_VOCAB = {

  // ── Aéroport Haneda ────────────────────────────────────────────────────────
  "quest-haneda-1": [
    { jp:"パスポート",  kana:"パスポート",  romaji:"pasupōto",    fr:"passeport",                 jlpt:5 },
    { jp:"飛行機",      kana:"ひこうき",    romaji:"hikōki",      fr:"avion",                     jlpt:5 },
    { jp:"観光",        kana:"かんこう",    romaji:"kankō",       fr:"tourisme",                  jlpt:4 },
    { jp:"目的",        kana:"もくてき",    romaji:"mokuteki",    fr:"objectif, but",             jlpt:4 },
    { jp:"滞在",        kana:"たいざい",    romaji:"taizai",      fr:"séjour",                    jlpt:3 },
    { jp:"入国審査",    kana:"にゅうこくしんさ", romaji:"nyūkoku-shinsa", fr:"contrôle d'immigration", jlpt:3 },
    { jp:"何日間",      kana:"なんにちかん", romaji:"nan-nichi-kan", fr:"combien de jours",       jlpt:4 },
    { jp:"仕事",        kana:"しごと",      romaji:"shigoto",     fr:"travail",                   jlpt:5 },
  ],

  "quest-haneda-2": [
    { jp:"バス",        kana:"バス",        romaji:"basu",        fr:"bus",                       jlpt:5 },
    { jp:"どこ",        kana:"どこ",        romaji:"doko",        fr:"où",                        jlpt:5 },
    { jp:"切符",        kana:"きっぷ",      romaji:"kippu",       fr:"billet",                    jlpt:4 },
    { jp:"値段",        kana:"ねだん",      romaji:"nedan",       fr:"prix",                      jlpt:4 },
    { jp:"時間",        kana:"じかん",      romaji:"jikan",       fr:"temps, durée",              jlpt:5 },
    { jp:"ありがとうございます", kana:"ありがとうございます", romaji:"arigatō gozaimasu", fr:"merci beaucoup", jlpt:5 },
    { jp:"乗り場",      kana:"のりば",      romaji:"noriba",      fr:"arrêt, terminal",           jlpt:4 },
    { jp:"分",          kana:"ふん",        romaji:"fun",         fr:"minute(s)",                 jlpt:5 },
  ],

  // ── Gare de Tokyo Shinkansen ───────────────────────────────────────────────
  "quest-shinkansen-1": [
    { jp:"新幹線",      kana:"しんかんせん", romaji:"shinkansen",  fr:"train à grande vitesse",   jlpt:4 },
    { jp:"片道",        kana:"かたみち",    romaji:"katamichi",   fr:"aller simple",              jlpt:4 },
    { jp:"指定席",      kana:"ていせき",    romaji:"shiteiseki",  fr:"siège réservé",             jlpt:4 },
    { jp:"窓側",        kana:"まどがわ",    romaji:"madogawa",    fr:"côté fenêtre",              jlpt:4 },
    { jp:"禁煙",        kana:"きんえん",    romaji:"kin'en",      fr:"non-fumeur",                jlpt:3 },
    { jp:"確認",        kana:"かくにん",    romaji:"kakunin",     fr:"confirmer, vérifier",       jlpt:3 },
    { jp:"払う",        kana:"はらう",      romaji:"harau",       fr:"payer",                     jlpt:4 },
    { jp:"自由席",      kana:"じゆうせき",  romaji:"jiyūseki",    fr:"siège libre (non réservé)", jlpt:4 },
  ],

  // ── Gare JR Shinjuku ───────────────────────────────────────────────────────
  "quest-jr-1": [
    { jp:"出口",        kana:"でぐち",      romaji:"deguchi",     fr:"sortie",                    jlpt:5 },
    { jp:"東口",        kana:"ひがしぐち",  romaji:"higashi-guchi", fr:"sortie Est",              jlpt:4 },
    { jp:"Suica",       kana:"スイカ",      romaji:"Suika",       fr:"carte IC de transport",     jlpt:4 },
    { jp:"路線",        kana:"ろせん",      romaji:"rosen",       fr:"ligne (de train)",          jlpt:4 },
    { jp:"山手線",      kana:"やまのてせん", romaji:"Yamanote-sen", fr:"ligne Yamanote",          jlpt:4 },
    { jp:"方向",        kana:"ほうこう",    romaji:"hōkō",        fr:"direction",                 jlpt:4 },
    { jp:"乗り換え",    kana:"のりかえ",    romaji:"norikae",     fr:"correspondance, transfer",  jlpt:4 },
    { jp:"改札",        kana:"かいさつ",    romaji:"kaisatsu",    fr:"portillon, contrôle",       jlpt:4 },
  ],

  // ── Nine Hours Capsule Hotel ───────────────────────────────────────────────
  "quest-ninehours-1": [
    { jp:"予約",        kana:"よやく",      romaji:"yoyaku",      fr:"réservation",               jlpt:4 },
    { jp:"名前",        kana:"なまえ",      romaji:"namae",       fr:"nom, prénom",               jlpt:5 },
    { jp:"チェックアウト", kana:"チェックアウト", romaji:"chekku-auto", fr:"check-out",            jlpt:4 },
    { jp:"鍵",          kana:"かぎ",        romaji:"kagi",        fr:"clé",                       jlpt:5 },
    { jp:"シャワー",    kana:"シャワー",    romaji:"shawā",       fr:"douche",                    jlpt:5 },
    { jp:"何時",        kana:"なんじ",      romaji:"nanji",       fr:"à quelle heure",            jlpt:5 },
    { jp:"共有",        kana:"きょうゆう",  romaji:"kyōyū",       fr:"partagé, commun",           jlpt:3 },
    { jp:"ルール",      kana:"ルール",      romaji:"rūru",        fr:"règle",                     jlpt:4 },
  ],

  // ── Grand Hyatt Tokyo ──────────────────────────────────────────────────────
  "quest-hyatt-1": [
    { jp:"予約",        kana:"よやく",      romaji:"yoyaku",      fr:"réservation",               jlpt:4 },
    { jp:"部屋",        kana:"へや",        romaji:"heya",        fr:"chambre",                   jlpt:5 },
    { jp:"アップグレード", kana:"アップグレード", romaji:"appugurēdo", fr:"upgrade, surclassement", jlpt:4 },
    { jp:"ルームサービス", kana:"ルームサービス", romaji:"rūmu-sābisu", fr:"room service",         jlpt:4 },
    { jp:"注文する",    kana:"ちゅうもんする", romaji:"chūmon suru", fr:"commander",              jlpt:4 },
    { jp:"モーニングコール", kana:"モーニングコール", romaji:"mōningu-kōru", fr:"réveil téléphonique", jlpt:4 },
    { jp:"確認",        kana:"かくにん",    romaji:"kakunin",     fr:"confirmation",              jlpt:3 },
    { jp:"丁寧",        kana:"ていねい",    romaji:"teinei",      fr:"poli, courtois",            jlpt:3 },
  ],

  // ── 7-Eleven Kabukichō ────────────────────────────────────────────────────
  "quest-7eleven-1": [
    { jp:"おにぎり",    kana:"おにぎり",    romaji:"onigiri",     fr:"boulette de riz",           jlpt:5 },
    { jp:"どこ",        kana:"どこ",        romaji:"doko",        fr:"où",                        jlpt:5 },
    { jp:"ありますか",  kana:"ありますか",  romaji:"arimasu ka",  fr:"est-ce qu'il y a ?",        jlpt:5 },
    { jp:"コーヒー",    kana:"コーヒー",    romaji:"kōhī",        fr:"café",                      jlpt:5 },
    { jp:"温める",      kana:"あたためる",  romaji:"atatameru",   fr:"réchauffer",                jlpt:4 },
    { jp:"電子レンジ",  kana:"でんしレンジ", romaji:"denshi-renji", fr:"micro-ondes",             jlpt:4 },
    { jp:"サイズ",      kana:"サイズ",      romaji:"saizu",       fr:"taille",                    jlpt:4 },
    { jp:"冷蔵庫",      kana:"れいぞうこ",  romaji:"reizōko",     fr:"réfrigérateur",             jlpt:4 },
  ],

  // ── FamilyMart Shibuya ────────────────────────────────────────────────────
  "quest-familymart-1": [
    { jp:"お弁当",      kana:"おべんとう",  romaji:"obentō",      fr:"bento, repas en boîte",     jlpt:4 },
    { jp:"ください",    kana:"ください",    romaji:"kudasai",     fr:"s'il vous plaît (donner)",  jlpt:5 },
    { jp:"いくら",      kana:"いくら",      romaji:"ikura",       fr:"combien ça coûte ?",        jlpt:5 },
    { jp:"箸",          kana:"はし",        romaji:"hashi",       fr:"baguettes",                 jlpt:4 },
    { jp:"袋",          kana:"ふくろ",      romaji:"fukuro",      fr:"sac (plastique)",           jlpt:4 },
    { jp:"揚げる",      kana:"あげる",      romaji:"ageru",       fr:"frire",                     jlpt:4 },
    { jp:"レジ",        kana:"レジ",        romaji:"reji",        fr:"caisse",                    jlpt:4 },
    { jp:"ポイントカード", kana:"ポイントカード", romaji:"pointo-kādo", fr:"carte de fidélité",    jlpt:4 },
  ],

  // ── Lawson Harajuku ───────────────────────────────────────────────────────
  "quest-lawson-1": [
    { jp:"デザート",    kana:"デザート",    romaji:"dezāto",      fr:"dessert",                   jlpt:5 },
    { jp:"人気",        kana:"にんき",      romaji:"ninki",       fr:"populaire",                 jlpt:4 },
    { jp:"お勧め",      kana:"おすすめ",    romaji:"osusume",     fr:"recommandation",            jlpt:4 },
    { jp:"カフェラテ",  kana:"カフェラテ",  romaji:"kaferate",    fr:"café au lait",              jlpt:4 },
    { jp:"ポンタカード", kana:"ポンタカード", romaji:"Ponta-kādo", fr:"carte Ponta (fidélité)",   jlpt:4 },
    { jp:"使える",      kana:"つかえる",    romaji:"tsukaeru",    fr:"pouvoir utiliser",          jlpt:4 },
    { jp:"季節限定",    kana:"きせつげんてい", romaji:"kisetsu-gentei", fr:"édition saisonnière",  jlpt:3 },
    { jp:"甘い",        kana:"あまい",      romaji:"amai",        fr:"sucré",                     jlpt:5 },
  ],

  // ── Matsumoto Kiyoshi Akihabara ───────────────────────────────────────────
  "quest-matsumoto-1": [
    { jp:"頭が痛い",    kana:"あたまがいたい", romaji:"atama ga itai", fr:"j'ai mal à la tête",  jlpt:5 },
    { jp:"薬",          kana:"くすり",      romaji:"kusuri",      fr:"médicament",                jlpt:5 },
    { jp:"症状",        kana:"しょうじょう", romaji:"shōjō",       fr:"symptôme",                 jlpt:3 },
    { jp:"飲み方",      kana:"のみかた",    romaji:"nomikata",    fr:"façon de prendre (médicament)", jlpt:4 },
    { jp:"熱",          kana:"ねつ",        romaji:"netsu",       fr:"fièvre",                    jlpt:5 },
    { jp:"領収書",      kana:"りょうしゅうしょ", romaji:"ryōshūsho", fr:"reçu",                  jlpt:3 },
    { jp:"アレルギー",  kana:"アレルギー",  romaji:"arerugī",     fr:"allergie",                  jlpt:4 },
    { jp:"1日3回",      kana:"いちにちさんかい", romaji:"ichinichi san-kai", fr:"3 fois par jour", jlpt:4 },
  ],

  // ── Bureau de Poste Central ───────────────────────────────────────────────
  "quest-post-1": [
    { jp:"荷物",        kana:"にもつ",      romaji:"nimotsu",     fr:"colis, bagage",             jlpt:5 },
    { jp:"送る",        kana:"おくる",      romaji:"okuru",       fr:"envoyer",                   jlpt:5 },
    { jp:"フランス",    kana:"フランス",    romaji:"Furansu",     fr:"France",                    jlpt:5 },
    { jp:"EMS",         kana:"イーエムエス", romaji:"ī-emu-esu",  fr:"EMS (service express international)", jlpt:4 },
    { jp:"申告書",      kana:"しんこくしょ", romaji:"shinkokusho", fr:"déclaration (douane)",     jlpt:3 },
    { jp:"追跡番号",    kana:"ついせきばんごう", romaji:"tsuiseki-bangō", fr:"numéro de suivi",   jlpt:3 },
    { jp:"内容",        kana:"ないよう",    romaji:"naiyō",       fr:"contenu",                   jlpt:4 },
    { jp:"届く",        kana:"とどく",      romaji:"todoku",      fr:"arriver, être livré",       jlpt:4 },
  ],

  // ── Starbucks Shibuya ─────────────────────────────────────────────────────
  "quest-starbucks-1": [
    { jp:"注文",        kana:"ちゅうもん",  romaji:"chūmon",      fr:"commande",                  jlpt:4 },
    { jp:"抹茶ラテ",    kana:"まっちゃラテ", romaji:"matcha rate", fr:"matcha latte",             jlpt:4 },
    { jp:"グランデ",    kana:"グランデ",    romaji:"gurande",     fr:"taille grande",             jlpt:4 },
    { jp:"甘さ控えめ",  kana:"あまさひかえめ", romaji:"amasa-hikaeme", fr:"sucre réduit",         jlpt:3 },
    { jp:"名前",        kana:"なまえ",      romaji:"namae",       fr:"prénom (pour le gobelet)", jlpt:5 },
    { jp:"席",          kana:"せき",        romaji:"seki",        fr:"place, siège",              jlpt:4 },
    { jp:"テラス",      kana:"テラス",      romaji:"terasu",      fr:"terrasse, balcon",          jlpt:4 },
    { jp:"満席",        kana:"まんせき",    romaji:"manseki",     fr:"complet, toutes places prises", jlpt:3 },
  ],

  // ── McDonald's Shibuya ────────────────────────────────────────────────────
  "quest-mcdo-1": [
    { jp:"メニュー",    kana:"メニュー",    romaji:"menyū",       fr:"menu",                      jlpt:5 },
    { jp:"セット",      kana:"セット",      romaji:"setto",       fr:"menu (avec accompagnement)", jlpt:4 },
    { jp:"ポテト",      kana:"ポテト",      romaji:"poteto",      fr:"frites",                    jlpt:5 },
    { jp:"照り焼き",    kana:"てりやき",    romaji:"teriyaki",    fr:"teriyaki",                  jlpt:4 },
    { jp:"タッチ決済",  kana:"タッチけっさい", romaji:"tatchi-kessai", fr:"paiement sans contact", jlpt:3 },
    { jp:"ナプキン",    kana:"ナプキン",    romaji:"napukin",     fr:"serviette",                 jlpt:4 },
    { jp:"特別",        kana:"とくべつ",    romaji:"tokubetsu",   fr:"spécial, exclusif",         jlpt:4 },
    { jp:"サイズ",      kana:"サイズ",      romaji:"saizu",       fr:"taille (M, L, etc.)",       jlpt:4 },
  ],

  // ── Asahi Super Dry Hall ──────────────────────────────────────────────────
  "quest-asahi-1": [
    { jp:"生ビール",    kana:"なまビール",  romaji:"nama bīru",   fr:"bière pression",            jlpt:4 },
    { jp:"席",          kana:"せき",        romaji:"seki",        fr:"place, table",              jlpt:4 },
    { jp:"窓",          kana:"まど",        romaji:"mado",        fr:"fenêtre",                   jlpt:5 },
    { jp:"枝豆",        kana:"えだまめ",    romaji:"edamame",     fr:"edamame (haricots verts)",  jlpt:4 },
    { jp:"お会計",      kana:"おかいけい",  romaji:"o-kaikei",    fr:"l'addition",                jlpt:4 },
    { jp:"乾杯",        kana:"かんぱい",    romaji:"kanpai",      fr:"santé ! (trinquer)",        jlpt:4 },
    { jp:"眺め",        kana:"ながめ",      romaji:"nagame",      fr:"vue (panorama)",            jlpt:3 },
    { jp:"予約",        kana:"よやく",      romaji:"yoyaku",      fr:"réservation",               jlpt:4 },
  ],

  // ── Loft Shibuya ─────────────────────────────────────────────────────────
  "quest-loft-1": [
    { jp:"文房具",      kana:"ぶんぼうぐ",  romaji:"bunbōgu",     fr:"papeterie, fournitures",    jlpt:4 },
    { jp:"何階",        kana:"なんかい",    romaji:"nan-kai",     fr:"quel étage",                jlpt:4 },
    { jp:"名入れ",      kana:"なまいれ",    romaji:"namairi",     fr:"personnalisation (prénom)", jlpt:3 },
    { jp:"ラッピング",  kana:"ラッピング",  romaji:"rappingu",    fr:"emballage cadeau",          jlpt:4 },
    { jp:"無料",        kana:"むりょう",    romaji:"muryō",       fr:"gratuit",                   jlpt:4 },
    { jp:"贈り物",      kana:"おくりもの",  romaji:"okurimono",   fr:"cadeau",                    jlpt:4 },
    { jp:"サービス",    kana:"サービス",    romaji:"sābisu",      fr:"service",                   jlpt:4 },
    { jp:"手帳",        kana:"てちょう",    romaji:"techō",       fr:"carnet, agenda",            jlpt:4 },
  ],

  // ── SHIBUYA109 ────────────────────────────────────────────────────────────
  "quest-109-1": [
    { jp:"サイズ",      kana:"サイズ",      romaji:"saizu",       fr:"taille (vêtement)",         jlpt:4 },
    { jp:"試着",        kana:"しちゃく",    romaji:"shichaku",    fr:"essayage",                  jlpt:4 },
    { jp:"試着室",      kana:"しちゃくしつ", romaji:"shichaku-shitsu", fr:"cabine d'essayage",    jlpt:4 },
    { jp:"大きい",      kana:"おおきい",    romaji:"ōkii",        fr:"grand, large",              jlpt:5 },
    { jp:"小さい",      kana:"ちいさい",    romaji:"chiisai",     fr:"petit, étroit",             jlpt:5 },
    { jp:"ファッション", kana:"ファッション", romaji:"fasshon",    fr:"mode",                      jlpt:4 },
    { jp:"在庫",        kana:"ざいこ",      romaji:"zaiko",       fr:"stock",                     jlpt:3 },
    { jp:"流行り",      kana:"はやり",      romaji:"hayari",      fr:"tendance, à la mode",       jlpt:3 },
  ],

  // ── Don Quijote Shibuya ───────────────────────────────────────────────────
  "quest-donki-1": [
    { jp:"化粧品",      kana:"けしょうひん", romaji:"keshōhin",   fr:"cosmétiques",               jlpt:4 },
    { jp:"何階",        kana:"なんかい",    romaji:"nan-kai",     fr:"quel étage",                jlpt:4 },
    { jp:"免税",        kana:"めんぜい",    romaji:"menzei",      fr:"détaxe, Tax Free",          jlpt:3 },
    { jp:"パスポート",  kana:"パスポート",  romaji:"pasupōto",    fr:"passeport",                 jlpt:5 },
    { jp:"提示する",    kana:"ていじする",  romaji:"teiji suru",  fr:"présenter, montrer",        jlpt:3 },
    { jp:"カード払い",  kana:"カードばらい", romaji:"kādo-barai", fr:"paiement par carte",        jlpt:4 },
    { jp:"安い",        kana:"やすい",      romaji:"yasui",       fr:"pas cher, bon marché",      jlpt:5 },
    { jp:"割引",        kana:"わりびき",    romaji:"waribiki",    fr:"réduction, remise",         jlpt:3 },
  ],

  // ── Yodobashi-Akiba ───────────────────────────────────────────────────────
  "quest-yodobashi-1": [
    { jp:"カメラ",      kana:"カメラ",      romaji:"kamera",      fr:"appareil photo",            jlpt:5 },
    { jp:"予算",        kana:"よさん",      romaji:"yosan",       fr:"budget",                    jlpt:4 },
    { jp:"比べる",      kana:"くらべる",    romaji:"kuraberu",    fr:"comparer",                  jlpt:4 },
    { jp:"違い",        kana:"ちがい",      romaji:"chigai",      fr:"différence",                jlpt:4 },
    { jp:"保証",        kana:"ほしょう",    romaji:"hoshō",       fr:"garantie",                  jlpt:3 },
    { jp:"ズーム",      kana:"ズーム",      romaji:"zūmu",        fr:"zoom",                      jlpt:4 },
    { jp:"免税",        kana:"めんぜい",    romaji:"menzei",      fr:"détaxe",                    jlpt:3 },
    { jp:"専門家",      kana:"せんもんか",  romaji:"senmonka",    fr:"expert, spécialiste",       jlpt:3 },
  ],

  // ── Lumine Est Shinjuku ───────────────────────────────────────────────────
  "quest-lumine-1": [
    { jp:"レストラン",  kana:"レストラン",  romaji:"resutoran",   fr:"restaurant",                jlpt:5 },
    { jp:"何階",        kana:"なんかい",    romaji:"nan-kai",     fr:"quel étage",                jlpt:4 },
    { jp:"ベジタリアン", kana:"ベジタリアン", romaji:"bejitarian", fr:"végétarien",               jlpt:4 },
    { jp:"ラーメン",    kana:"ラーメン",    romaji:"rāmen",       fr:"ramen",                     jlpt:5 },
    { jp:"案内",        kana:"あんない",    romaji:"annai",       fr:"guide, information",        jlpt:4 },
    { jp:"直接",        kana:"ちょくせつ",  romaji:"chokusetsu",  fr:"directement",               jlpt:3 },
    { jp:"地下",        kana:"ちか",        romaji:"chika",       fr:"sous-sol",                  jlpt:5 },
    { jp:"繋がる",      kana:"つながる",    romaji:"tsunagaru",   fr:"être relié, connecté",      jlpt:3 },
  ],

  // ── Tokyo Skytree ─────────────────────────────────────────────────────────
  "quest-skytree-1": [
    { jp:"展望台",      kana:"てんぼうだい", romaji:"tenbōdai",   fr:"plateforme d'observation",  jlpt:4 },
    { jp:"チケット",    kana:"チケット",    romaji:"chiketto",    fr:"billet",                    jlpt:5 },
    { jp:"料金",        kana:"りょうきん",  romaji:"ryōkin",      fr:"tarif, prix",               jlpt:4 },
    { jp:"富士山",      kana:"ふじさん",    romaji:"Fuji-san",    fr:"Mont Fuji",                 jlpt:4 },
    { jp:"天気",        kana:"てんき",      romaji:"tenki",       fr:"météo, temps",              jlpt:5 },
    { jp:"晴れた日",    kana:"はれたひ",    romaji:"hareta hi",   fr:"jour ensoleillé",           jlpt:5 },
    { jp:"高さ",        kana:"たかさ",      romaji:"takasa",      fr:"hauteur",                   jlpt:4 },
    { jp:"意味",        kana:"いみ",        romaji:"imi",         fr:"signification, sens",       jlpt:4 },
  ],

  // ── Tour de Tokyo ─────────────────────────────────────────────────────────
  "quest-tokyotower-1": [
    { jp:"タワー",      kana:"タワー",      romaji:"tawā",        fr:"tour",                      jlpt:5 },
    { jp:"歴史",        kana:"れきし",      romaji:"rekishi",     fr:"histoire",                  jlpt:4 },
    { jp:"違い",        kana:"ちがい",      romaji:"chigai",      fr:"différence",                jlpt:4 },
    { jp:"入場券",      kana:"にゅうじょうけん", romaji:"nyūjō-ken", fr:"billet d'entrée",       jlpt:4 },
    { jp:"閉館時間",    kana:"へいかんじかん", romaji:"heikan-jikan", fr:"heure de fermeture",   jlpt:3 },
    { jp:"ライトアップ", kana:"ライトアップ", romaji:"raito-appu", fr:"illumination nocturne",    jlpt:3 },
    { jp:"夜景",        kana:"やけい",      romaji:"yakei",       fr:"paysage nocturne",          jlpt:3 },
    { jp:"建設",        kana:"けんせつ",    romaji:"kensetsu",    fr:"construction",              jlpt:3 },
  ],

  // ── Meiji Jingū ───────────────────────────────────────────────────────────
  "quest-meiji-1": [
    { jp:"神社",        kana:"じんじゃ",    romaji:"jinja",       fr:"sanctuaire shinto",         jlpt:4 },
    { jp:"手水舎",      kana:"ちょうずや",  romaji:"chōzuya",     fr:"fontaine de purification",  jlpt:3 },
    { jp:"参拝",        kana:"さんぱい",    romaji:"sanpai",      fr:"prière, visite au temple",  jlpt:3 },
    { jp:"お守り",      kana:"おまもり",    romaji:"omamori",     fr:"amulette porte-bonheur",    jlpt:4 },
    { jp:"お辞儀",      kana:"おじぎ",      romaji:"ojigi",       fr:"révérence, s'incliner",     jlpt:4 },
    { jp:"二拝二拍手一拝", kana:"にはいにはくしゅいちはい", romaji:"ni-hai ni-hakushu ichi-hai", fr:"méthode de prière shinto", jlpt:3 },
    { jp:"清める",      kana:"きよめる",    romaji:"kiyomeru",    fr:"purifier",                  jlpt:3 },
    { jp:"学業成就",    kana:"がくぎょうじょうじゅ", romaji:"gakugyō-jōju", fr:"réussite scolaire", jlpt:3 },
  ],

  // ── Sensō-ji ──────────────────────────────────────────────────────────────
  "quest-sensoji-1": [
    { jp:"お寺",        kana:"おてら",      romaji:"o-tera",      fr:"temple bouddhiste",         jlpt:4 },
    { jp:"門",          kana:"もん",        romaji:"mon",         fr:"porte, portail",            jlpt:4 },
    { jp:"おみくじ",    kana:"おみくじ",    romaji:"omikuji",     fr:"fortune tirée au sort",     jlpt:4 },
    { jp:"大吉",        kana:"だいきち",    romaji:"daikichi",    fr:"très grande chance",        jlpt:3 },
    { jp:"凶",          kana:"きょう",      romaji:"kyō",         fr:"mauvaise fortune",          jlpt:3 },
    { jp:"仲見世通り",  kana:"なかみせどおり", romaji:"Nakamise-dōri", fr:"allée des boutiques",  jlpt:3 },
    { jp:"お土産",      kana:"おみやげ",    romaji:"omiyage",     fr:"souvenir",                  jlpt:4 },
    { jp:"歴史",        kana:"れきし",      romaji:"rekishi",     fr:"histoire",                  jlpt:4 },
  ],

  // ── Tokyo National Museum ─────────────────────────────────────────────────
  "quest-museum-1": [
    { jp:"博物館",      kana:"はくぶつかん", romaji:"hakubutsukan", fr:"musée",                   jlpt:4 },
    { jp:"展示",        kana:"てんじ",      romaji:"tenji",       fr:"exposition, vitrine",       jlpt:4 },
    { jp:"音声ガイド",  kana:"おんせいガイド", romaji:"onsei-gaido", fr:"audioguide",              jlpt:4 },
    { jp:"フランス語",  kana:"フランスご",  romaji:"Furansu-go",  fr:"français (langue)",         jlpt:5 },
    { jp:"閉館",        kana:"へいかん",    romaji:"heikan",      fr:"fermeture (musée)",         jlpt:3 },
    { jp:"国宝",        kana:"こくほう",    romaji:"kokuhō",      fr:"trésor national",           jlpt:3 },
    { jp:"作品",        kana:"さくひん",    romaji:"sakuhin",     fr:"œuvre",                     jlpt:4 },
    { jp:"貴重",        kana:"きちょう",    romaji:"kichō",       fr:"précieux",                  jlpt:3 },
  ],

  // ── Tokyo Metropolitan Theatre ────────────────────────────────────────────
  "quest-theater-1": [
    { jp:"コンサート",  kana:"コンサート",  romaji:"konsāto",     fr:"concert",                   jlpt:4 },
    { jp:"チケット",    kana:"チケット",    romaji:"chiketto",    fr:"billet",                    jlpt:5 },
    { jp:"プログラム",  kana:"プログラム",  romaji:"puroguramu",  fr:"programme",                 jlpt:4 },
    { jp:"座席",        kana:"ざせき",      romaji:"zaseki",      fr:"siège, place",              jlpt:4 },
    { jp:"開演",        kana:"かいえん",    romaji:"kaien",       fr:"début du spectacle",        jlpt:3 },
    { jp:"クローク",    kana:"クローク",    romaji:"kurōku",      fr:"vestiaire",                 jlpt:4 },
    { jp:"地下",        kana:"ちか",        romaji:"chika",       fr:"sous-sol",                  jlpt:5 },
    { jp:"公演",        kana:"こうえん",    romaji:"kōen",        fr:"représentation, spectacle", jlpt:3 },
  ],

  // ── Big Echo Kabukichō ────────────────────────────────────────────────────
  "quest-karaoke-1": [
    { jp:"カラオケ",    kana:"カラオケ",    romaji:"karaoke",     fr:"karaoké",                   jlpt:4 },
    { jp:"部屋",        kana:"へや",        romaji:"heya",        fr:"salle, chambre",            jlpt:5 },
    { jp:"何名様",      kana:"なんめいさま", romaji:"nan-mei-sama", fr:"pour combien de personnes", jlpt:4 },
    { jp:"飲み放題",    kana:"のみほうだい", romaji:"nomi-hōdai",  fr:"boissons à volonté",       jlpt:3 },
    { jp:"時間",        kana:"じかん",      romaji:"jikan",       fr:"heure(s)",                  jlpt:5 },
    { jp:"曲",          kana:"きょく",      romaji:"kyoku",       fr:"chanson, morceau",          jlpt:4 },
    { jp:"延長",        kana:"えんちょう",  romaji:"enchō",       fr:"prolongation",              jlpt:3 },
    { jp:"検索する",    kana:"けんさくする", romaji:"kensaku suru", fr:"rechercher",              jlpt:3 },
  ],

  // ── @home café Akihabara ──────────────────────────────────────────────────
  "quest-maidcafe-1": [
    { jp:"おかえりなさいませ", kana:"おかえりなさいませ", romaji:"okaerinasaimase", fr:"bienvenue à la maison (accueil maid)", jlpt:4 },
    { jp:"ご主人様",    kana:"ごしゅじんさま", romaji:"goshujin-sama", fr:"maître (terme d'adresse)", jlpt:3 },
    { jp:"ただいま",    kana:"ただいま",    romaji:"tadaima",     fr:"je suis rentré(e)",         jlpt:5 },
    { jp:"オムライス",  kana:"オムライス",  romaji:"omuraisu",    fr:"omelette au riz",           jlpt:4 },
    { jp:"呪文",        kana:"じゅもん",    romaji:"jumon",       fr:"formule magique",           jlpt:3 },
    { jp:"写真",        kana:"しゃしん",    romaji:"shashin",     fr:"photo",                     jlpt:5 },
    { jp:"一緒に",      kana:"いっしょに",  romaji:"issho ni",    fr:"ensemble",                  jlpt:5 },
    { jp:"サービス",    kana:"サービス",    romaji:"sābisu",      fr:"service (offert)",          jlpt:4 },
  ],

  // ── Hôpital Keio ──────────────────────────────────────────────────────────
  "quest-hospital-1": [
    { jp:"熱",          kana:"ねつ",        romaji:"netsu",       fr:"fièvre",                    jlpt:5 },
    { jp:"喉",          kana:"のど",        romaji:"nodo",        fr:"gorge",                     jlpt:5 },
    { jp:"痛い",        kana:"いたい",      romaji:"itai",        fr:"douloureux, j'ai mal",      jlpt:5 },
    { jp:"症状",        kana:"しょうじょう", romaji:"shōjō",       fr:"symptôme",                 jlpt:3 },
    { jp:"保険",        kana:"ほけん",      romaji:"hoken",       fr:"assurance",                 jlpt:4 },
    { jp:"処方箋",      kana:"しょほうせん", romaji:"shohōsen",    fr:"ordonnance",               jlpt:3 },
    { jp:"診察",        kana:"しんさつ",    romaji:"shinsatsu",   fr:"consultation médicale",     jlpt:3 },
    { jp:"領収書",      kana:"りょうしゅうしょ", romaji:"ryōshūsho", fr:"reçu, justificatif",    jlpt:3 },
  ],

};

// ── Apply to DB ────────────────────────────────────────────────────────────────
async function main() {
  let updated = 0;
  for (const [questId, vocab] of Object.entries(QUEST_VOCAB)) {
    try {
      const result = await prisma.quest.updateMany({
        where: { id: questId },
        data:  { vocab },
      });
      if (result.count > 0) {
        console.log(`✅  ${questId} — ${vocab.length} mots`);
        updated++;
      } else {
        console.log(`⚠️  ${questId} — quête introuvable (pas encore créée en DB)`);
      }
    } catch (err) {
      console.error(`❌  ${questId}:`, err.message);
    }
  }
  console.log(`\n✅  ${updated}/${Object.keys(QUEST_VOCAB).length} quêtes mises à jour.`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

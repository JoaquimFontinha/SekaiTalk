export type SnsChoice = {
  id: string;
  jp: string;
  romaji: string;
  fr: string;
  correct: boolean;
  feedback?: string;
};

export type SnsStep = {
  id: string;
  from: "them" | "you";
  jp: string;
  romaji: string;
  fr: string;
  choices?: SnsChoice[];
};

export type SnsContact = {
  name: string;
  handle: string;
  avatar: string;
  image?: string;
  relation: string;
};

export type SnsConversation = {
  id: string;
  poiId: string;
  title: string;
  context: string;
  contact: SnsContact;
  steps: SnsStep[];
  xpReward: number;
};

const SNS_CONVERSATIONS: SnsConversation[] = [
  // ── Konbini Shinjuku ────────────────────────────────────────
  {
    id: "sns-konbini-shinjuku",
    poiId: "konbini-shinjuku",
    title: "Message de Haruki",
    context: "Ton ami t'envoie un message pendant que tu fais tes courses.",
    contact: { name: "ハルキ", handle: "@haruki_tmk", avatar: "🙃", image: "/characters/konbini_vendor.png", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "ねーねー今コンビニいる？w", romaji: "nē nē ima konbini iru? w", fr: "Hé, t'es au konbini là ? lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "うん！いるよ〜", romaji: "un! iru yo~", fr: "Ouais j'y suis !", correct: true },
        { id: "y1b", jp: "え、コンビニってスーパーと違うの？", romaji: "e, konbini tte sūpā to chigau no?", fr: "Attends, un konbini c'est pas un supermarché ?", correct: false, feedback: "Tu es DANS le konbini, cette question n'a aucun sens !" },
        { id: "y1c", jp: "今日の天気いいね！", romaji: "kyō no tenki ii ne!", fr: "Il fait beau aujourd'hui !", correct: false, feedback: "C'est complètement hors sujet !" },
      ]},
      { id: "t2", from: "them", jp: "やばー！おにぎり1個だけ買ってきてほしいんだけど🍙", romaji: "yabā! onigiri ikko dake katte kite hoshii n da kedo", fr: "Oh super ! Tu pourrais m'acheter un onigiri ? 🍙" },
      { id: "t3", from: "them", jp: "ツナマヨがいいな〜", romaji: "tsuna mayo ga ii na~", fr: "J'aimerais bien du thon mayo~" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "いいよ〜！他にいる？", romaji: "ii yo~! hoka ni iru?", fr: "Pas de prob ! T'as besoin d'autre chose ?", correct: true },
        { id: "y2b", jp: "あ、コンビニ出ちゃった笑", romaji: "a, konbini dechatta w", fr: "Oh, je viens juste de sortir du konbini lol", correct: false, feedback: "Tu es en train de lui répondre DEPUIS le konbini !" },
        { id: "y2c", jp: "おにぎりって何種類あるの？", romaji: "onigiri tte nanshurui aru no?", fr: "Y'a combien de types d'onigiris ?", correct: false, feedback: "Il t'a demandé de lui acheter, pas un cours sur les onigiris !" },
      ]},
      { id: "t4", from: "them", jp: "ほんと！？ありがとー！めっちゃ助かる🙏", romaji: "honto!? arigatō! meccha tasukaru", fr: "Vraiment !? Merci ! T'es vraiment trop sympa 🙏" },
      { id: "t5", from: "them", jp: "てかお茶も！緑茶ね！", romaji: "teka ocha mo! ryokucha ne!", fr: "Au fait, un thé aussi ! Du thé vert hein !" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "りょ！ちょ待ってて〜", romaji: "ryo! cho matte te~", fr: "OK ! Attends un peu~", correct: true },
        { id: "y3b", jp: "緑茶ってカフェインあるの？", romaji: "ryokucha tte kafein aru no?", fr: "Le thé vert contient de la caféine ?", correct: false, feedback: "Il t'a demandé d'acheter du thé, pas un cours de nutrition !" },
        { id: "y3c", jp: "お茶はどこで飲むの？", romaji: "ocha wa doko de nomu no?", fr: "Où est-ce qu'on boit le thé ?", correct: false, feedback: "Question complètement hors de propos !" },
      ]},
      { id: "t6", from: "them", jp: "マジ神！後でお金払うね〜", romaji: "maji kami! ato de okane harau ne~", fr: "T'es trop fort ! Je te rembourserai après~" },
      { id: "t7", from: "them", jp: "てかなんか食べたいw おすすめ何かある？", romaji: "teka nanka tabetai w osusume nanika aru?", fr: "Bon j'ai faim lol, t'as des reco ?" },
      { id: "y4", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y4a", jp: "サンドイッチめっちゃうまいよ！", romaji: "sandoicchi meccha umai yo!", fr: "Les sandwichs sont vraiment super bons !", correct: true },
        { id: "y4b", jp: "コンビニじゃなくてレストランに行けばw", romaji: "konbini ja nakute resutoran ni ikeba w", fr: "Tu n'as qu'à aller au restaurant lol", correct: false, feedback: "Tu lui demandes de quitter le konbini... alors qu'il t'a demandé un reco konbini !" },
        { id: "y4c", jp: "ペンギンが好き！", romaji: "pengin ga suki!", fr: "J'aime les pingouins !", correct: false, feedback: "Complètement hors sujet xD" },
      ]},
      { id: "t8", from: "them", jp: "うける〜！じゃあそれも！w ほんまありがとな〜！草", romaji: "ukeru~! ja sore mo! w honma arigatō na~! kusa", fr: "Trop drôle ! Prends-le aussi ! lol Vraiment merci ! 😂" },
    ],
  },

  // ── FamilyMart Shibuya ──────────────────────────────────────
  {
    id: "sns-familymart-shibuya",
    poiId: "familymart-shibuya",
    title: "Message de Nana",
    context: "Tard le soir, ton amie veut qu'on lui rapporte quelque chose.",
    contact: { name: "ナナ", handle: "@nana_shibuya", avatar: "🌙", image: "/characters/konbini_vendor.png", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "ねー今コンビニいる？夜食食べたいんだけどw", romaji: "nē ima konbini iru? yashoku tabetai n da kedo w", fr: "Hé t'es au konbini ? J'ai faim pour la collation de nuit lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "うん！今いるよ〜何がいい？", romaji: "un! ima iru yo~ nani ga ii?", fr: "Ouais j'y suis~ Tu veux quoi ?", correct: true },
        { id: "y1b", jp: "夜食って太るよw", romaji: "yashoku tte futoru yo w", fr: "Manger la nuit ça fait grossir lol", correct: false, feedback: "Pas la réaction attendue quand quelqu'un a faim !" },
        { id: "y1c", jp: "コンビニって何時まで開いてる？", romaji: "konbini tte nanji made aite ru?", fr: "Le konbini ferme à quelle heure ?", correct: false, feedback: "Les konbinis sont ouverts 24h/24 ! Et tu y es en ce moment !" },
      ]},
      { id: "t2", from: "them", jp: "えー！やばw ありがとー！！", romaji: "ē! yaba w arigatō!!", fr: "Oh cool ! Super !! Merci !!" },
      { id: "t3", from: "them", jp: "カップ麺と甘いものなんかない？チョコとかでいいよ〜", romaji: "kappu men to amai mono nanka nai? choko toka de ii yo~", fr: "Y'a des nouilles cup et des trucs sucrés ? Du chocolat ça va~" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "あるある！どのカップ麺にする？種類いっぱいあるよ〜", romaji: "aru aru! dono kappu men ni suru? shurui ippai aru yo~", fr: "Y'en a ! Tu veux quel cup ? Y'a plein de choix~", correct: true },
        { id: "y2b", jp: "カップ麺は体に悪いよ笑", romaji: "kappu men wa karada ni warui yo w", fr: "Les nouilles cup c'est mauvais pour la santé lol", correct: false, feedback: "Elle t'a demandé d'en acheter, pas un cours de diététique !" },
        { id: "y2c", jp: "カップ麺の作り方わかる？", romaji: "kappu men no tsukurikata wakaru?", fr: "Tu sais comment on prépare les nouilles cup ?", correct: false, feedback: "Hors sujet total, elle te demande juste d'en acheter !" },
      ]},
      { id: "t4", from: "them", jp: "じゃあ日清のどん兵衛！！好きすぎてw", romaji: "ja nissin no donbei!! suki sugite w", fr: "Alors le Donbei de Nissin !! J'adore trop ça lol" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "りょ！チョコは何がいい？いっぱいあるよ〜", romaji: "ryo! choko wa nani ga ii? ippai aru yo~", fr: "OK ! T'as quel choco en tête ? Y'en a plein~", correct: true },
        { id: "y3b", jp: "チョコは虫歯になるよ笑", romaji: "choko wa mushiba ni naru yo w", fr: "Le chocolat ça donne des caries lol", correct: false, feedback: "Encore un conseil de santé non demandé !" },
        { id: "y3c", jp: "チョコって日本語で何ていうの？", romaji: "choko tte nihongo de nan te iu no?", fr: "Comment on dit chocolat en japonais ?", correct: false, feedback: "Tu le lui as demandé en japonais... donc tu le sais déjà !" },
      ]},
      { id: "t5", from: "them", jp: "なんでもいいよ！おまかせ〜w", romaji: "nandemo ii yo! omakase~ w", fr: "N'importe lequel ! Je m'en remets à toi~ lol" },
      { id: "t6", from: "them", jp: "マジありがとー！帰ったら一緒に食べよ！草", romaji: "maji arigatō! kaettara issho ni tabeyō! kusa", fr: "Merci vraiment ! On mange ensemble quand tu rentres ! 😂" },
    ],
  },

  // ── Don Quijote Shibuya ─────────────────────────────────────
  {
    id: "sns-donquijote-shibuya",
    poiId: "donquijote-shibuya",
    title: "Message de Ryō",
    context: "Ton ami veut que tu vérifies si un article est dispo.",
    contact: { name: "リョウ", handle: "@ryo_donki", avatar: "🛒", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "今ドンキにいるよね？w", romaji: "ima donki ni iru yo ne? w", fr: "T'es au Don Quijote là ? lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "うん！なんか探してるの？", romaji: "un! nanka sagashiteru no?", fr: "Ouais ! Tu cherches quelque chose ?", correct: true },
        { id: "y1b", jp: "ドンキって何？", romaji: "donki tte nani?", fr: "C'est quoi le Don Quijote ?", correct: false, feedback: "Tu y es EN CE MOMENT... tu sais très bien ce que c'est !" },
        { id: "y1c", jp: "今家にいるよ〜", romaji: "ima ie ni iru yo~", fr: "Je suis à la maison là~", correct: false, feedback: "Il te demande DEPUIS le Don Quijote... alors que tu y es !" },
      ]},
      { id: "t2", from: "them", jp: "え！ちょうどよかった！！", romaji: "e! chōdo yokatta!!", fr: "Oh super tomber bien !!" },
      { id: "t3", from: "them", jp: "ポケモンのぬいぐるみ探してんだけど〜 ピカチュウのでっかいやつ！", romaji: "pokémon no nuigurumi sagashiteru n da kedo~ pikachū no dekkai yatsu!", fr: "Je cherche une peluche Pokémon~ Une grande de Pikachu !" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "ちょっと見てみるね！", romaji: "chotto mite miru ne!", fr: "Je jette un coup d'oeil !", correct: true },
        { id: "y2b", jp: "ピカチュウって誰？", romaji: "pikachū tte dare?", fr: "Pikachu c'est qui ?", correct: false, feedback: "Tout le monde connaît Pikachu !" },
        { id: "y2c", jp: "ぬいぐるみは苦手なんだよね", romaji: "nuigurumi wa nigate na n da yo ne", fr: "J'aime pas trop les peluches moi", correct: false, feedback: "Il t'a demandé de chercher, pas ton avis sur les peluches !" },
      ]},
      { id: "t4", from: "them", jp: "まじ！？ありがとー！もしあったら値段も教えて〜", romaji: "maji!? arigatō! moshi attara nedan mo oshiete~", fr: "Sérieux !? Merci ! Si t'en trouves, dis-moi le prix~" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "りょ！見つけたら連絡するね〜", romaji: "ryo! mitsukettara renraku suru ne~", fr: "OK ! Je te préviens si j'en trouve~", correct: true },
        { id: "y3b", jp: "ポケモンは任天堂だよw", romaji: "pokémon wa nintendō da yo w", fr: "Pokémon c'est Nintendo lol", correct: false, feedback: "C'est une info totalement inutile dans ce contexte !" },
        { id: "y3c", jp: "ドンキって安いの？", romaji: "donki tte yasui no?", fr: "Don Quijote c'est pas cher ?", correct: false, feedback: "Tu y es, tu peux vérifier toi-même !" },
      ]},
      { id: "t5", from: "them", jp: "やばやば！マジ神！🙏", romaji: "yabayaba! maji kami!", fr: "T'es trop fort ! 🙏" },
      { id: "t6", from: "them", jp: "ドンキって全然時間溶けるよねw", romaji: "donki tte zenzen jikan tokeru yo ne w", fr: "Au Don Quijote le temps passe tellement vite lol" },
    ],
  },

  // ── Starbucks Shibuya ───────────────────────────────────────
  {
    id: "sns-starbucks-shibuya",
    poiId: "starbucks-shibuya",
    title: "Message de Haruna",
    context: "Ton amie veut te rejoindre pour un café.",
    contact: { name: "ハルナ", handle: "@haruna_coffee", avatar: "☕", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "今スタバにいる？w", romaji: "ima sutaba ni iru? w", fr: "T'es au Starbucks là ? lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "うん！渋谷スクランブルの！", romaji: "un! shibuya sukuranburu no!", fr: "Ouais ! Celui du Scramble de Shibuya !", correct: true },
        { id: "y1b", jp: "スタバって何のこと？", romaji: "sutaba tte nani no koto?", fr: "C'est quoi le Starbucks ?", correct: false, feedback: "Starbucks c'est la chaîne de café mondiale... et tu y es !" },
        { id: "y1c", jp: "今図書館で勉強中w", romaji: "ima toshokan de benkyō chū w", fr: "Je révise à la bibliothèque là lol", correct: false, feedback: "Tu es AU Starbucks, pas à la bibliothèque !" },
      ]},
      { id: "t2", from: "them", jp: "えw！私も行きたい！今から行っていい？", romaji: "e w! watashi mo ikitai! ima kara itte ii?", fr: "Oh lol ! Moi aussi je veux venir ! Je peux arriver maintenant ?" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "もちろん！いつでもおいでー！", romaji: "mochiron! itsudemo oide~!", fr: "Bien sûr ! Viens quand tu veux !", correct: true },
        { id: "y2b", jp: "スタバって高くない？", romaji: "sutaba tte takakunai?", fr: "Le Starbucks c'est pas un peu cher ?", correct: false, feedback: "Tu es déjà là, c'est un peu tard pour ce débat !" },
        { id: "y2c", jp: "コーヒーは苦手なんだよね", romaji: "kōhī wa nigate na n da yo ne", fr: "Je n'aime pas trop le café moi", correct: false, feedback: "Tu es AU Starbucks... et tu dis que t'aimes pas le café ?!" },
      ]},
      { id: "t3", from: "them", jp: "やったー！！何飲んでるの？", romaji: "yattā!! nani nonde ru no?", fr: "Super !! T'es en train de boire quoi ?" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "抹茶ラテ！めっちゃうまいよ〜！", romaji: "maccha rate! meccha umai yo~!", fr: "Un matcha latte ! C'est trop bon~!", correct: true },
        { id: "y3b", jp: "水を飲んでいます", romaji: "mizu wo nonde imasu", fr: "Je bois de l'eau", correct: false, feedback: "On est au Starbucks, t'aurais pu commander un truc !" },
        { id: "y3c", jp: "まだ注文してない笑", romaji: "mada chūmon shite nai w", fr: "J'ai pas encore commandé lol", correct: false, feedback: "Elle t'a demandé ce que tu bois, ça implique que tu bois quelque chose !" },
      ]},
      { id: "t4", from: "them", jp: "うわー！私もそれにする！！今から行くね！ちょ待ってて〜！", romaji: "uwa~! watashi mo sore ni suru!! ima kara iku ne! cho matte te~!", fr: "Waouh ! La même pour moi !! J'arrive ! Attends~!" },
      { id: "t5", from: "them", jp: "席キープしといてw", romaji: "seki kiipu shitoi te w", fr: "Garde-moi une place lol" },
    ],
  },

  // ── Gare JR Shinjuku ───────────────────────────────────────
  {
    id: "sns-jr-shinjuku",
    poiId: "jr-shinjuku",
    title: "Message de Naomi",
    context: "Ton amie s'est perdue dans le labyrinthe de Shinjuku.",
    contact: { name: "ナオミ", handle: "@naomi_trains", avatar: "🚃", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "今新宿駅どこにいる？w 迷子になったw", romaji: "ima shinjuku eki doko ni iru? w maigo ni natta w", fr: "T'es où dans la gare de Shinjuku ? lol Je me suis perdue lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "南口にいるよ！どこにいるの？", romaji: "minami guchi ni iru yo! doko ni iru no?", fr: "Je suis à la sortie sud ! T'es où toi ?", correct: true },
        { id: "y1b", jp: "新宿って東京にあるの？", romaji: "shinjuku tte tōkyō ni aru no?", fr: "Shinjuku c'est à Tokyo ?", correct: false, feedback: "On est à Shinjuku EN CE MOMENT... évidemment c'est à Tokyo !" },
        { id: "y1c", jp: "電車は何時に来るの？", romaji: "densha wa nanji ni kuru no?", fr: "Le train arrive à quelle heure ?", correct: false, feedback: "Elle est perdue, pas en attente d'un train !" },
      ]},
      { id: "t2", from: "them", jp: "え！南口ってどこ！？w", romaji: "e! minami guchi tte doko!? w", fr: "C'est où la sortie sud !? lol" },
      { id: "t3", from: "them", jp: "新宿でか過ぎてわからん笑", romaji: "shinjuku deka sugite wakaran w", fr: "Shinjuku est trop grand je comprends rien lol" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "わかるw！今地図送るね！ちょ待ってて", romaji: "wakaru w! ima chizu okuru ne! cho matte te", fr: "Je comprends lol ! Je t'envoie un plan ! Attends", correct: true },
        { id: "y2b", jp: "新宿は駅が200個くらいあるらしいよ！", romaji: "shinjuku wa eki ga nihyakko kurai aru rashii yo!", fr: "Shinjuku aurait genre 200 sorties apparemment !", correct: false, feedback: "C'est une info inutile pour quelqu'un de perdu !" },
        { id: "y2c", jp: "じゃあ迷子センターに行って笑", romaji: "ja maigo sentā ni itte w", fr: "Va au bureau des objets perdus lol", correct: false, feedback: "Elle n'est pas un enfant perdu !" },
      ]},
      { id: "t4", from: "them", jp: "ありがとー！マジ助かる！！", romaji: "arigatō! maji tasukaru!!", fr: "Merci ! T'es vraiment un sauveur !!" },
      { id: "t5", from: "them", jp: "てか新宿の乗り換えって毎回迷うんだけどw どうやって覚えた？", romaji: "teka shinjuku no norikae tte maikai mayou n da kedo w dō yatte oboeta?", fr: "À chaque fois je me perds pour les correspondances lol, t'as mémorisé comment ?" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "慣れるしかないよ笑！毎日乗ってたらわかるようになるよ！", romaji: "nareru shika nai yo w! mainichi notte tara wakaru yō ni naru yo!", fr: "Faut juste s'y faire lol ! À force tu mémorises !", correct: true },
        { id: "y3b", jp: "新宿は存在しないよw", romaji: "shinjuku wa sonzai shinai yo w", fr: "Shinjuku ça existe pas lol", correct: false, feedback: "On est À Shinjuku..." },
        { id: "y3c", jp: "電車に乗らなければいい笑", romaji: "densha ni noranakere ba ii w", fr: "T'as qu'à ne plus prendre le train lol", correct: false, feedback: "Conseil inutile pour quelqu'un qui vit à Tokyo !" },
      ]},
      { id: "t6", from: "them", jp: "だよねー笑 じゃあ南口で待ってるね！見えたら連絡する！", romaji: "da yo ne~! w ja minami guchi de matte ru ne! mietara renraku suru!", fr: "T'as raison ! lol Alors j'attends à la sortie sud ! Je te préviens !" },
    ],
  },

  // ── @home café Akihabara ────────────────────────────────────
  {
    id: "sns-at-home-cafe-akihabara",
    poiId: "at-home-cafe-akihabara",
    title: "Message de Yuuki",
    context: "Ton ami otaku te contacte depuis Akihabara.",
    contact: { name: "ユウキ", handle: "@yuuki_akiba", avatar: "🎮", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "今アキバにいるよね？！新しいフィギュア出たんだけど！！", romaji: "ima akiba ni iru yo ne?! atarashii figua deta n da kedo!!", fr: "T'es à Akiba là ?! Un nouveau figurine est sorti !!" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "え！マジ！？どのやつ！？", romaji: "e! maji!? dono yatsu!?", fr: "Quoi ! Sérieux !? Lequel ?!", correct: true },
        { id: "y1b", jp: "フィギュアって食べられるの？", romaji: "figua tte taberareru no?", fr: "Les figurines ça se mange ?", correct: false, feedback: "Non... les figurines ça ne se mange pas !" },
        { id: "y1c", jp: "秋葉原って電車で行けるの？", romaji: "akihabara tte densha de ikeru no?", fr: "On peut y aller en train à Akihabara ?", correct: false, feedback: "Tu y es déjà !" },
      ]},
      { id: "t2", from: "them", jp: "鬼滅の炭治郎！！新しいやつ！！限定版！！", romaji: "kimetsu no tanjirō!! atarashii yatsu!! genteiban!!", fr: "Tanjiro de Demon Slayer !! Le nouveau !! Édition limitée !!" },
      { id: "t3", from: "them", jp: "まじ買うしかないじゃん！！草", romaji: "maji kau shika nai jan!! kusa", fr: "Faut absolument l'acheter !! 😂" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "うわー！それは買うしかないね！笑 いくら？", romaji: "uwa~! sore wa kau shika nai ne! w ikura?", fr: "Wow ! Faut le prendre oui ! lol C'est combien ?", correct: true },
        { id: "y2b", jp: "鬼滅って鬼の話でしょ？怖そうw", romaji: "kimetsu tte oni no hanashi desho? kowasō w", fr: "Demon Slayer c'est une histoire de démons non ? Ça fait peur lol", correct: false, feedback: "C'est une super série, et il te demande l'intérêt de l'acheter pas un résumé !" },
        { id: "y2c", jp: "フィギュアより本物の刀の方がよくない？", romaji: "figua yori honmono no katana no hō ga yoku nai?", fr: "Un vrai katana c'est mieux qu'une figurine non ?", correct: false, feedback: "Complètement hors de propos !" },
      ]},
      { id: "t4", from: "them", jp: "9800円！！高いけどしゃーない！！", romaji: "kyūsen happyaku en!! takai kedo shānai!!", fr: "9800 yens !! C'est cher mais tant pis !!" },
      { id: "t5", from: "them", jp: "一緒に見に来ない？！限定だから早くなくなるよ！！", romaji: "isshoni mi ni konai?! genteida kara hayaku nakunaru yo!!", fr: "Tu veux pas venir voir ?! C'est une édition limitée ça va partir vite !!" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "今から行く！！ちょ待ってて！！", romaji: "ima kara iku!! cho matte te!!", fr: "J'arrive !! Attends un peu !!", correct: true },
        { id: "y3b", jp: "フィギュアって何センチあるの？", romaji: "figua tte nansen chi aru no?", fr: "La figurine fait combien de centimètres ?", correct: false, feedback: "Il t'a invité à venir la voir, pas à demander sa taille !" },
        { id: "y3c", jp: "アキバって遠いよね", romaji: "akiba tte tōi yo ne", fr: "C'est loin Akihabara non", correct: false, feedback: "Tu Y ES déjà !" },
      ]},
      { id: "t6", from: "them", jp: "やったー！！待ってるよ！！絶対後悔しないって！！w", romaji: "yattā!! matte ru yo!! zettai kōkai shinai tte!! w", fr: "Super !! Je t'attends !! Tu regretteras pas !! lol" },
    ],
  },

  // ── Tokyo Skytree ───────────────────────────────────────────
  {
    id: "sns-tokyo-skytree",
    poiId: "tokyo-skytree",
    title: "Message de Kenta",
    context: "Ton ami visite le Tokyo Skytree pour la première fois.",
    contact: { name: "ケンタ", handle: "@kenta_sky", avatar: "🗼", relation: "Ami(e)" },
    xpReward: 30,
    steps: [
      { id: "t1", from: "them", jp: "今スカイツリーいるんだけど！！やばすぎw", romaji: "ima sukaitsurii iru n da kedo!! yaba sugi w", fr: "Je suis au Tokyo Skytree !! C'est dingue lol" },
      { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y1a", jp: "えw！マジ！？景色どう！？", romaji: "e w! maji!? keshiki dō!?", fr: "Oh lol ! Vraiment !? La vue c'est comment ?!", correct: true },
        { id: "y1b", jp: "スカイツリーって食べ物屋さん？", romaji: "sukaitsurii tte tabemono yasan?", fr: "Le Skytree c'est un restaurant ?", correct: false, feedback: "C'est la plus haute tour du Japon !" },
        { id: "y1c", jp: "今雨降ってるの？", romaji: "ima ame futteru no?", fr: "Il pleut là ?", correct: false, feedback: "Il parle de la vue magnifique, pas de la météo !" },
      ]},
      { id: "t2", from: "them", jp: "めっちゃきれい！！東京全体見えるし！！", romaji: "meccha kirei!! tōkyō zentai mieru shi!!", fr: "Super beau !! On voit tout Tokyo !!" },
      { id: "t3", from: "them", jp: "天気いいから富士山まで見えてる！！草", romaji: "tenki ii kara fujisan made miete ru!! kusa", fr: "Il fait beau donc on voit même le Mont Fuji !! 😂" },
      { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y2a", jp: "えw！富士山まで！？やばくない！？", romaji: "e w! fujisan made!? yabakunai!?", fr: "Lol ! Jusqu'au Mont Fuji !? C'est dingue non !?", correct: true },
        { id: "y2b", jp: "富士山って登れるの？", romaji: "fujisan tte noboreru no?", fr: "On peut escalader le Mont Fuji ?", correct: false, feedback: "Il parle de le voir depuis le Skytree, pas de l'escalader !" },
        { id: "y2c", jp: "富士山って北海道にあるよね？", romaji: "fujisan tte hokkaidō ni aru yo ne?", fr: "Le Mont Fuji c'est à Hokkaido non ?", correct: false, feedback: "Non... le Fuji est près de Tokyo ! On vient de le voir depuis là-bas !" },
      ]},
      { id: "t4", from: "them", jp: "ほんとに！！写真撮りまくってるw", romaji: "hontoni!! shashin torimakutte ru w", fr: "Vraiment !! Je prends des tonnes de photos lol" },
      { id: "t5", from: "them", jp: "てか展望デッキって2つあるじゃん！どっちがおすすめ？", romaji: "teka tenbō dekki tte futatsu aru jan! docchi ga osusume?", fr: "Au fait y'a deux terrasses ! Laquelle tu recommandes ?" },
      { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
        { id: "y3a", jp: "天望回廊の方がやばいよ！ガラス床あるし！", romaji: "tenbō kairō no hō ga yabai yo! garasu yuka aru shi!", fr: "La Tembo Galleria c'est trop bien ! Y'a un plancher en verre !", correct: true },
        { id: "y3b", jp: "スカイツリーって何階建て？", romaji: "sukaitsurii tte nankai date?", fr: "Le Skytree fait combien d'étages ?", correct: false, feedback: "Il t'a demandé une recommandation, pas l'architecture du bâtiment !" },
        { id: "y3c", jp: "どっちも怖いから行かない方がいいよw", romaji: "docchi mo kowai kara ikanai hō ga ii yo w", fr: "Les deux font peur, vaut mieux pas y aller lol", correct: false, feedback: "Il est déjà là-haut... un peu tard pour lui dire ça !" },
      ]},
      { id: "t6", from: "them", jp: "うわー！絶対行く！！ありがとー！！", romaji: "uwa~! zettai iku!! arigatō!!", fr: "Waouh ! J'y vais absolument !! Merci !!" },
      { id: "t7", from: "them", jp: "てかガラス床こわいって笑 でも行くw", romaji: "teka garasu yuka kowai tte w demo iku w", fr: "Le plancher en verre ça fait peur lol Mais j'y vais lol" },
    ],
  },
];

export function getSnsConversation(poiId: string): SnsConversation | null {
  return SNS_CONVERSATIONS.find(c => c.poiId === poiId) ?? null;
}

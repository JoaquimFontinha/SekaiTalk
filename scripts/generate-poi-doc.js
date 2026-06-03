const fs = require('fs');

const themes = [
  { title: '✈️ Premier pas à Tokyo',  poiIds: ['haneda-airport','tokyo-station-shinkansen','jr-shinjuku'] },
  { title: '🏨 Se loger',             poiIds: ['nine-hours-shinjuku','grand-hyatt-tokyo'] },
  { title: '🏪 La vie quotidienne',   poiIds: ['7eleven-shinjuku','familymart-shibuya','lawson-harajuku','matsumoto-kiyoshi-akiba','tokyo-central-post'] },
  { title: '🍜 Manger & Boire',       poiIds: ['starbucks-shibuya','mcdonalds-shibuya','asahi-super-dry-hall'] },
  { title: '🛍️ Shopping',            poiIds: ['loft-shibuya','shibuya-109','donquijote-shibuya','yodobashi-akiba','lumine-est-shinjuku'] },
  { title: '⛩️ Découvrir Tokyo',     poiIds: ['tokyo-skytree','tokyo-tower','meiji-jingu','sensoji','tokyo-national-museum','tokyo-metro-theatre','big-echo-kabukicho','at-home-cafe-akihabara','keio-hospital'] },
];

const pois = [
  { id:'haneda-airport',             name:'Aéroport International Haneda',    type:'transport' },
  { id:'tokyo-station-shinkansen',   name:'Gare de Tokyo — Shinkansen',       type:'transport' },
  { id:'jr-shinjuku',                name:'Gare JR Shinjuku',                 type:'transport' },
  { id:'nine-hours-shinjuku',        name:'Nine Hours Shinjuku-North',        type:'hotel' },
  { id:'grand-hyatt-tokyo',          name:'Grand Hyatt Tokyo',                type:'hotel' },
  { id:'7eleven-shinjuku',           name:'7-Eleven Kabukichō',               type:'konbini' },
  { id:'familymart-shibuya',         name:'FamilyMart Shibuya',               type:'konbini' },
  { id:'lawson-harajuku',            name:'Lawson Harajuku',                  type:'konbini' },
  { id:'matsumoto-kiyoshi-akiba',    name:'Matsumoto Kiyoshi Akihabara',      type:'pharmacie' },
  { id:'tokyo-central-post',         name:'Bureau de Poste Central de Tokyo', type:'poste' },
  { id:'starbucks-shibuya',          name:'Starbucks Shibuya Scramble',       type:'café' },
  { id:'mcdonalds-shibuya',          name:"McDonald's Shibuya",               type:'restaurant' },
  { id:'asahi-super-dry-hall',       name:'Asahi Super Dry Hall',             type:'izakaya' },
  { id:'loft-shibuya',               name:'Loft Shibuya',                     type:'shop' },
  { id:'shibuya-109',                name:'SHIBUYA109',                       type:'shop' },
  { id:'donquijote-shibuya',         name:'Mega Don Quijote Shibuya',         type:'shop' },
  { id:'yodobashi-akiba',            name:'Yodobashi-Akiba',                  type:'shop' },
  { id:'lumine-est-shinjuku',        name:'Lumine Est Shinjuku',              type:'shop' },
  { id:'tokyo-skytree',              name:'Tokyo Skytree',                    type:'site' },
  { id:'tokyo-tower',                name:'Tour de Tokyo',                    type:'site' },
  { id:'meiji-jingu',                name:'Meiji Jingū',                      type:'site' },
  { id:'sensoji',                    name:'Sensō-ji',                         type:'site' },
  { id:'tokyo-national-museum',      name:'Tokyo National Museum',            type:'site' },
  { id:'tokyo-metro-theatre',        name:'Tokyo Metropolitan Theatre',       type:'site' },
  { id:'big-echo-kabukicho',         name:'Big Echo Kabukichō',               type:'loisir' },
  { id:'at-home-cafe-akihabara',     name:'@home café Akihabara',             type:'loisir' },
  { id:'keio-hospital',              name:'Hôpital Keio University',          type:'médecin' },
];

const characters = {
  'haneda-airport':             { name:'Nakamura Yuki',   nameJp:'中村 雪',   role:"Agente d'accueil — Aéroport Haneda" },
  'tokyo-station-shinkansen':   { name:'Watanabe Ryō',    nameJp:'渡辺 亮',   role:'Agent JR — Gares de Tokyo' },
  'jr-shinjuku':                { name:'Watanabe Ryō',    nameJp:'渡辺 亮',   role:'Agent JR — Gares de Tokyo' },
  'nine-hours-shinjuku':        { name:'Kimura Mai',      nameJp:'木村 舞',   role:'Réceptionniste — Nine Hours' },
  'grand-hyatt-tokyo':          { name:'Inoue Sora',      nameJp:'井上 蒼',   role:'Concierge — Grand Hyatt Tokyo' },
  '7eleven-shinjuku':           { name:'Aoki Kai',        nameJp:'青木 海',   role:'Vendeur — 7-Eleven Kabukichō' },
  'familymart-shibuya':         { name:'Satō Yuna',       nameJp:'佐藤 柚那', role:'Caissière — FamilyMart Shibuya' },
  'lawson-harajuku':            { name:'Hayashi Leo',     nameJp:'林 玲央',   role:'Gérant — Lawson Harajuku' },
  'matsumoto-kiyoshi-akiba':    { name:'Ogawa Nana',      nameJp:'小川 奈々', role:'Pharmacienne — Matsumoto Kiyoshi' },
  'tokyo-central-post':         { name:'Tanaka Hiroshi',  nameJp:'田中 博',   role:'Agent — Bureau de Poste Central' },
  'starbucks-shibuya':          { name:'Fujii Saki',      nameJp:'藤井 咲',   role:'Barista — Starbucks Shibuya' },
  'mcdonalds-shibuya':          { name:'Nishimura Mia',   nameJp:'西村 美亜', role:"Caissière — McDonald's Shibuya" },
  'asahi-super-dry-hall':       { name:'Itō Ken',         nameJp:'伊藤 健',   role:'Barman — Asahi Super Dry Hall' },
  'loft-shibuya':               { name:'Matsuda Daiki',   nameJp:'松田 大輝', role:'Conseiller — Loft Shibuya' },
  'shibuya-109':                { name:'Nakashima Yuko',  nameJp:'中島 由子', role:'Vendeuse — SHIBUYA109' },
  'donquijote-shibuya':         { name:'Yamamoto Kota',   nameJp:'山本 航太', role:'Vendeur — Mega Don Quijote' },
  'yodobashi-akiba':            { name:'Endō Yuji',       nameJp:'遠藤 勇二', role:'Expert — Yodobashi-Akiba' },
  'lumine-est-shinjuku':        { name:'Miura Aki',       nameJp:'三浦 亜希', role:'Hôtesse — Lumine Est Shinjuku' },
  'tokyo-skytree':              { name:'Katō Ren',        nameJp:'加藤 蓮',   role:'Guide — Tokyo Skytree' },
  'tokyo-tower':                { name:'Suzuki Hiro',     nameJp:'鈴木 大',   role:'Guide — Tokyo Tower' },
  'meiji-jingu':                { name:'Shimizu Miko',    nameJp:'清水 巫女', role:'Miko — Meiji Jingū' },
  'sensoji':                    { name:'Tanaka Ryūsei',   nameJp:'田中 龍星', role:'Prêtre — Sensō-ji' },
  'tokyo-national-museum':      { name:'Yamada Keiji',    nameJp:'山田 啓二', role:'Conservateur — Musée National de Tokyo' },
  'tokyo-metro-theatre':        { name:'Kobayashi Emi',   nameJp:'小林 絵美', role:'Ouvreuse — Théâtre Métropolitain' },
  'big-echo-kabukicho':         { name:'Nakamura Haru',   nameJp:'中村 晴',   role:'Staff — Big Echo Kabukichō' },
  'at-home-cafe-akihabara':     { name:'Kawase Moe',      nameJp:'川瀬 萌',   role:'Maid — @home café Akihabara' },
  'keio-hospital':              { name:'Fujiwara Aya',    nameJp:'藤原 彩',   role:'Infirmière — Hôpital Keio' },
};

const logoMap = {
  'jr-shinjuku':'jr-shinjuku.svg','tokyo-station-shinkansen':'shinkansen.png',
  'haneda-airport':'haneda.png','7eleven-shinjuku':'7eleven.png',
  'familymart-shibuya':'familymart.webp','lawson-harajuku':'lawson.png',
  'donquijote-shibuya':'donquijote.webp','loft-shibuya':'loft.png',
  'shibuya-109':'shibuya109.png','yodobashi-akiba':'yodobashi.jpg',
  'lumine-est-shinjuku':'lumine.jpg','mcdonalds-shibuya':'mcdonalds.png',
  'starbucks-shibuya':'starbucks.png','nine-hours-shinjuku':'nine-hours.jpg',
  'grand-hyatt-tokyo':'grand-hyatt.jpg','matsumoto-kiyoshi-akiba':'matsumoto-kiyoshi.jpg',
  'tokyo-central-post':'tokyo-post.png','tokyo-skytree':'tokyo-skytree.png',
  'tokyo-tower':'tokyo-tower.png','tokyo-national-museum':'tokyo-national-museum.png',
  'asahi-super-dry-hall':'asahi.png','big-echo-kabukicho':'big-echo.webp',
  'at-home-cafe-akihabara':'at-home-cafe.webp',
};

const entrySounds = {
  '7eleven-shinjuku':'/sounds/konbini_enter.mp3',
  'familymart-shibuya':'/sounds/konbini_enter.mp3',
  'lawson-harajuku':'/sounds/konbini_enter.mp3',
};

const lessons = {
  'haneda-airport':           { title:"Bienvenue à l'aéroport Haneda",           desc:"Vocabulaire essentiel pour arriver et s'orienter à l'aéroport" },
  'tokyo-station-shinkansen': { title:'Le Shinkansen',                            desc:'Maîtrise le vocabulaire du train à grande vitesse japonais' },
  'jr-shinjuku':              { title:'La Gare de Shinjuku',                      desc:"S'orienter et acheter une IC card à la plus grande gare du monde" },
  'nine-hours-shinjuku':      { title:'Le Capsule Hotel',                         desc:'Vocabulaire pour le check-in dans un capsule hôtel design' },
  'grand-hyatt-tokyo':        { title:"À l'hôtel de luxe",                        desc:"Expressions polies pour un séjour dans un palace japonais" },
  '7eleven-shinjuku':         { title:'Le Konbini 7-Eleven',                      desc:'Vocabulaire essentiel du konbini japonais' },
  'familymart-shibuya':       { title:'FamilyMart et le ファミチキ',              desc:'Commande, paiement et produits signature de FamilyMart' },
  'lawson-harajuku':          { title:'Lawson et les desserts japonais',           desc:'Découvre les sucreries et le programme fidélité Ponta' },
  'matsumoto-kiyoshi-akiba':  { title:'À la pharmacie japonaise',                 desc:'Expliquer ses symptômes et acheter des médicaments' },
  'tokyo-central-post':       { title:'La Poste japonaise',                       desc:'Envoyer un colis et remplir les formulaires' },
  'starbucks-shibuya':        { title:'Commander au Starbucks',                   desc:'Tailles, personnalisations et le Scramble Crossing' },
  'mcdonalds-shibuya':        { title:"McDonald's japonais",                      desc:'Menus exclusifs et commandes au Japon' },
  'asahi-super-dry-hall':     { title:"L'izakaya japonais",                       desc:"Commander des bières et petits plats dans un izakaya" },
  'loft-shibuya':             { title:'Le Loft Shibuya',                          desc:"Papeterie, cadeaux et emballages au Loft" },
  'shibuya-109':              { title:'Shopping mode au SHIBUYA109',              desc:"Tailles japonaises, cabines d'essayage et tendances" },
  'donquijote-shibuya':       { title:'Don Quijote et la détaxe',                desc:'Naviguer dans le magasin et obtenir la Tax Free' },
  'yodobashi-akiba':          { title:'Électronique à Yodobashi',                 desc:'Comparer appareils et obtenir garantie + détaxe' },
  'lumine-est-shinjuku':      { title:'Lumine Est Shinjuku',                      desc:'Trouver son chemin dans un grand centre commercial' },
  'tokyo-skytree':            { title:'Au sommet du Tokyo Skytree',               desc:'Billets, hauteurs et histoire de la tour' },
  'tokyo-tower':              { title:'La Tour de Tokyo',                         desc:'Histoire, horaires et illuminations nocturnes' },
  'meiji-jingu':              { title:'Le Meiji Jingū',                           desc:'Rites shinto et omamori au sanctuaire' },
  'sensoji':                  { title:"Le Sensō-ji d'Asakusa",                   desc:'Temple bouddhiste, omikuji et souvenirs' },
  'tokyo-national-museum':    { title:'Musée National de Tokyo',                  desc:'Trésors, audioguide et fermeture' },
  'tokyo-metro-theatre':      { title:'Au Théâtre Métropolitain',                 desc:'Programme, billets et vestiaire au TMT' },
  'big-echo-kabukicho':       { title:'Karaoké au Big Echo',                      desc:'Réserver une salle et chanter en japonais' },
  'at-home-cafe-akihabara':   { title:"L'expérience maid café",                  desc:'Accueil, commande et photo souvenir' },
  'keio-hospital':            { title:"À l'hôpital Keio",                        desc:'Exprimer ses symptômes et naviguer le système de santé' },
};

const quests = [
  { p:'haneda-airport', t:"Passer l'immigration", d:"Franchis le contrôle des passeports.", xp:60, vocab:[],
    tasks:[
      { n:1, i:"Présente ton passeport et dis bonjour à l'agent", c:[{t:"✅ Tu as présenté ton passeport et dit 'こんにちは'"},{t:"Tu as dit ton nom sans passeport"},{t:"Tu as parlé en anglais"}] },
      { n:2, i:"Dis que tu viens pour le tourisme (観光)", c:[{t:"✅ L'agent a compris : tu viens en touriste"},{t:"L'agent pense que tu viens pour le travail"},{t:"L'agent n'a pas compris"}] },
      { n:3, i:"Dis combien de jours tu restes (例：7日間)", c:[{t:"✅ L'agent a noté la durée exacte de ton séjour"},{t:"L'agent n'a pas eu de réponse claire"},{t:"Tu as dit une durée impossible"}] },
    ]},
  { p:'haneda-airport', t:"Rejoindre le centre-ville", d:"Demande comment prendre le bus limousine jusqu'à Shinjuku.", xp:50, vocab:[],
    tasks:[
      { n:1, i:"Demande où se trouvent les bus pour Shinjuku", c:[{t:"✅ L'agent t'a indiqué le terminal B1"},{t:"L'agent t'a envoyé au train"},{t:"L'agent n'a pas compris ta destination"}] },
      { n:2, i:"Demande le prix et la durée du trajet", c:[{t:"✅ Tu sais que c'est 1300¥ et ~50 minutes"},{t:"Tu n'as obtenu que le prix"},{t:"Tu n'as pas compris la durée"}] },
      { n:3, i:"Achète ton billet et dis merci", c:[{t:"✅ Transaction réussie, tu as remercié poliment"},{t:"Tu as oublié de remercier"},{t:"Tu as payé le mauvais montant"}] },
    ]},
  { p:'tokyo-station-shinkansen', t:"Acheter un billet Shinkansen", d:"Achète un billet pour Kyoto, siège fenêtre non-fumeur.", xp:70, vocab:[],
    tasks:[
      { n:1, i:"Demande un aller simple pour Kyoto", c:[{t:"✅ L'agent a compris : aller simple pour Kyoto"},{t:"L'agent a réservé un aller-retour"},{t:"Tu as demandé Osaka par erreur"}] },
      { n:2, i:"Précise : siège réservé, côté fenêtre, non-fumeur", c:[{t:"✅ L'agent a bien noté tes préférences de siège"},{t:"L'agent a réservé côté couloir"},{t:"Tu n'as pas précisé non-fumeur"}] },
      { n:3, i:"Confirme le prix et paye", c:[{t:"✅ Paiement effectué, tu as ton billet"},{t:"Tu as refusé en entendant le prix"},{t:"Tu as oublié de vérifier la date"}] },
    ]},
  { p:'jr-shinjuku', t:"S'orienter à Shinjuku", d:"Trouve la bonne sortie et achète une carte IC.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Demande quelle sortie pour Kabukichō (東口 ou 南口 ?)", c:[{t:"✅ L'agent t'a dit d'aller à la 東口 (sortie Est)"},{t:"L'agent t'a envoyé à la sortie Sud"},{t:"L'agent n'a pas compris Kabukichō"}] },
      { n:2, i:"Demande comment acheter une carte Suica", c:[{t:"✅ Tu sais maintenant comment acheter une Suica"},{t:"L'agent t'a renvoyé au guichet principal"},{t:"Tu pensais que la Suica était gratuite"}] },
      { n:3, i:"Demande quelle ligne pour aller à Shibuya", c:[{t:"✅ L'agent t'a dit la ligne Yamanote, direction Shibuya"},{t:"L'agent t'a envoyé sur la mauvaise ligne"},{t:"Tu as demandé Akihabara par erreur"}] },
    ]},
  { p:'nine-hours-shinjuku', t:"Check-in au Nine Hours", d:"Effectue ton check-in dans ce capsule hôtel design.", xp:50, vocab:[],
    tasks:[
      { n:1, i:"Donne ton nom et numéro de réservation", c:[{t:"✅ Check-in confirmé avec ton nom"},{t:"Le nom n'a pas été trouvé dans le système"},{t:"Tu as donné le mauvais nom"}] },
      { n:2, i:"Demande l'heure du check-out et les règles du casier", c:[{t:"✅ Tu sais : check-out à 10h, casier avec ta clé"},{t:"Tu n'as pas compris l'heure du check-out"},{t:"Tu pensais que le check-out était à midi"}] },
      { n:3, i:"Demande où sont les douches et le pyjama", c:[{t:"✅ Tu as trouvé les douches et reçu un pyjama"},{t:"Tu pensais que les douches étaient dans la capsule"},{t:"Tu as oublié de demander le pyjama"}] },
    ]},
  { p:'grand-hyatt-tokyo', t:"Séjour au Grand Hyatt", d:"Check-in dans ce palace de Roppongi et commande le room service.", xp:80, vocab:[],
    tasks:[
      { n:1, i:"Dis que tu as une réservation et demande si un upgrade est possible", c:[{t:"✅ Le concierge a vérifié et propose une meilleure chambre"},{t:"Aucun upgrade disponible ce soir"},{t:"Tu n'as pas osé demander l'upgrade"}] },
      { n:2, i:"Commande le room service : soba froide et thé vert", c:[{t:"✅ Commande passée : soba et thé dans 30 minutes"},{t:"Tu as commandé de la nourriture occidentale par erreur"},{t:"Tu as raccroché sans confirmer"}] },
      { n:3, i:"Demande un réveil (モーニングコール) pour 7h00", c:[{t:"✅ Réveil confirmé pour 7h00"},{t:"Tu as demandé 7h mais l'hôtel a noté 17h"},{t:"Tu n'as pas demandé de réveil"}] },
    ]},
  { p:'7eleven-shinjuku', t:"Café et snacks au 7-Eleven", d:"Commande un café fraîchement torréfié et des snacks.", xp:45, vocab:[],
    tasks:[
      { n:1, i:"Demande où se trouvent les onigiri au saumon", c:[{t:"✅ Tu as trouvé les onigiri au saumon"},{t:"Tu as pris du thon mayo par erreur"},{t:"L'employé n'a pas compris ta demande"}] },
      { n:2, i:"Commande un café taille M (セブンカフェ) à la machine", c:[{t:"✅ Tu as commandé et payé ton café M correctement"},{t:"Tu as pris un café trop grand"},{t:"Tu n'as pas compris la machine"}] },
      { n:3, i:"Demande si les onigiri peuvent être chauffés (温めますか？)", c:[{t:"✅ L'employé t'a montré le micro-ondes en libre-service"},{t:"Tu as mangé l'onigiri froid"},{t:"L'employé a réchauffé pour toi à la caisse"}] },
    ]},
  { p:'familymart-shibuya', t:"Le bento du midi", d:"Choisis et achète un bento, paie et demande des baguettes.", xp:45, vocab:[],
    tasks:[
      { n:1, i:"Demande ce que c'est 'ファミチキ'", c:[{t:"✅ Tu sais maintenant ce qu'est le ファミチキ"},{t:"Tu as confondu avec un onigiri"},{t:"Tu n'as pas compris l'explication"}] },
      { n:2, i:"Achète un bento et un ファミチキ", c:[{t:"✅ Tu as acheté le bento et le ファミチキ"},{t:"Tu as oublié le ファミチキ"},{t:"Tu as pris le mauvais bento"}] },
      { n:3, i:"Demande des baguettes (箸) et un sac plastique", c:[{t:"✅ Tu as obtenu tes baguettes et sac (3¥)"},{t:"Tu as oublié de demander les baguettes"},{t:"Tu pensais que le sac était gratuit"}] },
    ]},
  { p:'lawson-harajuku', t:"Les desserts du Lawson", d:"Découvre les fameux desserts Uchi Café de Lawson.", xp:45, vocab:[],
    tasks:[
      { n:1, i:"Demande lequel des desserts est le plus populaire", c:[{t:"✅ L'employé t'a recommandé le ロールケーキ"},{t:"Il t'a recommandé un onigiri"},{t:"Il n'avait pas d'avis"}] },
      { n:2, i:"Achète le dessert recommandé et un lait au café", c:[{t:"✅ Achat réussi : dessert + lait café"},{t:"Tu as pris un thé au lieu du lait café"},{t:"Tu as oublié de prendre le dessert"}] },
      { n:3, i:"Demande si la carte Ponta est acceptée", c:[{t:"✅ Tu sais que Ponta est accepté chez Lawson"},{t:"L'employé a dit que Ponta n'existe plus"},{t:"Tu n'as pas entendu parler de Ponta"}] },
    ]},
  { p:'matsumoto-kiyoshi-akiba', t:"À la pharmacie", d:"Décris tes symptômes et achète le bon médicament.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Dis que tu as mal à la tête (頭が痛い) depuis ce matin", c:[{t:"✅ La pharmacienne a compris tes symptômes"},{t:"Tu as dit que tu avais mal au ventre"},{t:"Tu n'as pas réussi à expliquer"}] },
      { n:2, i:"Demande le médicament recommandé et la posologie", c:[{t:"✅ Tu as compris la posologie du バファリン"},{t:"Tu as pris le mauvais médicament"},{t:"Tu n'as pas compris la posologie"}] },
      { n:3, i:"Demande si c'est remboursable avec ta mutuelle étrangère", c:[{t:"✅ Tu gardes le reçu pour ta mutuelle"},{t:"La pharmacie a refusé de te donner un reçu"},{t:"Tu pensais que c'était remboursé directement"}] },
    ]},
  { p:'tokyo-central-post', t:"Envoyer un colis au Japon", d:"Envoie un colis en EMS vers la France depuis la poste centrale.", xp:50, vocab:[],
    tasks:[
      { n:1, i:"Dis que tu veux envoyer un colis en France par EMS", c:[{t:"✅ L'agent a compris : colis EMS pour la France"},{t:"L'agent a proposé uniquement la poste ordinaire"},{t:"Tu as demandé DHL par erreur"}] },
      { n:2, i:"Donne les détails du contenu (vêtements, aucun liquide)", c:[{t:"✅ La déclaration est remplie correctement"},{t:"Tu as oublié de déclarer la valeur"},{t:"Tu as mis des liquides dans le colis"}] },
      { n:3, i:"Paye et demande le délai de livraison", c:[{t:"✅ Colis envoyé, tu as ton numéro de suivi"},{t:"Tu as choisi la poste lente (2-3 semaines)"},{t:"Tu as oublié de demander le numéro de suivi"}] },
    ]},
  { p:'starbucks-shibuya', t:"Commander chez Starbucks", d:"Commande un café customisé au Starbucks du Scramble Crossing.", xp:45, vocab:[],
    tasks:[
      { n:1, i:"Demande un Matcha Latte chaud taille Grande", c:[{t:"✅ Commande passée, la barista a noté ton prénom"},{t:"Tu as commandé un thé noir par erreur"},{t:"Tu as oublié de préciser la taille"}] },
      { n:2, i:"Demande à réduire le sucre (甘さ控えめで)", c:[{t:"✅ La barista a bien noté la réduction de sucre"},{t:"Tu as oublié de préciser le sucre"},{t:"Tu as demandé encore plus de sucre"}] },
      { n:3, i:"Demande si tu peux t'asseoir au balcon avec vue sur le Scramble", c:[{t:"✅ Tu sais que le balcon est au 2ème étage et souvent plein"},{t:"La barista a dit que le balcon n'existait pas"},{t:"Tu as trouvé une place sans demander"}] },
    ]},
  { p:'mcdonalds-shibuya', t:"Commander au McDonald's japonais", d:"Découvre les spécialités japonaises du MacDo.", xp:40, vocab:[],
    tasks:[
      { n:1, i:"Demande ce qu'il y a de typiquement japonais dans le menu", c:[{t:"✅ Tu connais maintenant le テリヤキ et 月見バーガー"},{t:"La caissière a dit que le menu était identique à la France"},{t:"Tu as commandé sans poser de questions"}] },
      { n:2, i:"Commande un テリヤキバーガー en menu avec frites M", c:[{t:"✅ Commande passée : テリヤキ set M"},{t:"Tu as oublié de préciser M pour les frites"},{t:"Tu as commandé en anglais"}] },
      { n:3, i:"Paye sans contact (タッチ決済) et demande des serviettes", c:[{t:"✅ Paiement sans contact réussi, tu as tes serviettes"},{t:"Tu as payé en espèces finalement"},{t:"Tu as oublié les serviettes"}] },
    ]},
  { p:'asahi-super-dry-hall', t:"Soirée à l'Asahi Super Dry Hall", d:"Commande des bières et des petites assiettes avec vue sur la Skytree.", xp:60, vocab:[],
    tasks:[
      { n:1, i:"Demande une table avec vue sur la Skytree pour 2 personnes", c:[{t:"✅ Tu as une table avec vue sur la Skytree"},{t:"Toutes les tables avec vue étaient prises"},{t:"Tu as demandé une table intérieure"}] },
      { n:2, i:"Commande 2 bières pression Asahi Super Dry", c:[{t:"✅ 2 bières commandées, avec edamame en plus"},{t:"Tu n'as commandé qu'une seule bière"},{t:"Tu as commandé du vin"}] },
      { n:3, i:"Demande l'addition (お会計をお願いします)", c:[{t:"✅ L'addition est réglée correctement"},{t:"Tu as oublié de demander l'addition"},{t:"Tu as laissé l'autre payer"}] },
    ]},
  { p:'loft-shibuya', t:"Trouver un cadeau au Loft", d:"Cherche un cadeau original au Loft Shibuya et fais-le emballer.", xp:50, vocab:[],
    tasks:[
      { n:1, i:"Demande le rayon carnets et papeterie (文房具)", c:[{t:"✅ L'employé t'a indiqué le 3ème étage"},{t:"Tu as été envoyé au mauvais étage"},{t:"Tu n'as pas su demander le rayon"}] },
      { n:2, i:"Demande si le carnet peut être personnalisé (名入れ)", c:[{t:"✅ Tu sais que la personnalisation est possible pour 500¥"},{t:"L'employé a dit que ce service n'existait pas"},{t:"Tu as acheté le carnet sans personnalisation"}] },
      { n:3, i:"Demande un emballage cadeau (ラッピング)", c:[{t:"✅ Le cadeau est joliment emballé, c'était gratuit"},{t:"L'emballage était payant (200¥)"},{t:"Tu as renoncé à l'emballage"}] },
    ]},
  { p:'shibuya-109', t:"Shopping mode au SHIBUYA109", d:"Essaie une tenue tendance et découvre les tailles japonaises.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Demande quelle est la taille japonaise pour un 38 européen", c:[{t:"✅ Tu sais que tu fais du M en taille japonaise"},{t:"Tu as pris trop grand"},{t:"Tu n'as pas compris les tailles"}] },
      { n:2, i:"Demande si tu peux essayer la veste (試着できますか？)", c:[{t:"✅ Tu as essayé la veste en cabine"},{t:"L'essayage n'était pas autorisé"},{t:"Tu as acheté sans essayer"}] },
      { n:3, i:"Dis que c'est un peu trop large et demande la taille en dessous", c:[{t:"✅ La vendeuse a apporté la bonne taille"},{t:"Le S n'était plus en stock"},{t:"Tu as gardé la taille trop grande"}] },
    ]},
  { p:'donquijote-shibuya', t:"Chasse aux bonnes affaires chez Donki", d:"Navigue dans le labyrinthe de Don Quijote.", xp:50, vocab:[],
    tasks:[
      { n:1, i:"Demande où est le rayon cosmétiques coréens", c:[{t:"✅ Tu as trouvé les cosmétiques coréens au 2ème"},{t:"Tu es allé au rayon électronique par erreur"},{t:"L'employé ne savait pas"}] },
      { n:2, i:"Demande si la détaxe (免税) est disponible pour les touristes", c:[{t:"✅ La détaxe est dispo à partir de 5000¥ sur présentation du passeport"},{t:"Donki n'accepte pas la détaxe"},{t:"Tu n'avais pas ton passeport"}] },
      { n:3, i:"Paye et demande de pouvoir payer en yen et en carte", c:[{t:"✅ Paiement par carte accepté, sans contact possible"},{t:"Donki n'acceptait que les espèces"},{t:"Tu as payé uniquement en espèces"}] },
    ]},
  { p:'yodobashi-akiba', t:"Acheter un appareil photo", d:"Compare deux appareils photo et achète le meilleur pour ton budget.", xp:60, vocab:[],
    tasks:[
      { n:1, i:"Dis que tu cherches un appareil photo compact sous 50 000 yens", c:[{t:"✅ L'expert t'a proposé 2-3 modèles dans ton budget"},{t:"Tous les modèles dépassaient ton budget"},{t:"Tu as été envoyé au rayon téléphone"}] },
      { n:2, i:"Demande la différence entre les deux modèles proposés", c:[{t:"✅ Tu comprends les différences et as fait ton choix"},{t:"Les explications étaient trop techniques"},{t:"Tu n'as pas osé demander les différences"}] },
      { n:3, i:"Demande la carte de garantie et la détaxe", c:[{t:"✅ Garantie internationale et détaxe obtenues"},{t:"La garantie n'était valable qu'au Japon"},{t:"Tu as oublié la détaxe"}] },
    ]},
  { p:'lumine-est-shinjuku', t:"Trouver son chemin dans Lumine", d:"Navigue dans Lumine Est et trouve le restaurant qui te correspond.", xp:45, vocab:[],
    tasks:[
      { n:1, i:"Demande à quel étage se trouvent les restaurants", c:[{t:"✅ Tu sais que les restos sont aux 7ème et 8ème étages"},{t:"Tu as cherché au 3ème étage"},{t:"L'hôtesse t'a envoyé dans les boutiques"}] },
      { n:2, i:"Demande si un restaurant sert du ramen végétarien", c:[{t:"✅ Tu as trouvé un ramen végé au 8ème étage"},{t:"Aucun restaurant végé n'était disponible"},{t:"Tu as commandé un ramen avec viande"}] },
      { n:3, i:"Demande comment rejoindre la gare JR Shinjuku directement", c:[{t:"✅ Tu sais qu'il y a une connexion directe au B1"},{t:"L'hôtesse t'a dit de sortir dehors"},{t:"Tu es sorti par la mauvaise sortie"}] },
    ]},
  { p:'tokyo-skytree', t:"Monter au Tokyo Skytree", d:"Achète ton billet et monte aux 350m au-dessus de Tokyo.", xp:65, vocab:[],
    tasks:[
      { n:1, i:"Demande le prix du billet pour la plateforme à 350m", c:[{t:"✅ Tu sais : Tembo Deck 2100¥, Galleria 1000¥ en plus"},{t:"Tu pensais que l'entrée était gratuite"},{t:"Tu as confondu les deux niveaux"}] },
      { n:2, i:"Achète le billet et demande si la vue sur le Fuji est possible aujourd'hui", c:[{t:"✅ Tu sais que le Fuji se voit par temps clair"},{t:"Le guide a dit que le Fuji n'est jamais visible"},{t:"Tu n'as pas demandé pour le Fuji"}] },
      { n:3, i:"En haut, demande au guide ce que signifie le chiffre 634", c:[{t:"✅ Tu sais que 634 = Musashi (む・さ・し)"},{t:"Le guide a dit que c'était un nombre aléatoire"},{t:"Tu n'as pas pensé à poser la question"}] },
    ]},
  { p:'tokyo-tower', t:"La Tour de Tokyo", d:"Visite la tour emblématique inspirée de la Tour Eiffel.", xp:60, vocab:[],
    tasks:[
      { n:1, i:"Demande la différence entre la Tokyo Tower et la Skytree", c:[{t:"✅ Tu comprends la différence historique et architecturale"},{t:"Le guide a dit qu'elles étaient identiques"},{t:"Tu as confondu les deux tours"}] },
      { n:2, i:"Achète un billet pour le Main Deck (150m) et demande l'heure de fermeture", c:[{t:"✅ Billet acheté, fermeture à 23h"},{t:"Tu as acheté le billet Top Deck par erreur"},{t:"Tu pensais que c'était fermé à 18h"}] },
      { n:3, i:"Demande comment la tour est éclairée (illumination) le soir", c:[{t:"✅ Tu connais les deux modes d'illumination de la tour"},{t:"Le guide a dit que l'illumination était constante"},{t:"Tu n'as pas demandé pour les lumières"}] },
    ]},
  { p:'meiji-jingu', t:"Se recueillir au Meiji Jingū", d:"Apprends les codes du sanctuaire shinto et prie correctement.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Demande comment se purifier à la fontaine (手水舎)", c:[{t:"✅ Tu connais les 4 étapes de la purification"},{t:"Tu as bu directement à la fontaine"},{t:"Tu as sauté la purification"}] },
      { n:2, i:"Demande comment prier correctement (二拝二拍手一拝)", c:[{t:"✅ Tu maîtrises la méthode 二拝二拍手一拝"},{t:"Tu as fait les gestes dans le mauvais ordre"},{t:"Tu as fait une seule inclinaison"}] },
      { n:3, i:"Achète un omamori (お守り) pour la réussite scolaire", c:[{t:"✅ Tu as l'お守り学業成就 et tu sais ne jamais l'ouvrir"},{t:"Tu as ouvert l'お守り par curiosité"},{t:"Tu as acheté le mauvais お守り"}] },
    ]},
  { p:'sensoji', t:"Visite du Sensō-ji", d:"Explore le plus vieux temple de Tokyo et tire ton omikuji.", xp:60, vocab:[],
    tasks:[
      { n:1, i:"Demande l'histoire de la porte Kaminarimon (雷門)", c:[{t:"✅ Tu sais l'histoire de la 雷門 et de sa lanterne de 670kg"},{t:"Le prêtre a dit que la porte datait de 1960"},{t:"Tu n'as pas demandé l'histoire"}] },
      { n:2, i:"Tire un omikuji (おみくじ) et demande ce que signifie 大吉", c:[{t:"✅ Tu sais que 大吉 est la meilleure chance"},{t:"Tu pensais que 凶 était positif"},{t:"Tu n'as pas voulu tirer l'omikuji"}] },
      { n:3, i:"Achète un souvenir dans la Nakamise-dori (仲見世通り)", c:[{t:"✅ Tu as acheté une spécialité d'Asakusa"},{t:"Tu as acheté une Kitty souvenir banale"},{t:"Tu es reparti sans souvenir"}] },
    ]},
  { p:'tokyo-national-museum', t:"Au Musée National de Tokyo", d:"Découvre les trésors de l'art japonais au plus grand musée du pays.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Demande quelle est la pièce la plus précieuse du musée", c:[{t:"✅ Tu connais maintenant les pièces majeures du musée"},{t:"Le conservateur a refusé de te répondre"},{t:"Tu as demandé pour les peintures occidentales"}] },
      { n:2, i:"Demande si les explications sont disponibles en français", c:[{t:"✅ Tu as loué l'audioguide en français pour 650¥"},{t:"Aucun support en français n'était disponible"},{t:"Tu as visité sans aide linguistique"}] },
      { n:3, i:"Demande l'heure de fermeture et s'il y a un café", c:[{t:"✅ Tu sais : fermeture à 17h, café dans le parc"},{t:"Tu pensais que le musée fermait à 20h"},{t:"Tu as raté la dernière entrée"}] },
    ]},
  { p:'tokyo-metro-theatre', t:"Au Théâtre Métropolitain", d:"Achète des billets pour un spectacle et découvre la culture musicale tokyoïte.", xp:55, vocab:[],
    tasks:[
      { n:1, i:"Demande ce qui est à l'affiche ce soir", c:[{t:"✅ Tu sais ce soir : orchestre philharmonique, Beethoven 9ème"},{t:"C'était une pièce de théâtre kabuki"},{t:"Tu n'as pas compris le programme"}] },
      { n:2, i:"Achète 2 billets en catégorie B (5000¥ chacun)", c:[{t:"✅ 2 billets achetés, portes à 18h30 pour 19h"},{t:"Tu as pris des billets en catégorie A trop chers"},{t:"Tu as oublié de demander l'heure des portes"}] },
      { n:3, i:"Demande où laisser ton manteau (vestiaire / クローク)", c:[{t:"✅ Tu as trouvé le vestiaire au B1, gratuit pour manteau"},{t:"Tu ne savais pas qu'il y avait un vestiaire"},{t:"Tu es entré dans la salle avec ton manteau"}] },
    ]},
  { p:'big-echo-kabukicho', t:"Nuit karaoké à Kabukichō", d:"Réserve une salle, chante en japonais et profite du free-time.", xp:65, vocab:[],
    tasks:[
      { n:1, i:"Réserve une salle pour 3 personnes pendant 2 heures", c:[{t:"✅ Salle réservée pour 3 personnes avec free-time"},{t:"Tu n'as réservé que pour 1h"},{t:"Tu as refusé le free-time"}] },
      { n:2, i:"Demande comment chercher une chanson japonaise par titre", c:[{t:"✅ Tu sais chercher une chanson par hiragana ou romaji"},{t:"Tu n'as pas compris la tablette"},{t:"Tu n'as pu chanter que des chansons anglaises"}] },
      { n:3, i:"À la fin, demande l'addition et si tu peux prolonger d'une heure", c:[{t:"✅ Tu as prolongé d'1h pour 800¥/personne"},{t:"La salle était déjà réservée après vous"},{t:"Tu as quitté la salle exactement à l'heure"}] },
    ]},
  { p:'at-home-cafe-akihabara', t:"L'expérience maid café", d:"Découvre l'univers des maid cafés d'Akihabara.", xp:70, vocab:[],
    tasks:[
      { n:1, i:"Réponds à la maid qui te dit 'おかえりなさいませ'", c:[{t:"✅ Tu as répondu 'ただいま' et tu es entré dans le jeu"},{t:"Tu as juste dit 'merci' en français"},{t:"Tu as brisé le jeu de rôle"}] },
      { n:2, i:"Commande un omurice (オムライス) avec décoration au ketchup", c:[{t:"✅ Tu as commandé l'omurice avec dessin et dit la formule"},{t:"Tu as commandé un plat sans décoration"},{t:"Tu as refusé de faire la formule magique"}] },
      { n:3, i:"Achète une photo Polaroid souvenir avec la maid", c:[{t:"✅ Tu as ton Polaroid signé, en respectant les règles"},{t:"La maid a refusé la photo"},{t:"Tu as essayé de toucher la maid sans permission"}] },
    ]},
  { p:'keio-hospital', t:"Consultation à l'hôpital Keio", d:"Décris tes symptômes en japonais et navigue dans le système de santé.", xp:70, vocab:[],
    tasks:[
      { n:1, i:"Explique que tu as de la fièvre (38°) et mal à la gorge", c:[{t:"✅ L'infirmière a compris tes symptômes précisément"},{t:"Tu n'as pas su exprimer la fièvre en japonais"},{t:"Tu as dit que tu avais mal au dos à la place"}] },
      { n:2, i:"Demande si tu as besoin d'une assurance médicale internationale", c:[{t:"✅ Tu comprends le processus de remboursement"},{t:"L'infirmière a dit que les étrangers n'étaient pas acceptés"},{t:"Tu pensais que c'était gratuit comme en France"}] },
      { n:3, i:"Demande une ordonnance (処方箋) à apporter à la pharmacie", c:[{t:"✅ Tu as ton ordonnance et sais où aller à la pharmacie"},{t:"Tu n'as pas compris que tu avais besoin d'une ordonnance"},{t:"Tu as acheté un médicament sans ordonnance"}] },
    ]},
];

function e(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function emptyCell(label) { return `<span style="color:#d1d5db;font-style:italic">— ${label||'à définir'}</span>`; }

let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>POIs Tokyo — SekaiTalk</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:2cm 2.5cm;color:#1a1a1a;line-height:1.4}
  h1{font-size:22pt;color:#312e81;border-bottom:3px solid #312e81;padding-bottom:8px;margin-top:0}
  h2{font-size:14pt;color:#fff;background:#4f46e5;padding:7px 14px;margin-top:32px;page-break-before:always}
  h2:first-of-type{page-break-before:avoid}
  h3{font-size:12pt;color:#4338ca;margin:14px 0 3px;border-bottom:1px solid #e0e7ff;padding-bottom:2px}
  h4{font-size:11pt;color:#6d28d9;margin:10px 0 3px}
  table{border-collapse:collapse;width:100%;margin:4px 0 8px;font-size:10pt}
  td,th{border:1px solid #d1d5db;padding:5px 8px;vertical-align:top}
  th{background:#f3f4f6;font-weight:700;color:#374151;font-size:9.5pt}
  .lbl{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin:12px 0 3px}
  .tag{background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:12px;font-size:9pt;font-weight:700;margin-right:4px}
  .tag-t{background:#fef3c7;color:#92400e}
  .task-ok{color:#16a34a;font-weight:700}
  .task-no{color:#9ca3af}
  .xp{color:#7c3aed;font-weight:700;font-size:10pt}
  .vocab-empty{color:#9ca3af;font-style:italic;font-size:10pt;margin:2px 0}
  code{background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:9pt}
</style>
</head><body>
<h1>📍 POIs de Tokyo — SekaiTalk</h1>
<p style="color:#6b7280;font-size:10pt">Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${pois.length} POIs — 6 thèmes</p>
<br>
`;

pois.forEach((poi, idx) => {
  const theme = themes.find(t => t.poiIds.includes(poi.id));
  const char  = characters[poi.id] || {};
  const lesson= lessons[poi.id];
  const logo  = logoMap[poi.id] ? '/images/pois/logos/'+logoMap[poi.id] : '';
  const entry = entrySounds[poi.id] || '';
  const poiQuests = quests.filter(q => q.p === poi.id);

  html += `<h2>${idx+1}. ${e(poi.name)}</h2>\n`;

  // Infos générales
  html += `<p><span class="tag">${e(poi.type)}</span> <span class="tag tag-t">${e(theme?.title||'— Sans thème')}</span> <code>${e(poi.id)}</code></p>\n`;

  // Personnage
  html += `<div class="lbl">Personnage</div>\n`;
  html += `<table><tr><th>Nom</th><th>Nom JP</th><th>Rôle</th><th>Image personnage</th></tr>\n`;
  html += `<tr><td>${e(char.name)||emptyCell('à définir')}</td><td>${e(char.nameJp)||emptyCell('')}</td><td>${e(char.role)||emptyCell('')}</td><td><code>/characters/default.png</code></td></tr></table>\n`;

  // Médias
  html += `<div class="lbl">Médias (scène)</div>\n`;
  html += `<table><tr><th>Image de fond</th><th>Son d'entrée</th><th>Son ambiant</th><th>Logo POI</th></tr>\n`;
  html += `<tr>`;
  html += `<td>${emptyCell('à définir')}</td>`;
  html += `<td>${entry ? `<code>${e(entry)}</code>` : emptyCell('à définir')}</td>`;
  html += `<td>${emptyCell('à définir')}</td>`;
  html += `<td>${logo ? `<code>${e(logo)}</code>` : emptyCell('à définir')}</td>`;
  html += `</tr></table>\n`;

  // Cours
  html += `<div class="lbl">Cours</div>\n`;
  if (lesson) {
    html += `<table><tr><th>Titre</th><th>Description</th></tr>\n`;
    html += `<tr><td><strong>${e(lesson.title)}</strong></td><td>${e(lesson.desc)}</td></tr></table>\n`;
  } else {
    html += `<p class="vocab-empty">Aucun cours défini.</p>\n`;
  }

  // Quêtes
  html += `<div class="lbl">Quête(s)</div>\n`;
  if (poiQuests.length === 0) {
    html += `<p class="vocab-empty">Aucune quête.</p>\n`;
  } else {
    poiQuests.forEach((q, qi) => {
      html += `<h4>Quête ${qi+1} — ${e(q.t)} <span class="xp">+${q.xp} XP</span></h4>\n`;
      html += `<p style="margin:2px 0 6px;color:#6b7280;font-size:10pt;font-style:italic">${e(q.d)}</p>\n`;

      html += `<table><tr><th width="40">#</th><th>Instruction</th><th>Réponses (✅ = correcte)</th></tr>\n`;
      q.tasks.forEach(task => {
        html += `<tr><td style="text-align:center;font-weight:700;color:#4f46e5">${task.n}</td>`;
        html += `<td>${e(task.i)}</td>`;
        html += `<td><ul style="margin:0;padding-left:16px">`;
        task.c.forEach(choice => {
          const ok = choice.t.startsWith('✅');
          html += `<li class="${ok?'task-ok':'task-no'}">${e(choice.t)}</li>`;
        });
        html += `</ul></td></tr>\n`;
      });
      html += `</table>\n`;

      // Vocab
      html += `<div class="lbl" style="font-size:8.5pt">Vocabulaire</div>\n`;
      if (q.vocab && q.vocab.length > 0) {
        html += `<table><tr><th>JP</th><th>Kana</th><th>Romaji</th><th>Français</th><th>JLPT</th></tr>\n`;
        q.vocab.forEach(v => {
          html += `<tr><td>${e(v.jp)}</td><td>${e(v.kana)}</td><td>${e(v.romaji)}</td><td>${e(v.fr)}</td><td>N${v.jlpt}</td></tr>\n`;
        });
        html += `</table>\n`;
      } else {
        html += `<p class="vocab-empty">— à définir</p>\n`;
      }
    });
  }
});

html += '</body></html>';
fs.writeFileSync('POIs_Tokyo_SekaiTalk.html', html, 'utf8');
console.log('✅ Fichier généré : POIs_Tokyo_SekaiTalk.html (' + Math.round(html.length/1024) + ' KB)');

const legacyBooks=[['ship','忒修斯之船','航海故事与两位读者留下的调查笔记交织成一本神秘旧书。'],['prince','小王子','一位来自遥远星球的少年通过玫瑰与狐狸理解爱和责任。'],['stranger','局外人','默尔索用近乎冷静的目光面对荒诞、生活与社会期待。'],['siddhartha','悉达多','一个人经历修行和世俗生活，寻找属于自己的智慧。'],['garden','秘密花园','一座被锁住的花园渐渐焕发生机，几位孩子的生活也随之改变。'],['night','夜航西飞','关于非洲成长、旅行与飞行冒险的回忆录。'],['kafka','海边的卡夫卡','一段穿梭在现实与梦境之间的文学旅程。'],['letters','山茶文具店','代笔店里的人们通过文字表达难以说出口的心意。'],['other','海边的房间','虚构藏书：旅人在海边停留时的短篇日记。'],['rain','雨天来信','虚构藏书：一位邮差在雨季整理无人领取的信，也慢慢读懂了自己的心事。'],['forest','森林散步','虚构藏书：一位画家沿林间小径记录四季，在细小的变化里重新学会等待。'],['station','旧站台','虚构藏书：小镇末班车停运前，几位旅人在候车室交换各自想去的地方。'],['slow','慢慢生活','虚构藏书：一些关于做饭、散步和整理房间的短篇，记录把普通日子过好的尝试。'],['leaves','叶间拾光','虚构藏书：一位旅人把途中拾到的叶子夹进书里，每一页都留着一处停下来的理由。'],['clouds','晴空日记','虚构藏书：一本记录天空与散步的小日记，写下那些没有特别计划的晴朗日子。'],['cat','猫的来信','虚构藏书：住在旧书店附近的一只猫，用一封封小信记下街角的人与温柔的小事。']];
const notes={stranger:'不表现悲伤，真的就等于不悲伤吗？',garden:'我小时候想拥有秘密花园，现在更想有人和我一起照料它。',night:'有些风景只适合在夜里想起。',kafka:'不是所有道路都有地图。',letters:'没写出来的那些话，也许更重要。',other:'临走之前，我把窗户开了一会儿。',rain:'雨停之后，我终于把那封写了很久的信寄了出去。原来等的不是晴天，是一点勇气。',forest:'今天沿着同一条小路走，才发现上次没留意的苔藓。慢一点，也许就不会错过。',station:'车票夹在这里。那年没能去的地方，后来我走路也到了。',slow:'这一页读完，我去给自己煮了一碗面。碗洗好时，窗外的天还亮着。',leaves:'这片叶子是在回家的路上拾到的。夹在这里，提醒自己也记得看看脚边的风景。',clouds:'今天没有赶路，坐在窗边看了一会儿云。什么也没做的一天，也可以被好好记住。',cat:'如果你又遇见窗边那只猫，请替我和它打声招呼。它大概还记得，去年那个总来读书的人。'};
const letter=[['书友 A','我曾以为寻找答案，是为了有一天能够停下来。'],['书友 B','也许我们寻找的不是答案，而是值得继续追问的问题。'],['书友 C','我第二次读这本书，最喜欢的反而是那些没有回答的部分。']];

// Authored demonstration object, separate from book-club messages and player saves.
const authoredKeepsakes={night:{id:'keepsake-night-postcard-v014',source:'authored-playtest',kind:'postcard',label:'一角旧明信片',pickLabel:'抽出旧明信片',title:'一张没有寄出的明信片',detail:'可以翻到背面看看，也可以收回书里',parts:[['原创演示 · 旧明信片','留给远方。'],['原创演示 · 明信片背面','收件人：下一次出发的自己。\n\n原来，远方也可以先留在这里。']]}};

// Authored game keepsakes in the four new fictional books are available on first visit.
const firstVisitNotes = new Set(['rain','forest','station','slow','leaves','clouds','cat']);

// Original cover artwork reused as CSS sprites; the clean tabletop underneath is separate.
const tableBooks=[


  {id:'cat',x:596,y:1319,width:79,height:105,color:'#e6b852',clip:'polygon(3% 0,96% 0,100% 4%,100% 99%,1% 100%,0 5%)'}
];

// Current physical collection. Legacy identities stay intact for existing saves.
const collectionBooks=[["naval", "纳瓦尔宝典", "有人一天读完，也有人想把它放在手边，反复重读。"], ["questions", "八万四千问", "有书友一天只读一问，给自己留一点慢慢消化的时间。"], ["siddhartha", "悉达多", "一个人经历修行和世俗生活，寻找属于自己的智慧。"], ["courage", "被讨厌的勇气", "读过之后，书友们仍在讨论：不同的思考方式，能不能走向相通的地方？"], ["tao", "道德经", "有人想走近经典，也有人觉得知易行难，正在慢慢体会。"], ["presence", "当下的力量", "一本让书友一边读、一边追问自己的书。"], ["fiscal", "财政密码", "从读几页就困，到清早专门找个地方读，书友留下了不同的尝试。"], ["bondage", "人性的枷锁", "有人想读这本书，先在书页旁留下了关于译本的问题。"], ["solitude", "百年孤独", "有人给自己定了读完的目标，也有人刚刚开始挑战。"], ["diamond", "金刚经", "不同的书和不同的阅读经历，让书友再次遇见这部经典。"], ["toad", "蛤蟆先生去看心理医生", "读过这本，又读《被讨厌的勇气》，书友开始比较两种思考方式。"], ["vegetarian", "素食者", "离奇的情节与细腻的文字，让书友记住了这本书。"], ["red", "红楼梦", "有人等待一个读得进去的机缘，也有人在假期去看相关戏剧。"], ["prince", "小王子", "一位来自遥远星球的少年通过玫瑰与狐狸理解爱和责任。"], ["lychee", "长安的荔枝", "一趟运送荔枝的差事，让书友读到了小人物的处境。"], ["habits", "高效能人士的七个习惯", "读到书里的方法，再带回真实的交流中，一位书友记录着自己的练习。"], ["japan", "以日为鉴", "一位书友读到与身边相似的现象，觉得这本书很好读。"], ["tokyo", "东京八平米", "有人把这本书放进了自己的年度推荐。"], ["sentence", "一句顶一万句", "同一本书、同一页，书友偶然在阅读中相遇。"], ["weeks", "四千周", "读书时，有人想到了时间，也想到了年轻时的体验。"], ["submarine", "夜晚的潜水艇", "有书友把它留在睡前，形容像给大脑做一次按摩。"], ["seventh", "第七天", "一位书友读过之后，只想先说一句：太绝了。"], ["otherlife", "格外的活法", "群友推荐：“格外的活法，强烈推荐。”"], ["bigtech", "重返大厂", "像听人讲故事一样读下去，是一位书友喜欢的阅读节奏。"], ["notetaking", "笔记的方法", "接地气的工具书，也引出了书友对方法是否适合自己的讨论。"], ["drive", "认知驱动", "有人读出了熟悉思想的拼接，也愿意把这个感受留在书里。"], ["symposium", "会饮篇", "一趟飞机上翻完的小书，书友说，读完仍有些地方不太明白。"], ["tendays", "十日终焉", "疑问、解答、新问题，书友在环环相扣的故事里停不下来。"], ["gobi", "走出戈壁", "一位书友合上书时，觉得自己也跟着走过了一段苦日子。"], ["altay", "我的阿勒泰", "书友把这本书放进了自己的阅读分享，留下想与人交换的感受。"]];
const books=[...collectionBooks,...legacyBooks.filter(book=>!collectionBooks.some(current=>current[0]===book[0]))];
const shelfBookIds=["siddhartha", "questions", "tao", "diamond", "presence", "naval", "fiscal", "courage", "red", "solitude", "bondage", "vegetarian", "night", "toad", "otherlife", "bigtech", "notetaking", "drive", "symposium", "tendays"];
const frontBookIds=["prince", "lychee", "habits", "japan", "tokyo", "weeks", "sentence", "submarine", "seventh"];
const coffeeBookIds=["gobi", "altay", "garden", "kafka"];
const sceneBookIds=[...shelfBookIds,...frontBookIds,"cat",...coffeeBookIds];

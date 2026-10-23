'use strict';
// Original bookstore fiction, distinct from exported group messages and verified book quotations.
window.BookAuthoredStories=(()=>{
  const items=[
  {
    "id": "original-a-lychee",
    "caption": "运荔枝的人",
    "storyId": "delivery-worker",
    "book": "lychee",
    "title": "当日送达",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "看到这里，觉得荔枝真是一种很娇贵的水果。\n稍微耽搁就坏。\n人倒是怎么折腾都被认为还能用。",
      "后来看见“当日送达”，心情复杂。\n希望这次的李善德已经吃过饭了。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-a-weeks",
    "caption": "读后计划",
    "storyId": "one-day",
    "book": "weeks",
    "title": "一天只有一天",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "买这本书，是想学会把一天过成两天。\n读到这里，作者劝我先接受一天只有一天。\n钱花了，工作量居然没增加。\n好书。",
      "今天从待办清单里划掉了一项：\n把自己培养成一个没有待办清单的人。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-a-tokyo",
    "caption": "一次整理",
    "storyId": "storage-box",
    "book": "tokyo",
    "title": "以后应该用得上",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "她住八平米。\n我住“这个以后应该还用得上”。",
      "受启发，回家整理了一次。\n第一件扔掉的东西，是去年买的收纳盒。\n它一直占地方，等我开始收纳。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-a-river",
    "caption": "在河边坐一会儿",
    "storyId": "listening-river",
    "book": "siddhartha",
    "title": "先听懂这一句",
    "kind": "relay",
    "pace": "participation",
    "source": "authored-story",
    "parts": [
      "读到他坐在河边倾听，我也把书合上，安静坐了一会儿。",
      "听见了肚子叫。",
      "也行。\n先处理一个我能听懂的。"
    ],
    "prompt": "你读这一段时，身边有什么声音？"
  },
  {
    "id": "original-a-rush-1",
    "caption": "借一点时间",
    "storyId": "lychee-time",
    "book": "lychee",
    "title": "替他找个办法",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "替李善德找过办法了。\n路线、马匹、保鲜，感觉哪样都缺。\n最缺的还是时间。\n\n听说店里有一本专门管这件事的书，我去借一下。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "lychee-time",
    "chapter": 1,
    "targetBook": "weeks"
  },
  {
    "id": "original-a-rush-2",
    "caption": "借书回来以后",
    "storyId": "lychee-time",
    "book": "weeks",
    "title": "没法跟荔枝解释",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "回来了。\n那本书说，时间管理首先要承认时间不够。",
      "道理很好。\n不知道怎么跟荔枝解释。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "lychee-time",
    "chapter": 2
  },
  {
    "id": "original-b-courage",
    "caption": "一次练习",
    "storyId": "separation",
    "book": "courage",
    "title": "替别人做作业",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "今天认真练习了课题分离。\n别人怎么看我，是别人的课题。",
      "然后花了二十分钟，想别人现在怎么看我。\n\n我这个人，确实很喜欢替别人做作业。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-b-naval",
    "caption": "寻找合伙人",
    "storyId": "washing-leverage",
    "book": "naval",
    "title": "合伙关系有待改善",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "读完这一段，开始寻找一种东西：\n我休息的时候，它还能替我干活。",
      "找到了。洗衣机。\n\n但是它坚持让我自己晾。\n合伙关系有待改善。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-b-habits",
    "caption": "今晚的清单",
    "storyId": "circle",
    "book": "habits",
    "title": "暂不需要国际配合",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "最近很操心的：\n国际局势。\n楼上装修。\n明天会不会迟到。\n\n今晚实际能做的：\n把闹钟调好。",
      "已完成。\n这件事暂时不需要国际社会配合。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "layout": "columns",
    "columns": [
      [
        "最近很操心的",
        "国际局势。\n楼上装修。\n明天会不会迟到。"
      ],
      [
        "今晚实际能做的",
        "把闹钟调好。"
      ]
    ],
    "art": "ART-02"
  },
  {
    "id": "original-b-tao",
    "caption": "养花记录",
    "storyId": "plant",
    "book": "tao",
    "title": "主要是我着急",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "读到这里，决定少一点妄加干预。\n先从养花开始。",
      "昨天没忍住，把土扒开看了看根长得怎么样。\n\n花本来长得挺好的。\n主要是我着急。"
    ],
    "prompt": "读到这里，你想接一句什么？"
  },
  {
    "id": "original-b-solitude",
    "caption": "人物关系图",
    "storyId": "family-chart",
    "book": "solitude",
    "title": "其余亲戚下次认",
    "kind": "stack",
    "pace": "short",
    "source": "authored-story",
    "parts": [
      "原计划：做一张人物关系图，方便阅读。\n目前进展：需要另一张图，解释这张图。",
      "今天先记住那个让我难过的人。\n其余亲戚，下次再认。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "layout": "diagram",
    "art": "ART-03"
  },
  {
    "id": "original-b-locksmith",
    "caption": "通讯录里的一通电话",
    "storyId": "phone-call",
    "book": "sentence",
    "title": "把名字存下来",
    "kind": "relay",
    "pace": "participation",
    "source": "authored-story",
    "parts": [
      "通讯录里有四百多人。\n今天想找个人说说话，往下翻了很久。\n最后接通的是修锁师傅。",
      "原本只想问修锁多少钱。\n聊着聊着，他说，这个小区他来过，我家那种锁他也修过。\n我说，上次也是你修的。\n\n他沉默了一下，问：\n“你是不是又自己拆过？”",
      "我们因此聊得很深入。\n\n临走他说，下次有事直接打电话，别自己弄。\n我把号码从“修锁”改成了“王师傅”。\n\n今天终于在通讯录里，认出一个人。"
    ],
    "prompt": "最近有没有一句很普通的话，让你记住了说话的人？"
  },
  {
    "id": "original-b-chair",
    "caption": "多出来的椅子",
    "storyId": "extra-chair",
    "book": "tokyo",
    "title": "给那只包留着",
    "kind": "relay",
    "pace": "participation",
    "source": "authored-story",
    "parts": [
      "房间本来就小，我还买了一把椅子。\n用来招待朋友。\n\n买回来三个月，招待过外套、快递和一床来不及叠的被子。",
      "周末终于叫朋友来吃饭。\n她进门看了一圈，问坐哪儿。\n我清了清椅子，她把包放了上去。\n\n后来我们都坐在地上。",
      "饭吃得有点挤，话说了很多。\n她走以后，我第一次觉得这把椅子买对了。\n\n今天把椅子上的东西都收走了。\n给她那个很大的包留着。"
    ],
    "prompt": "你房间里，有没有一件专门等人来的东西？"
  },
  {
    "id": "original-b-listener-1",
    "caption": "去找个听众",
    "storyId": "dessert-listener",
    "book": "courage",
    "title": "去找个听众",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "最近有一点进步。\n我开始接受，有些人可以不喜欢我。\n\n但今天买到一盒特别好吃的点心，还是很想找个人说一下。\n我去那本研究“说得着”的书里，找个听众。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "dessert-listener",
    "chapter": 1,
    "targetBook": "sentence"
  },
  {
    "id": "original-b-listener-2",
    "caption": "谈话之后",
    "storyId": "dessert-listener",
    "book": "sentence",
    "title": "所以点心呢",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "找到了。\n我讲了半小时，关于自由、勇气，以及不再寻求认可。\n\n他一直听着。\n最后问：“所以点心呢？”",
      "明天准备再买一盒。\n这段关系值得维持。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "dessert-listener",
    "chapter": 2
  },
  {
    "id": "original-b-prep-1",
    "caption": "阅读准备",
    "storyId": "reading-preparation",
    "book": "solitude",
    "title": "先把关系理清楚",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "决定先把人物关系理清楚，再继续往下读。\n工欲善其事。\n我去隔壁那本讲笔记的书里，找点工具。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "reading-preparation",
    "chapter": 1,
    "targetBook": "notetaking"
  },
  {
    "id": "original-b-prep-2",
    "caption": "笔记准备好了",
    "storyId": "reading-preparation",
    "book": "notetaking",
    "title": "系统先建起来了",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "工具很好。\n已经统一了颜色、线型和人物编号。\n\n小说暂时没往下读，系统先建立起来了。\n忽然有点担心，去那本把一生按星期算的书里看一眼，还剩多少时间。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "reading-preparation",
    "chapter": 2,
    "targetBook": "weeks"
  },
  {
    "id": "original-b-prep-3",
    "caption": "读书准备的后记",
    "storyId": "reading-preparation",
    "book": "weeks",
    "title": "不是来做户籍登记",
    "kind": "stack",
    "pace": "cross",
    "source": "authored-story",
    "parts": [
      "回去看小说了。\n\n我是想知道他们后来怎么样了，\n不是想进他们家做户籍登记。",
      "关系图留在原书里。\n若有书友看懂，烦请指正。\n尤其是被我画成夫妻的那两位。"
    ],
    "prompt": "读到这里，你想接一句什么？",
    "trail": "reading-preparation",
    "chapter": 3
  }
];
  const byId=new Map(items.map(item=>[item.id,item]));
  return {items,get:id=>byId.get(id),seed(){const books={};for(const x of items)(books[x.book]||=[]).push({id:x.id,kind:x.kind,author:'bookshop-original',authorName:'纸间书店 · 原创',front:x.parts[0],back:'',stock:'cream',replies:[]});return books;}};
})();

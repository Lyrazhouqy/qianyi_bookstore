# 纸间书店

从既有线上动画版恢复的静态游戏工程。当前交付边界见 [HANDOFF.md](HANDOFF.md)。

源码仓库：<https://github.com/Lyrazhouqy/qianyi_bookstore>，当前源码版本 `0.6.24`。安装后按以下命令运行；无需构建。历史设计稿和批量截图、录像留在本机，`evidence/baseline/` 与 `evidence/bookshop-v0624/manifest.json` 随仓库保留；后者记录本版本44个运行文件的校验值。

```sh
npm ci
npm run dev
```

macOS 下需要跨聊天回合保留预览时，运行 `npm run preview`。它提交一个仅监听本机的临时 launchd 作业，不添加登录启动项；`npm run preview -- status` 查看状态，`npm run preview -- stop` 关闭。

打开 <http://127.0.0.1:4173>，直接运行网页。默认仅监听本机。所有游戏内容与字体回退均可本地运行，不需要付费模型或后端。

```sh
npx playwright install chromium webkit
npm test
node tests/baseline.cjs
node scripts/capture-siddhartha.cjs
```

`npm test` 在 Chromium / WebKit 的五种视口覆盖共享阅读器、13本书点击/归位、接力续写与线索、窗景预设/上传/刷新恢复；本轮定向结果见 HANDOFF 最末段和对应 evidence manifest。模拟触摸不替代真实iPhone验收。

- `evidence/baseline/`：恢复部署的原始 HTML、来源、缺陷复现和截图。
- `evidence/verification/`：本轮报告、逐帧动画证据、截图、视频及测试结果。
- 静态发布白名单：`index.html`、`styles.css`、`content.js`、`app.js`、`siddhartha.css`、`siddhartha.js`。

延续 `paperbook-v3` 本机存储键，刷新会读取已保存的续写与发现。「重新到访」重新计算本次翻书次数，保留发现和已写入的文字。当前尚未接入多人或跨设备同步。

《悉达多》交互打磨版从 <http://127.0.0.1:4173/?focus=siddhartha> 进入。拿起后书仍合着；轻点或向左拖开封面，轻点纸角直接取出并展开第一层；也可向上抽出信，再轻点打开折页，逐段展开到末尾可续写。「折好，放回夹页」收回信，「合书放回」完成整个归位。其他书保留此前交互。

v0.4 证据在 `evidence/siddhartha-v04/`，三条浏览器批注修订在 `evidence/siddhartha-v041/`，旧版 60 项检查留在 `evidence/verification/`，不混用验证结论。

信件正文与续写输入使用从指定「【家庭】」会话复用的悠哉（Yozai）完整字体，信纸复用同一张纤维纹理。字体原始授权与来源哈希见 `assets/`；v0.4.2 的加载、布局与交互证据在 `evidence/siddhartha-v042/`。静态发布白名单以 `release-manifest.json` 为准，包含字体、授权和信纸资源。

v0.4.3 调整取书/归位的共用轨迹、封面转轴与展信折痕；信纸取出时保持比例，展开时位置与宽度固定。新增 `tests/motion.spec.cjs` 检查书架交接尺寸及展信几何稳定，`node scripts/review-motion.cjs` 保存中间帧和操作录像；当前证据见 `evidence/siddhartha-v043/`。

v0.4.4 手机使用单页近读：轻点或左扫打开封面，简介为 18px；右扫书页或点「合上封面」可合书，顶部按钮放回书架。横屏简介与夹信并排。预览地址加 `?focus=siddhartha&v=0.4.4`，刷新已有预览即可。


v0.5.0 历史主界面：<http://127.0.0.1:4173/?v=0.5.0>。原图与真实交互分层：场景可拖看、九种藏书可从书脊或选书单拿起，店内手记使用真实本地记录。手机使用可平移场景和可读选书单；阅读器继续使用 v0.4.4 的近读布局。`room.css` / `room.js` 与场景 PNG 已加入发布白名单。本轮源码和画面证据见 `evidence/bookshop-v05/`，未发布线上。


v0.5.1 主界面：<http://127.0.0.1:4173/?v=0.5.1>。按四张用户图片重新排版，手机竖向浏览，一座大书架直接展示九本有书名的大触点书籍，装饰阅读角随后展示；桌面左右布局。保留已打磨的阅读器与本地续写。`node scripts/review-elements.cjs` 采集主界面与尺寸，`node scripts/review-element-touch.cjs` 检查原生模拟触摸，证据见 `evidence/bookshop-v051/`；场景发布素材以 release-manifest.json 为准。


v0.5.2 主界面：<http://127.0.0.1:4173/?v=0.5.2>。书架缩小一档，手机纵向分组、平板与桌面并排；书脊保持可读且保留宽点击区。《悉达多》封面、350px 手机单页、18px 简介、左右轻扫与原字体字条保持 v0.4.4 组件。证据见 `evidence/bookshop-v052/`；仍是本地版本，未发布线上。


v0.5.3 恢复《悉达多》的双页外观：左侧内封标语、右侧简介与夹信。抽书/封面/展信沿用 v0.5.1，窄手机继续保留350px单页近读；主界面维持紧凑模块布局。<http://127.0.0.1:4173/?v=0.5.3>；所有 `?v=` 预览链接都会读取当前静态文件，并不能切回历史版本。证据在 `evidence/bookshop-v053/`，未发布线上。


v0.6.0 游戏场景：<http://127.0.0.1:4173/?v=0.6.0>。全屏插画房间里直接点书脊拿书；短屏可以上下拖看房间。墙上便笺保留手记与阅读节奏，陈列桌上的蓝色书保留藏书索引。原抽书/翻封面/展信、干玫瑰/信封/邮票与刷新保存沿用。`node scripts/review-game.cjs` 采集五视口画面，`node scripts/review-game-touch.cjs` 检查触摸与镜头；证据 `evidence/bookshop-v06/`。发布资源仍以 release-manifest.json 为准，尚未更新线上。


当前 v0.6.1：场景沿用 v0.6.0，《悉达多》按用户明确要求原样恢复 v0.4.3 书籍组件。简介在左内封，夹信在右页；拿起、封面拖动、逐折展信、收信归位和原字体/信纸保留。<http://127.0.0.1:4173/?v=0.6.1>。证据在 `evidence/bookshop-v061/`；被替代的单页与内封标语版测试在 `tests/archive/`。


当前 v0.6.2：全部九本书共用 v0.4.3 的拿起封面、转轴开合、抽取/展开线索和归位动作；各自的封面色、书名、简介、便笺与玫瑰/信封/邮票进度保留。悠哉字体与原纸纹不变。源代码已参数化，不能再称为与原 v0.4.3 JS/CSS 整文件逐字节一致；动作核心和原 CSS 前缀的一致性见 `evidence/bookshop-v062/motion-consistency.json`。本地预览 <http://127.0.0.1:4173/?v=0.6.2>，没有线上发布。

当前 v0.6.3：书架容量增至13位（5/3/5），九本现有藏书与四处预留，地球仪和原开书/线索动作保持。两引擎20项定向回归、三视口容量/触点检查及原生模拟触摸通过；证据 `evidence/bookshop-v063/`。本地预览 <http://127.0.0.1:4173/?v=0.6.3>。

当前 v0.6.4：13个书位全部可玩，新增四本游戏原创藏书《雨天来信》《森林散步》《旧站台》《慢慢生活》，各有简介和首访可见的独立便笺，沿用 v0.4.3 开合/展信动作、字体和信纸。两引擎28项定向检查与原生模拟触摸通过。证据 `evidence/bookshop-v064/`；本地预览 <http://127.0.0.1:4173/?v=0.6.4>，未发布。

当前 v0.6.5：书架右移，大窗户可轻点换景，内置树影/海风，也可上传本机图片。原13本书及阅读器保留，旧进度不重置。两引擎36项定向检查和原生模拟触摸通过。预览 <http://127.0.0.1:4173/?v=0.6.5>，未发布。素材、内置imagegen来源与完整提示词见 `assets/scene/PROVENANCE-v065.json`。换自选图仅保存到本机，支持PNG/JPG/WebP/AVIF，最大4MB。

当前 v0.6.6：陈列架正面三本封面书也能分别拿起、翻开、展便笺、放回，共16本可玩藏书。原图封面保留，抽屉可打开选书单。修复拖开封面后快速点便笺首触被忽略的问题。两引擎50项定向回归与原生模拟触摸通过，未发布线上。入口 <http://127.0.0.1:4173/?v=0.6.6>；素材与内置imagegen提示词见 `assets/scene/PROVENANCE-v066.json`。

当前 v0.6.7：手持书合上后向下拖归位，短拖回弹，也可点场景空白处收起。去掉常驻顶部归还按钮及底部操作文案，保留原翻封面、逐折信件、悠哉字体和纸纹；16本共用。写信时点背景只收起输入焦点。66项阅读回归与最终18项手势检查通过，原生模拟触摸完整流程通过；真实iPhone未验收，未发布。预览 <http://127.0.0.1:4173/?v=0.6.7>，证据 `evidence/bookshop-v067/manifest.json`；回放 `node scripts/review-physical-return.cjs`。

当前 v0.6.8：便笺与接力信居中叠在打开的书本上，逐折展开/收折时中心保持稳定，再沿原路径回夹页；字体、纸纹和下拖收书保留。两引擎20项定向检查及四条逐帧定位流程通过；真实iPhone未验收，未发布。预览 <http://127.0.0.1:4173/?v=0.6.8>；证据 `evidence/bookshop-v068/manifest.json`，回放 `node scripts/review-centered-note.cjs`。

当前 v0.6.9：留声机音符会动，点击打开唱片纸页，接入参考页七首音乐及原封面；可切曲、暂停/继续，刷新记住选曲且不会自动出声，翻书时音乐继续。小屏纸页可滚动选曲。两引擎最终18项音乐检查、12项场景回归与三次原生模拟触摸通过，实际iPhone未验收，未发布。预览 <http://127.0.0.1:4173/?v=0.6.9>；来源 `assets/music/PROVENANCE.json`，证据 `evidence/bookshop-v069/manifest.json`，回放 `node scripts/review-music-touch.cjs`。

当前 v0.6.10：每次加载/刷新随机换一次窗景，停留期间不自动切换；手选/上传在本次访问固定，自选图片保存并可参与下次随机。两引擎18项定向检查通过，含模拟停留五分钟不变化。原预览已刷新；未发布。<http://127.0.0.1:4173/?v=0.6.10>，证据 `evidence/bookshop-v0610/manifest.json`。

当前 v0.6.11：拱形窗框补纸纹木框、前景窗格/内缘/窗台，连续玻璃内显示同画风新景「雨后山色、晚霞、初雪」，现共五种内置景。每次刷新随机一次、不定时切换、自选图片仍可用。两引擎24项定向检查通过，并保留六幅场景截图；未发布。<http://127.0.0.1:4173/?v=0.6.11>；素材来源/内置imagegen记录 `assets/scene/PROVENANCE-v0611.json`，完整提示词 `assets/scene/window-landscapes-v0611.prompts.json`，证据 `evidence/bookshop-v0611/manifest.json`。

当前 v0.6.12：两只抱枕改为绿灰长圆角枕、豆沙粉花瓣枕；内置imagegen编辑后只合成抱枕区域，原房间/窗景/音乐/书籍保留。两引擎8项场景回归与390/609目视检查通过。预览 <http://127.0.0.1:4173/?v=0.6.12>，未发布；素材/提示词来源 `assets/scene/PROVENANCE-v0612.json`，证据 `evidence/bookshop-v0612/manifest.json`。

当前 v0.6.13：书架和窗户继续右移；移除沙发左侧盆栽、书架右侧挂画和便签，保留两只新抱枕。手机最右列点击区域与留声机已分离，320px镜头微调保证16本书触点完整。共享阅读器/字体/纸纹/窗景逻辑/音乐源码哈希不变。局部换画重生了房间底图，其他家具不能称像素完全一致。证据 `evidence/bookshop-v0613/manifest.json`，素材/提示词 `assets/scene/PROVENANCE-v0613.json`。仅本地预览，未发布。

当前 v0.6.14：留声机和木桌缩小下移，补回被喇叭遮住的书架，动态音符移到书脊下方，点击区随物件移动。两引擎手机28项交互与4项最终动画边界检查通过；原预览已刷新。局部素材/提示词 `assets/scene/PROVENANCE-v0614.json`，本轮证据 `evidence/bookshop-v0614/manifest.json`。仅本地，未发布。

当前 v0.6.15：窗户整体左移32场景单位，旧窗位置以局部空墙合成，原窗框/风景/热点一起移动。两引擎320/390/横屏36项场景与窗景回归通过，原预览已刷新；仅本地。来源 `assets/scene/PROVENANCE-v0615.json`，证据 `evidence/bookshop-v0615/manifest.json`。

当前 v0.6.16：未播放音乐时也恢复明显的音符上浮/淡出，略放大并加深颜色；播放/暂停与减少动画偏好保留。两引擎320/390的24项回归通过，原预览已刷新。证据 `evidence/bookshop-v0616/manifest.json`；只改本地，未发布。

当前 v0.6.17：落地灯增加自然垂直拉绳，下拉松手切换暖黄灯光，短拉/取消回弹；手机44px抓取区、键盘和独立保存开关状态。两引擎320/390/横屏24项回归及320原生模拟触摸通过；原预览已刷新并开灯。证据 `evidence/bookshop-v0617/manifest.json`，仅本地，未发布/未真机验收。

当前 v0.6.18：垂绳向灯罩内侧靠近约7~8px，保留窄屏抓取范围；两引擎8项灯绳回归通过。原预览已刷新，证据 `evidence/bookshop-v0618/manifest.json`。

当前 v0.6.19：拉绳进一步向灯罩内部移动约9px，保持垂直及暖黄灯光；两引擎375/390八项拉绳回归通过，原预览已刷新。证据 `evidence/bookshop-v0619/manifest.json`。

当前 v0.6.20：风景与音乐弹窗共用纸页/插画卡片/胶带选中/手机两列滚动样式，换景和上传行为保留。两引擎320/390/横屏42项窗景与音乐回归通过；原预览已打开新风景弹窗。证据 `evidence/bookshop-v0620/manifest.json`，仅本地未发布。

当前 v0.6.21：第六张风景卡直接上传自己的照片，带加号空态/旧照片预览，点击更换，取消保持原景；原预览已刷新。24项窗景及4项最终上传卡回归通过，证据 `evidence/bookshop-v0621/manifest.json`。仅本地未发布。

当前v0.6.22：陈列桌花束触碰/鼠标碰入后轻晃，三组枝叶错开摆动并衰减，原花瓶稳住；原预览已刷新。两引擎最终16项花束/场景回归通过。动图 `evidence/bookshop-v0622/bouquet-sway.gif`，素材/提示词 `assets/scene/PROVENANCE-v0622.json`，证据 `evidence/bookshop-v0622/manifest.json`。仅本地，未发布。

当前v0.6.23：手机房间增加纸纹裁剪留白、原生双轴轻扫与鼠标平移，保留44px书脊触点、原翻书/信纸/字体和互动。两引擎五视口60项场景/相机/拉灯、手机16项阅读回归和三尺寸原生模拟触摸通过。原预览已原地刷新；仅本地，未发布/未真机验收。证据 `evidence/bookshop-v0623/manifest.json`。

固定手机试玩v0.6.23已发布为独立Vercel预览（原生产不变），规范路径 https://paper-bookshop-playtest-n6alphq7b-zhouxixis-projects-b5eae314.vercel.app/v0.6.23/ 。免登录分享链接/二维码在本机.preview/mobile-playtest-v0623.json和对应-qr.png，有效至2026-11-18；交付链接携带分享参数，直接访问规范地址会受Vercel保护。43文件远程SHA256核对通过，Chromium两种手机视口流程通过；远程WebKit加载未闭合，未新增真机验收。证据evidence/mobile-playtest-v0623/deployment.json。

当前本地v0.6.24：点击花瓶在小白花/粉色郁金香/暖黄小雏菊间循环，淡换后轻晃，本机保存；碰花晃动、平移与书籍交互保留。原预览已刷新。两引擎定向矩阵与媒体事件补跑、两尺寸原生模拟触摸结果见HANDOFF末段及evidence/bookshop-v0624/manifest.json。既有手机分享链接仍为固定v0.6.23，未更新线上。

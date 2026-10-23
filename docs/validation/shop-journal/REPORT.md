# 店主营运手记 · 2026-10-23

现有项目开发分支，用户批准的10则原创文案，署名店主，不作为真实群聊/书中引文。无新独立Demo、Vercel项目或外部美术。

## 行为

- 同一个挂画入口，纸页每页3则，总计4页，随时翻到全部10则，不按时间/书籍锁定。首页没有展示完时，关闭/刷新仍保留；全部展示完后下一次打开挑选下一批未展示内容，已拿过的书(state.seen)相关条目优先。全部已展示后首页稳定；本次打开期间顺序不变。
- 独立存档 `paperbook-journal-v1`，字段version/read/front；read代表文字已经完整显示，不代表真人确实读完。发现/重访试玩按gameKey分隔，未改原游戏、便笺、原文、草稿、回复与阅读状态。存储故障仅保留本次内存进度，正文照常读。
- 新字按中文grapheme出现，普通字符30ms、标点110ms、换行100ms。点纸页或“轻点，看完这页”立即补齐，旧内容直接显示；翻页复用纸声。减少动态直接全文，隐藏/关闭停止定时器；手动滚动退出自动跟随。全文占位保持文字逐字出现时布局稳定；完整正文供屏幕阅读器读取，逐字层aria-hidden，不逐字播报。
- 参考用户指定[家庭聊天](codex://threads/01a0f689-662b-7003-a72e-88bef038a4c8)，实际核对 `/Users/zhouqingyi/repos/xigua-studio/outputs/anniversary-sites-source/dist/app.js` 的prepareTyping/tick/fill，借鉴出字节奏、标点停顿和轻点补齐。没有复制家庭私人正文、媒体或聊天内容。当前手记继续使用书店既有字体。
- 原到访统计、自然/密集模式和重新到访入口保留在“来过的痕迹”折页。挂画的前次轻晃实现也纳入本轮提交；不纳入其他场景工作的修改。

## 验证

- Chromium/WebKit 320×568、390×844：28/28。十则全达、4页边界、逐字增长、占位高度稳定、点按补齐、旧页即时、刷新/关闭稳定、读书关联优先、旧档/便笺/草稿不变、设置保持、减少动态、键盘、连翻无残字、存储错误、事件模拟后台停止均通过。
- SE375×667、ProMax430×932、横屏844×390、桌面1280×900，两引擎额外布局：8/8。关/翻页/详情入口可见，纸页无横向溢出。窄屏正文在纸页内滚动。
- 原挂画鼠标/减少动态/手记开关及320/390触屏入口：8/8。共44/44，0失败/重试/跳过。详细stats与每例结果见results.json；完整本地报告evidence/shop-journal/，未覆盖其他任务证据。
- typing-frames.json是实际浏览器逐帧出字采样，普通相邻字约25–34ms，观测到句号停顿约108ms；初始逗号停顿采样起于中途，不作为完整延时测量。

## 实际操作记录

`explore.cjs`使用独立空白浏览器、原书友池、正常动画和Chromium CDP触摸输入：点挂画→看到逐字→点补齐→往前翻→近一页（旧文字立即显示）→关闭→拿起《道德经》→Escape归架→再点挂画，首页出现tao/weeks/lychee，页面错误为空。touch-trajectory.json、typing-390.png、journal-390.png为本次证据；320截图另存journal-320.png。

这是有目标的自动操作，非十分钟盲测，未操作用户原标签或私人存档。手机视口、触摸注入、后台事件均为模拟，未进行物理iPhone/安卓、VoiceOver人耳或持续帧率验收。

## 源码与入口

journal.js/css与HTML、明确静态白名单是本轮主体；room.js/app.js未修改。相关测试前后/HTTP SHA256见source-hashes.json，不把并行场景修改称为全工程冻结。没有新模型调用或音频/美术资产需求。

入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新后点窗户下的植物纸画。只完成本地开发分支，未推送或覆盖线上。

复跑：

```sh
BOOKSHOP_REPORT=evidence/shop-journal/initial.json npx playwright test tests/shop-journal.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/shop-journal/initial
node docs/validation/shop-journal/explore.cjs
```

# 书页纸声 · 2026-10-23

范围：现有开发分支 `feat/rhythm-v014`。新增轻声交互，不改便笺池、抽取/已读、原文、草稿或旧档；不发布生产。

## 实现

- `paper-sound.js`：本地 Web Audio 生成短纸张摩擦和低沉书封接触声，无外部音频请求、付费调用或新美术。七种细微音色对应拿起、封面、书页、展信、纸片翻面、收回、归架；约160–390ms，微小播放速率变化。
- `siddhartha.js`：在已有动作接受/完成边界调用，复用 busy、取消、重复点击保护。书页拖动取消不发翻页声，不在 pointermove 上触发。
- 留声机原面板底部加入独立「翻书纸声」开关；默认开，`paperbook-paper-sound-v1` 记住开关。背景唱片仍使用原 HTMLMediaElement 和原控制，不改 `music.js` 的并行工作。
- 页面加载不建 AudioContext，不播放纸声；可信点按/键盘手势才解锁。最多3声同时播放，同类75ms去重；静音/后台立即停止，恢复后不重放旧动作。权限拒绝、缺少 API、存储被禁都不阻断阅读。
- `index.html` 增加脚本/样式；明确静态白名单补这两个文件，无版本/部署切换。

## 验证方法与边界

`tests/paper-sound.spec.cjs` 在真实浏览器 AudioContext 上记录实际 buffer 与 AnalyserNode 非零信号，检查去重、音量峰值、唱片媒体时钟继续前进、静音/恢复、键盘、取消翻页和故障降级。它不能代替人耳试听。权限拒绝通过覆写首次 resume/state 注入；后台通过 document.hidden/visibilitychange 注入，属于故障模拟，非真实手机系统音频中断。

主矩阵：Chromium/WebKit，320×568、390×844手机视口。回归：原音乐、翻页物理手感、便笺/明信片、回复草稿和直接下一页。音乐涉及真实MP3解码与媒体时钟；并发媒体用例发生的暂停另行记录；最终采用单worker减少同批干扰，但本机仍有其他场景任务同时跑浏览器，未声称系统隔离。

测试修正：原 paper-feel 用例断言特定 feel-note，但未隔离新增的原创故事池；补隔离 stories.js，保留真实池的独立探索。新取消翻页用例在第一次归位后用了旧坐标；改为等两帧后重新测量当前角的位置，不改产品动画。

## 已发生的测试

- 初轮音效16例：8过/8失败。4例将 stop 后等待 ended 事件的计数当作仍在发声；4例未真正模拟 Chromium 的 suspended 状态、且 reload 后引用未定义变量。改正探针，并在声源淘汰时立即 disconnect，防短暂重叠。
- 第二轮音效：24/24。
- 扩展第一轮：106/112。取消翻页旧坐标2例；固定便笺夹具受故事池影响2例；并发WebKit音乐初始变 paused 2例。取消翻页定向复核4/4；WebKit音乐单worker复核2/2。并发暂停的具体原因未独立定论，不宣称已修复底层音频焦点。
- 最终完整矩阵：110/112，音效相关32/32；0跳过/重试。剩余两例：Chromium390的原32px短甩判定未跨过翻页阈值；WebKit390初始唱片成为paused（发生在任何手势之前，此时纸声音频上下文尚未创建）。不改原翻页阈值或音乐逻辑，不称整套全部通过。上述两项在两个引擎390视口定向复核4/4；仍保留偶发记录，详细数据在 `results.json`。完整本地报告于 `evidence/paper-sound/`，不覆盖其他任务证据。

## 实际探索轨迹（有目标的自动操作）

`explore.cjs` 是独立空白存档、原始故事/读书群池、正常动画的 Chromium 390×844 CDP 触摸输入。点《纳瓦尔宝典》→封面→夹页→右下角下一页（先收信再翻）→Escape归架。`touch-trajectory.json` 记录7次实际声源 start、running状态、idle归位和背景唱片时钟继续；页面错误为空。`touch-note.png` 为当时画面。

这是自动化定向探索，非不知道目标的十分钟盲测；未触碰用户当前标签、未修改用户存档。未进行真实iPhone/安卓、系统静音键/蓝牙/扬声器延迟、人耳音色或响度验收。试听参考 `page-sound.wav` 来自浏览器实际页声buffer（应用主增益；单声，不混唱片），不代表麦克风实录。

## 核对与入口

`source-hashes.json` 记录相关代码测试前后及HTTP字节哈希。并行任务更改了场景入口/manifest，不称全工程冻结；本轮纸声JS/CSS及阅读器/音乐/便笺代码保持。

现有本地入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新后拿书、开封面、点右下角听纸响；留声机面板可独立关闭。仅开发分支本地实现，未推送或部署生产。

参考：浏览器手势解锁规则使用 [MDN AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume) 与 [Chrome Web Audio autoplay](https://developer.chrome.com/blog/web-audio-autoplay)；文档不能代替真机验收。

复跑命令：

```sh
BOOKSHOP_REPORT=evidence/paper-sound/verified.json npx playwright test tests/paper-sound.spec.cjs tests/music.spec.cjs tests/music-default.spec.cjs tests/single-corner.spec.cjs tests/page-feel.spec.cjs tests/paper-feel.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/paper-sound/verified --workers=1
node docs/validation/paper-sound/explore.cjs
```

# v0.14.1 封面与横放书取归

2026-10-22；开发分支 `feat/rhythm-v014`，基于 `3bdde62`。继续使用原项目，本轮不推送或部署生产。

## 修正

旧实现把约148×410的侧面书脊图贴在整张宽封面上，既拉扁图案，又让透明圆角露出后面的矩形底板。现在普通书使用独立完整的布面正面、原五色配色、同一Noto Serif SC书名和正方形简洁矢量印记；封面没有裁剪多边形或窄书脊拉宽。猫书、小王子、长安的荔枝原本完整的正面插画继续使用原素材，未生成或栅格编辑图片。

横放书不再用宽高分别插值。书先保持横放倾角抽离支承，接着绕书本转向、转正、等比接近；书脊、封面、纸口为不同平面。全程使用同一个三维缩放因子，封面图案与厚度一起缩放。归位沿同一条路径反向；上方的书在取走的书离开后落下一本的厚度，归位前先抬起让位，完成后清掉临时位移。不是自由物理引擎，也没有宣称模拟真实手部受力。

原拿起→封面→翻开→读纸/回应→归位状态机、排队和手势互斥复用。竖书保留既有取归轨迹。书位/宽触点、34本身份、全部便笺可读规则、原文与便笺左右对照、存储键和原始素材池未改。

## 验证

- 新专项：封面无书脊图拉宽/无裁角、印记不变形/文字不裁切；四种横书（前架中层、墙架、单本、茶几）逐帧矩阵三轴尺度一致、开场/落点和支承位置交接、上层落下与复位、旋转中断/减少动态效果。两引擎320×568、390×844。
- 初轮8/12通过，四例逐帧断言发现二维scale没有同时缩放书的厚度（Z轴仍为1）；修成scale3d(s,s,s)后专项12/12通过，未放宽断言。原始失败与修复后报告分别留在evidence/bookshop-v014-binding/focused-results.json和rigid-results.json。
- 最终相关回归 **140/140通过，0失败、0 flaky、0跳过**（约6.6分钟），见[test-summary.json](test-summary.json)，包含新专项以及collection/motion/siddhartha/reading-pacing/quotation/rhythm，不把分阶段数字拼成一轮结果。
- Chromium CDP模拟原生触摸记录见[native-touch.json](native-touch.json)：直接点书脊、翻封面、取纸/收纸、向下拖书归位。两种宽度各直接操作4本书、3本横书读纸后下拖归位均通过，页面脚本错误为空。录屏与截图使用隔离存档，不操作用户真实输入内容。
- [61资源HTTP与本地SHA256](runtime-resources.json)，同时核对真实素材/发现引擎/便笺状态管理等来源与基线字节相同。原文核实数量仍为1组，没有增加或伪造任何发言。

浏览器手机视口、模拟输入与录屏不是物理iPhone、真Safari、帧率基准或真人主观手感验收；本轮未进行十分钟开放探索。

## 复看与验收

- [《道德经》390px封面](tao-390.png)
- [WebKit320px封面](tao-webkit-320.png)
- [横书手持终态](stack-390.png)
- [横书取出、转向及归位动态复看](rigid-book-loop.gif)：隔离Chromium390×844录屏转20fps/300px GIF，非原生帧率基准；原WebM与MP4在本地evidence目录。

入口：<http://127.0.0.1:4173/?v=0.14.1&playtest=rhythm>。直接点击茶几、前架或墙架任一本横放书，观察抽出、转向和等比接近；合起后下拖归位，观察上层书先让位再复原。版本参数标识本机当前源码，不是历史快照。生产仍v0.13.0，用户确认体验前不覆盖。

复现最终回归：

```sh
BOOKSHOP_REPORT=evidence/bookshop-v014-binding/final-results.json npx playwright test tests/binding-motion.spec.cjs tests/collection.spec.cjs tests/motion.spec.cjs tests/siddhartha.spec.cjs tests/reading-pacing.spec.cjs tests/quotation.spec.cjs tests/rhythm.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/bookshop-v014-binding/final-test-results
node scripts/review-binding-touch.cjs
```

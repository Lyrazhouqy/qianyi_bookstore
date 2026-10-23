# v0.14.10：花瓶先打开纸页，再选择花束

2026-10-23，现有 `feat/rhythm-v014` 分支。进入时存在未提交v0.14.9页角样式改动；本轮保留它们，期间该工作由原执行方提交为 `e91fae3`，随后并行追加页角改动 `0055264`。本轮保留两次提交并追加换花弹窗，不覆盖页角工作。未推送/部署，生产仍v0.13.0。

## 行为与文件

- 点击花瓶只打开选择纸页，不再轮流换下一束。使用留声机现有纸页、卡片、胶带选中态、字体、滚动和响应式网格；三种原花束配插图，“正在摆”标记当前选择。
- 点击卡片后淡入更换并记住选择。弹窗保留可继续比较，关闭/X/Escape/点外部后焦点回花瓶，与音乐选择一致。原花束触碰/鼠标轻扫晃动、静止花瓶、减弱动态偏好保持。
- 加载失败可点同一束重试；快速选择以最后一次为准；关闭弹窗取消尚未完成的切换，晚到资源不改变选择。旧 `paperbook-bouquet-v1` 存档键和三种素材不变，不改书友内容或阅读存档。
- 首轮暴露花瓶中心被《四千周》的透明点击热区挡住，提升花瓶命中层；邻书实际书名位置仍可拿起，未移动书/花瓶绘图。

文件：`index.html`新增纸页与入口语义；`room.js`接入已有统一弹窗开关/关闭/焦点；`bouquet.js/.css`选择、加载互斥、图片预览、命中层；包版本/发布清单。`music.js/.css`未改，样式直接复用。测试更新原轮换用例为明确选择；音乐旧测试将已移出场景的slow书替换为当前night书，并将唱片选择器限定在音乐弹窗，避免把复用卡片样式的花束也计为唱片。

## 验证

最终换花/音乐相关回归40/40通过，0失败/跳过/flaky；两引擎320/390。换花、弹窗、音乐相关源码在测试前后保持。期间并行页角任务更新secrets.css（0055264），其余61项运行资源源hash保持；当前62项资源均与HTTP逐字节一致。不将此次运行称为全工程单一冻结快照。分阶段结果见[test-summary.json](test-summary.json)，源码/HTTP字节见[runtime-hashes.json](runtime-hashes.json)。原始失败trace与完整截图在忽略的 `evidence/bouquet-picker/`，未用后续通过覆盖早期结果。

初轮命中遮挡修复后，检查还发现两处旧测试假设：带焦点的画面区域不能做原花瓶像素逐字节比较；待加载路由应使用可释放的异步门闩。改为保留花束三种实图差异、静止瓶口坐标与不改阅读存档的实际断言，重试/晚到/取消路径使用明确释放。Chromium320复核5/5通过。音乐扩大检查发现过时书名和全页卡片计数，修正测试入口和作用域，未改音乐运行逻辑。

复现：

```sh
BOOKSHOP_REPORT=evidence/bouquet-picker/verified-results.json npx playwright test tests/bouquet-change.spec.cjs tests/bouquet.spec.cjs tests/music.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/bouquet-picker/verified-tests
```

Chromium/WebKit各320×568、390×844手机视口/模拟触摸，包含三花束视觉差异、选择持久化、失败/重试/晚到取消、晃动/减弱动态、焦点/关闭、邻书命中，以及七首真实音频切换/暂停恢复/阅读持续播放。没有实体iPhone/真Safari、真实移动网络或新盲测结论。

[320px选择弹窗](flower-choices-320.png) · [390px选择弹窗](flower-choices-390.png)。原预览标签未操作；验收请打开当前源码入口：<http://127.0.0.1:4173/?v=0.14.10&playtest=rhythm>。版本参数用于识别当前源码，不是历史快照。

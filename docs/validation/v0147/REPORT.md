# v0.14.7：弧形折角与弯曲纸页

2026-10-23。现有开发分支 `feat/rhythm-v014`，基于 `ab3920b`；未推送/部署，生产仍v0.13.0。

## 实现

- 右下角改为SVG弧形纸背、细纸边与柔影；视觉收小为约50px，76px命中范围不变。轻翘提示更克制，鼠标悬停略抬纸，触摸不依赖悬停。
- 按下即起纸，12段切线连续的纸面从外缘带动书脊，取代整张硬板rotateY。拖动决定弯曲进度，正反面分开、纸背不镜像书名，投影随纸移动；取消/短拖回弹，松手顺势完成约480ms，原重访系数与减弱动态偏好保持。
- 保留单右下角、末页循环、抽纸/收纸、展信直接下一页、回应草稿和全部旧档规则；不改真实素材、日期、书位、发现引擎或存储键。新页内容仍在翻页完成时提交，不提前触发读取。
- 新SVG序列化与原HTML字符串不同，曾导致布局刷新替换同一按钮、丢失旋转后键盘焦点；改成缓存导航源串，只有内容改变才替换，补同节点焦点回归。

运行修改：`secrets.js/.css`、`siddhartha.js`，以及版本与发布清单。新增 `tests/page-craft.spec.cjs`、`scripts/review-page-craft-touch.cjs`。未新增栅格资产或依赖。

## 验证和证据

- 初期页角/单角18/18，曲面检查4/4；截图复核发现逐段高光形成条纹，改为连续明暗后4/4。
- 扩大回归75/76，WebKit390旋转后键盘焦点失败；修复SVG节点替换后WebKit390定向7/7。原失败和截图留在本机忽略目录，没有覆盖为通过。
- 冻结源码最终80/80通过，0失败/跳过/flaky；62运行资源测试前后源hash与HTTP字节一致。最终结果见[分阶段清单](test-summary.json)。[源与HTTP哈希](runtime-hashes.json)、[原生协议触摸结果](native-touch.json)。
- Chromium/WebKit各320×568、390×844，检查拖动/取消/旋转/键盘、单页循环、快速连点、长纸滚动、草稿与明信片。Playwright横扫使用鼠标指针模拟，另Chromium320/390用CDP原生触摸协议、动画开启，覆盖封面拖动、页角、展信直接翻页、回应草稿、翻卡和取消。均为浏览器模拟；没有实体iPhone、真Safari、真实输入法、帧率测量或新盲测。

```sh
BOOKSHOP_REPORT=evidence/bookshop-v0147/verified-results.json npx playwright test tests/page-craft.spec.cjs tests/page-curl.spec.cjs tests/single-corner.spec.cjs tests/paper-feel.spec.cjs tests/prince-postcard.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/bookshop-v0147/verified-tests
node scripts/review-page-craft-touch.cjs
```

[起纸](bend-lifting.png) · [经过书脊](bend-held.png) · [模拟触摸录屏节选](page-turn.gif)。GIF为本机隔离浏览器的真实录屏裁切，不是制作的动画示意。完整原始WebM和测试trace在忽略的 `evidence/bookshop-v0147/`；没有上传私密素材来源文件。

现有入口：<http://127.0.0.1:4173/?v=0.14.7&playtest=rhythm>。原用户标签确认无可见未完成输入后更新，恢复《纳瓦尔宝典》开放页；最后刷新恢复最终源码，示范拿书135→137，未写字/发送/清档/新增标签。版本参数是当前源码标记，不是历史快照。

下一步：用户验收纸面弯曲、折角辨识与按下/松手反馈，以及真实手机性能和键盘下操作。

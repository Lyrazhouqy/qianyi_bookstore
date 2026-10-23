# v0.14.8：参考同类游戏后的翻页手感

2026-10-23，现有开发分支 `feat/rhythm-v014`，基于 `4d47108`。未推送/部署，生产仍v0.13.0。

## 来源与动作

[查阅记录及设计判断](REFERENCES.md)包含Tengami官方/开发者访谈、Storyteller及Strange Horticulture发行商介绍。主要参考是Tengami强调手指可控的纸艺。没有直接试玩参考游戏，浏览器控制在打开官方片和恢复状态时两次超时，没有取得逐帧视频证据；本轮参数是我们自己的设计和测试结果。

- 慢拖：根据纸边位移反算翻页角，校正12段曲面的投影，不再按固定距离直接放大角度。320/390测试中44px拖动的可见纸边落点误差限定16px内；不等于物理手机测量。
- 松手：最近输入事件样本估速，快速短甩可推进一页；停住后速度失效，短拖回弹；明显向右带回优先取消。纵向、旋转、pointercancel保持取消语义。
- 节奏：轻点收尾目标340ms，释放约150–360ms，回弹约150–230ms；原重访比例、减弱动态偏好保持。依次收纸再翻页、回应草稿、单右下角、末页循环和v0.13全部纸可读保持。
- 翻页下方显出书名和匿名折纸轮廓，避免整块空纸；昵称/正文及原阅读状态仍在原时机处理，没有提前标记为已读或添加新机关。

运行修改：`siddhartha.js`、`secrets.js/.css`，版本/发布清单；新增 `tests/page-feel.spec.cjs`、`scripts/review-page-feel-touch.cjs`；既有曲面测试改为在截图后继续拖到新的完成距离。没有修改真实素材、日期、发现引擎、存储键、书位或资产。

## 验证

- 初期23/24：WebKit旧曲面测试停在60px截图后松手，新的跟手映射下停住应回弹；保留曲面截图断言，继续拖95px后再检查完成。新甩页/停住/回拉/跟手8/8通过。
- 兼容扩大124/124，0失败/跳过/flaky，含曲面、页角、草稿、明信片、重访与快速连点。
- Chromium CDP原生触摸补查首次短甩未推进；原代码按事件回调执行时刻估速，改为输入事件自带时刻，减少主线程/协议等待对速度计算的影响。最终冻结源码再跑64/64（两引擎320×568/390×844，0失败/跳过/flaky），包含甩页、停住、回拉、旋转/键盘、展信翻页/草稿。未将前一阶段124项当成最终源码全量复跑。
- 最终Chromium320/390原生协议触摸完整流程通过，含短甩推进、同距离停住回弹、封面/页角、取消、回应草稿、明信片翻面和收起；页面错误为空。[清单](native-touch.json)，输入事件元数据与完整WebM在本机忽略目录。
- 62静态资源测试前后源hash保持，与HTTP逐字节匹配。[源哈希](runtime-hashes.json) · [分阶段结果](test-summary.json)。

```sh
BOOKSHOP_REPORT=evidence/bookshop-v0148/touch-fix-results.json npx playwright test tests/page-feel.spec.cjs tests/page-craft.spec.cjs tests/page-curl.spec.cjs tests/single-corner.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/bookshop-v0148/touch-fix-tests
node scripts/review-page-feel-touch.cjs
```

鼠标拖动模拟、浏览器手机视口、Chromium CDP触摸均不等于实体iPhone/真Safari、真实输入法、帧率性能或新盲测。[跟手截图](finger-tracking.png) · [模拟触摸录屏节选](page-feel.gif)。GIF来自实际隔离浏览器录屏裁切，没有插帧/制作动作，来源见gif-source.json。

入口：<http://127.0.0.1:4173/?v=0.14.8&playtest=rhythm>。浏览器控制连接超时，本轮未能刷新/操作现有用户标签；需点击新入口加载当前源码，版本参数不是历史快照。下一验收为真实手指操作的短甩容错、回拉意图和重复阅读节奏。

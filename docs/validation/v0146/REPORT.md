# v0.14.6：放回、单右下角与展信直接翻页

2026-10-23；现有仓库开发分支 `feat/rhythm-v014`，基于 `264e2b8`。本地验收，未推送、未部署，生产仍为 v0.13.0。

## 本轮行为

- 回应提交按钮统一为“放回”；原“翻回”改为“收起便笺 / 收起信 / 收起明信片 / 收起草稿”，翻面写作“翻到正面”。
- 有多个夹页时只保留右下角一个翻页入口，末页继续翻到第一页。所有便笺/自己的旧纸/特殊物件仍是独立页面，原顺序与开场随机规则保持。只有一页时没有空的翻页入口。
- 展开的纸稍向上移，并在多页书中为右下角留出完整76px命中空间，长内容内部滚动。普通便笺、双面纸、接力信、明信片均可展读时直接点右下角，依次完成原有快速收纸和翻页；连续点不会跳页。
- 回应中直接翻页先存草稿，不发送；回到同一张纸可继续写。存草稿失败时保留当前编辑界面。主动点“放回”才提交，取消仍是“放下笔”。复用原存储键和状态机，未修改真实44条素材、日期、发现选择引擎或旧档结构。

## 代码与复核入口

运行文件：`secrets.js/.css`（唯一循环页角）、`siddhartha.js/.css`（收纸后翻页、文字与布局），`index.html`/包版本/发布清单。新增 `tests/single-corner.spec.cjs`，其余测试更新单角循环路径；旧创作测试改用当前可见的同类旧书，以及书摞实际书脊命中点，继续检查旧fold/relay、双面草稿和失败重试。

复现：

```sh
BOOKSHOP_REPORT=evidence/bookshop-v0146/release-results.json npx playwright test tests/single-corner.spec.cjs tests/page-curl.spec.cjs tests/quotation.spec.cjs tests/revisit.spec.cjs tests/secrets.spec.cjs tests/prince-postcard.spec.cjs tests/rhythm.spec.cjs tests/paper-feel.spec.cjs --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/bookshop-v0146/release-tests
node scripts/review-single-corner-touch.cjs
npm run test:discovery-engine
```

## 验证结果

- 冻结最终源码完整回归176/176通过，0失败/跳过/flaky；Chromium/WebKit × 320×568、390×844。短屏修复后专项26/26通过；发现引擎12/12通过。62运行资源与本地HTTP SHA256逐字节匹配，最终测试前后源哈希保持。分阶段结果保留如下。
- 初期136项回归中130通过、6项仍用旧上一页路径；随后旧创作测试暴露过时书名与整摞中央命中路径，改成当前同类旧书和可见书脊点。扩大检查再发现短屏明信片翻面被挤出、取消拖动后快速收起被防误触拦截，两处均修复后重新冻结源码测试。中途停止的运行只记录为中断，不拼接为最终全绿。
- 额外Chromium320/390原生协议触摸全流程通过，脚本错误为空。[触摸清单](native-touch.json)。

## 证据边界

浏览器均为本机隔离上下文。Chromium / WebKit 的320×568、390×844手机视口，包含触摸点按；Playwright横扫为鼠标指针模拟。额外Chromium检查用CDP原生触摸协议、动画开启，覆盖封面拖动、页角拖动、展信直接下一页、回应草稿保留、取消、明信片左右扫。没有物理iPhone、真Safari、真实键盘/输入法或新十分钟开放试玩。

原用户标签未清档或新增；刷新前确认没有可见未完成输入，再更新v0.14.6。示范打开《纳瓦尔宝典》、抽读peter_47的纸，直接右下角由第4页循环到第1页；没有写字/发送，最终再刷新恢复展信，拿书次数133→135。该过程是验收示范，不是盲测。

[展信与页角](letter-next.png) · [回应与放回](reply-next.png) · [源码与HTTP资源哈希](runtime-hashes.json) · [分阶段结果](test-summary.json)。全部原日志、失败trace和WebM留在忽略目录 `evidence/bookshop-v0146/`，未用后续通过覆盖失败阶段。

验收入口：<http://127.0.0.1:4173/?v=0.14.6&playtest=rhythm>，版本参数表示当前源码，不是历史快照。下一步为用户实际体验单角循环及展信时翻页，以及真机键盘下操作。

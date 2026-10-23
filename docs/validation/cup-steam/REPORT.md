# 茶杯热气

2026-10-23，仅现有项目本地修改，未提交、推送或部署。

- cup-steam.js/css：三缕浅暖白SVG热气，5.4–6.2秒错相轻升、微散、渐隐，锚定原画杯口(281,1120)，不移动或覆盖杯子。无新图片资产、音效、交互或存档。
- 热气层pointer-events:none、aria-hidden；阅读/离屏/后台暂停，减少动态隐藏。CSS动画，不启用JS逐帧循环。
- Chromium/WebKit，320×568和390×844共4环境通过。验证实际变换随时间变化、杯口相对坐标、书籍点击/阅读暂停及归架恢复、离屏暂停与减少动态；后台仅visibilitychange/document.hidden事件模拟，非真实切换应用。页面错误为空。源JS/CSS HTTP内容与本地hash匹配，见source-hashes.json、results.json。
- 初次离屏断言用scrollIntoViewIfNeeded把上方书带入视野，但热气仍在视野内；改为明确相机移动且断言热气出视口后重跑4环境均通过，没有为测试改变产品。
- 检查脚本/tmp/cup-steam-check.cjs；截图/tmp/cup-steam-{chromium,webkit}-{320,390}.png。Chromium320截图已人工复看，热气来自杯口且不挡原物件。仅浏览器手机模拟，非实体手机帧率或主观验收。

入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新后查看茶杯。

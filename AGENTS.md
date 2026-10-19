# 纸间书店

- 当前工程从 Vercel 部署 `dpl_EgtnxRQQd6PyDrK92HAPUXGopr82` 恢复；证据与原始 HTML 在 `evidence/baseline/`，不要改写原始证据。
- 接手先读 `HANDOFF.md`。`index.html`、`styles.css`、`content.js`、`app.js`、`siddhartha.js`、`siddhartha.css`、`room.js`、`room.css` 是直接部署的静态源码，无构建步骤。
- 保留现有书店场景与书友留下真实痕迹的方向；书暂不流转、不引入游戏内 AI、不接入多人服务器。
- 修改移动交互后运行相关 Playwright Chromium/WebKit 测试，记录被测源文件哈希；浏览器手机视口、iOS 模拟器与真实 iPhone 验收分别陈述。
- 发布到现有 Vercel 项目时只上传明确的静态文件白名单；保留部署 ID 与回退入口。修改本地源码不代表已更新线上站点。

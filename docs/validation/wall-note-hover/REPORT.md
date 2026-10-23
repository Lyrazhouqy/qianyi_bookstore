# 植物挂画 Hover · 2026-10-23

现有开发分支局部修改，不改书/便笺/存档，不部署。

- 原画是场景位图的一部分。SVG复用同一图像，纸片独立绕(207,615)的顶部夹子摆动，夹子静止；邻近空白墙纹理软边遮底，原位图不编辑，无新增美术资源。rest/original/sway截图为同一浏览器局部画面。
- `wall-note.js` 单次小幅阻尼摆动，峰值约1.3度，最长1.8秒。离开提高阻尼；持续Hover不反复重启。点按/弹窗/开书/失焦/后台/resize/减少动态复位。精细鼠标指针才触发，触屏无Hover。`wall-note.css`按940×1672场景统一定位，纸片有轻影。原手记button/键盘/焦点仍沿用，移除原生悬浮title。
- 相关新增两文件加入index和明确静态白名单，不改版本号，不纳入其他窗口、猫、书架或音乐的并行改动。

测试：Chromium/WebKit桌面各2项=4/4；320×568、390×844两个引擎触屏各1项=4/4，共8/8，0失败/重试/跳过。实际逐帧transform有变化且幅度受限，夹子坐标不动；自动停止、移开收势、resize/blur/减少动态复位、Hover不写存档、点击/键盘开原手记、触屏点击开关和焦点均通过。详见results.json。手机视口模拟非真机，未另做盲测。

源码前后/HTTP SHA256见source-hashes.json，原图与两运行文件不变；共享HTML/room.js按实际记录，不称全工程冻结。完整报告、失败留存路径（本轮无失败）为evidence/wall-note-hover/。

复跑：

```sh
BOOKSHOP_REPORT=evidence/wall-note-hover/desktop.json npx playwright test tests/wall-note-hover.spec.cjs -g mouse --project=chromium-desktop --project=webkit-desktop --output=evidence/wall-note-hover/desktop
BOOKSHOP_REPORT=evidence/wall-note-hover/mobile.json npx playwright test tests/wall-note-hover.spec.cjs -g touchscreen --project=chromium-small --project=webkit-small --project=chromium-iPhone14 --project=webkit-iPhone14 --output=evidence/wall-note-hover/mobile
```

验收入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新，将鼠标移到窗户下方的植物纸画；观察夹子不动、纸片小摆，移开收势。仅本地开发分支，未推送或覆盖生产。

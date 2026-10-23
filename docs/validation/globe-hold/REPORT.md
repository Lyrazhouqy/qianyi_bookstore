# 按住地球仪缓慢转动

2026-10-23，仅本地开发分支，未提交、推送或部署。

## 实现

- globe.js / globe.css：手指、鼠标按住才转，250ms轻启，约36秒一圈，松手约320ms减速停止；保留停止朝向，不回跳。键盘空格/Enter也可按住。
- 只在原画球体区域绘制球面投影，按原轴上端(782,478)、下端(722,588)计算固定斜轴；不旋转DOM、支架、底座或外框，外轮廓不平移。原画样式不变，未生成新美术；背面装饰图案复用现有可见球面。
- 手指移动超过9px取消，不阻止场景滚动；pointercancel/失去捕获、离屏、切后台、开书均停止。减弱动态时静止。首次主动按住前保留原画。无存档写入。
- index.html引入两个文件，release-manifest.json补静态白名单；保留并行故事/猫任务的已有改动。

## 验证

- Chromium、WebKit，320×568 / 390×844，最终12/12通过，0失败/跳过；长按、松手、拖动取消、键盘、减弱动态、离屏、旁边《夜航西飞》开书均覆盖。转动前后按钮坐标/大小相同，无CSS旋转，无页面错误。
- Chromium两尺寸另经CDP Input.dispatchTouchEvent长按、释放、滑动取消通过，见touch-protocol.json。浏览器手机尺寸和原生触摸协议仍为模拟，不是实体iPhone/Safari验收。
- 首轮10/12：高屏滚到猫附近时地球仪仍在屏内，离屏测试前提错误；改为明确移出视口后全量12/12通过，未为测试修改产品逻辑。
- 运行JS/CSS的HTTP内容与本地SHA256一致，见source-hashes.json。完整原始结果 /tmp/globe-playwright-final.json；截图 /tmp/globe-final-tests/ 下before.png、holding.png；触摸原始结果 /tmp/globe-cdp.json。

验收入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新后按住地球仪。原用户浏览器未操作。真实手机长按手感及地图美术连续性仍待用户验收。

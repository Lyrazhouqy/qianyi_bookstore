# 卡通真实地图与转速调整

日期：2026-10-23；仅现有项目本地开发分支，未提交、推送或部署。

- 按住转速由36秒一圈改为18秒一圈；250ms起步/320ms停止及拖动取消保持。
- 原有随机球面/镜像背面替换为Natural Earth 1:110m真实陆地轮廓，完整360°经纬度贴图，蓝海/浅鼠尾草绿陆地、简洁卡通轮廓与柔和明暗。127个陆地多边形，保留岛屿/内环，坐标只舍入至0.001度；无行政边界/文字。原斜轴与支架不动，球面216×210绘制用于小屏清晰显示。初始即显示新球面，无须先按住。
- 数据来源：https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson 。Public Domain条款：https://www.naturalearthdata.com/about/terms-of-use/ 。源SHA256和处理说明见assets/scene/globe-land-natural-earth-110m.source.md。用Canvas按数据上色，没有调用图像生成模型或新增付费调用。
- 本轮交互12/12（Chromium/WebKit320×568/390×844）及新增资源失败4/4分别通过；失败时回退原画且移除无效按钮。原始日志分别/tmp/globe-map-results.json、/tmp/globe-map-fallback-results.json，未混称一次运行。
- Chromium两尺寸CDP真实触摸协议长按900ms，角度0.27060 / 0.26781弧度，释放停止；13个陆地/海洋坐标探针通过，含七大洲、日本、格陵兰、马达加斯加及三大洋。只作数据与浏览器模拟验证，不是物理手机或测绘级验收。
- 最终运行JS/CSS/地图资产HTTP与本地SHA256匹配，见source-hashes.json。截图preview.png；全场景前后截图位于/tmp/globe-map-tests。

验收：http://127.0.0.1:4173/?playtest=rhythm 。刷新并按住地球仪；待用户确认转速与卡通地图风格。

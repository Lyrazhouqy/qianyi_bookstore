# 音乐默认开启与WebKit自动播放暂停修正

2026-10-23，现有项目本地修改，未提交、推送或部署。

- 原代码已在页面初始化调用play()，恢复上次唱片、循环/渐入，并在NotAllowedError后等首次真实点击/Enter/空格重试。
- 实际检查发现WebKit在首次真实交互之前可先发pause事件再拒绝自动播放；原pause监听器将其当作用户暂停，增加revision后忽略随后的策略拒绝，导致第一次点击也不播放。本轮区分尚未交互的策略暂停与主动暂停：前者清理音轨并回ready，后者保持paused。保留原选择、继续位置、主动暂停和title移除等并行修改。
- 原音乐默认测试8/8；实际无策略注入的WebKit探针复现entry=paused且gesture后仍paused，一次等待ready/playing因此超时。修正后实际Chromium/WebKit390均entry=ready、首次点击后playing、真实MP3媒体时钟前进，见actual-policy-observation.json。
- 最终Chromium/WebKit320/390共12/12通过，含新增pause先于NotAllowedError夹具、首触/键盘解锁、选曲记忆、主动暂停及不重叠播放。浏览器策略拒绝夹具是模拟；额外无注入观察使用实际浏览器策略与媒体解码，仍非物理iPhone/扬声器真人试听验收。
- 最终music.js HTTP与本地hash匹配，见verification.json；完整结果/tmp/music-default-fix-results.json，证据目录/tmp/music-default-fix-tests。未操作用户原标签或清存档。

入口：http://127.0.0.1:4173/?playtest=rhythm 。刷新后默认尝试播放，受浏览器策略限制时第一次点击页面播放。

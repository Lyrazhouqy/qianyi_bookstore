# 点击花束也能选花

2026-10-23（Asia/Shanghai），feat/rhythm-v014，起始61c1d6d。保留并行窗景/地球仪/书架/声音等修改，仅提交本任务改动。没有单独变更版本或部署生产。

点击花束或花瓶均调用既有同一个换花弹窗，用户明确选择后更换，沿用三种花、淡入、花束晃动和paperbook-bouquet-v1记忆。花束增加dialog语义、当前花名同步及可靠命中层；关闭后焦点回到实际点击的花束/花瓶。悬浮/轻碰依旧晃动，不自动轮换。花束上的拖动交回现有相机，位移/取消手势拦住其后的click，键盘Space/Enter可正常打开。阅读进度与旧存档保持。

Chromium/WebKit各320×568、390×844，换花及花束动画定向36/36通过，0失败、跳过、flaky：两入口同弹窗、三种花/记忆/标签同步、命中/实际入口焦点、拖动确实移动相机且不弹窗、取消后不误开、键盘、晃动/固定花瓶、减少动态、附近猫书仍可拿起，以及原图片失败/最后选择优先/关闭取消。旧晃动用例随新行为补上关弹窗步骤。原始日志本机evidence/flower-entry/results.json，摘要test-summary.json。

bouquet.js、bouquet.css测试前后hash保持；room.js、index.html期间被并行窗景任务修改，不称全工程或四文件单一冻结。记录时四项HTTP与当前文件匹配（runtime-hashes.json）。node --check bouquet.js/room.js、git diff --check通过。手机视口/触摸及取消注入为浏览器模拟，不是实体iPhone/Safari或主观验收。

入口 <http://127.0.0.1:4173/?playtest=rhythm&flowers=choose>。当前工作区版本标记由其他任务更新为v0.14.15，本任务不提交该版本改动。原用户标签未操作，需重新加载；未推送/部署。下一步用户点花朵选择一束并确认与花瓶一致。

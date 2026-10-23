# 翻页参考与本轮取舍

查阅日期：2026-10-23。来源与设计判断分开；没有购买/直接操作参考游戏，没有取得其时长、阈值、曲线或真机性能数据。尝试打开官方视频时浏览器控制连接超时，未完成观看，不提供虚构视频时码或逐帧测量。

| 参考 | 可核实的来源事实 | 对本项目的设计判断 |
| --- | --- | --- |
| [Tengami 开发者官网](https://www.nyamyam.com/tengami)及[Jennifer Schneidereit 访谈](https://www.nintendolife.com/news/2012/11/developer_interview_nyamyam_on_tengami_life_after_rare_and_nintendos_stance_on_indies) | 官网将翻、折、滑、拉作为探索方式；开发者明确说iOS纸艺跟随手指，玩家能控制操作快慢。 | 核心参考是可控性：慢拖纸边跟手，松手根据动量收尾，回拉可以反悔；纸张层次帮助预期下一页。具体几何、速度窗口和时长为本项目调参。 |
| [Storyteller 发行商官方介绍](https://annapurnainteractive.com/games/storyteller) | 漫画格、角色拖放与即时角色关系反应是其叙事操作。 | 采用动作与结果直接对应的方向：点击就翻，拖动就由手控制进度，纸边是主要入口。没有从官方文字推导其翻页时长，也不声称复制其动画。 |
| [Strange Horticulture 发行商介绍](https://www.iceberg-games.com/games/strange-horticulture-2/) | 植物店内使用百科与线索识别植物，书是反复查阅的物件。 | 作为重复阅读的操作成本参考：普通翻页要轻，不增加折纸步骤；保留原左原文/右便笺。未据该页面断言具体翻页实现。 |

本轮落实：纸边移动距离按纸张宽度换算角度，曲面总投影校正；最近80ms输入事件样本估速，停住90ms后速度失效；不足18px不视为甩页，回拉方向优先取消。轻点完整收尾340ms，拖动松手约150–360ms、回弹约150–230ms，沿用旧重访缩放与减弱动态偏好。以上是本项目目标值，非同类游戏实测值，也不等同真实手机体验验收。

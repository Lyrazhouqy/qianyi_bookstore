# 右下折角增强辨识度

2026-10-23，`feat/rhythm-v014`，基于 `e91fae3` 后的当前工作区。

仅修改 `secrets.css`：可见折角从约54px放大至67px，保留76px点击范围；接触阴影加深、卷边线略加粗，原纸张弧线/渐变和手势函数保持。原展开信件上移空间、翻页、草稿与全部便笺规则未改。

开始时已有花束选择相关未提交修改（bouquet.css/js、room.js、index.html、包版本/发布清单及其测试），当前版本由这些既有修改设为0.14.10；本任务不修改或提交这些文件，也不将本轮书角验证称作花束验收。使用现有项目入口 <http://127.0.0.1:4173/?v=0.14.10&playtest=rhythm>，版本参数不是历史快照。未部署生产。

沿用既有page-curl与single-corner套件，Chromium/WebKit各320×568、390×844。结果见[test-summary.json](test-summary.json)，相关4个运行源文件测试前后及HTTP哈希见[source-hashes.json](source-hashes.json)。截图为隔离Chromium390px、2倍设备像素、减弱动态以定格外观：[全图](corner-390.png) · [细节](corner-detail-390.png)。无物理iPhone或新盲测结论，未操作用户现有标签或存档。

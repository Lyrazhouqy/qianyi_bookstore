# 蓬松绿色波点抱枕

2026-10-23，用户要求长抱枕更蓬松，随后补充白色波点。使用内置image_gen，两次定向编辑，无CLI/API后备。保留原素材，只由`.cushion-left`显示本图的x126..346/y935..1090区域；其他场景和右侧花朵抱枕继续沿用既有素材。

输入：`sofa-cushions-v0612.png`为完整编辑目标，用户的抱枕局部截图为形状/配色参考。第一遍增加蓬松度；第二遍在第一遍结果上加奶白波点。

最终PNG原样复制，未裁切、重编码或覆盖原图。最终提示词：

```text
Use case: precise-object-edit. This input is the edit target, the complete warm paper-collage bookshop. Modify ONLY the sage-green lumbar cushion on the left side of the orange sofa. Add a restrained pattern of about 12 softly painted warm-white polka dots evenly spaced over the cushion fabric. Each dot diameter about 6 percent of the cushion height; no other motifs. The dots should follow the softly bulging fabric perspective, not look like sharp decals. Also keep the cushion noticeably plump and stuffed, with a gently swelling center, soft tucked rounded corners and a subtly shaded lower padded edge. Preserve its sage green, cream piping, horizontal tilt, position, approximate width and hand-painted texture. Preserve ALL other objects and the entire original scene composition unchanged. No crop or zoom; preserve the full 940 by 1673 scene proportions. All changed pixels must remain in the cushion area x126..346 y935..1090 in the original coordinates. Do not change the orange sofa or flower cushion, and add no text.
```

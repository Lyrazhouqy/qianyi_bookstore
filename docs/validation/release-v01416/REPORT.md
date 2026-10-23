# v0.14.16 发布记录

2026-10-23，现有paper-bookshop-playtest项目。用户授权提交所有本地成果并发布生产。静态白名单88项；根目录与/v0.14.16/同源，按旧提交5b49c2e逐项核对SHA256保留/v0.13.0/，共237个文件引用、107个唯一内容块。scripts/package-release.cjs可复现打包，不上传.preview、认证状态、node_modules或群聊源文件。

## 发布前检查

- 当前图文、窗景、手记、茶杯、纸声、地球仪、书架、音乐及手机阅读作为一个版本打包，工作区相关静态文件与冻结包88项SHA256保持。
- 发现引擎单元测试通过。手机Chromium/WebKit320/390，图册/地球仪/安全区/键盘模拟/音乐/手记/旧接力信/三景共128项范围：最终一轮125通过，排查声音时中断最后2项、1项未跑；剩余三项静音输出定向3/3。最早失败保留原报告，旧接力信测试隔离了后来加入的原创故事池，并对齐现有直接展信与“放回”按钮，产品流程未为测试回退。见[local-checks.json](local-checks.json)。
- 浏览器模拟不是物理手机验收；静音复核保留真实媒体解码/时钟及WebAudio处理，输出接零增益，未作真人听音结论。用户在手机验证实际手感与声音。

## 部署

- 已发布生产：<https://paper-bookshop-playtest.vercel.app/v0.14.16/>，根目录同版本；旧版<https://paper-bookshop-playtest.vercel.app/v0.13.0/>保持原内容。
- Vercel部署 `dpl_EyU3rCuXEfxT1B6M7BjoH4bk3SRn`，项目 `prj_3ppzRCOoA2Uk9XXmoDeraGFmQkZY`，READY、正式域名绑定、无aliasError，原保护设置不变。唯一部署域名仍遵循项目原认证规则；手机使用上面的正式域名。
- 游戏源码提交 `eefa5dffc555a086185082f6db0f702feaf77de3`，GitHub main与feat/rhythm-v014均已推送；发布元信息与验证脚本随后独立提交，静态游戏文件保持同一快照。
- 无认证公开请求：新版/根/旧版入口200；88个新版资源、4个根目录代码及3个旧版代码共95项SHA256匹配，见[online-resources.json](online-resources.json)。其余旧版文件打包前由原Git提交逐项验证，不称全部旧版资源均做了网络下载检查。
- 线上两引擎320/390共4条隔离浏览器流程通过：版本、34本书、三景+空白上传、新手记标题/16px正文、拿书/展信/左原文右便笺/下一页、留本机便笺、猫图册。页面错误为空，见[online-smoke.json](online-smoke.json)。scripts/verify-release.cjs使用静音输出，不影响真实音频时钟，不代表实体手机、真人试听或真实多人共创验收。
- 回退部署 `dpl_AzX2E39tmvzL2XRtBC2Aq7uAYkGk`（v0.13.0）；当前部署与历史保存在release-manifest.json。回退时在同项目把这个已有部署重新提升到生产。

![线上手机模拟预览](phone-online-preview.png)

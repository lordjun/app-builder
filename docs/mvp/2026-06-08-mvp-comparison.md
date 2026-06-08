# MVP Direction Comparison

日期：2026-06-08  
候选方向：设备工具 vs PDF 工具  
目的：选择第一个进入原型开发的 APP 方向  

## Executive Recommendation

建议第一款原型选择 `Privacy-First PDF Toolbox`，第二优先级保留 `Connection-First Casting Tool` 做技术验证。

原因很直接：PDF 工具的 MVP 边界更清楚，开发更快，数据和硬件依赖更少，更适合本项目从市场研究进入第一个可运行产品。设备工具的商业信号更强，但兼容性、协议、客服、退款和版权边界风险更高，适合在 PDF 原型推进的同时做小规模技术验证。

## Comparison Table

| 维度 | Privacy-First PDF Toolbox | Connection-First Casting Tool | 判断 |
|---|---|---|---|
| 需求强度 | 高，免费榜和文档工具同类信号强 | 高，畅销工具榜和设备工具差评信号强 | 接近 |
| 付费信号 | 中，靠高级功能和买断/订阅 | 高，设备工具畅销榜验证更强 | 设备工具胜 |
| 痛点可解决性 | 高，广告、权限、收费、导出流程可直接优化 | 中高，连接失败可优化但受设备和网络影响 | PDF 胜 |
| MVP 开发速度 | 快，可用 Web/PWA 一周原型 | 慢，需要 Android 原型和设备测试 | PDF 胜 |
| 技术依赖 | PDF.js、pdf-lib、File API | Cast SDK、Roku ECP、局域网发现、真实设备 | PDF 胜 |
| 测试复杂度 | 中，主要是文件类型和浏览器 | 高，设备、网络、系统、权限组合多 | PDF 胜 |
| 失败风险 | 中，主要是同质化和付费转化 | 高，主要是兼容性、退款、客服 | PDF 胜 |
| 商业天花板 | 中，竞争多但稳定 | 中高，工具付费能力强 | 设备工具胜 |
| 合规风险 | 低到中，主要是隐私和文件处理 | 中到高，DRM、版权、设备协议边界 | PDF 胜 |
| 首个产品适配度 | 高 | 中 | PDF 胜 |

## Recommended Path

### Step 1: Build PDF Prototype

先做 `Privacy-First PDF Toolbox` 的 Web/PWA 原型：

- 图片转 PDF
- 合并 PDF
- 签名 PDF
- 本地导出
- 明确隐私承诺

目标不是做完整 APP，而是在 1-2 周内验证：

- 用户是否真的完成任务。
- 用户是否觉得比竞品更清楚、更可信。
- 用户愿意为哪些高级功能付费。

### Step 2: Run Device Tool Technical Spike

并行做一个很小的 Android 技术验证：

- 扫描 Chromecast / Roku。
- 显示设备。
- 做连接测试。
- 记录失败原因。

如果设备发现和连接测试不稳定，就不要进入完整 MVP。如果技术验证顺利，再考虑第二个产品。

## Product 1: PDF Toolbox Decision Notes

### Why It Should Go First

- 不依赖硬件。
- 不依赖外部 API。
- 不需要用户注册。
- 可以先做 Web，快速上线。
- 痛点可由 UX 和定价策略直接改善。
- 可用真实文件任务测试。

### Core MVP

只做三个动作：

1. 图片转 PDF
2. 合并 PDF
3. 签名 PDF

压缩和页面重排可以作为第二批功能。OCR、AI 文档问答、云同步暂不做。

### First Pricing Test

第一版不急着收费，但需要测试付费意愿：

- 免费完整完成基础任务。
- 高级功能入口显示价格锚点。
- 访谈用户愿意为批量处理、OCR、模板、无广告、云同步中的哪一项付费。

## Product 2: Device Tool Decision Notes

### Why It Should Not Go First

- 需要真实设备测试。
- 用户环境不可控。
- 很容易因为“我的设备不支持”产生差评。
- 投屏和视频内容涉及 DRM 边界。
- 客服压力会从第一天出现。

### Why It Should Still Be Explored

- 畅销工具榜验证了用户愿意为设备工具付费。
- 低评分痛点集中，说明竞品没有把连接和付费体验做好。
- 如果能做出“先测试可用，再收费”的模式，差异化很明确。

### Technical Spike Scope

只做：

1. 局域网扫描。
2. Chromecast / Roku 识别。
3. 连接测试。
4. 失败原因分类。

不做付费，不做完整投屏，不做遥控器。

## Product 3: Employee Scheduling Holding Pattern

员工排班方向暂时不进入第一个 MVP，但保留为后续 B2B / 小商户机会。

原因：

- HotSchedules 证明了付费意愿。
- 评论痛点明确。
- 但数据接入、企业流程、销售和多系统兼容会显著增加复杂度。

更合理的下一步是研究员工侧辅助工具：

- 多份工作排班聚合。
- 班次提醒。
- 工时和收入估算。
- 日历同步。

这个方向要等第一个 MVP 跑通后再做。

## First 14-Day Plan

### Days 1-2: Product Skeleton

- 确定 PDF Toolbox 的三个核心动作。
- 写页面结构和用户路径。
- 确定技术栈：React / Next.js / pdf-lib / PDF.js。

### Days 3-6: Prototype

- 实现文件选择。
- 实现图片转 PDF。
- 实现 PDF 合并。
- 实现签名导出。

### Days 7-8: UX And Trust Layer

- 增加隐私提示。
- 增加导出确认。
- 增加错误提示。
- 增加基础移动端适配。

### Days 9-10: Testing

- 用真实 PDF 和图片测试。
- 检查大文件、中文文件名、移动浏览器。
- 记录任务完成时间。

### Days 11-14: User Validation

- 找 10 个用户完成真实文件任务。
- 记录失败点。
- 问愿意付费的功能。
- 根据反馈决定是否做 Android 版或继续 Web 版。

## Decision Gate

PDF 原型继续推进的条件：

- 10 个测试用户中至少 7 个能完成核心任务。
- 平均首次任务完成时间低于 3 分钟。
- 至少 3 个用户明确表示愿意为高级功能付费。
- 没有严重文件损坏或导出失败问题。

如果达不到这些条件，应先修正产品体验，不进入完整 APP 开发。

设备工具继续推进的条件：

- 技术原型能稳定发现至少两类设备。
- 连接失败原因能被准确分类。
- 用户理解并接受“先连接测试，成功后再付费”的模式。
- 不需要支持 DRM 内容也能形成足够价值。

## Final Recommendation

第一款产品：`Privacy-First PDF Toolbox`。  
第二技术探索：`Connection-First Casting Tool`。  
暂缓方向：`Employee Scheduling Assistant`。

下一步应进入 PDF Toolbox 的详细产品规格和实现计划。

已创建后续执行文档：

- [Privacy-First PDF Toolbox PRD](../product/privacy-first-pdf-toolbox-prd.md)
- [Implementation Plan](../superpowers/plans/2026-06-08-privacy-first-pdf-toolbox.md)

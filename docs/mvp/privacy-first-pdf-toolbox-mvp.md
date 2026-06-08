# Privacy-First PDF Toolbox MVP

## Product Thesis

PDF、扫描和文档工具需求强，竞品多但体验常见问题明显：权限重、广告多、功能堆叠、收费不透明、用户不信任文件处理过程。第一版产品不做“大而全 PDF 编辑器”，而是做一个离线优先、透明收费、少打扰的轻量 PDF 工具箱。

核心差异化：文件不上传，基础动作免费，高级能力清楚收费。

## Target Users

- 学生：提交作业、整理讲义、合并扫描件。
- 自由职业者：合同签名、报价单、发票、客户文件。
- 小商户：收据、运单、证件、表格、菜单。
- 签证、租房、房产、保险等需要临时处理文件的人。

## Core Pain Points

1. 临时打开 PDF 却被广告或付费墙打断。
2. 合并、签名、压缩等简单动作被复杂 UI 包住。
3. 工具请求读取所有文件，隐私压力高。
4. 导出时才发现有水印或需要订阅。
5. 扫描和图片转 PDF 的结果不稳定。
6. 不知道文件是否上传到云端。

## MVP Scope

### Include

- 打开用户选择的 PDF。
- 图片转 PDF。
- PDF 合并。
- PDF 压缩。
- 手写签名和日期文本。
- 页面重排和删除。
- 本地导出。
- 明确隐私提示：文件默认不离开设备。

### Exclude

- 不做完整 PDF 编辑器。
- 不做复杂 OCR。
- 不做多人协作。
- 不做云盘同步。
- 不做 AI 文档问答。
- 不做所有格式转换。
- 不请求全盘文件管理权限，除非平台要求且用户明确同意。

## First Screen

首屏直接给出 5 个工具入口：

- 打开 PDF
- 图片转 PDF
- 合并 PDF
- 压缩 PDF
- 签名 PDF

底部显示隐私承诺：`默认本地处理，不上传文件。`

不放营销 hero，不放长介绍，不先要求注册。

## User Flow

### Sign PDF

1. 用户选择 `签名 PDF`。
2. 选择一个 PDF 文件。
3. 添加签名或日期。
4. 拖动到页面位置。
5. 预览。
6. 导出。

### Image To PDF

1. 用户选择照片或拍照。
2. 自动裁边和排序。
3. 选择纸张尺寸。
4. 导出 PDF。

### Merge PDF

1. 用户选择多个 PDF。
2. 拖动排序。
3. 可删除页面。
4. 导出合并文件。

## Monetization

推荐从低摩擦开始：

- 免费：打开、签名、图片转 PDF、合并少量文件、基础压缩。
- Pro：批量处理、无次数限制、高级压缩、模板、OCR、更多签名样式。
- 定价：优先考虑一次性买断 + 可选订阅，而不是只做订阅。

原则：

- 不在导出最后一刻突然收费。
- 不给免费导出加水印，除非首页和工具入口提前写清楚。
- 不通过恐吓式提示推动付费。

## Success Metrics

- 首次任务完成率。
- 从打开 APP 到完成导出的时间。
- 导出失败率。
- 压缩后文件大小降低比例。
- 签名任务完成率。
- 免费用户 7 日复用率。
- Pro 转化率。
- 1 星评论中“广告、收费、隐私、导出失败”的比例。

## Tech Stack Recommendation

最快上线建议从 Web/PWA 或 Android 先做：

### Option A: Web / PWA

- React / Next.js
- PDF.js for viewing
- pdf-lib for merge/sign/page operations
- browser image APIs for image-to-PDF
- Stripe for payment if做 Web
- Vercel / Cloudflare Pages deployment

优势：开发快、跨平台、容易验证。  
劣势：移动端文件权限、分享入口和离线能力不如原生。

### Option B: Android

- Kotlin + Jetpack Compose
- Android document picker
- PdfRenderer / third-party PDF library
- Google Play Billing

优势：更贴近 Google Play 机会池。  
劣势：开发和上架验证成本高于 Web。

第一版建议先做 Web/PWA 验证核心流程，再决定是否转 Android 原生。

## Data And API Dependencies

- PDF.js
- pdf-lib
- Browser File API
- Optional OCR API only after MVP 验证
- Payment provider if Pro plan is tested

## Testing Plan

自动化测试：

- 合并 PDF 页面顺序测试。
- 签名位置和导出测试。
- 图片转 PDF 输出页数测试。
- 压缩流程不会破坏文件测试。
- 文件不上传的端到端检查。

手工测试：

- 手机浏览器选择文件。
- 大文件导入。
- 多张图片转 PDF。
- 导出后在系统 PDF 阅读器打开。
- 离线或弱网下基础功能可用。

## Risks

- PDF 工具竞争极多，必须靠体验和信任差异化。
- Web 端处理大文件可能性能不足。
- 如果只做基础功能，付费转化可能低。
- 如果太早加复杂功能，会失去“轻量可信”的优势。
- OCR、AI 问答和云同步会增加隐私和成本风险。

## Validation Plan

先做一周内可完成的原型：

1. Web 页面提供 5 个工具入口。
2. 先实现图片转 PDF、合并 PDF、签名 PDF 三个核心动作。
3. 找 10 个用户完成真实文件任务。
4. 记录完成率、耗时、失败点和愿意付费的功能。

## Decision

这个方向是最快 MVP 候选。推荐作为第一款可执行产品原型，因为开发边界清楚、上手快、风险低、可以快速验证真实使用和付费意愿。

## Follow-Up Documents

- [Product Requirements](../product/privacy-first-pdf-toolbox-prd.md)
- [Implementation Plan](../superpowers/plans/2026-06-08-privacy-first-pdf-toolbox.md)

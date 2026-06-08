# Privacy-First PDF Toolbox PRD

日期：2026-06-08  
状态：Approved direction, ready for implementation planning  
产品：Privacy-First PDF Toolbox  

## 1. Product Goal

做一个离线优先、隐私友好、收费透明的轻量 PDF 工具箱，让用户在不注册、不上传文件、不被广告打断的情况下完成高频文档任务。

第一版目标不是替代 Acrobat，也不是做完整 PDF 编辑器，而是验证用户是否愿意使用一个更可信、更简单的 PDF 工具完成真实任务。

## 2. Target Users

### Primary Users

- 学生：把照片、讲义、作业合成 PDF。
- 自由职业者：签合同、整理报价单、合并客户文件。
- 小商户：处理收据、证件、菜单、发票、运单。
- 临时办事用户：租房、签证、保险、房产、学校表格。

### User Traits

- 不想学习复杂 PDF 软件。
- 只需要临时完成一个明确任务。
- 对文件隐私敏感。
- 讨厌导出时突然收费或加水印。

## 3. Core Jobs To Be Done

1. 当我有多张图片时，我想把它们按顺序转成一个 PDF，以便提交或分享。
2. 当我有多个 PDF 时，我想把它们合并成一个文件，以便减少整理成本。
3. 当我需要签名时，我想快速在 PDF 上添加签名和日期，以便完成表格或合同。

## 4. MVP Scope

### Included In Version 0.1

- Web/PWA 原型。
- 本地文件选择。
- 图片转 PDF。
- 多 PDF 合并。
- PDF 签名：手写签名或文本签名。
- 导出处理后的 PDF。
- 基础错误提示。
- 隐私提示：文件默认只在浏览器本地处理。
- 移动端可用的单页工具界面。

### Excluded From Version 0.1

- OCR。
- AI 文档问答。
- 云同步。
- 用户账号。
- 团队协作。
- 完整 PDF 文本编辑。
- 支付功能。
- 全量页面重排和复杂页面编辑。
- 后端服务。

## 5. Product Principles

- 不上传文件：默认所有处理都在浏览器中完成。
- 不先注册：用户打开页面即可开始任务。
- 不隐藏成本：第一版不收费，只记录未来付费意愿；后续收费点必须在任务开始前明确。
- 不做功能堆叠：先把三个核心任务做稳定。
- 不请求不必要权限：只通过用户主动选择文件读取内容。

## 6. First Screen

首屏是工具操作面板，不做营销页。

必须显示：

- 产品名：Privacy PDF Toolbox
- 隐私承诺：Files stay in your browser by default.
- 三个工具入口：
  - Images to PDF
  - Merge PDFs
  - Sign PDF
- 最近操作结果区。
- 错误提示区。

## 7. User Flows

### 7.1 Images To PDF

1. 用户点击 `Images to PDF`。
2. 用户选择一张或多张图片。
3. 系统显示图片数量和顺序。
4. 用户点击 `Create PDF`。
5. 系统生成 PDF。
6. 用户下载文件。

Success condition:

- 用户能把至少 1 张 JPG/PNG 图片导出为 PDF。
- 多张图片按选择顺序生成多页 PDF。

### 7.2 Merge PDFs

1. 用户点击 `Merge PDFs`。
2. 用户选择两个或更多 PDF。
3. 系统显示文件名和顺序。
4. 用户点击 `Merge PDFs`。
5. 系统生成合并后的 PDF。
6. 用户下载文件。

Success condition:

- 输出 PDF 的页面数量等于输入 PDF 页面总数。
- 文件顺序与用户选择顺序一致。

### 7.3 Sign PDF

1. 用户点击 `Sign PDF`。
2. 用户选择一个 PDF。
3. 用户输入文本签名或在画布上手写签名。
4. 用户选择签名位置。
5. 用户点击 `Apply Signature`。
6. 系统生成签名后的 PDF。
7. 用户下载文件。

Version 0.1 simplification:

- 签名默认添加到第一页。
- 文本签名默认在右下角。
- 手写签名默认在右下角。
- 后续版本再支持拖拽定位。

## 8. Functional Requirements

### File Handling

- 只接受 PDF、PNG、JPG、JPEG。
- 单个文件大小上限默认 25 MB。
- 超过限制时显示错误。
- 文件处理失败时不丢失页面状态。

### PDF Generation

- 图片转 PDF 使用图片原始比例居中排版。
- 合并 PDF 保留输入页面顺序。
- 签名 PDF 保留原 PDF 内容并添加签名层。

### Download

- 每个任务完成后提供明确下载按钮。
- 默认文件名：
  - `images-to-pdf.pdf`
  - `merged.pdf`
  - `signed.pdf`

### Privacy Messaging

- 首屏显示隐私承诺。
- 每个工具区显示一句简短说明：`Processed locally in your browser.`

## 9. Non-Functional Requirements

- 首屏在移动端 375px 宽度下可读。
- 三个核心工具不依赖网络请求。
- 不引入服务器端文件上传。
- 出错时显示用户可理解的信息。
- 代码结构要便于后续增加压缩、OCR 和支付。

## 10. Success Metrics

Prototype validation:

- 10 个测试用户中至少 7 个能完成一个真实任务。
- 平均首次任务完成时间低于 3 分钟。
- 至少 3 个用户明确表示愿意为高级功能付费。
- 0 个文件上传行为。
- 0 个严重导出损坏问题。

Product usage metrics:

- Tool started.
- Files selected.
- PDF generated.
- Download clicked.
- Error shown.
- User-reported friction.

## 11. Future Paid Features

第一版不做支付，只验证付费意愿。后续候选 Pro 功能：

- 批量处理。
- 高级压缩。
- OCR。
- 自定义签名位置。
- 页面重排。
- 模板。
- 无限制大文件。
- 云端同步，但必须明确和本地模式区分。

## 12. Risks

- Web 端大文件处理性能不足。
- 移动浏览器文件选择体验不一致。
- PDF 签名定位过于简化，可能不满足合同场景。
- 免费竞品很多，必须在信任和易用性上明显更好。
- 如果后续加入云端或 AI，隐私承诺需要重新设计。

## 13. Decision

Version 0.1 进入 Web/PWA 原型实现。技术栈建议为 Vite + React + TypeScript + pdf-lib + Vitest。第一轮只实现图片转 PDF、PDF 合并、PDF 签名三个任务。

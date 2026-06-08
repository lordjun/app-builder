# Device Utility MVP: Connection-First Casting Tool

## Product Thesis

用户愿意为打印、投屏、遥控这类家庭设备工具付费，但现有产品常见问题是连接失败、付费后仍不可用、订阅恢复困难、权限过重和更新后功能回退。第一版不做“万能设备工具”，而是做一个窄场景：`Roku / Chromecast 连接诊断 + 稳定投屏`。

核心差异化：先验证设备能否连接，再引导付费；清楚说明支持范围，不用“所有电视都支持”这类高风险承诺。

## Target Users

- 家里有 Chromecast、Roku 或智能电视，但不知道为什么手机投屏失败的普通用户。
- 经常把网页视频、本地视频、照片投到电视上的用户。
- 愿意为“稳定可用”付费，但讨厌试用陷阱和付费后不能用的用户。

## Core Pain Points

1. 设备不出现或无法连接。
2. 同一 Wi-Fi 下仍无法识别设备。
3. 暂停、快进、音量等控制不稳定。
4. 付费前不知道自己的设备是否被支持。
5. 付费后恢复订阅失败或仍提示再次付费。
6. 权限请求过多，用户不知道为什么需要。

## MVP Scope

### Include

- Chromecast / Google Cast 设备发现。
- Roku 设备发现。
- 网络诊断：同 Wi-Fi、局域网权限、设备响应、协议支持。
- 连接测试：连接成功前不进入付费墙。
- 投屏本地照片和公开视频 URL。
- 基础控制：播放、暂停、停止。
- 兼容性说明页：明确支持和不支持的设备。
- 订阅恢复和购买状态检查。
- 失败日志导出，用于客服和迭代。

### Exclude

- 不支持所有电视品牌。
- 不做 IPTV。
- 不做 DRM 视频破解或绕过。
- 不支持 Netflix、Disney+、HBO 等受 DRM 保护内容投屏。
- 不做完整电视遥控器。
- 不承诺跨所有网络环境可用。

## First Screen

首屏直接进入设备发现，不做营销页：

1. 顶部显示当前网络名称和连接状态。
2. 中间显示发现中的设备列表。
3. 每个设备显示品牌、协议、连接可用性。
4. 没发现设备时显示诊断步骤：Wi-Fi、权限、电视电源、设备协议。
5. 只有设备通过连接测试后，才显示高级投屏功能入口。

## User Flow

1. 用户打开 APP。
2. APP 请求必要权限，并解释用途。
3. APP 扫描 Chromecast / Roku 设备。
4. 用户选择设备。
5. APP 执行连接测试。
6. 如果失败，APP 给出具体原因和下一步。
7. 如果成功，用户试投一张照片或测试视频。
8. 用户确认可用后，再进入付费功能。
9. 付费用户可保存设备、批量投屏、投网页视频、恢复订阅。

## Monetization

建议先用透明订阅 + 一次性买断二选一：

- 免费：设备发现、连接诊断、一次测试投屏。
- Pro 月订阅：网页视频投屏、批量照片、设备收藏、历史记录。
- 一次性买断：适合讨厌订阅的工具用户。

付费页必须显示：

- 支持设备类型。
- 不支持 DRM 视频。
- 当前设备是否已通过连接测试。
- 退款和取消订阅说明。

## Success Metrics

- 设备发现成功率。
- 连接测试成功率。
- 连接失败后的问题解决率。
- 试投成功率。
- 付费转化率。
- 付费后 7 日退款率。
- 订阅恢复失败率。
- 1 星评论中“付费后不能用”的比例。

## Tech Stack Recommendation

第一版建议 Android 优先，因为 Google Play 设备工具和畅销工具榜信号更强。

- Android: Kotlin + Jetpack Compose
- Device discovery: mDNS / SSDP / Google Cast SDK / Roku ECP
- Local media: Android Media APIs
- Payments: Google Play Billing
- Analytics: privacy-friendly event logging
- Crash reporting: Sentry or Firebase Crashlytics

后续再考虑 iOS，但 iOS 的局域网权限、投屏生态和平台限制需要单独评估。

## Data And API Dependencies

- Google Cast SDK
- Roku External Control Protocol
- Local network discovery
- Google Play Billing
- Optional: support log upload endpoint

## Testing Plan

最低测试矩阵：

- Chromecast with Google TV
- Roku Streaming Stick / Roku TV
- Android 手机两种品牌
- 家庭 Wi-Fi 和移动热点
- 无设备环境
- 设备不同网段环境
- 购买、恢复购买、取消订阅后状态

自动化测试：

- 设备发现解析单元测试。
- 连接诊断状态机测试。
- 购买状态和权限状态测试。
- UI 快照测试。

手工测试：

- 连接失败时诊断是否准确。
- 设备成功连接后是否能完成测试投屏。
- 付费前是否清楚展示支持范围。

## Risks

- 设备兼容性会显著增加测试成本。
- 投屏场景容易触碰 DRM 和版权边界。
- 用户退款风险高，尤其是“付费后发现不支持我的设备”。
- 第三方协议变化可能导致功能回退。
- 需要客服和故障日志能力，否则差评会集中爆发。

## Validation Plan

先做无代码验证：

1. 制作支持范围和付费页文案。
2. 访谈 10 个真实投屏失败用户。
3. 确认他们是否接受“先连接测试，成功后再付费”的模式。

再做技术验证：

1. 写一个 Android 原型，只做设备发现和连接测试。
2. 在 3-5 台设备上测试。
3. 如果设备发现和连接测试稳定，再进入 MVP 开发。

## Decision

这个方向商业潜力高，但第一版必须严格收窄。推荐作为第二优先级技术探索，先做连接诊断原型，再决定是否投入完整 MVP。

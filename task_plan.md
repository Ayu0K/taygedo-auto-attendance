# Taygedo 多平台自托管路线计划

## 目标

把项目从 GitHub Actions 签到脚本演进成“核心签到能力 + 多运行环境适配器”的自托管工具。核心逻辑不绑定平台；账号、状态、通知、运行入口通过适配器接入。

## 已完成

- [x] 保持 GitHub Actions 签到和短信登录兼容。
- [x] 新增账号密码登录模式 `TAYGEDO_LOGIN_MODE=password`。
- [x] 账号 JSON 支持 `phone`、`password`、`passwordUpdatedAt`。
- [x] `accessToken` 失效后优先账密重登；失败后回退到 `refreshToken` 和 `laohuToken` 重建。
- [x] 新增 `loadRuntimeConfig(env)`，统一解析通知、重试、存储、KV key、管理员 token 等配置。
- [x] 新增 `AccountStore`：env、file、GitHub 文件写回、Cloudflare KV、Upstash REST。
- [x] 新增 `StateStore`：memory、file、Cloudflare KV、Upstash REST。
- [x] 新增服务层：`AttendanceService`、`LoginService`。
- [x] 新增本地 CLI：`pnpm local attendance` / `pnpm local login`。
- [x] 新增 Cloudflare Worker runtime：scheduled 定时签到、`/run` 手动触发、KV 账号写回和状态保存。
- [x] 新增 `wrangler.jsonc` 和 Cloudflare Deploy Button 文档。
- [x] 新增 Dockerfile、docker-compose、`.dockerignore`。
- [x] 新增 GHCR 多架构 Docker workflow，构建 `linux/amd64` 和 `linux/arm64`。
- [x] 调整 docker-compose 为一次性任务入口，默认使用 GHCR 镜像，避免 `restart` 导致重复签到。
- [x] 升级运行时和依赖到 Node 24 线：Actions/Docker 使用 Node 24，GitHub/Docker actions 升到避免 Node20 runtime 的主版本，TypeScript/Vitest/tsx/wrangler 更新。
- [x] README 已收敛为快速使用、部署方式、配置、安全提示和致谢。
- [x] README 补充 GitHub 新手 6 步部署路径，降低首次 Fork/Actions/Secret 配置门槛。
- [x] 登录 workflow 默认使用 `password` 模式，提供模式下拉和账号默认值。
- [x] 测试覆盖账号解析、账密登录、自动重登、存储、运行时配置、Local CLI、Cloudflare Worker、store factory。

## 待完成

- [ ] 把 auth retry 下沉到统一请求/session 层，401/402 后重登并重试当前请求。
- [ ] 增加塔吉多金币任务：浏览帖子、点赞帖子、分享帖子、任务状态查询。
- [ ] 补完整设备指纹字段：`openudid`、`vendorid`，并支持打印、复用、强制生成。
- [ ] 增加 BBS `ds` 签名和 native/H5 请求封装，提高协议完整度。
- [ ] 真正使用 `StateStore` 做每日去重：`attendance:<accountId>:<date>`。
- [ ] 保存结构化运行历史：最近一次结果、失败账号、每游戏统计。
- [ ] 通知系统升级：更丰富渠道、失败通知隔离、统一消息收集器。
- [ ] Docker 增加常驻循环或内置调度模式。
- [ ] 为 GitHub 新手补充 README 截图或 GIF：创建 PAT、添加 Secret、Run workflow。
- [ ] 增加 workflow 失败排查表：PAT 权限不足、未启用 Actions、密码 Secret 缺失、账号 JSON 格式错误。
- [ ] 支持普通 Redis、S3 或通过 `unstorage` 接更多后端。
- [ ] 增加 lint/format 和 CI 质量门禁：test、build、Docker build smoke test。
- [ ] Web 管理界面：账号添加、手动触发、最近结果查看。

## 风险与注意

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 明文保存密码 | 泄漏账号凭据 | 仅放 Secret/KV/权限受限文件，README 明确警告 |
| Cloudflare Node crypto 兼容差异 | 登录加密失败 | 已启用 `nodejs_compat`，后续可迁移 Web Crypto |
| KV/Upstash 写回失败 | token 更新丢失 | 失败应进入摘要和通知 |
| 自动重登过度触发 | 风控或频繁登录 | 单账号单次运行限制重登次数 |
| 一键部署误导用户 | 用户以为无需配置账号 | README 明确部署后仍需配置账号 JSON |

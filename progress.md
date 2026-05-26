# Progress

## 2026-05-25

- 阅读了当前项目结构、README、package scripts、GitHub Actions workflow、核心 runner/action/account 文件。
- 对照查看了参考仓库的 README、`wrangler.jsonc`、`nitro.config.ts`、`package.json`。
- 明确用户选择路线 2：多平台自托管签到服务。
- 创建本计划文件，暂未修改业务代码。
- 重新浅克隆并分析参考仓库，重点看了 `plugins/storage.ts`、`tasks/attendance.ts`、`utils/attendance/*`、`scripts/action.mjs`、GitHub schedule workflow。
- 更新发现：参考项目的 Redis/Upstash/KV 主要用于运行状态持久化，账号凭据仍来自环境变量；本项目需要额外解决刷新 token 写回，因此应分离 `AccountStore` 和 `StateStore`。

## 2026-05-26

- 实现账号密码登录：`TaygedoApi.loginWithPassword()` 调用老虎 `secureLogin`，登录 workflow 支持 `password` 模式。
- 扩展账号 JSON：新增 `phone`、`password`、`passwordUpdatedAt`。
- 调整签到会话恢复顺序：`accessToken` 失效后优先账密重登，失败再回退到 `refreshToken` 和 `laohuToken`。
- 新增运行配置解析：`src/config/runtime.ts`。
- 新增存储抽象：`AccountStore` / `StateStore`，实现 env、file、Cloudflare KV、Upstash REST 等后端。
- 新增服务层：`AttendanceService`、`LoginService`。
- 新增 Local CLI：`pnpm local attendance`、`pnpm local login`。
- 新增 Cloudflare Worker runtime、`wrangler.jsonc`、手动 `/run` 触发和 KV 写回。
- 新增 Dockerfile、docker-compose、`.dockerignore`。
- 新增 GHCR 多架构 Docker workflow：推送 `linux/amd64`、`linux/arm64` 镜像。
- README 重写为更简洁的快速使用/部署/配置说明，并在致谢中提到 `AEtherside/skland-daily-attendance` 和 `SkyBlue997/tjd-daily`。
- 为第一次使用 GitHub 的用户补充最短部署路径：Fork、启用 Actions、创建 PAT、添加 Secrets、运行登录和签到 workflow。
- 登录 workflow 的 password 模式优先读取 `TAYGEDO_LOGIN_PASSWORD` Secret，避免新手把密码留在 workflow 输入记录里。
- 继续优化 GitHub 新手体验：`塔吉多登录` workflow 默认 `password` 模式，改成下拉选择，并给 `account_id=main`、`account_name=主账号` 默认值。
- README 开头改为 6 步部署承诺，并把 fine-grained PAT 权限说明收敛到 `Secrets: Read and write`，同时说明首次登录只需要填手机号，减少第一次配置时找错权限或字段。
- 调整 `docker-compose.yml`：默认使用 GHCR 镜像，`restart: "no"`，作为一次性签到任务入口，避免容器退出后自动重启造成重复执行；README Docker 段落同步改为 `docker compose run --rm taygedo-attendance`。
- 升级 Node/runtime 与依赖：GitHub Actions `actions/checkout@v5`、`actions/setup-node@v5` 且 `node-version: 24`；Dockerfile 使用 `node:24-alpine`；Docker actions 升到 `setup-qemu@v4`、`setup-buildx@v4`、`login-action@v4`、`metadata-action@v6`；`@types/node` 升到 24 线，`tsx`、`typescript`、`vitest`、`wrangler` 更新并刷新 lockfile。
- 验证 action 主版本标签存在；`rg` 确认仓库中除 lockfile 的依赖元数据外没有残留 Node 20/22 运行时配置。
- 验证：`pnpm test` 通过，13 个测试文件、50 个测试；`pnpm build` 通过。

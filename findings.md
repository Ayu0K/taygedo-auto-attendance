# Findings

## 当前项目结构

- 项目是 TypeScript + pnpm，当前主要入口是 `src/action.ts`。
- `src/runner.ts` 已经比较接近核心业务层：读取账号 JSON、执行签到、必要时通过 `secretWriter` 写回更新后的账号。
- `src/login-action.ts` 承担 GitHub Actions 手动登录流程。
- `.github/workflows/attendance.yml` 负责定时签到和把 `updated-accounts.json` 写回 GitHub Secret。
- `.github/workflows/login.yml` 负责短信验证码登录并写回 `TAYGEDO_ACCOUNTS`。

## 参考项目观察

- `AEtherside/skland-daily-attendance` 使用 Nitro 支持多平台部署。
- 它的一键 Cloudflare 部署不是只有 README 按钮，还依赖 `wrangler.jsonc`、定时任务配置和运行时配置。
- 参考项目通过运行时配置和存储能力把 Cloudflare Workers、GitHub Actions、Docker 等环境统一起来。
- 参考项目的主要平台抽象来自 Nitro：
  - `nitro.config.ts` 开启 `experimental.tasks`，用 `scheduledTasks` 配置定时任务。
  - `tasks/attendance.ts` 用 `defineTask` 实现签到任务。
  - `useRuntimeConfig()` 统一读取 `SKLAND_TOKENS`、通知 URL、重试次数等配置。
  - `useStorage()` 统一读写持久化状态。
- 参考项目的 GitHub Actions 不是直接跑核心函数，而是启动 Nitro dev server，然后请求 `/_nitro/tasks/attendance`。这样 GitHub Actions、Cloudflare、Docker 都走同一条 task 入口。
- 参考项目的 Cloudflare 部署依赖 `wrangler.jsonc`：
  - `kv_namespaces` 绑定名为 `KV`。
  - `triggers.crons` 和 `nitro.config.ts` 的 `scheduledTasks` 使用同一 cron。
  - README 放 Deploy Button。
- 参考项目的存储插件 `plugins/storage.ts` 用 `unstorage` 动态选择驱动：
  - Upstash Redis: `KV_REST_API_URL` + `KV_REST_API_TOKEN`，或 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`。
  - Redis: `REDIS_URL` 或 `KV_URL=rediss://...`。
  - S3: `S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`S3_BUCKET`、`S3_REGION`。
  - Cloudflare KV: Nitro preset 包含 `cloudflare` 时自动用 binding `KV`。
  - Deno KV: Nitro preset 包含 `deno` 时自动启用。
  - 默认: 本地 `.data/kv`。
- 参考项目的 Redis/Upstash/KV 主要用于运行状态持久化，例如按 token hash + 上海日期生成 `kv:attendance:<hash>:<date>`，用来判断今天是否已经签到；账号凭据仍来自环境变量 `SKLAND_TOKENS`。

## 对本项目的启发

- 不建议直接引入 Nitro，当前项目规模用原生 Worker 适配器更轻。
- 更重要的是先抽象存储、配置、运行入口，再做 Cloudflare Deploy Button。
- 当前 `runAttendance` 的 `secretWriter` 是一个很好的过渡点，可以演进成 `AccountStore`。
- Cloudflare 下无法直接写 GitHub Secret，刷新后的账号应写入 KV 或其他存储。
- 需要区分两类存储：
  - `AccountStore`: 保存账号 JSON 和刷新后的 token，是本项目必须解决的问题。
  - `StateStore`: 保存运行状态，例如“今天是否签到过”、最近一次摘要、执行历史，是增强体验和避免重复执行用的。
- 如果模仿参考项目引入 `unstorage`，可以统一 Cloudflare KV、Upstash、Redis、S3、本地文件。但代价是依赖变重，且当前项目不一定需要 S3/Deno 等全部驱动。
- 更适合本项目的渐进方案：先自定义小接口 `AccountStore` 和 `StateStore`，实现 GitHub 文件、Cloudflare KV、本地文件；后续需要多后端时再引入 `unstorage`。

## 技术注意点

- 当前 `src/taygedo/api.ts` 使用 `node:crypto`。
- Cloudflare Workers 需要启用 Node.js compatibility 才能尽量兼容 Node crypto。
- 如果 Worker 环境实际不支持所需加密 API，需要再迁移到 Web Crypto 或纯 JS 实现。
- 参考项目使用 Web Crypto 的 `crypto.subtle.digest` 生成状态 key，这比 Node crypto 更适合跨 Workers/Node/Deno。

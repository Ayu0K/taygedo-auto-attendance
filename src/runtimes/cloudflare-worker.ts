import { loadRuntimeConfig } from '../config/runtime.js'
import { AttendanceService } from '../services/attendance-service.js'
import { createAccountStore, createStateStore } from '../stores/factory.js'
import { TaygedoApi } from '../taygedo/api.js'

type ScheduledController = Record<string, unknown>
type ExecutionContext = Record<string, unknown>

interface CloudflareEnv extends Record<string, unknown> {
  KV: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
  TAYGEDO_TEST_API?: ConstructorParameters<typeof AttendanceService>[0]['api']
}

const worker = {
  async scheduled(_event: ScheduledController, env: CloudflareEnv, _ctx: ExecutionContext): Promise<void> {
    await runCloudflareAttendance(env)
  },

  async fetch(request: Request, env: CloudflareEnv, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/run') {
      return Response.json({ ok: true })
    }

    const config = loadRuntimeConfig(envToStrings(env))
    if (config.adminToken && request.headers.get('Authorization') !== `Bearer ${config.adminToken}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runCloudflareAttendance(env)
    return Response.json({ ok: true, summary: result.summary })
  },
}

export default worker

async function runCloudflareAttendance(env: CloudflareEnv) {
  const config = loadRuntimeConfig(envToStrings(env))
  const service = new AttendanceService({
    accountStore: createAccountStore({ config, kv: env.KV }),
    stateStore: createStateStore({ config, kv: env.KV }),
    api: env.TAYGEDO_TEST_API ?? new TaygedoApi(),
    notificationUrls: config.notificationUrls,
    maxRetries: config.maxRetries,
  })
  return await service.run()
}

function envToStrings(env: CloudflareEnv): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {
    TAYGEDO_ACCOUNT_STORE: 'cloudflare-kv',
    TAYGEDO_STATE_STORE: 'cloudflare-kv',
  }
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      values[key] = value
    }
  }
  return values
}

import { describe, expect, it, vi } from 'vitest'
import worker from '../src/runtimes/cloudflare-worker.js'

type ScheduledController = Record<string, unknown>
type ExecutionContext = Record<string, unknown>

describe('cloudflare worker runtime', () => {
  it('runs attendance from scheduled events and stores the latest summary', async () => {
    const kv = new Map<string, string>()
    kv.set('TAYGEDO_ACCOUNTS', JSON.stringify([
      { id: 'main', name: '主账号', uid: '1', deviceId: 'device-1', refreshToken: 'refresh' },
    ]))
    const env = createEnv(kv)

    await worker.scheduled({} as ScheduledController, env, {} as ExecutionContext)

    expect(kv.get('taygedo:last-summary')).toContain('塔吉多每日签到结果')
  })

  it('requires an admin token for manual trigger', async () => {
    const env = createEnv(new Map(), { TAYGEDO_ADMIN_TOKEN: 'secret' })

    const denied = await worker.fetch(new Request('https://example.com/run'), env, {} as ExecutionContext)
    const allowed = await worker.fetch(new Request('https://example.com/run', {
      headers: { Authorization: 'Bearer secret' },
    }), env, {} as ExecutionContext)

    expect(denied.status).toBe(401)
    expect(allowed.status).toBe(200)
  })
})

function createEnv(kv: Map<string, string>, overrides: Partial<Record<string, string>> = {}) {
  const api = {
    refreshToken: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh-new', uid: '1' }),
    getGameRoles: vi.fn()
      .mockResolvedValueOnce({ roles: [{ roleId: 'role-1', roleName: '角色一' }] })
      .mockResolvedValue({ roles: [] }),
    appSignin: vi.fn().mockResolvedValue({ exp: 10, goldCoin: 20 }),
    getSigninState: vi.fn().mockResolvedValue({ days: 1 }),
    getSigninRewards: vi.fn().mockResolvedValue([{ name: '奖励一', num: 1 }]),
    gameSignin: vi.fn().mockResolvedValue(undefined),
  }
  return {
    KV: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      put: vi.fn(async (key: string, value: string) => { kv.set(key, value) }),
    },
    TAYGEDO_TEST_API: api,
    TAYGEDO_ACCOUNTS: JSON.stringify([
      { id: 'main', name: '主账号', uid: '1', deviceId: 'device-1', refreshToken: 'refresh' },
    ]),
    ...overrides,
  }
}

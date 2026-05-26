import { describe, expect, it } from 'vitest'
import { loadRuntimeConfig } from '../src/config/runtime.js'
import { createAccountStore, createStateStore } from '../src/stores/factory.js'
import { EnvAccountStore, FileAccountStore, UpstashAccountStore } from '../src/stores/account-store.js'
import { FileStateStore, MemoryStateStore, UpstashStateStore } from '../src/stores/state-store.js'

describe('store factories', () => {
  it('creates default env and memory stores', () => {
    const config = loadRuntimeConfig({ TAYGEDO_ACCOUNTS: '[]' })

    expect(createAccountStore({ config })).toBeInstanceOf(EnvAccountStore)
    expect(createStateStore({ config })).toBeInstanceOf(MemoryStateStore)
  })

  it('creates file stores for local and docker runtimes', () => {
    const config = loadRuntimeConfig({
      TAYGEDO_ACCOUNT_STORE: 'file',
      TAYGEDO_STATE_STORE: 'file',
    })

    expect(createAccountStore({ config, accountsFile: 'accounts.json' })).toBeInstanceOf(FileAccountStore)
    expect(createStateStore({ config, stateDir: 'state' })).toBeInstanceOf(FileStateStore)
  })

  it('creates Upstash stores when REST credentials are configured', () => {
    const config = loadRuntimeConfig({
      TAYGEDO_ACCOUNT_STORE: 'upstash',
      TAYGEDO_STATE_STORE: 'upstash',
      TAYGEDO_UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
      TAYGEDO_UPSTASH_REDIS_REST_TOKEN: 'redis-token',
    })

    expect(createAccountStore({ config })).toBeInstanceOf(UpstashAccountStore)
    expect(createStateStore({ config })).toBeInstanceOf(UpstashStateStore)
  })
})

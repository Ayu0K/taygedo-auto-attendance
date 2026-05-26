import { describe, expect, it } from 'vitest'
import { loadRuntimeConfig } from '../src/config/runtime.js'

describe('loadRuntimeConfig', () => {
  it('loads defaults and notification urls from env', () => {
    expect(loadRuntimeConfig({
      TAYGEDO_ACCOUNTS: '[{"id":"main"}]',
      TAYGEDO_NOTIFICATION_URLS: ' https://example.com/a,https://example.com/b ',
      TAYGEDO_SERVERCHAN_SENDKEY: ' SCT123 ',
    })).toEqual(expect.objectContaining({
      accountsSecret: '[{"id":"main"}]',
      notificationUrls: [
        'https://example.com/a',
        'https://example.com/b',
        'https://sctapi.ftqq.com/SCT123.send',
      ],
      maxRetries: 3,
      updatedAccountsPath: 'updated-accounts.json',
      accountStore: 'env',
      stateStore: 'memory',
      accountsKey: 'TAYGEDO_ACCOUNTS',
      statePrefix: 'taygedo',
    }))
  })

  it('loads storage settings and admin token', () => {
    expect(loadRuntimeConfig({
      TAYGEDO_MAX_RETRIES: '5',
      TAYGEDO_UPDATED_ACCOUNTS_PATH: 'out/accounts.json',
      TAYGEDO_ACCOUNT_STORE: 'cloudflare-kv',
      TAYGEDO_STATE_STORE: 'upstash',
      TAYGEDO_ACCOUNTS_KEY: 'accounts',
      TAYGEDO_STATE_PREFIX: 'prod',
      TAYGEDO_ADMIN_TOKEN: 'admin-token',
      TAYGEDO_UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
      TAYGEDO_UPSTASH_REDIS_REST_TOKEN: 'redis-token',
    })).toEqual(expect.objectContaining({
      accountsSecret: undefined,
      maxRetries: 5,
      updatedAccountsPath: 'out/accounts.json',
      accountStore: 'cloudflare-kv',
      stateStore: 'upstash',
      accountsKey: 'accounts',
      statePrefix: 'prod',
      adminToken: 'admin-token',
      upstashUrl: 'https://redis.example.com',
      upstashToken: 'redis-token',
    }))
  })

  it('rejects invalid retry values', () => {
    expect(() => loadRuntimeConfig({ TAYGEDO_MAX_RETRIES: 'nope' })).toThrow('TAYGEDO_MAX_RETRIES must be a positive integer')
  })
})

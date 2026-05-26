import type { RuntimeConfig } from '../config/runtime.js'
import {
  CloudflareKvAccountStore,
  EnvAccountStore,
  FileAccountStore,
  type AccountStore,
  type KvNamespace,
  UpstashAccountStore,
} from './account-store.js'
import {
  CloudflareKvStateStore,
  FileStateStore,
  MemoryStateStore,
  type StateStore,
  UpstashStateStore,
} from './state-store.js'

interface StoreFactoryOptions {
  config: RuntimeConfig
  accountsFile?: string
  stateDir?: string
  kv?: KvNamespace
  fetch?: typeof globalThis.fetch
}

export function createAccountStore(options: StoreFactoryOptions): AccountStore {
  const { config } = options
  if (config.accountStore === 'env') {
    return new EnvAccountStore(config.accountsSecret)
  }
  if (config.accountStore === 'file') {
    return new FileAccountStore(options.accountsFile ?? config.updatedAccountsPath)
  }
  if (config.accountStore === 'cloudflare-kv') {
    if (!options.kv) {
      throw new Error('Cloudflare KV account store requires a KV binding')
    }
    return new CloudflareKvAccountStore(options.kv, config.accountsKey, config.accountsSecret)
  }
  if (!config.upstashUrl || !config.upstashToken) {
    throw new Error('Upstash account store requires TAYGEDO_UPSTASH_REDIS_REST_URL and TAYGEDO_UPSTASH_REDIS_REST_TOKEN')
  }
  return new UpstashAccountStore(config.upstashUrl, config.upstashToken, config.accountsKey, options.fetch)
}

export function createStateStore(options: StoreFactoryOptions): StateStore {
  const { config } = options
  if (config.stateStore === 'memory') {
    return new MemoryStateStore(config.statePrefix)
  }
  if (config.stateStore === 'file') {
    return new FileStateStore(options.stateDir ?? '.data/state', config.statePrefix)
  }
  if (config.stateStore === 'cloudflare-kv') {
    if (!options.kv) {
      throw new Error('Cloudflare KV state store requires a KV binding')
    }
    return new CloudflareKvStateStore(options.kv, config.statePrefix)
  }
  if (!config.upstashUrl || !config.upstashToken) {
    throw new Error('Upstash state store requires TAYGEDO_UPSTASH_REDIS_REST_URL and TAYGEDO_UPSTASH_REDIS_REST_TOKEN')
  }
  return new UpstashStateStore(config.upstashUrl, config.upstashToken, config.statePrefix, options.fetch)
}

import { describe, expect, it, vi } from 'vitest'
import { runLocalCli } from '../src/runtimes/local-cli.js'

describe('runLocalCli', () => {
  it('runs attendance from a local accounts file', async () => {
    const service = {
      runAttendance: vi.fn().mockResolvedValue({ summary: 'ok' }),
      runLogin: vi.fn(),
      sendLoginCode: vi.fn(),
    }

    await runLocalCli(['attendance', '--accounts-file', 'accounts.json'], { service })

    expect(service.runAttendance).toHaveBeenCalledWith(expect.objectContaining({
      accountsFile: 'accounts.json',
    }))
  })

  it('runs password login from CLI arguments', async () => {
    const service = {
      runAttendance: vi.fn(),
      runLogin: vi.fn().mockResolvedValue(undefined),
      sendLoginCode: vi.fn(),
    }

    await runLocalCli([
      'login',
      '--mode',
      'password',
      '--phone',
      '13800138000',
      '--password',
      'secret-password',
      '--account-id',
      'main',
      '--accounts-file',
      'accounts.json',
    ], { service })

    expect(service.runLogin).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'password',
      phone: '13800138000',
      password: 'secret-password',
      accountId: 'main',
      accountsFile: 'accounts.json',
    }))
  })
})

/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration, AMTUserConsent } from '../../../models'
import { createSpyObj } from '../../../test/helper/jest'
import {
  editProfile,
  getUpdatedData,
  handleAMTPassword,
  handleGenerateRandomMEBxPassword,
  handleGenerateRandomPassword,
  handleMEBxPassword
} from './edit'
import { ClientAction, TlsMode, TlsSigningAuthority } from '../../../models/RCS.Config'

describe('AMT Profile - Edit', () => {
  let resSpy
  let req
  let getByNameSpy: jest.SpyInstance
  let writeSecretWithObjectSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { profiles: { getByName: jest.fn(), update: jest.fn() } },
      body: { profileName: 'profileName' },
      query: {},
      tenantId: ''
    }
    getByNameSpy = jest.spyOn(req.db.profiles, 'getByName').mockResolvedValue({})
    jest.spyOn(req.db.profiles, 'update').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should edit', async () => {
    await editProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle found', async () => {
    // these should be global and checked if called
    // but not enought time in the sprint to do it correctly
    req.secretsManager = {
      writeSecretWithObject: jest.fn(),
      getSecretAtPath: jest.fn(),
      deleteSecretAtPath: jest.fn()
    }
    writeSecretWithObjectSpy = jest.spyOn(req.secretsManager, 'getSecretAtPath').mockResolvedValue({})
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'password',
      generateRandomMEBxPassword: false,
      mebxPassword: 'password',
      userConsent: 'None',
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }
    jest.spyOn(req.db.profiles, 'getByName').mockResolvedValue({
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      dhcpEnabled: false,
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      userConsent: 'None',
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    })
    await editProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('acm', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle not found', async () => {
    jest.spyOn(req.db.profiles, 'getByName').mockResolvedValue(null)
    await editProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.profiles, 'getByName').mockRejectedValue(null)
    await editProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('test editProfile when CIRA profile is changed to TLS profile', async () => {
    req.secretsManager = { writeSecretWithObject: jest.fn(), getSecretAtPath: jest.fn() }
    writeSecretWithObjectSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue({})
    req.body = {
      profileName: 'testTLS',
      activation: ClientAction.ADMINCTLMODE,
      amtPassword: null,
      ciraConfigName: null,
      generateRandomMEBxPassword: true,
      generateRandomPassword: true,
      tenantId: '',
      tags: [
        'tag1'
      ],
      wifiConfigs: [],
      dhcpEnabled: false,
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true,
      userConsent: 'None',
      version: '1'
    }
    jest.spyOn(req.db.profiles, 'getByName').mockResolvedValue({
      profileName: 'testTLS',
      activation: ClientAction.ADMINCTLMODE,
      amtPassword: null,
      ciraConfigName: 'ciraConfig2',
      generateRandomMEBxPassword: true,
      generateRandomPassword: true,
      mebxPassword: null,
      tenantId: '',
      tags: [
        'tag1'
      ],
      wifiConfigs: [],
      dhcpEnabled: false,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true,
      userConsent: 'None',
      version: '1'
    })
    jest.spyOn(req.db.profiles, 'update').mockResolvedValue({
      profileName: 'testTLS',
      activation: ClientAction.ADMINCTLMODE,
      amtPassword: null,
      ciraConfigName: null,
      generateRandomMEBxPassword: true,
      generateRandomPassword: true,
      mebxPassword: null,
      tenantId: '',
      tags: [
        'tag1'
      ],
      wifiConfigs: [],
      dhcpEnabled: false,
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true,
      userConsent: 'None',
      version: '2'
    })
    const amtConfig: AMTConfiguration = {
      profileName: 'testTLS',
      activation: ClientAction.ADMINCTLMODE,
      ciraConfigName: null,
      generateRandomMEBxPassword: true,
      generateRandomPassword: true,
      tenantId: '',
      tags: [
        'tag1'
      ],
      wifiConfigs: [],
      dhcpEnabled: false,
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true,
      userConsent: AMTUserConsent.NONE,
      version: '2'
    }
    await editProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('testTLS', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(200)
    expect(resSpy.json).toHaveBeenCalledWith(amtConfig)
    expect(writeSecretWithObjectSpy).toHaveBeenCalledTimes(1)
  })
})

test('test handleAMTpassword when the request body amtPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    amtPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    tenantId: ''
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleAMTpassword when the request body amtPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, amtPassword: 'Intel@123', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    amtPassword: 'Intel@123',
    tenantId: ''
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    mebxPassword: 'P@ssw0rd',
    generateRandomMEBxPassword: false,
    tenantId: ''
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, mebxPassword: 'Intel@123', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    mebxPassword: 'Intel@123',
    tenantId: ''
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomPassword: true,
    amtPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when passwordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomPassword: true,
    amtPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    activation: ClientAction.ADMINCTLMODE,
    generateRandomPassword: undefined,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with random amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    activation: ClientAction.ADMINCTLMODE,
    generateRandomPassword: true,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomMEBxPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when mebxPasswordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomMEBxPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomMEBxPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is undefined and profile created with mebxPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: undefined,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when the request body when activation changed', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, generateRandomMEBxPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: ClientAction.ADMINCTLMODE, tenantId: '' }
  const expected: AMTConfiguration = {
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when static passwords are changed to random', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    amtPassword: null,
    ciraConfigName: undefined,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when random passwords are changed to static', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: false,
    mebxPassword: 'P@ssw0rd',
    tenantId: '',
    tags: undefined
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test(`test getUpdatedData when activation messaged changed from ${ClientAction.ADMINCTLMODE} to ${ClientAction.CLIENTCTLMODE}`, async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.CLIENTCTLMODE,
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    dhcpEnabled: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: undefined,
    mebxPassword: null,
    tags: undefined,
    tenantId: ''
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData with kvm options', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: ClientAction.ADMINCTLMODE,
    amtPassword: null,
    ciraConfigName: undefined,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  let result: AMTConfiguration
  result = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)

  oldConfig.userConsent = AMTUserConsent.KVM
  oldConfig.iderEnabled = true
  oldConfig.kvmEnabled = true
  oldConfig.solEnabled = true
  result = await getUpdatedData(newConfig, oldConfig)
  expect(result.userConsent).toEqual('KVM')
  expect(result.iderEnabled).toEqual(true)
  expect(result.kvmEnabled).toEqual(true)
  expect(result.solEnabled).toEqual(true)

  newConfig.userConsent = AMTUserConsent.ALL
  newConfig.iderEnabled = false
  newConfig.kvmEnabled = true
  newConfig.solEnabled = false
  result = await getUpdatedData(newConfig, oldConfig)
  expect(result.userConsent).toEqual('All')
  expect(result.iderEnabled).toEqual(false)
  expect(result.kvmEnabled).toEqual(true)
  expect(result.solEnabled).toEqual(false)
})

test('test getUpdatedData when CIRA profile is changed to TLS profile', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
    tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: 'ciraConfig2',
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
    tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when TLS profile mode 2 is changed to TLS profile mode 4', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    tlsMode: TlsMode.MUTUAL_ALLOW_NONTLS,
    tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
    tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    tlsMode: TlsMode.MUTUAL_ALLOW_NONTLS,
    tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when TLS profile is changed to CIRA profile', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: 'ciraConfig2',
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: null,
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'testTLS',
    activation: ClientAction.CLIENTCTLMODE,
    amtPassword: null,
    ciraConfigName: 'ciraConfig2',
    generateRandomMEBxPassword: false,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: '',
    tags: [
      'tag1'
    ],
    dhcpEnabled: true,
    iderEnabled: false,
    kvmEnabled: true,
    solEnabled: false,
    userConsent: undefined,
    version: undefined
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

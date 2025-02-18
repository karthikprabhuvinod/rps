/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTPassword, type AMTPasswordContext, type AMTPasswordEvent } from './amtPassword'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { HttpHandler } from '../HttpHandler'
import { Configurator } from '../Configurator'
import * as common from './common'
import { interpret } from 'xstate'

const clientId = uuid()
Environment.Config = config

describe('AMT Password State Machine', () => {
  let amtPwd: AMTPassword
  let amtPwdContext: AMTPasswordContext
  let amtPasswordEvent: AMTPasswordEvent
  const configurator = new Configurator()
  let invokeWsmanCallSpy: jest.SpyInstance
  let currentStateIndex: number
  let configuration

  beforeEach(() => {
    amtPwd = new AMTPassword()
    amtPwdContext = {
      clientId,
      httpHandler: new HttpHandler(),
      status: 'success',
      errorMessage: '',
      xmlMessage: '',
      statusMessage: '',
      message: null,
      generalSettings: null,
      amtPassword: null
    }

    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      network: {},
      status: {},
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1
    }
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)

    configuration = {
      services: {
        'send-generalsettings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { AMT_GeneralSettings: { DigestRealm: 'Digest:A3829B3827DE4D33D4449B366831FD01' } }
          }
        }),
        'send-updated-amt-password': Promise.resolve({ clientId }),
        'save-amt-password-to-secret-provider': Promise.resolve({ clientId }),
        'error-machine': Promise.resolve({ clientId })
      },
      actions: {
      }
    }
    currentStateIndex = 0
  })

  it('should get General Settings', async () => {
    await amtPwd.getGeneralSettings(amtPwdContext)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should change AMT Password', async () => {
    amtPwdContext.generalSettings = {
      DigestRealm: 'Digest:A3829B3827DE4D33D4449B366831FD01'
    }
    await amtPwd.changeAMTPassword(amtPwdContext, amtPasswordEvent)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should return true to store device data in vault', async () => {
    const insertSpy = jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockImplementation(async () => true)
    const response = await amtPwd.saveDeviceInfoToSecretProvider(amtPwdContext, null)
    expect(insertSpy).toHaveBeenCalled()
    expect(response).toBe(true)
  })

  it('should return false if not able to save device data in vault', async () => {
    const err = new Error('unable to save')
    jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockRejectedValueOnce(err)

    await expect(amtPwd.saveDeviceInfoToSecretProvider(amtPwdContext, null)).rejects.toBe(err)
  })

  it('should eventually reach "SUCCESS"', (done) => {
    const mockAmtPwdMachine = amtPwd.machine.withConfig(configuration).withContext(amtPwdContext)
    const flowStates = [
      'ACTIVATED',
      'GET_GENERAL_SETTINGS',
      'SEND_UPDATED_AMT_PASSWORD',
      'SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER',
      'SUCCESS'
    ]
    const amtPwdService = interpret(mockAmtPwdMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })
    amtPwdService.start()
    amtPwdService.send({ type: 'CHANGEPASSWORD', clientId, data: null })
  })

  it('should eventually reach "Failed" at save-amt-password-to-secret-provider state ', (done) => {
    configuration.services['save-amt-password-to-secret-provider'] = Promise.reject(new Error())
    const mockAmtPwdMachine = amtPwd.machine.withConfig(configuration).withContext(amtPwdContext)
    const flowStates = [
      'ACTIVATED',
      'GET_GENERAL_SETTINGS',
      'SEND_UPDATED_AMT_PASSWORD',
      'SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER',
      'FAILED'
    ]
    const amtPwdService = interpret(mockAmtPwdMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    amtPwdService.start()
    amtPwdService.send({ type: 'CHANGEPASSWORD', clientId, data: null })
  })
})

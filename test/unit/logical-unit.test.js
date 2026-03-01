import assert from 'node:assert/strict'
import test from 'node:test'

import { QRError } from '../../dist/.errors/class.js'
import { getErrorMessage } from '../../dist/.helpers/index.js'

test('getErrorMessage returns Error.message when available', () => {
  const message = getErrorMessage(new Error('boom'), 'fallback')
  assert.equal(message, 'boom')
})

test('getErrorMessage returns non-empty string input', () => {
  const message = getErrorMessage('direct message', 'fallback')
  assert.equal(message, 'direct message')
})

test('getErrorMessage falls back for unknown/empty values', () => {
  assert.equal(getErrorMessage('', 'fallback'), 'fallback')
  assert.equal(getErrorMessage('   ', 'fallback'), 'fallback')
  assert.equal(getErrorMessage({ anything: true }, 'fallback'), 'fallback')
  assert.equal(getErrorMessage(new Error('   '), 'fallback'), 'fallback')
})

test('QRError uses explicit message when provided', () => {
  const error = new QRError('SCAN_CANCELLED', 'QR cancelled by user')
  assert.equal(error.code, 'SCAN_CANCELLED')
  assert.equal(error.name, 'QRError')
  assert.equal(error.message, '{@z-base/qr} QR cancelled by user')
})

test('QRError falls back to code when message is omitted', () => {
  const error = new QRError('SCAN_START_FAILED')
  assert.equal(error.code, 'SCAN_START_FAILED')
  assert.equal(error.name, 'QRError')
  assert.equal(error.message, '{@z-base/qr} SCAN_START_FAILED')
})

import type { EncryptedString } from './types'

const enc = new TextEncoder()
const dec = new TextDecoder()

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Ensure we hand WebCrypto a real ArrayBuffer (not SharedArrayBuffer / ArrayBufferLike).
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveAesKey(password: string, salt: Uint8Array, iterations: number) {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(plainText: string, vaultPassword: string): Promise<EncryptedString> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const iterations = 210_000

  const key = await deriveAesKey(vaultPassword, salt, iterations)
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    enc.encode(plainText),
  )

  return {
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations,
    saltB64: bytesToB64(salt),
    ivB64: bytesToB64(iv),
    cipherTextB64: bytesToB64(new Uint8Array(cipherBuf)),
  }
}

export async function decryptString(payload: EncryptedString, vaultPassword: string): Promise<string> {
  const salt = b64ToBytes(payload.saltB64)
  const iv = b64ToBytes(payload.ivB64)
  const cipherBytes = b64ToBytes(payload.cipherTextB64)

  const key = await deriveAesKey(vaultPassword, salt, payload.iterations)
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(cipherBytes),
  )
  return dec.decode(plainBuf)
}


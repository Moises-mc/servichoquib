import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

/** Genera hashes scrypt con sal aleatoria; nunca almacena contraseñas en texto plano. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(String(password), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt}$${derivedKey.toString('hex')}`;
}

export async function comparePassword(password, storedHash) {
  try {
    const [algorithm, cost, blockSize, parallelization, salt, keyHex] = String(storedHash).split('$');
    if (algorithm !== 'scrypt' || !salt || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    if (expected.length !== KEY_LENGTH) return false;
    const actual = await scryptAsync(String(password), salt, expected.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
      maxmem: MAX_MEMORY,
    });
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

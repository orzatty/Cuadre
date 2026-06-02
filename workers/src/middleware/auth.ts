import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { Env, AuthVariables } from '../types';

/**
 * JWT Authentication middleware for Hono.
 * Extracts the Bearer token, verifies it with jose, and attaches
 * userId + userEmail to the Hono context variables.
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { success: false, error: 'Token de autenticación requerido' },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.email) {
      return c.json(
        { success: false, error: 'Token inválido: claims faltantes' },
        401
      );
    }

    // Check expiration explicitly (jose checks it too, but belt-and-suspenders)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return c.json(
        { success: false, error: 'Token expirado' },
        401
      );
    }

    c.set('userId', payload.sub as string);
    c.set('userEmail', payload.email as string);

    await next();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error de autenticación';

    if (message.includes('expired')) {
      return c.json({ success: false, error: 'Token expirado' }, 401);
    }

    return c.json(
      { success: false, error: 'Token inválido' },
      401
    );
  }
}

/**
 * Generate a JWT token for a user.
 */
export async function generateToken(
  userId: string,
  email: string,
  jwtSecret: string,
  expiresInHours: number = 72
): Promise<string> {
  const { SignJWT } = await import('jose');

  const secret = new TextEncoder().encode(jwtSecret);

  const token = await new SignJWT({
    email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .setIssuer('cuadre-api')
    .sign(secret);

  return token;
}

/**
 * Hash a password using PBKDF2 via Web Crypto API.
 * Returns { hash, salt } as hex strings.
 */
export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

/**
 * Verify a password against a stored hash and salt.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const salt = new Uint8Array(
    storedSalt.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const computedHash = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHash === storedHash;
}

// ============================================
// Auth Routes — Register, Login, Refresh, Profile
// ============================================

import { Hono } from 'hono';
import type { Env, AuthVariables, RegisterRequest, LoginRequest, ApiResponse, AuthResponse, UserPublic, User } from '../types';
import { generateToken, hashPassword, verifyPassword } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---- POST /auth/register ----
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<RegisterRequest>();

    // Validate input
    if (!body.email || !body.password || !body.display_name) {
      return c.json<ApiResponse>(
        { success: false, error: 'Email, contraseña y nombre son requeridos' },
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json<ApiResponse>(
        { success: false, error: 'Formato de email inválido' },
        400
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return c.json<ApiResponse>(
        { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
        400
      );
    }

    // Validate display name
    if (body.display_name.trim().length < 2) {
      return c.json<ApiResponse>(
        { success: false, error: 'El nombre debe tener al menos 2 caracteres' },
        400
      );
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
      .bind(body.email.toLowerCase().trim())
      .first();

    if (existing) {
      return c.json<ApiResponse>(
        { success: false, error: 'Este email ya está registrado' },
        409
      );
    }

    // Hash password
    const { hash, salt } = await hashPassword(body.password);

    // Generate user ID
    const userId = crypto.randomUUID().replace(/-/g, '');

    // Insert user
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, salt, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(userId, body.email.toLowerCase().trim(), hash, salt, body.display_name.trim())
      .run();

    // Generate JWT
    const token = await generateToken(userId, body.email.toLowerCase().trim(), c.env.JWT_SECRET);

    const userPublic: UserPublic = {
      id: userId,
      email: body.email.toLowerCase().trim(),
      display_name: body.display_name.trim(),
      avatar_url: null,
      preferred_currency: 'VES',
      created_at: new Date().toISOString(),
    };

    return c.json<ApiResponse<AuthResponse>>(
      {
        success: true,
        data: { token, user: userPublic },
        message: '¡Cuenta creada exitosamente! Bienvenido a Cuadre 🎉',
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al crear la cuenta' },
      500
    );
  }
});

// ---- POST /auth/login ----
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginRequest>();

    if (!body.email || !body.password) {
      return c.json<ApiResponse>(
        { success: false, error: 'Email y contraseña son requeridos' },
        400
      );
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, salt, display_name, avatar_url, preferred_currency, created_at FROM users WHERE email = ?'
    )
      .bind(body.email.toLowerCase().trim())
      .first<User>();

    if (!user) {
      return c.json<ApiResponse>(
        { success: false, error: 'Credenciales inválidas' },
        401
      );
    }

    if (!user.password_hash || !user.salt) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Esta cuenta usa inicio de sesión con Google. Por favor usa Google para ingresar.',
        },
        401
      );
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.password_hash, user.salt);

    if (!isValid) {
      return c.json<ApiResponse>(
        { success: false, error: 'Credenciales inválidas' },
        401
      );
    }

    // Update last login
    await c.env.DB.prepare(
      `UPDATE users SET updated_at = datetime('now') WHERE id = ?`
    )
      .bind(user.id)
      .run();

    // Generate JWT
    const token = await generateToken(user.id, user.email, c.env.JWT_SECRET);

    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      preferred_currency: user.preferred_currency,
      created_at: user.created_at,
    };

    return c.json<ApiResponse<AuthResponse>>({
      success: true,
      data: { token, user: userPublic },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al iniciar sesión' },
      500
    );
  }
});

// ---- POST /auth/refresh ----
auth.post('/refresh', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');

    // Generate a new token
    const token = await generateToken(userId, userEmail, c.env.JWT_SECRET);

    return c.json<ApiResponse<{ token: string }>>({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al renovar el token' },
      500
    );
  }
});

// ---- GET /auth/me ----
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const user = await c.env.DB.prepare(
      'SELECT id, email, display_name, avatar_url, preferred_currency, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<UserPublic>();

    if (!user) {
      return c.json<ApiResponse>(
        { success: false, error: 'Usuario no encontrado' },
        404
      );
    }

    return c.json<ApiResponse<UserPublic>>({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al obtener el perfil' },
      500
    );
  }
});

export default auth;

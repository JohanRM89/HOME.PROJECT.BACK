const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const UserRepository    = require('../repositories/UserRepository');
const SessionRepository = require('../repositories/SessionRepository');
const FamilyMemberRepository = require('../repositories/FamilyMemberRepository');

class AuthService {
  // ── Registro ────────────────────────────────────────────
  async register({ name, email, password }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      const err = new Error('El correo ya está registrado');
      err.status = 409; throw err;
    }

    const rounds      = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, rounds);

    const user = await UserRepository.create({
      name,
      email: email.toLowerCase(),
      password_hash,
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  // ── Login ────────────────────────────────────────────────
  async login({ email, password, meta = {} }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
    }

    const { token, expiresAt } = this._generateToken(user.id);
    await SessionRepository.createSession(user.id, token, expiresAt, meta);
    const  member = await FamilyMemberRepository.getMemberid(user.id);
    console.log("member", member)
    return {
      token,
      expiresAt,
      user: { id: user.id, name: user.name, email: user.email },
      memberid: member ? member.group_id : null
    };
  }

  // ── Logout ───────────────────────────────────────────────
  async logout(token) {
    await SessionRepository.revoke(token);
  }

  // ── Solicitar reset de contraseña ────────────────────────
  async requestPasswordReset(email) {
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const user = await UserRepository.setResetToken(email, token, expiresAt);
    if (!user) {
      // Silencioso: no revelar si el email existe
      return { message: 'Si el correo existe recibirás instrucciones' };
    }

    // En producción: enviar email con enlace conteniendo el token
    console.log(`[Auth] Reset token para ${email}: ${token}`);
    return { message: 'Si el correo existe recibirás instrucciones', _dev_token: token };
  }

  // ── Restablecer contraseña ───────────────────────────────
  async resetPassword(token, password) {
    const user = await UserRepository.findByResetToken(token);
    if (!user) {
      const err = new Error('Token inválido o expirado'); err.status = 400; throw err;
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hash   = await bcrypt.hash(password, rounds);

    await UserRepository.clearResetToken(user.id, hash);
    await SessionRepository.revokeAllForUser(user.id);

    return { message: 'Contraseña actualizada correctamente' };
  }

  // ── Helpers privados ─────────────────────────────────────
  _generateToken(userId) {
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const token     = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn });
    const decoded   = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    return { token, expiresAt };
  }
}

module.exports = new AuthService();

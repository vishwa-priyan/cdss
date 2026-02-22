import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').optional().isIn(['admin', 'doctor', 'nurse']),
];

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  const { email, password, name, role = 'nurse' } = req.body;
  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  await query(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [email, password_hash, name, role]
  );
  const [user] = await query('SELECT id, email, name, role FROM users WHERE email = ?', [email]);
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
}

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  const { email, password } = req.body;
  const users = await query('SELECT id, email, name, role, password_hash FROM users WHERE email = ?', [email]);
  if (!users.length) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const user = users[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

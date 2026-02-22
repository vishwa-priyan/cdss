import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

let systemSettings = {};

export async function get(req, res) {
  res.json(systemSettings);
}

export async function update(req, res) {
  systemSettings = { ...systemSettings, ...req.body };
  res.json(systemSettings);
}

export async function listUsers(req, res) {
  const users = await query('SELECT id, email, name, role, created_at FROM users');
  res.json(users);
}

export async function createUser(req, res) {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'email, password, and name are required' });
  }
  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(400).json({ message: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  await query('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)', [
    email,
    hash,
    name,
    role || 'nurse',
  ]);
  const [user] = await query('SELECT id, email, name, role, created_at FROM users WHERE email = ?', [email]);
  res.status(201).json(user);
}

export async function updateUser(req, res) {
  const id = req.params.id;
  const { email, name, role, password } = req.body;
  const [u] = await query('SELECT id FROM users WHERE id = ?', [id]);
  if (!u) return res.status(404).json({ message: 'User not found' });
  const updates = [];
  const params = [];
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
  }
  if (password !== undefined && password.length >= 6) {
    const hash = await bcrypt.hash(password, 10);
    updates.push('password_hash = ?');
    params.push(hash);
  }
  if (params.length) {
    params.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  const [user] = await query('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [id]);
  res.json(user);
}

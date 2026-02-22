import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export async function seedAdmin() {
  const existing = await query('SELECT id FROM users WHERE email = ?', ['admin@cdss.local']);
  if (existing.length) return;
  const hash = await bcrypt.hash('admin123', 10);
  await query(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    ['admin@cdss.local', hash, 'System Admin', 'admin']
  );
  console.log('Seeded admin user: admin@cdss.local / admin123');
}

seedAdmin()
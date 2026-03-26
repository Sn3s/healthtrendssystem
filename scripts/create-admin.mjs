#!/usr/bin/env node
/**
 * Creates an admin account with full access to all portals (encoder, doctor, patient, admin).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (from Supabase Dashboard → Project Settings → API).
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 node scripts/create-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env from project root
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL || 'admin@healthstream.local';
const password = process.env.ADMIN_PASSWORD || 'Admin123!';

if (!url || !serviceKey) {
  console.error('Missing required env vars. Add to .env:');
  console.error('  VITE_SUPABASE_URL (you have this)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Project Settings → API)');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let userId;

  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);

  if (found) {
    userId = found.id;
    console.log('Using existing user:', email);
  } else {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'System Admin' },
    });
    if (error) {
      console.error('Failed to create user:', error.message);
      process.exit(1);
    }
    userId = user.user.id;
    console.log('Created user:', email);
  }

  // Get first department for doctor role
  const { data: depts } = await supabase.from('departments').select('id').limit(1);
  const departmentId = depts?.[0]?.id ?? null;

  const roles = [
    { user_id: userId, role: 'admin', department: null },
    { user_id: userId, role: 'encoder', department: null },
    { user_id: userId, role: 'patient', department: null },
    { user_id: userId, role: 'doctor', department: departmentId },
  ];

  for (const r of roles) {
    const { error } = await supabase.from('user_roles').upsert(r, {
      onConflict: 'user_id,role',
      ignoreDuplicates: true,
    });
    if (error) {
      console.error('Failed to add role', r.role, ':', error.message);
    } else {
      console.log('  ✓', r.role);
    }
  }

  console.log('\nAdmin account ready.');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('\nSign in at http://localhost:8080/auth and choose any portal.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

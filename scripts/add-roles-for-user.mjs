#!/usr/bin/env node
/**
 * Adds all roles (admin, encoder, doctor, patient) to an existing user by email.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] || process.env.ADD_ROLES_EMAIL;

if (!url || !serviceKey) {
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env (Supabase Dashboard → Project Settings → API)');
  process.exit(1);
}
if (!email) {
  console.error('Usage: node scripts/add-roles-for-user.mjs <email>');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === email);
  if (!user) {
    console.error('User not found:', email);
    console.error('Sign up at http://localhost:8080/auth first.');
    process.exit(1);
  }

  const { data: depts } = await supabase.from('departments').select('id').limit(1);
  const departmentId = depts?.[0]?.id ?? null;

  const roles = [
    { user_id: user.id, role: 'admin', department: null },
    { user_id: user.id, role: 'encoder', department: null },
    { user_id: user.id, role: 'patient', department: null },
    { user_id: user.id, role: 'doctor', department: departmentId },
  ];

  for (const r of roles) {
    const { error } = await supabase.from('user_roles').upsert(r, {
      onConflict: 'user_id,role',
      ignoreDuplicates: true,
    });
    if (error) console.error('Failed', r.role, error.message);
    else console.log('  ✓', r.role);
  }
  console.log('\nDone. Sign in at http://localhost:8080/auth');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

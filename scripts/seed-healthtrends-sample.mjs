#!/usr/bin/env node
/**
 * Inserts sample APE companies + employees for PE Encoding search tests.
 * Safe to re-run: skips rows that already exist (by exam_code).
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon) in .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const companies = [
  { company_code: '001', name: 'Acme Manufacturing Corp.' },
  { company_code: '002', name: 'Bay City Logistics Inc.' },
];

const employees = [
  { company_code: '001', employee_number: 1, exam_code: '001-001', name: 'Maria Clara Santos', address: '12 Rizal St., QC', contact_number: '09171234501', age: 34, gender: 'female' },
  { company_code: '001', employee_number: 2, exam_code: '001-002', name: 'Maria Santos-Dela Cruz', address: '45 Katipunan Ave.', contact_number: '09171234502', age: 29, gender: 'female' },
  { company_code: '001', employee_number: 3, exam_code: '001-003', name: 'Mario Santez', address: '88 Commonwealth', contact_number: '09171234503', age: 41, gender: 'male' },
  { company_code: '001', employee_number: 4, exam_code: '001-004', name: 'Jon Smith', address: '3 Legaspi Village', contact_number: '09171234504', age: 38, gender: 'male' },
  { company_code: '001', employee_number: 5, exam_code: '001-005', name: 'John Smyth', address: '9 BGC Taguig', contact_number: '09171234505', age: 45, gender: 'male' },
  { company_code: '001', employee_number: 6, exam_code: '001-006', name: 'Ana Patricia Garcia', address: '21 Taft Ave.', contact_number: '09171234506', age: 27, gender: 'female' },
  { company_code: '002', employee_number: 1, exam_code: '002-001', name: 'Anne Garsia', address: '7 Port Area', contact_number: '09281230001', age: 31, gender: 'female' },
  { company_code: '002', employee_number: 2, exam_code: '002-002', name: 'Robert Tan', address: '100 Chinatown', contact_number: '09281230002', age: 52, gender: 'male' },
  { company_code: '002', employee_number: 3, exam_code: '002-003', name: 'Roberto Tann', address: '55 Escolta', contact_number: '09281230003', age: 48, gender: 'male' },
];

const examDate = '2026-03-10';

async function main() {
  for (const c of companies) {
    const { error } = await supabase.from('ape_companies').upsert(c, { onConflict: 'company_code' });
    if (error) {
      console.error('Company upsert:', error.message);
      process.exit(1);
    }
    console.log('Company OK:', c.company_code, c.name);
  }

  let inserted = 0;
  let skipped = 0;
  for (const e of employees) {
    const { data: existing } = await supabase.from('ape_employees').select('id').eq('exam_code', e.exam_code).maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from('ape_employees').insert({
      ...e,
      exam_date: examDate,
      created_by: null,
    });
    if (error) {
      console.error('Employee insert', e.exam_code, error.message);
      process.exit(1);
    }
    inserted++;
    console.log('Employee:', e.exam_code, e.name);
  }
  console.log('\nDone. Inserted:', inserted, 'Skipped (already exist):', skipped);
  console.log('Try search: "maria", "santos", "001-005", "jon", "garsia", "robert tan"');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

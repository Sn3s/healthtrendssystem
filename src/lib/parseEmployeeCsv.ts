import type { ApeEmployeeRow } from '@/lib/healthtrends-validation';
import { apeEmployeeRowSchema } from '@/lib/healthtrends-validation';

/** Parse CSV text into rows (RFC 4180-style quotes and commas). */
export function parseCsv(content: string): string[][] {
  const text = content.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      field = '';
      if (row.some((x) => x.trim().length > 0)) {
        rows.push(row.map((x) => x.trim()));
      }
      row = [];
      i++;
      continue;
    }
    field += c;
    i++;
  }
  row.push(field);
  if (row.some((x) => x.trim().length > 0)) {
    rows.push(row.map((x) => x.trim()));
  }
  return rows;
}

const HEADER_ALIASES: Record<string, keyof ApeEmployeeRow> = {
  name: 'name',
  'full name': 'name',
  'employee name': 'name',
  address: 'address',
  contact: 'contact_number',
  phone: 'contact_number',
  mobile: 'contact_number',
  contact_number: 'contact_number',
  'contact number': 'contact_number',
  email: 'email',
  'e-mail': 'email',
  'email address': 'email',
  age: 'age',
  gender: 'gender',
  sex: 'gender',
};

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapHeaderRow(headers: string[]): Map<keyof ApeEmployeeRow, number> | null {
  const map = new Map<keyof ApeEmployeeRow, number>();
  headers.forEach((h, idx) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (key && !map.has(key)) map.set(key, idx);
  });
  if (!map.has('name') || !map.has('age') || !map.has('gender')) return null;
  return map;
}

function normalizeGender(raw: string): ApeEmployeeRow['gender'] {
  const x = raw.trim().toLowerCase();
  if (['m', 'male', 'man', '1'].includes(x)) return 'male';
  if (['f', 'female', 'woman', '2'].includes(x)) return 'female';
  if (['o', 'other', '3', 'non-binary', 'nonbinary', 'nb'].includes(x)) return 'other';
  throw new Error(`Unrecognized gender "${raw}"`);
}

function rowFromPositions(cells: string[]): ApeEmployeeRow {
  if (cells.length < 5) {
    throw new Error(
      `Expected 5 columns (name, address, contact, age, gender) or 6 with email after contact; got ${cells.length}`,
    );
  }
  if (cells.length > 6) {
    throw new Error(
      `Expected 5 or 6 columns without a header row; got ${cells.length}. Use a header row or fix extra fields.`,
    );
  }
  let name: string;
  let address: string;
  let contact_number: string;
  let email: string;
  let ageRaw: string;
  let genderRaw: string;
  if (cells.length === 6) {
    [name, address = '', contact_number = '', email = '', ageRaw, genderRaw] = cells;
  } else {
    [name, address = '', contact_number = '', ageRaw, genderRaw] = cells;
    email = '';
  }
  const age = parseInt(String(ageRaw).replace(/\s/g, ''), 10);
  if (Number.isNaN(age)) throw new Error(`Invalid age "${ageRaw}"`);
  return {
    name,
    address,
    contact_number,
    email,
    age,
    gender: normalizeGender(genderRaw ?? ''),
  };
}

function rowFromMap(cells: string[], colMap: Map<keyof ApeEmployeeRow, number>): ApeEmployeeRow {
  const get = (k: keyof ApeEmployeeRow) => {
    const idx = colMap.get(k);
    if (idx === undefined) {
      if (k === 'address' || k === 'contact_number' || k === 'email') return '';
      throw new Error(`Missing column: ${k}`);
    }
    return cells[idx] ?? '';
  };
  const name = get('name');
  const address = get('address');
  const contact_number = get('contact_number');
  const email = get('email');
  const ageRaw = get('age');
  const genderRaw = get('gender');
  const age = parseInt(String(ageRaw).replace(/\s/g, ''), 10);
  if (Number.isNaN(age)) throw new Error(`Invalid age "${ageRaw}"`);
  return {
    name,
    address,
    contact_number,
    email,
    age,
    gender: normalizeGender(genderRaw),
  };
}

export type ParseEmployeeCsvResult = {
  rows: ApeEmployeeRow[];
  skipped: { line: number; reason: string }[];
};

/**
 * Parse employee rows from CSV. First row is treated as headers if it maps to known columns;
 * otherwise rows are read in order: name, address, contact_number, email, age, gender (six columns),
 * or the legacy five columns without email (email becomes empty).
 */
export function parseEmployeeCsv(text: string): ParseEmployeeCsvResult {
  const matrix = parseCsv(text);
  const skipped: { line: number; reason: string }[] = [];
  if (matrix.length === 0) return { rows: [], skipped: [{ line: 0, reason: 'Empty file' }] };

  const first = matrix[0];
  const colMap = mapHeaderRow(first);
  const dataRows = colMap ? matrix.slice(1) : matrix;
  const startLine = colMap ? 2 : 1;

  const rows: ApeEmployeeRow[] = [];

  dataRows.forEach((cells, j) => {
    const lineNumber = startLine + j;
    if (cells.every((c) => !c || c.trim() === '')) return;
    try {
      const raw = colMap ? rowFromMap(cells, colMap) : rowFromPositions(cells);
      const parsed = apeEmployeeRowSchema.safeParse(raw);
      if (!parsed.success) {
        skipped.push({ line: lineNumber, reason: parsed.error.issues[0]?.message ?? 'Invalid row' });
        return;
      }
      rows.push(parsed.data);
    } catch (e) {
      skipped.push({
        line: lineNumber,
        reason: e instanceof Error ? e.message : 'Invalid row',
      });
    }
  });

  return { rows, skipped };
}

export function employeeCsvTemplate(): string {
  return [
    'name,address,contact_number,email,age,gender',
    'Maria Santos,"123 Rizal Ave., Manila",09171234567,maria.santos.001@employees.healthtrends.demo,32,female',
    'Juan Cruz,456 Quezon Blvd,09281234567,juan.cruz.002@employees.healthtrends.demo,41,male',
  ].join('\r\n');
}

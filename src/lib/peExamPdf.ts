import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { Database } from '@/integrations/supabase/types';

export type PeRecordRow = Database['public']['Tables']['pe_records']['Row'];

export type PePdfEmployee = {
  name: string;
  exam_code: string;
  exam_date: string;
  company_code: string;
  /** Display name from `ape_companies`; optional when missing in DB. */
  company_name?: string;
  email?: string;
};

const META_KEYS = new Set([
  'id',
  'ape_employee_id',
  'updated_at',
  'created_at',
  'physical_exam_saved_at',
  'laboratory_saved_at',
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function physicalFieldHasData(key: string, value: unknown): boolean {
  if (META_KEYS.has(key) || key.startsWith('lab_')) return false;
  if (value == null) return false;
  if (typeof value === 'boolean') return value === true;
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

function hasPhysicalExamData(pe: PeRecordRow): boolean {
  for (const key of Object.keys(pe) as (keyof PeRecordRow)[]) {
    const k = String(key);
    if (physicalFieldHasData(k, pe[key])) return true;
  }
  return false;
}

function hasLaboratoryData(pe: PeRecordRow): boolean {
  for (const key of Object.keys(pe) as (keyof PeRecordRow)[]) {
    if (!String(key).startsWith('lab_')) continue;
    const v = pe[key];
    if (isNonEmptyString(v)) return true;
  }
  return false;
}

export function getPeCombinedPdfReadiness(
  pe: PeRecordRow | null | undefined
): { ok: true } | { ok: false; message: string } {
  if (!pe) {
    return { ok: false, message: 'The examination has no results yet.' };
  }
  if (!pe.physical_exam_saved_at || !pe.laboratory_saved_at) {
    return {
      ok: false,
      message:
        'Save both the Physical Examination and Laboratory and Diagnostic Examination sections before downloading a PDF.',
    };
  }
  if (!hasPhysicalExamData(pe) || !hasLaboratoryData(pe)) {
    return { ok: false, message: 'The examination has no results yet.' };
  }
  return { ok: true };
}

function fmt(pe: PeRecordRow, key: keyof PeRecordRow): string {
  const v = pe[key];
  if (v == null) return '-';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t.replace(/\u2014/g, '-') : '-';
  }
  return String(v).replace(/\u2014/g, '-');
}

const L: Record<string, string> = {
  childhood_diseases: 'Childhood diseases',
  past_illnesses_injuries: 'Past illnesses / injuries',
  operations: 'Operations',
  smoker: 'Smoker',
  alcohol: 'Alcohol',
  exercise: 'Exercise',
  family_heart_disease: 'Family: Heart disease',
  family_hypertension: 'Family: Hypertension',
  family_diabetes: 'Family: Diabetes',
  family_asthma: 'Family: Asthma',
  family_allergy: 'Family: Allergy',
  family_cancer: 'Family: Cancer',
  family_others: 'Family: Others',
  ob_lmp: 'LMP',
  ob_days: 'Days',
  ob_pmp: 'PMP',
  ob_interval: 'Interval',
  ob_gravida: 'Gravida',
  ob_para: 'Para',
  ob_delivery: 'Delivery',
  ob_complications: 'Complications',
  meas_height: 'Height',
  meas_weight_lbs: 'Weight (lbs)',
  meas_bp: 'BP (mmHg)',
  meas_pr: 'PR (bpm)',
  meas_rr: 'RR',
  meas_va_correction: 'Visual acuity (correction)',
  meas_far_od: 'Far vision OD 20/',
  meas_far_os: 'Far vision OS 20/',
  meas_near_odj: 'Near vision OD J/',
  meas_near_osj: 'Near vision OS J/',
  find_head: 'Findings — Head',
  find_ears_eyes_nose: 'Findings — Ears/Eyes/Nose',
  find_mouth_throat: 'Findings — Mouth and Throat',
  find_neck_thorax: 'Findings — Neck/Thorax',
  find_lungs: 'Findings — Lungs',
  find_heart: 'Findings — Heart',
  find_abdomen: 'Findings — Abdomen',
  find_genitalia: 'Findings — Genitalia',
  find_extremities: 'Findings — Extremities',
  find_skin: 'Findings — Skin',
  find_rectum: 'Findings — Rectum',
  find_ishihara_score: 'Ishihara test score',
  dental_missing_teeth: 'Dental — Missing teeth',
  dental_canes: 'Dental — Canes',
  dental_replaced: 'Dental — Replaced',
  dental_jacket_crown: 'Dental — Jacket, Crown',
  lab_hem_hemoglobin: 'Hemoglobin',
  lab_hem_hematocrit: 'Hematocrit',
  lab_hem_wbc: 'WBC',
  lab_hem_rbc: 'RBC',
  lab_hem_segmanters: 'Segmanters',
  lab_hem_lymphocytes: 'Lymphocytes',
  lab_hem_eosinophil: 'Eosinophil',
  lab_hem_monocytes: 'Monocytes',
  lab_hem_basophil: 'Basophil',
  lab_hem_platelet: 'Platelet',
  lab_ua_color: 'Color',
  lab_ua_transparency: 'Transparency',
  lab_ua_reaction: 'Reaction',
  lab_ua_specific_gravity: 'Specific gravity',
  lab_ua_protein: 'Protein',
  lab_ua_sugar: 'Sugar',
  lab_ua_pus_cells: 'Pus cells',
  lab_ua_red_blood_cells: 'Red blood cells',
  lab_ua_epithelial_cells: 'Epithelial cells',
  lab_ua_amorphous: 'Amorphous',
  lab_ua_mucus_threads: 'Mucus threads',
  lab_ua_bacteria: 'Bacteria',
  lab_ua_others: 'Others',
  lab_stool_color: 'Color',
  lab_stool_consistency: 'Consistency',
  lab_stool_others: 'Others',
  lab_chest_pa_findings: 'Findings',
  lab_chest_pa_impression: 'Impression',
  lab_ecg_rate: 'Rate',
  lab_ecg_rhythm: 'Rhythm',
  lab_ecg_interpretation: 'Interpretation',
  lab_ecg_others: 'Others',
  lab_pap_specimen_adequacy: 'Specimen adequacy',
  lab_pap_general_categorization: 'General categorization',
  lab_pap_descriptive_diagnoses: 'Descriptive diagnoses',
};

type Section = { title: string; keys: (keyof PeRecordRow)[] };

const PHYSICAL_SECTIONS: Section[] = [
  {
    title: 'Past medical history',
    keys: ['childhood_diseases', 'past_illnesses_injuries', 'operations'],
  },
  { title: 'Personal history', keys: ['smoker', 'alcohol', 'exercise'] },
  {
    title: 'Family history',
    keys: [
      'family_heart_disease',
      'family_hypertension',
      'family_diabetes',
      'family_asthma',
      'family_allergy',
      'family_cancer',
      'family_others',
    ],
  },
  {
    title: 'Obstetrical history',
    keys: [
      'ob_lmp',
      'ob_days',
      'ob_pmp',
      'ob_interval',
      'ob_gravida',
      'ob_para',
      'ob_delivery',
      'ob_complications',
    ],
  },
  {
    title: 'Measurements',
    keys: [
      'meas_height',
      'meas_weight_lbs',
      'meas_bp',
      'meas_pr',
      'meas_rr',
      'meas_va_correction',
      'meas_far_od',
      'meas_far_os',
      'meas_near_odj',
      'meas_near_osj',
    ],
  },
  {
    title: 'Findings',
    keys: [
      'find_head',
      'find_ears_eyes_nose',
      'find_mouth_throat',
      'find_neck_thorax',
      'find_lungs',
      'find_heart',
      'find_abdomen',
      'find_genitalia',
      'find_extremities',
      'find_skin',
      'find_rectum',
      'find_ishihara_score',
    ],
  },
  {
    title: 'Dental',
    keys: ['dental_missing_teeth', 'dental_canes', 'dental_replaced', 'dental_jacket_crown'],
  },
];

const LAB_SECTIONS: Section[] = [
  {
    title: 'Hematology',
    keys: [
      'lab_hem_hemoglobin',
      'lab_hem_hematocrit',
      'lab_hem_wbc',
      'lab_hem_rbc',
      'lab_hem_segmanters',
      'lab_hem_lymphocytes',
      'lab_hem_eosinophil',
      'lab_hem_monocytes',
      'lab_hem_basophil',
      'lab_hem_platelet',
    ],
  },
  {
    title: 'Urinalysis',
    keys: [
      'lab_ua_color',
      'lab_ua_transparency',
      'lab_ua_reaction',
      'lab_ua_specific_gravity',
      'lab_ua_protein',
      'lab_ua_sugar',
      'lab_ua_pus_cells',
      'lab_ua_red_blood_cells',
      'lab_ua_epithelial_cells',
      'lab_ua_amorphous',
      'lab_ua_mucus_threads',
      'lab_ua_bacteria',
      'lab_ua_others',
    ],
  },
  {
    title: 'Stool examination',
    keys: ['lab_stool_color', 'lab_stool_consistency', 'lab_stool_others'],
  },
  { title: 'Chest PA', keys: ['lab_chest_pa_findings', 'lab_chest_pa_impression'] },
  {
    title: 'ECG',
    keys: ['lab_ecg_rate', 'lab_ecg_rhythm', 'lab_ecg_interpretation', 'lab_ecg_others'],
  },
  {
    title: 'Pap smear',
    keys: [
      'lab_pap_specimen_adequacy',
      'lab_pap_general_categorization',
      'lab_pap_descriptive_diagnoses',
    ],
  },
];

/** A4 in PDF points (1/72 in) */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const LINE_GAP = 1.35;
const FOOTER_RESERVE = 44;
const LABEL_COL = 152;
const VALUE_X = MARGIN + LABEL_COL + 14;
const VALUE_MAX_W = PAGE_W - MARGIN - VALUE_X;

const ACCENT = rgb(0.13, 0.35, 0.55);
const ACCENT_DARK = rgb(0.08, 0.22, 0.38);
const TEXT_BODY = rgb(0.09, 0.1, 0.12);
const TEXT_LABEL = rgb(0.28, 0.31, 0.36);
const TEXT_MUTED = rgb(0.45, 0.47, 0.52);
const RULE = rgb(0.86, 0.88, 0.92);
const CARD_FILL = rgb(0.97, 0.98, 0.99);
const CARD_STROKE = rgb(0.88, 0.9, 0.94);
const HERO_H = 92;

/** Standard 14 fonts use WinAnsi; replace unsupported chars to avoid pdf-lib encode errors. */
function pdfSafe(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      if (cp === 9 || cp === 10 || cp === 13) return ch;
      if (cp >= 32 && cp <= 126) return ch;
      if (cp >= 160 && cp <= 255) return ch;
      return '?';
    })
    .join('');
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const safe = pdfSafe(text);
  const words = safe.split(/\s+/).filter(Boolean);
  if (words.length === 0) return safe ? [safe] : [''];
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) cur = trial;
    else {
      if (cur) {
        lines.push(cur);
        cur = w;
      } else {
        lines.push(w);
        cur = '';
      }
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function formatSavedFooter(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

type LayoutCtx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  y: number;
};

export async function buildPeExamPdfBlob(employee: PePdfEmployee, pe: PeRecordRow): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const lineHeight = (size: number) => size * LINE_GAP;

  const ctx: LayoutCtx = {
    doc,
    page: doc.addPage([PAGE_W, PAGE_H]),
    font,
    fontBold,
    y: PAGE_H - MARGIN,
  };

  const drawRunningHeader = () => {
    const run = pdfSafe(`APE Report  |  ${employee.exam_code}  |  ${employee.name}`);
    ctx.page.drawText(run, {
      x: MARGIN,
      y: PAGE_H - 28,
      size: 8,
      font: fontBold,
      color: TEXT_MUTED,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: PAGE_H - 34 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 34 },
      thickness: 0.6,
      color: RULE,
    });
    ctx.y = PAGE_H - 52;
  };

  const startNewPage = () => {
    ctx.page = doc.addPage([PAGE_W, PAGE_H]);
    drawRunningHeader();
  };

  const ensureSpace = (need: number) => {
    if (ctx.y - need < MARGIN + FOOTER_RESERVE) {
      startNewPage();
    }
  };

  /** Two-column field: bold label (wrapped) + value (wrapped), aligned rows. */
  const drawFieldRow = (label: string, value: string) => {
    const labelLines = wrapText(`${label}:`, fontBold, 9, LABEL_COL - 4);
    const valueLines = wrapText(value, font, 10, VALUE_MAX_W);
    const rowLh = lineHeight(10);
    const rows = Math.max(labelLines.length, valueLines.length);
    const blockH = rows * rowLh + 10;
    ensureSpace(blockH);
    const topBaseline = ctx.y;
    for (let i = 0; i < rows; i++) {
      const yLine = topBaseline - i * rowLh;
      if (labelLines[i]) {
        ctx.page.drawText(labelLines[i], {
          x: MARGIN,
          y: yLine,
          size: 9,
          font: fontBold,
          color: TEXT_LABEL,
        });
      }
      if (valueLines[i]) {
        ctx.page.drawText(valueLines[i], {
          x: VALUE_X,
          y: yLine,
          size: 10,
          font,
          color: TEXT_BODY,
        });
      }
    }
    ctx.y = topBaseline - blockH;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(26);
    ctx.y -= 4;
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - 12,
      width: 3.5,
      height: 13,
      color: ACCENT,
    });
    ctx.page.drawText(pdfSafe(title), {
      x: MARGIN + 11,
      y: ctx.y - 1,
      size: 11,
      font: fontBold,
      color: ACCENT_DARK,
    });
    ctx.y -= 18;
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y + 6 },
      end: { x: PAGE_W - MARGIN, y: ctx.y + 6 },
      thickness: 0.75,
      color: RULE,
    });
    ctx.y -= 10;
  };

  const drawMajorHeading = (title: string) => {
    ensureSpace(36);
    ctx.y -= 8;
    ctx.page.drawText(pdfSafe(title), {
      x: MARGIN,
      y: ctx.y,
      size: 16,
      font: fontBold,
      color: ACCENT_DARK,
    });
    ctx.y -= 8;
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y },
      end: { x: PAGE_W - MARGIN, y: ctx.y },
      thickness: 2.2,
      color: ACCENT,
    });
    ctx.y -= 16;
  };

  // --- Page 1 hero ---
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_H - HERO_H,
    width: PAGE_W,
    height: HERO_H,
    color: ACCENT,
  });
  ctx.page.drawText('Annual Physical Examination', {
    x: MARGIN,
    y: PAGE_H - 38,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText('Clinical and laboratory record', {
    x: MARGIN,
    y: PAGE_H - 58,
    size: 10,
    font,
    color: rgb(0.88, 0.92, 0.97),
  });

  ctx.y = PAGE_H - HERO_H - 22;

  // Patient summary card
  const physSaved = formatSavedFooter(pe.physical_exam_saved_at);
  const labSaved = formatSavedFooter(pe.laboratory_saved_at);
  const cardLines: [string, string][] = [
    ['Patient name', employee.name],
    ['Exam code', employee.exam_code],
    ['Exam date', String(employee.exam_date)],
    ['Company code', employee.company_code],
  ];
  const em = employee.email?.trim();
  if (em) cardLines.push(['Email', em]);
  const coName = employee.company_name?.trim();
  if (coName) cardLines.push(['Company name', coName]);
  const cardPadV = 14;
  const rowH = lineHeight(10);
  const lh8 = lineHeight(8);
  let metaH = 0;
  if (physSaved || labSaved) {
    metaH = 10 + 0.5 + (physSaved ? lh8 + 2 : 0) + (labSaved ? lh8 + 2 : 0);
  }
  const cardH = cardPadV * 2 + cardLines.length * rowH + metaH;
  ensureSpace(cardH + 28);
  const cardTop = ctx.y;
  const cardBottom = ctx.y - cardH;
  ctx.page.drawRectangle({
    x: MARGIN - 2,
    y: cardBottom,
    width: PAGE_W - 2 * (MARGIN - 2),
    height: cardH,
    color: CARD_FILL,
    borderColor: CARD_STROKE,
    borderWidth: 0.8,
  });
  let cy = cardTop - cardPadV - 2;
  for (const [k, v] of cardLines) {
    ctx.page.drawText(pdfSafe(k), {
      x: MARGIN + 10,
      y: cy,
      size: 8,
      font: fontBold,
      color: TEXT_MUTED,
    });
    ctx.page.drawText(pdfSafe(v), {
      x: MARGIN + 118,
      y: cy,
      size: 10,
      font: fontBold,
      color: TEXT_BODY,
    });
    cy -= rowH;
  }
  if (physSaved || labSaved) {
    cy -= 6;
    ctx.page.drawLine({
      start: { x: MARGIN + 8, y: cy },
      end: { x: PAGE_W - MARGIN - 8, y: cy },
      thickness: 0.5,
      color: RULE,
    });
    cy -= 8;
    if (physSaved) {
      ctx.page.drawText(pdfSafe(`Physical exam saved: ${physSaved}`), {
        x: MARGIN + 10,
        y: cy,
        size: 8,
        font,
        color: TEXT_MUTED,
      });
      cy -= lh8 + 2;
    }
    if (labSaved) {
      ctx.page.drawText(pdfSafe(`Laboratory saved: ${labSaved}`), {
        x: MARGIN + 10,
        y: cy,
        size: 8,
        font,
        color: TEXT_MUTED,
      });
      cy -= lh8;
    }
  }
  ctx.y = cardBottom - 18;

  drawMajorHeading('Physical examination');

  for (const section of PHYSICAL_SECTIONS) {
    drawSectionTitle(section.title);
    for (const key of section.keys) {
      const label = L[String(key)] ?? String(key);
      drawFieldRow(label, fmt(pe, key));
    }
    ctx.y -= 6;
  }

  ctx.y -= 8;
  drawMajorHeading('Laboratory and diagnostic examination');

  for (const section of LAB_SECTIONS) {
    drawSectionTitle(section.title);
    for (const key of section.keys) {
      const label = L[String(key)] ?? String(key);
      drawFieldRow(label, fmt(pe, key));
    }
    ctx.y -= 6;
  }

  // Page numbers (all pages)
  const pages = doc.getPages();
  const total = pages.length;
  const label = (i: number) => pdfSafe(`Page ${i + 1} of ${total}`);
  pages.forEach((page, i) => {
    const w = font.widthOfTextAtSize(label(i), 8);
    page.drawText(label(i), {
      x: (PAGE_W - w) / 2,
      y: 28,
      size: 8,
      font,
      color: TEXT_MUTED,
    });
  });

  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

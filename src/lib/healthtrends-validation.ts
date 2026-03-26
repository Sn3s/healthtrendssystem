import { z } from 'zod';

export const apeCompanySchema = z.object({
  company_code: z.string().regex(/^\d{3}$/, 'Company ID must be exactly 3 digits (e.g. 001)'),
  name: z.string().trim().min(1, 'Company name is required').max(200),
});

export const apeEmployeeRowSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  address: z.string().trim().max(500),
  contact_number: z.string().trim().max(50),
  age: z.coerce.number().int().min(0, 'Invalid age').max(150),
  gender: z.enum(['male', 'female', 'other']),
});

export const bulkImportSchema = z.object({
  company_code: z.string().regex(/^\d{3}$/),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(apeEmployeeRowSchema).min(1, 'Add at least one employee row'),
});

export const peReviewOfSystemsSchema = z.object({
  childhood_diseases: z.string().max(8000).optional(),
  past_illnesses_injuries: z.string().max(8000).optional(),
  operations: z.string().max(8000).optional(),
  smoker: z.enum(['yes', 'no']).optional().nullable(),
  alcohol: z.enum(['yes', 'no', 'occasional']).optional().nullable(),
  exercise: z.enum(['none', 'light', 'moderate', 'heavy']).optional().nullable(),
  family_heart_disease: z.boolean(),
  family_hypertension: z.boolean(),
  family_diabetes: z.boolean(),
  family_asthma: z.boolean(),
  family_allergy: z.boolean(),
  family_cancer: z.boolean(),
  family_others: z.string().max(500).optional(),
});

export type ApeCompanyFormData = z.infer<typeof apeCompanySchema>;
export type ApeEmployeeRow = z.infer<typeof apeEmployeeRowSchema>;
export type PeReviewOfSystemsFormData = z.infer<typeof peReviewOfSystemsSchema>;

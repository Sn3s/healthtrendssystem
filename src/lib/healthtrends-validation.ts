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
  ob_lmp: z.string().max(200).optional(),
  ob_days: z.string().max(100).optional(),
  ob_pmp: z.string().max(200).optional(),
  ob_interval: z.string().max(200).optional(),
  ob_gravida: z.string().max(50).optional(),
  ob_para: z.string().max(50).optional(),
  ob_delivery: z.string().max(2000).optional(),
  ob_complications: z.string().max(2000).optional(),
  meas_height: z.string().max(100).optional(),
  meas_weight_lbs: z.string().max(50).optional(),
  meas_bp: z.string().max(50).optional(),
  meas_pr: z.string().max(30).optional(),
  meas_rr: z.string().max(30).optional(),
  meas_va_correction: z.enum(['uncorrected', 'corrected']).optional().nullable(),
  meas_far_od: z.string().max(30).optional(),
  meas_far_os: z.string().max(30).optional(),
  meas_near_odj: z.string().max(30).optional(),
  meas_near_osj: z.string().max(30).optional(),
  find_head: z.string().max(4000).optional(),
  find_ears_eyes_nose: z.string().max(4000).optional(),
  find_mouth_throat: z.string().max(4000).optional(),
  find_neck_thorax: z.string().max(4000).optional(),
  find_lungs: z.string().max(4000).optional(),
  find_heart: z.string().max(4000).optional(),
  find_abdomen: z.string().max(4000).optional(),
  find_genitalia: z.string().max(4000).optional(),
  find_extremities: z.string().max(4000).optional(),
  find_skin: z.string().max(4000).optional(),
  find_rectum: z.string().max(4000).optional(),
  find_ishihara_score: z.string().max(200).optional(),
  dental_missing_teeth: z.string().max(2000).optional(),
  dental_canes: z.string().max(2000).optional(),
  dental_replaced: z.string().max(2000).optional(),
  dental_jacket_crown: z.string().max(2000).optional(),
});

export const peLabHematologySchema = z.object({
  lab_hem_hemoglobin: z.string().max(100).optional(),
  lab_hem_hematocrit: z.string().max(100).optional(),
  lab_hem_wbc: z.string().max(100).optional(),
  lab_hem_rbc: z.string().max(100).optional(),
  lab_hem_segmanters: z.string().max(100).optional(),
  lab_hem_lymphocytes: z.string().max(100).optional(),
  lab_hem_eosinophil: z.string().max(100).optional(),
  lab_hem_monocytes: z.string().max(100).optional(),
  lab_hem_basophil: z.string().max(100).optional(),
  lab_hem_platelet: z.string().max(100).optional(),
});

export const peLabUrinalysisSchema = z.object({
  lab_ua_color: z.string().max(200).optional(),
  lab_ua_transparency: z.string().max(200).optional(),
  lab_ua_reaction: z.string().max(200).optional(),
  lab_ua_specific_gravity: z.string().max(100).optional(),
  lab_ua_protein: z.string().max(200).optional(),
  lab_ua_sugar: z.string().max(200).optional(),
  lab_ua_pus_cells: z.string().max(200).optional(),
  lab_ua_red_blood_cells: z.string().max(200).optional(),
  lab_ua_epithelial_cells: z.string().max(200).optional(),
  lab_ua_amorphous: z.string().max(200).optional(),
  lab_ua_mucus_threads: z.string().max(200).optional(),
  lab_ua_bacteria: z.string().max(200).optional(),
  lab_ua_others: z.string().max(2000).optional(),
});

export const peLabStoolSchema = z.object({
  lab_stool_color: z.string().max(200).optional(),
  lab_stool_consistency: z.string().max(200).optional(),
  lab_stool_others: z.string().max(2000).optional(),
});

export const peLabChestPaSchema = z.object({
  lab_chest_pa_findings: z.string().max(4000).optional(),
  lab_chest_pa_impression: z.string().max(2000).optional(),
});

export const peLabEcgSchema = z.object({
  lab_ecg_rate: z.string().max(50).optional(),
  lab_ecg_rhythm: z.string().max(100).optional(),
  lab_ecg_interpretation: z.string().max(4000).optional(),
  lab_ecg_others: z.string().max(2000).optional(),
});

export const peLabPapSmearSchema = z.object({
  lab_pap_specimen_adequacy: z.string().max(2000).optional(),
  lab_pap_general_categorization: z.string().max(2000).optional(),
  lab_pap_descriptive_diagnoses: z.string().max(4000).optional(),
});

export const peLaboratorySchema = peLabHematologySchema
  .merge(peLabUrinalysisSchema)
  .merge(peLabStoolSchema)
  .merge(peLabChestPaSchema)
  .merge(peLabEcgSchema)
  .merge(peLabPapSmearSchema);

export type ApeCompanyFormData = z.infer<typeof apeCompanySchema>;
export type ApeEmployeeRow = z.infer<typeof apeEmployeeRowSchema>;
export type PeReviewOfSystemsFormData = z.infer<typeof peReviewOfSystemsSchema>;
export type PeLabHematologyFormData = z.infer<typeof peLabHematologySchema>;
export type PeLabUrinalysisFormData = z.infer<typeof peLabUrinalysisSchema>;
export type PeLabStoolFormData = z.infer<typeof peLabStoolSchema>;
export type PeLabChestPaFormData = z.infer<typeof peLabChestPaSchema>;
export type PeLabEcgFormData = z.infer<typeof peLabEcgSchema>;
export type PeLabPapSmearFormData = z.infer<typeof peLabPapSmearSchema>;
export type PeLaboratoryFormData = z.infer<typeof peLaboratorySchema>;

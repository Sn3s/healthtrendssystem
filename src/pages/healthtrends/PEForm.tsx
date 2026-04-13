import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  peReviewOfSystemsSchema,
  peLaboratorySchema,
  type PeReviewOfSystemsFormData,
  type PeLabHematologyFormData,
  type PeLabUrinalysisFormData,
  type PeLabStoolFormData,
  type PeLabChestPaFormData,
  type PeLabEcgFormData,
  type PeLabPapSmearFormData,
  type PeLaboratoryFormData,
} from '@/lib/healthtrends-validation';
import { Download, Mail } from 'lucide-react';
import { HealthTrendsMark } from '@/components/HealthTrendsMark';
import { buildPeExamPdfBlob, getPeCombinedPdfReadiness } from '@/lib/peExamPdf';
import { blobToBase64Pdf, invokeSendPeReport } from '@/lib/emailPeReport';

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

const PE_FINDING_FIELDS: { name: keyof PeReviewOfSystemsFormData; label: string }[] = [
  { name: 'find_head', label: 'Head' },
  { name: 'find_ears_eyes_nose', label: 'Ears/Eyes/Nose' },
  { name: 'find_mouth_throat', label: 'Mouth and Throat' },
  { name: 'find_neck_thorax', label: 'Neck/Thorax' },
  { name: 'find_lungs', label: 'Lungs' },
  { name: 'find_heart', label: 'Heart' },
  { name: 'find_abdomen', label: 'Abdomen' },
  { name: 'find_genitalia', label: 'Genitalia' },
  { name: 'find_extremities', label: 'Extremities' },
  { name: 'find_skin', label: 'Skin' },
  { name: 'find_rectum', label: 'Rectum' },
];

const LAB_HEM_DEFAULTS: PeLabHematologyFormData = {
  lab_hem_hemoglobin: '',
  lab_hem_hematocrit: '',
  lab_hem_wbc: '',
  lab_hem_rbc: '',
  lab_hem_segmanters: '',
  lab_hem_lymphocytes: '',
  lab_hem_eosinophil: '',
  lab_hem_monocytes: '',
  lab_hem_basophil: '',
  lab_hem_platelet: '',
};

const LAB_HEM_FIELDS: { name: keyof PeLabHematologyFormData; label: string; reference: string }[] = [
  { name: 'lab_hem_hemoglobin', label: 'Hemoglobin', reference: '(M) 135-180g/L; (F) 125-160g/L' },
  { name: 'lab_hem_hematocrit', label: 'Hematocrit', reference: '(M) 40-54vol%; (F) 37-47 vol%' },
  { name: 'lab_hem_wbc', label: 'WBC', reference: '5.0 - 10.0/cumm' },
  { name: 'lab_hem_rbc', label: 'RBC', reference: '4.6 - 6.2/cumm' },
  { name: 'lab_hem_segmanters', label: 'Segmanters', reference: '60%' },
  { name: 'lab_hem_lymphocytes', label: 'Lymphocytes', reference: '40%' },
  { name: 'lab_hem_eosinophil', label: 'Eosinophil', reference: '1-3%' },
  { name: 'lab_hem_monocytes', label: 'Monocytes', reference: '3-7%' },
  { name: 'lab_hem_basophil', label: 'Basophil', reference: '0-2%' },
  { name: 'lab_hem_platelet', label: 'Platelet', reference: '150-400 x 1 Ceg/cumm' },
];

const LAB_UA_DEFAULTS: PeLabUrinalysisFormData = {
  lab_ua_color: '',
  lab_ua_transparency: '',
  lab_ua_reaction: '',
  lab_ua_specific_gravity: '',
  lab_ua_protein: '',
  lab_ua_sugar: '',
  lab_ua_pus_cells: '',
  lab_ua_red_blood_cells: '',
  lab_ua_epithelial_cells: '',
  lab_ua_amorphous: '',
  lab_ua_mucus_threads: '',
  lab_ua_bacteria: '',
  lab_ua_others: '',
};

const LAB_UA_FIELDS: { name: keyof PeLabUrinalysisFormData; label: string; multiline?: boolean }[] = [
  { name: 'lab_ua_color', label: 'Color' },
  { name: 'lab_ua_transparency', label: 'Transparency' },
  { name: 'lab_ua_reaction', label: 'Reaction' },
  { name: 'lab_ua_specific_gravity', label: 'Specific Gravity' },
  { name: 'lab_ua_protein', label: 'Protein' },
  { name: 'lab_ua_sugar', label: 'Sugar' },
  { name: 'lab_ua_pus_cells', label: 'Pus Cells' },
  { name: 'lab_ua_red_blood_cells', label: 'Red Blood Cells' },
  { name: 'lab_ua_epithelial_cells', label: 'Epithelial Cells' },
  { name: 'lab_ua_amorphous', label: 'Amorphous' },
  { name: 'lab_ua_mucus_threads', label: 'Mucus Threads' },
  { name: 'lab_ua_bacteria', label: 'Bacteria' },
  { name: 'lab_ua_others', label: 'Others', multiline: true },
];

const LAB_STOOL_DEFAULTS: PeLabStoolFormData = {
  lab_stool_color: '',
  lab_stool_consistency: '',
  lab_stool_others: '',
};

const LAB_CHEST_PA_DEFAULTS: PeLabChestPaFormData = {
  lab_chest_pa_findings: '',
  lab_chest_pa_impression: '',
};

const LAB_ECG_DEFAULTS: PeLabEcgFormData = {
  lab_ecg_rate: '',
  lab_ecg_rhythm: '',
  lab_ecg_interpretation: '',
  lab_ecg_others: '',
};

const LAB_PAP_DEFAULTS: PeLabPapSmearFormData = {
  lab_pap_specimen_adequacy: '',
  lab_pap_general_categorization: '',
  lab_pap_descriptive_diagnoses: '',
};

const LAB_DEFAULTS: PeLaboratoryFormData = {
  ...LAB_HEM_DEFAULTS,
  ...LAB_UA_DEFAULTS,
  ...LAB_STOOL_DEFAULTS,
  ...LAB_CHEST_PA_DEFAULTS,
  ...LAB_ECG_DEFAULTS,
  ...LAB_PAP_DEFAULTS,
};

const LAB_STOOL_FIELDS: { name: keyof PeLabStoolFormData; label: string; multiline?: boolean }[] = [
  { name: 'lab_stool_color', label: 'Color' },
  { name: 'lab_stool_consistency', label: 'Consistency' },
  { name: 'lab_stool_others', label: 'Others', multiline: true },
];

const LAB_CHEST_PA_FIELDS: { name: keyof PeLabChestPaFormData; label: string; multiline?: boolean }[] = [
  { name: 'lab_chest_pa_findings', label: 'Findings', multiline: true },
  { name: 'lab_chest_pa_impression', label: 'Impression', multiline: true },
];

const LAB_ECG_FIELDS: { name: keyof PeLabEcgFormData; label: string; multiline?: boolean }[] = [
  { name: 'lab_ecg_rate', label: 'Rate' },
  { name: 'lab_ecg_rhythm', label: 'Rhythm' },
  { name: 'lab_ecg_interpretation', label: 'Interpretation', multiline: true },
  { name: 'lab_ecg_others', label: 'Others', multiline: true },
];

const LAB_PAP_FIELDS: { name: keyof PeLabPapSmearFormData; label: string }[] = [
  { name: 'lab_pap_specimen_adequacy', label: 'Specimen Adequacy' },
  { name: 'lab_pap_general_categorization', label: 'General Categorization' },
  { name: 'lab_pap_descriptive_diagnoses', label: 'Descriptive Diagnoses' },
];

export default function PEForm() {
  const { examCode: examCodeParam } = useParams<{ examCode: string }>();
  const examCode = examCodeParam ? decodeURIComponent(examCodeParam) : '';
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [employee, setEmployee] = useState<{
    id: string;
    exam_code: string;
    name: string;
    exam_date: string;
    company_code: string;
    company_name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLab, setSavingLab] = useState(false);
  const [physicalExamSavedAt, setPhysicalExamSavedAt] = useState<string | null>(null);
  const [laboratorySavedAt, setLaboratorySavedAt] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailingPdf, setEmailingPdf] = useState(false);

  const canAccess = userRoles.includes('encoder') || userRoles.includes('admin');

  const form = useForm<PeReviewOfSystemsFormData>({
    resolver: zodResolver(peReviewOfSystemsSchema),
    defaultValues: {
      childhood_diseases: '',
      past_illnesses_injuries: '',
      operations: '',
      smoker: undefined,
      alcohol: undefined,
      exercise: undefined,
      family_heart_disease: false,
      family_hypertension: false,
      family_diabetes: false,
      family_asthma: false,
      family_allergy: false,
      family_cancer: false,
      family_others: '',
      ob_lmp: '',
      ob_days: '',
      ob_pmp: '',
      ob_interval: '',
      ob_gravida: '',
      ob_para: '',
      ob_delivery: '',
      ob_complications: '',
      meas_height: '',
      meas_weight_lbs: '',
      meas_bp: '',
      meas_pr: '',
      meas_rr: '',
      meas_va_correction: undefined,
      meas_far_od: '',
      meas_far_os: '',
      meas_near_odj: '',
      meas_near_osj: '',
      find_head: '',
      find_ears_eyes_nose: '',
      find_mouth_throat: '',
      find_neck_thorax: '',
      find_lungs: '',
      find_heart: '',
      find_abdomen: '',
      find_genitalia: '',
      find_extremities: '',
      find_skin: '',
      find_rectum: '',
      find_ishihara_score: '',
      dental_missing_teeth: '',
      dental_canes: '',
      dental_replaced: '',
      dental_jacket_crown: '',
    },
  });

  const labForm = useForm<PeLaboratoryFormData>({
    resolver: zodResolver(peLaboratorySchema),
    defaultValues: LAB_DEFAULTS,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!canAccess) navigate('/');
    }
  }, [user, authLoading, canAccess, navigate]);

  useEffect(() => {
    if (!examCode || !user || !canAccess) return;

    (async () => {
      setLoading(true);
      const { data: emp, error: e1 } = await supabase.from('ape_employees').select('*').eq('exam_code', examCode).maybeSingle();
      if (e1 || !emp) {
        toast({ title: 'Not found', description: 'Invalid exam code.', variant: 'destructive' });
        navigate('/?tab=pe-encoding');
        setLoading(false);
        return;
      }
      const { data: co } = await supabase
        .from('ape_companies')
        .select('name')
        .eq('company_code', emp.company_code)
        .maybeSingle();
      const company_name = (co?.name ?? '').trim();
      setEmployee({
        id: emp.id,
        exam_code: emp.exam_code,
        name: emp.name,
        exam_date: emp.exam_date,
        company_code: emp.company_code,
        company_name,
        email: emp.email ?? '',
      });

      const { data: pe } = await supabase.from('pe_records').select('*').eq('ape_employee_id', emp.id).maybeSingle();
      if (pe) {
        form.reset({
          childhood_diseases: pe.childhood_diseases ?? '',
          past_illnesses_injuries: pe.past_illnesses_injuries ?? '',
          operations: pe.operations ?? '',
          smoker: (pe.smoker as 'yes' | 'no') ?? undefined,
          alcohol: (pe.alcohol as 'yes' | 'no' | 'occasional') ?? undefined,
          exercise: (pe.exercise as PeReviewOfSystemsFormData['exercise']) ?? undefined,
          family_heart_disease: !!pe.family_heart_disease,
          family_hypertension: !!pe.family_hypertension,
          family_diabetes: !!pe.family_diabetes,
          family_asthma: !!pe.family_asthma,
          family_allergy: !!pe.family_allergy,
          family_cancer: !!pe.family_cancer,
          family_others: pe.family_others ?? '',
          ob_lmp: pe.ob_lmp ?? '',
          ob_days: pe.ob_days ?? '',
          ob_pmp: pe.ob_pmp ?? '',
          ob_interval: pe.ob_interval ?? '',
          ob_gravida: pe.ob_gravida ?? '',
          ob_para: pe.ob_para ?? '',
          ob_delivery: pe.ob_delivery ?? '',
          ob_complications: pe.ob_complications ?? '',
          meas_height: pe.meas_height ?? '',
          meas_weight_lbs: pe.meas_weight_lbs ?? '',
          meas_bp: pe.meas_bp ?? '',
          meas_pr: pe.meas_pr ?? '',
          meas_rr: pe.meas_rr ?? '',
          meas_va_correction:
            pe.meas_va_correction === 'uncorrected' || pe.meas_va_correction === 'corrected'
              ? pe.meas_va_correction
              : undefined,
          meas_far_od: pe.meas_far_od ?? '',
          meas_far_os: pe.meas_far_os ?? '',
          meas_near_odj: pe.meas_near_odj ?? '',
          meas_near_osj: pe.meas_near_osj ?? '',
          find_head: pe.find_head ?? '',
          find_ears_eyes_nose: pe.find_ears_eyes_nose ?? '',
          find_mouth_throat: pe.find_mouth_throat ?? '',
          find_neck_thorax: pe.find_neck_thorax ?? '',
          find_lungs: pe.find_lungs ?? '',
          find_heart: pe.find_heart ?? '',
          find_abdomen: pe.find_abdomen ?? '',
          find_genitalia: pe.find_genitalia ?? '',
          find_extremities: pe.find_extremities ?? '',
          find_skin: pe.find_skin ?? '',
          find_rectum: pe.find_rectum ?? '',
          find_ishihara_score: pe.find_ishihara_score ?? '',
          dental_missing_teeth: pe.dental_missing_teeth ?? '',
          dental_canes: pe.dental_canes ?? '',
          dental_replaced: pe.dental_replaced ?? '',
          dental_jacket_crown: pe.dental_jacket_crown ?? '',
        });
        labForm.reset({
          lab_hem_hemoglobin: pe.lab_hem_hemoglobin ?? '',
          lab_hem_hematocrit: pe.lab_hem_hematocrit ?? '',
          lab_hem_wbc: pe.lab_hem_wbc ?? '',
          lab_hem_rbc: pe.lab_hem_rbc ?? '',
          lab_hem_segmanters: pe.lab_hem_segmanters ?? '',
          lab_hem_lymphocytes: pe.lab_hem_lymphocytes ?? '',
          lab_hem_eosinophil: pe.lab_hem_eosinophil ?? '',
          lab_hem_monocytes: pe.lab_hem_monocytes ?? '',
          lab_hem_basophil: pe.lab_hem_basophil ?? '',
          lab_hem_platelet: pe.lab_hem_platelet ?? '',
          lab_ua_color: pe.lab_ua_color ?? '',
          lab_ua_transparency: pe.lab_ua_transparency ?? '',
          lab_ua_reaction: pe.lab_ua_reaction ?? '',
          lab_ua_specific_gravity: pe.lab_ua_specific_gravity ?? '',
          lab_ua_protein: pe.lab_ua_protein ?? '',
          lab_ua_sugar: pe.lab_ua_sugar ?? '',
          lab_ua_pus_cells: pe.lab_ua_pus_cells ?? '',
          lab_ua_red_blood_cells: pe.lab_ua_red_blood_cells ?? '',
          lab_ua_epithelial_cells: pe.lab_ua_epithelial_cells ?? '',
          lab_ua_amorphous: pe.lab_ua_amorphous ?? '',
          lab_ua_mucus_threads: pe.lab_ua_mucus_threads ?? '',
          lab_ua_bacteria: pe.lab_ua_bacteria ?? '',
          lab_ua_others: pe.lab_ua_others ?? '',
          lab_stool_color: pe.lab_stool_color ?? '',
          lab_stool_consistency: pe.lab_stool_consistency ?? '',
          lab_stool_others: pe.lab_stool_others ?? '',
          lab_chest_pa_findings: pe.lab_chest_pa_findings ?? '',
          lab_chest_pa_impression: pe.lab_chest_pa_impression ?? '',
          lab_ecg_rate: pe.lab_ecg_rate ?? '',
          lab_ecg_rhythm: pe.lab_ecg_rhythm ?? '',
          lab_ecg_interpretation: pe.lab_ecg_interpretation ?? '',
          lab_ecg_others: pe.lab_ecg_others ?? '',
          lab_pap_specimen_adequacy: pe.lab_pap_specimen_adequacy ?? '',
          lab_pap_general_categorization: pe.lab_pap_general_categorization ?? '',
          lab_pap_descriptive_diagnoses: pe.lab_pap_descriptive_diagnoses ?? '',
        });
        setPhysicalExamSavedAt(pe.physical_exam_saved_at ?? null);
        setLaboratorySavedAt(pe.laboratory_saved_at ?? null);
      } else {
        labForm.reset(LAB_DEFAULTS);
        setPhysicalExamSavedAt(null);
        setLaboratorySavedAt(null);
      }
      setLoading(false);
    })();
  }, [examCode, user, canAccess, navigate]);

  const handleDownloadCombinedPdf = async () => {
    if (!employee) return;
    setDownloadingPdf(true);
    try {
      const { data: pe, error } = await supabase.from('pe_records').select('*').eq('ape_employee_id', employee.id).maybeSingle();
      if (error) throw error;
      const ready = getPeCombinedPdfReadiness(pe);
      if (!ready.ok) {
        toast({ title: 'Cannot download PDF', description: ready.message, variant: 'destructive' });
        return;
      }
      const blob = await buildPeExamPdfBlob(employee, pe!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PE-${employee.exam_code.replace(/[^\w.-]+/g, '_')}.pdf`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: 'Combined examination PDF is downloading.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEmailCombinedPdf = async () => {
    if (!employee) return;
    setEmailingPdf(true);
    try {
      const { data: pe, error } = await supabase.from('pe_records').select('*').eq('ape_employee_id', employee.id).maybeSingle();
      if (error) throw error;
      const ready = getPeCombinedPdfReadiness(pe);
      if (!ready.ok) {
        toast({ title: 'Cannot email PDF', description: ready.message, variant: 'destructive' });
        return;
      }
      const blob = await buildPeExamPdfBlob(employee, pe!);
      const pdfBase64 = await blobToBase64Pdf(blob);
      const filename = `PE-${employee.exam_code.replace(/[^\w.-]+/g, '_')}.pdf`;
      const res = await invokeSendPeReport({ examCode: employee.exam_code, pdfBase64, filename });
      toast({
        title: 'Report emailed',
        description: res.sentTo
          ? `The combined PDF was sent to ${res.sentTo}.`
          : 'The combined PDF was sent.',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast({ title: 'Could not send email', description: msg, variant: 'destructive' });
    } finally {
      setEmailingPdf(false);
    }
  };

  const onSaveLab = labForm.handleSubmit(async (values) => {
    if (!employee) return;
    setSavingLab(true);
    const labSavedAt = new Date().toISOString();
    const payload = {
      lab_hem_hemoglobin: values.lab_hem_hemoglobin || null,
      lab_hem_hematocrit: values.lab_hem_hematocrit || null,
      lab_hem_wbc: values.lab_hem_wbc || null,
      lab_hem_rbc: values.lab_hem_rbc || null,
      lab_hem_segmanters: values.lab_hem_segmanters || null,
      lab_hem_lymphocytes: values.lab_hem_lymphocytes || null,
      lab_hem_eosinophil: values.lab_hem_eosinophil || null,
      lab_hem_monocytes: values.lab_hem_monocytes || null,
      lab_hem_basophil: values.lab_hem_basophil || null,
      lab_hem_platelet: values.lab_hem_platelet || null,
      lab_ua_color: values.lab_ua_color || null,
      lab_ua_transparency: values.lab_ua_transparency || null,
      lab_ua_reaction: values.lab_ua_reaction || null,
      lab_ua_specific_gravity: values.lab_ua_specific_gravity || null,
      lab_ua_protein: values.lab_ua_protein || null,
      lab_ua_sugar: values.lab_ua_sugar || null,
      lab_ua_pus_cells: values.lab_ua_pus_cells || null,
      lab_ua_red_blood_cells: values.lab_ua_red_blood_cells || null,
      lab_ua_epithelial_cells: values.lab_ua_epithelial_cells || null,
      lab_ua_amorphous: values.lab_ua_amorphous || null,
      lab_ua_mucus_threads: values.lab_ua_mucus_threads || null,
      lab_ua_bacteria: values.lab_ua_bacteria || null,
      lab_ua_others: values.lab_ua_others || null,
      lab_stool_color: values.lab_stool_color || null,
      lab_stool_consistency: values.lab_stool_consistency || null,
      lab_stool_others: values.lab_stool_others || null,
      lab_chest_pa_findings: values.lab_chest_pa_findings || null,
      lab_chest_pa_impression: values.lab_chest_pa_impression || null,
      lab_ecg_rate: values.lab_ecg_rate || null,
      lab_ecg_rhythm: values.lab_ecg_rhythm || null,
      lab_ecg_interpretation: values.lab_ecg_interpretation || null,
      lab_ecg_others: values.lab_ecg_others || null,
      lab_pap_specimen_adequacy: values.lab_pap_specimen_adequacy || null,
      lab_pap_general_categorization: values.lab_pap_general_categorization || null,
      lab_pap_descriptive_diagnoses: values.lab_pap_descriptive_diagnoses || null,
      laboratory_saved_at: labSavedAt,
      updated_at: labSavedAt,
    };
    try {
      const { data: existing, error: selErr } = await supabase
        .from('pe_records')
        .select('id')
        .eq('ape_employee_id', employee.id)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing) {
        const { error } = await supabase.from('pe_records').update(payload).eq('ape_employee_id', employee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pe_records')
          .upsert({ ape_employee_id: employee.id, ...payload }, { onConflict: 'ape_employee_id' });
        if (error) throw error;
      }
      setLaboratorySavedAt(labSavedAt);
      toast({ title: 'Saved', description: 'Laboratory section updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSavingLab(false);
    }
  });

  const onSaveTab1 = form.handleSubmit(async (values) => {
    if (!employee) return;
    setSaving(true);
    const physicalSavedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('pe_records').upsert(
        {
          ape_employee_id: employee.id,
          childhood_diseases: values.childhood_diseases || null,
          past_illnesses_injuries: values.past_illnesses_injuries || null,
          operations: values.operations || null,
          smoker: values.smoker ?? null,
          alcohol: values.alcohol ?? null,
          exercise: values.exercise ?? null,
          family_heart_disease: values.family_heart_disease,
          family_hypertension: values.family_hypertension,
          family_diabetes: values.family_diabetes,
          family_asthma: values.family_asthma,
          family_allergy: values.family_allergy,
          family_cancer: values.family_cancer,
          family_others: values.family_others || null,
          ob_lmp: values.ob_lmp || null,
          ob_days: values.ob_days || null,
          ob_pmp: values.ob_pmp || null,
          ob_interval: values.ob_interval || null,
          ob_gravida: values.ob_gravida || null,
          ob_para: values.ob_para || null,
          ob_delivery: values.ob_delivery || null,
          ob_complications: values.ob_complications || null,
          meas_height: values.meas_height || null,
          meas_weight_lbs: values.meas_weight_lbs || null,
          meas_bp: values.meas_bp || null,
          meas_pr: values.meas_pr || null,
          meas_rr: values.meas_rr || null,
          meas_va_correction: values.meas_va_correction ?? null,
          meas_far_od: values.meas_far_od || null,
          meas_far_os: values.meas_far_os || null,
          meas_near_odj: values.meas_near_odj || null,
          meas_near_osj: values.meas_near_osj || null,
          find_head: values.find_head || null,
          find_ears_eyes_nose: values.find_ears_eyes_nose || null,
          find_mouth_throat: values.find_mouth_throat || null,
          find_neck_thorax: values.find_neck_thorax || null,
          find_lungs: values.find_lungs || null,
          find_heart: values.find_heart || null,
          find_abdomen: values.find_abdomen || null,
          find_genitalia: values.find_genitalia || null,
          find_extremities: values.find_extremities || null,
          find_skin: values.find_skin || null,
          find_rectum: values.find_rectum || null,
          find_ishihara_score: values.find_ishihara_score || null,
          dental_missing_teeth: values.dental_missing_teeth || null,
          dental_canes: values.dental_canes || null,
          dental_replaced: values.dental_replaced || null,
          dental_jacket_crown: values.dental_jacket_crown || null,
          physical_exam_saved_at: physicalSavedAt,
          updated_at: physicalSavedAt,
        },
        { onConflict: 'ape_employee_id' }
      );
      if (error) throw error;
      setPhysicalExamSavedAt(physicalSavedAt);
      toast({ title: 'Saved', description: 'Physical examination section updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  });

  if (authLoading || loading || !user || !canAccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <header className="border-b border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </header>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <HealthTrendsMark className="h-6 w-6" />
          <span className="text-sm font-medium truncate">APE · Physical examination</span>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" asChild>
          <Link to="/?tab=pe-encoding">Back to workspace</Link>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Physical examination</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {employee.exam_code} · {employee.name} · Exam date {employee.exam_date} · Co.{' '}
            {employee.company_code}
            {employee.company_name ? ` — ${employee.company_name}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            disabled={downloadingPdf || emailingPdf}
            onClick={handleDownloadCombinedPdf}
          >
            <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" aria-hidden />
            {downloadingPdf ? 'Preparing PDF…' : 'Download PDF report'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={downloadingPdf || emailingPdf}
            onClick={handleEmailCombinedPdf}
            title={
              employee.email?.trim()
                ? `Send PDF (employee on file: ${employee.email}; test inbox may override on server)`
                : 'Send PDF (uses employee email on file, or RESEND_TEST_RECIPIENT on server)'
            }
          >
            <Mail className="h-3.5 w-3.5 mr-1.5 shrink-0" aria-hidden />
            {emailingPdf ? 'Sending…' : 'Email PDF report'}
          </Button>
          <p className="text-[11px] text-muted-foreground leading-snug max-w-xl">
            Includes physical examination and laboratory results. Both sections must be saved with entered results. Email is sent via
            Resend; with <code className="bg-muted px-1 rounded">RESEND_TEST_RECIPIENT</code> set on the server, messages go to that inbox
            for testing until you add a domain.
          </p>
        </div>

        <Tabs defaultValue="ros" className="w-full">
          <TabsList className="h-auto min-h-9 w-full max-w-2xl grid grid-cols-1 gap-1 p-1 sm:grid-cols-2">
            <TabsTrigger value="ros" className="text-xs px-2 py-2 whitespace-normal text-center leading-snug">
              Physical Examination
            </TabsTrigger>
            <TabsTrigger value="ob" className="text-xs px-2 py-2 whitespace-normal text-center leading-snug">
              Laboratory and Diagnostic Examination
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ros" className="mt-4 space-y-3">
            <form onSubmit={onSaveTab1} className="space-y-3">
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Past medical history</CardTitle>
                  <CardDescription className="text-xs">Childhood diseases, past illnesses, operations.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Childhood diseases</Label>
                    <Textarea className="min-h-[56px] text-xs py-1.5" {...form.register('childhood_diseases')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Past illnesses / injuries</Label>
                    <Textarea className="min-h-[56px] text-xs py-1.5" {...form.register('past_illnesses_injuries')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Operations</Label>
                    <Textarea className="min-h-[56px] text-xs py-1.5" {...form.register('operations')} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Personal history</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Smoker</Label>
                    <Controller
                      control={form.control}
                      name="smoker"
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v as 'yes' | 'no')}
                          className="flex gap-3"
                        >
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="yes" id="sm-y" className="h-3.5 w-3.5" />
                            <Label htmlFor="sm-y" className="text-xs font-normal">
                              Yes
                            </Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="no" id="sm-n" className="h-3.5 w-3.5" />
                            <Label htmlFor="sm-n" className="text-xs font-normal">
                              No
                            </Label>
                          </div>
                        </RadioGroup>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Alcohol</Label>
                    <Controller
                      control={form.control}
                      name="alcohol"
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v as 'yes' | 'no' | 'occasional')}
                          className="flex flex-wrap gap-2"
                        >
                          {(['yes', 'no', 'occasional'] as const).map((v) => (
                            <div key={v} className="flex items-center gap-1.5">
                              <RadioGroupItem value={v} id={`alc-${v}`} className="h-3.5 w-3.5" />
                              <Label htmlFor={`alc-${v}`} className="text-xs font-normal capitalize">
                                {v}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Exercise</Label>
                    <Controller
                      control={form.control}
                      name="exercise"
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v as PeReviewOfSystemsFormData['exercise'])}
                          className="flex flex-wrap gap-1"
                        >
                          {(['none', 'light', 'moderate', 'heavy'] as const).map((v) => (
                            <div key={v} className="flex items-center gap-1.5">
                              <RadioGroupItem value={v} id={`ex-${v}`} className="h-3.5 w-3.5" />
                              <Label htmlFor={`ex-${v}`} className="text-xs font-normal capitalize">
                                {v}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Family history</CardTitle>
                  <CardDescription className="text-xs">Check all that apply.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                    {(
                      [
                        ['family_heart_disease', 'Heart disease'],
                        ['family_hypertension', 'Hypertension'],
                        ['family_diabetes', 'Diabetes'],
                        ['family_asthma', 'Asthma'],
                        ['family_allergy', 'Allergy'],
                        ['family_cancer', 'Cancer'],
                      ] as const
                    ).map(([key, label]) => (
                      <Controller
                        key={key}
                        control={form.control}
                        name={key}
                        render={({ field }) => (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={key}
                              checked={field.value}
                              onCheckedChange={(c) => field.onChange(!!c)}
                              className="h-3.5 w-3.5"
                            />
                            <Label htmlFor={key} className="text-xs font-normal cursor-pointer">
                              {label}
                            </Label>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                  <div className="space-y-1 pt-1">
                    <Label className="text-xs">Others (specify)</Label>
                    <Input className="h-8 text-xs" {...form.register('family_others')} placeholder="Other family history" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Obstetrical history</CardTitle>
                  <CardDescription className="text-xs">Menstrual and obstetric summary.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="ob_lmp">
                        LMP
                      </Label>
                      <Input id="ob_lmp" className="h-8 text-xs" {...form.register('ob_lmp')} placeholder="Last menstrual period" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="ob_days">
                        Days
                      </Label>
                      <Input id="ob_days" className="h-8 text-xs" {...form.register('ob_days')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="ob_pmp">
                        PMP
                      </Label>
                      <Input id="ob_pmp" className="h-8 text-xs" {...form.register('ob_pmp')} placeholder="Previous menstrual period" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="ob_interval">
                        Interval
                      </Label>
                      <Input id="ob_interval" className="h-8 text-xs" {...form.register('ob_interval')} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">OB score</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">G:</span>
                      <Input
                        className="h-8 w-14 text-xs"
                        inputMode="numeric"
                        {...form.register('ob_gravida')}
                        aria-label="Gravida"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums">P:</span>
                      <Input
                        className="h-8 w-14 text-xs"
                        inputMode="numeric"
                        {...form.register('ob_para')}
                        aria-label="Para"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="ob_delivery">
                      Delivery
                    </Label>
                    <Textarea id="ob_delivery" className="min-h-[56px] text-xs py-1.5" {...form.register('ob_delivery')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="ob_complications">
                      Complications
                    </Label>
                    <Textarea id="ob_complications" className="min-h-[72px] text-xs py-1.5" {...form.register('ob_complications')} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Measurements</CardTitle>
                  <CardDescription className="text-xs">Vital signs and anthropometrics.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="meas_height">
                        Height
                      </Label>
                      <Input
                        id="meas_height"
                        className="h-8 text-xs"
                        {...form.register('meas_height')}
                        placeholder="e.g. 170 cm / 5 ft 8 in"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="meas_weight_lbs">
                        Weight <span className="text-muted-foreground font-normal">(lbs)</span>
                      </Label>
                      <Input id="meas_weight_lbs" className="h-8 text-xs" {...form.register('meas_weight_lbs')} inputMode="decimal" />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-xs" htmlFor="meas_bp">
                        BP <span className="text-muted-foreground font-normal">(mmHg)</span>
                      </Label>
                      <Input
                        id="meas_bp"
                        className="h-8 text-xs"
                        {...form.register('meas_bp')}
                        placeholder="e.g. 120/80"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="meas_pr">
                        PR <span className="text-muted-foreground font-normal">(bpm)</span>
                      </Label>
                      <Input id="meas_pr" className="h-8 text-xs" {...form.register('meas_pr')} inputMode="numeric" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="meas_rr">
                        RR <span className="text-muted-foreground font-normal">(bpm)</span>
                      </Label>
                      <Input id="meas_rr" className="h-8 text-xs" {...form.register('meas_rr')} inputMode="numeric" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 border-t border-border/60">
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Visual acuity</p>
                      <Controller
                        control={form.control}
                        name="meas_va_correction"
                        render={({ field }) => (
                          <RadioGroup
                            className="flex flex-wrap gap-4"
                            value={field.value}
                            onValueChange={(v) => field.onChange(v as 'uncorrected' | 'corrected')}
                          >
                            <div className="flex items-center gap-1.5">
                              <RadioGroupItem value="uncorrected" id="va-uncorr" className="h-3.5 w-3.5" />
                              <Label htmlFor="va-uncorr" className="text-xs font-normal">
                                Uncorrected
                              </Label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <RadioGroupItem value="corrected" id="va-corr" className="h-3.5 w-3.5" />
                              <Label htmlFor="va-corr" className="text-xs font-normal">
                                Corrected
                              </Label>
                            </div>
                          </RadioGroup>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Far vision</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                        <span className="text-muted-foreground tabular-nums shrink-0">OD 20/</span>
                        <Input
                          className="h-8 w-20 text-xs"
                          {...form.register('meas_far_od')}
                          aria-label="Far vision right eye, 20 foot denominator"
                        />
                        <span className="text-muted-foreground tabular-nums shrink-0">OS 20/</span>
                        <Input
                          className="h-8 w-20 text-xs"
                          {...form.register('meas_far_os')}
                          aria-label="Far vision left eye, 20 foot denominator"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Near vision</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                        <span className="text-muted-foreground tabular-nums shrink-0">OD J/</span>
                        <Input
                          className="h-8 w-20 text-xs"
                          {...form.register('meas_near_odj')}
                          aria-label="Near vision right eye Jaeger"
                        />
                        <span className="text-muted-foreground tabular-nums shrink-0">OS J/</span>
                        <Input
                          className="h-8 w-20 text-xs"
                          {...form.register('meas_near_osj')}
                          aria-label="Near vision left eye Jaeger"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Findings</CardTitle>
                  <CardDescription className="text-xs">Physical examination findings by system.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PE_FINDING_FIELDS.map(({ name, label }) => (
                      <div key={name} className="space-y-1 sm:col-span-1">
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        <Textarea
                          id={name}
                          className="min-h-[56px] text-xs resize-y"
                          {...form.register(name)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <Label className="text-xs" htmlFor="find_ishihara_score">
                      Ishihara test score
                    </Label>
                    <Input
                      id="find_ishihara_score"
                      className="h-8 text-xs max-w-xs"
                      {...form.register('find_ishihara_score')}
                      placeholder="e.g. 12/14"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Dental</CardTitle>
                  <CardDescription className="text-xs">Dental examination notes.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="dental_missing_teeth">
                        Missing teeth
                      </Label>
                      <Textarea
                        id="dental_missing_teeth"
                        className="min-h-[56px] text-xs resize-y"
                        {...form.register('dental_missing_teeth')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="dental_canes">
                        Canes
                      </Label>
                      <Textarea
                        id="dental_canes"
                        className="min-h-[56px] text-xs resize-y"
                        {...form.register('dental_canes')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="dental_replaced">
                        Replaced
                      </Label>
                      <Textarea
                        id="dental_replaced"
                        className="min-h-[56px] text-xs resize-y"
                        {...form.register('dental_replaced')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="dental_jacket_crown">
                        Jacket, Crown
                      </Label>
                      <Textarea
                        id="dental_jacket_crown"
                        className="min-h-[56px] text-xs resize-y"
                        {...form.register('dental_jacket_crown')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="sm" className="h-8" disabled={saving}>
                {saving ? 'Saving…' : 'Save section'}
              </Button>
              {physicalExamSavedAt ? (
                <p className="text-xs text-muted-foreground pt-2" role="status">
                  Last saved at {formatSavedAt(physicalExamSavedAt)}.
                </p>
              ) : null}
            </form>
          </TabsContent>

          <TabsContent value="ob" className="mt-4">
            <form onSubmit={onSaveLab} className="space-y-3">
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Hematology</CardTitle>
                  <CardDescription className="text-xs">
                    Enter results; reference ranges are shown below each field for quick comparison.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LAB_HEM_FIELDS.map(({ name, label, reference }) => (
                      <div key={name} className="space-y-1">
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        <p className="text-[11px] text-muted-foreground leading-snug">Reference: {reference}</p>
                        <Input id={name} className="h-8 text-xs" {...labForm.register(name)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Urinalysis</CardTitle>
                  <CardDescription className="text-xs">Routine urine examination.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LAB_UA_FIELDS.map(({ name, label, multiline }) => (
                      <div key={name} className={`space-y-1 ${multiline ? 'sm:col-span-2' : ''}`}>
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        {multiline ? (
                          <Textarea
                            id={name}
                            className="min-h-[56px] text-xs resize-y"
                            {...labForm.register(name)}
                          />
                        ) : (
                          <Input id={name} className="h-8 text-xs" {...labForm.register(name)} />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Stool examination</CardTitle>
                  <CardDescription className="text-xs">Macroscopic stool findings.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LAB_STOOL_FIELDS.map(({ name, label, multiline }) => (
                      <div key={name} className={`space-y-1 ${multiline ? 'sm:col-span-2' : ''}`}>
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        {multiline ? (
                          <Textarea
                            id={name}
                            className="min-h-[56px] text-xs resize-y"
                            {...labForm.register(name)}
                          />
                        ) : (
                          <Input id={name} className="h-8 text-xs" {...labForm.register(name)} />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Chest PA</CardTitle>
                  <CardDescription className="text-xs">Posteroanterior chest radiograph.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {LAB_CHEST_PA_FIELDS.map(({ name, label, multiline }) => (
                      <div key={name} className="space-y-1">
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        <Textarea
                          id={name}
                          className="min-h-[72px] text-xs resize-y"
                          {...labForm.register(name)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">ECG</CardTitle>
                  <CardDescription className="text-xs">Electrocardiogram.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LAB_ECG_FIELDS.map(({ name, label, multiline }) => (
                      <div key={name} className={`space-y-1 ${multiline ? 'sm:col-span-2' : ''}`}>
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        {multiline ? (
                          <Textarea
                            id={name}
                            className="min-h-[72px] text-xs resize-y"
                            {...labForm.register(name)}
                          />
                        ) : (
                          <Input id={name} className="h-8 text-xs" {...labForm.register(name)} />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Pap smear</CardTitle>
                  <CardDescription className="text-xs">Cervical cytology report.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {LAB_PAP_FIELDS.map(({ name, label }) => (
                      <div key={name} className="space-y-1">
                        <Label className="text-xs" htmlFor={name}>
                          {label}
                        </Label>
                        <Textarea
                          id={name}
                          className="min-h-[72px] text-xs resize-y"
                          {...labForm.register(name)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="sm" className="h-8" disabled={savingLab}>
                {savingLab ? 'Saving…' : 'Save section'}
              </Button>
              {laboratorySavedAt ? (
                <p className="text-xs text-muted-foreground pt-2" role="status">
                  Last saved at {formatSavedAt(laboratorySavedAt)}.
                </p>
              ) : null}
            </form>
          </TabsContent>
        </Tabs>
      </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, User, ClipboardList } from 'lucide-react';
import { xrayReportSchema, type XrayReportFormData } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DIAGNOSTIC_IMAGING_OPTIONS = [
  'Chest PA',
  'Chest AP',
  'Chest Lateral',
  'Hand',
  'Wrist',
  'Elbow',
  'Shoulder',
  'Lumbar Spine',
  'Cervical Spine',
  'Thoracic Spine',
  'Pelvis',
  'Knee',
  'Ankle',
  'Foot',
  'Skull',
  'Abdomen',
  'Other',
];

interface XrayReportFormProps {
  visitId?: string | null;
  patientId?: string | null;
  initialPatient?: { name: string; date_of_birth: string; gender: string };
  onSuccess?: () => void;
}

function getAge(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function XrayReportForm({ visitId, patientId, initialPatient, onSuccess }: XrayReportFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<XrayReportFormData>>({
    reportDate: today,
    companyAffiliation: '',
    requestingPhysician: '',
    radiologicTechnologist: '',
    radiologist: '',
    patientName: initialPatient?.name ?? '',
    dateOfBirth: initialPatient?.date_of_birth ?? '',
    age: initialPatient?.date_of_birth ? getAge(initialPatient.date_of_birth) : undefined,
    sex: (initialPatient?.gender === 'male' || initialPatient?.gender === 'female' ? initialPatient.gender : '') as 'male' | 'female' | '',
    firstDayLastMenstruation: '',
    indicationHistory: '',
    diagnosticImagingRequest: '',
    findings: '',
    impression: '',
  });

  useEffect(() => {
    if (initialPatient) {
      setFormData((prev) => ({
        ...prev,
        patientName: initialPatient.name,
        dateOfBirth: initialPatient.date_of_birth,
        age: getAge(initialPatient.date_of_birth),
        sex: (initialPatient.gender === 'male' || initialPatient.gender === 'female' ? initialPatient.gender : prev.sex) as 'male' | 'female' | '',
      }));
    }
  }, [initialPatient]);

  const handleDobChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: value,
      age: value ? getAge(value) : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      reportDate: formData.reportDate ?? today,
      companyAffiliation: formData.companyAffiliation || null,
      requestingPhysician: formData.requestingPhysician ?? '',
      radiologicTechnologist: formData.radiologicTechnologist ?? '',
      radiologist: formData.radiologist ?? '',
      patientName: formData.patientName ?? '',
      dateOfBirth: formData.dateOfBirth ?? '',
      age: formData.age ?? null,
      sex: formData.sex as 'male' | 'female',
      firstDayLastMenstruation: formData.firstDayLastMenstruation || null,
      indicationHistory: formData.indicationHistory ?? '',
      diagnosticImagingRequest: formData.diagnosticImagingRequest ?? '',
      findings: formData.findings ?? '',
      impression: formData.impression ?? '',
    };

    const result = xrayReportSchema.safeParse(payload);
    if (!result.success) {
      const first = result.error.errors[0];
      toast({ title: 'Validation Error', description: first.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('xray_reports').insert({
        report_date: result.data.reportDate,
        company_affiliation: result.data.companyAffiliation || null,
        requesting_physician: result.data.requestingPhysician,
        radiologic_technologist: result.data.radiologicTechnologist,
        radiologist: result.data.radiologist,
        patient_name: result.data.patientName,
        date_of_birth: result.data.dateOfBirth,
        age: result.data.age,
        sex: result.data.sex,
        first_day_last_menstruation: result.data.firstDayLastMenstruation || null,
        indication_history: result.data.indicationHistory,
        diagnostic_imaging_request: result.data.diagnosticImagingRequest,
        findings: result.data.findings,
        impression: result.data.impression,
        visit_id: visitId || null,
        patient_id: patientId || null,
        recorded_by: user?.id ?? null,
      });

      if (error) throw error;

      toast({ title: 'X-Ray Report Saved', description: 'The report has been recorded successfully.' });
      setFormData({
        reportDate: today,
        companyAffiliation: '',
        requestingPhysician: '',
        radiologicTechnologist: '',
        radiologist: '',
        patientName: '',
        dateOfBirth: '',
        age: undefined,
        sex: '',
        firstDayLastMenstruation: '',
        indicationHistory: '',
        diagnosticImagingRequest: '',
        findings: '',
        impression: '',
      });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
        <div className="space-y-6 pb-8">
          {/* 1. Administrative & Identification */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-primary" />
              Administrative & Identification Information
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ensures the record is filed correctly and identifies who is involved in the procedure.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportDate">Date</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, reportDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyAffiliation">Company Affiliation</Label>
                <Input
                  id="companyAffiliation"
                  value={formData.companyAffiliation ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, companyAffiliation: e.target.value }))}
                  placeholder="Employer or organization (e.g., for APE)"
                />
              </div>
              <div>
                <Label htmlFor="requestingPhysician">Requesting Physician</Label>
                <Input
                  id="requestingPhysician"
                  value={formData.requestingPhysician ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, requestingPhysician: e.target.value }))}
                  placeholder="Doctor who ordered the test"
                  required
                />
              </div>
              <div>
                <Label htmlFor="radiologicTechnologist">Radiologic Technologist</Label>
                <Input
                  id="radiologicTechnologist"
                  value={formData.radiologicTechnologist ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, radiologicTechnologist: e.target.value }))}
                  placeholder="Professional who operated the X-ray machine"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="radiologist">Radiologist</Label>
                <Input
                  id="radiologist"
                  value={formData.radiologist ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, radiologist: e.target.value }))}
                  placeholder="Doctor who interprets the image"
                  required
                />
              </div>
            </div>
          </Card>

          <Separator />

          {/* 2. Patient Demographics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              Patient Demographics
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verifies patient identity and provides context for physical findings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientName">Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, patientName: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth ?? ''}
                  onChange={(e) => handleDobChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={150}
                  value={formData.age ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                  placeholder="Auto-calculated from DOB"
                />
              </div>
              <div>
                <Label>Sex</Label>
                <RadioGroup
                  value={formData.sex ?? ''}
                  onValueChange={(v) => setFormData((p) => ({ ...p, sex: v as 'male' | 'female' }))}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="sex-male" />
                    <Label htmlFor="sex-male" className="font-normal cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="sex-female" />
                    <Label htmlFor="sex-female" className="font-normal cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
              </div>
              {formData.sex === 'female' && (
                <div className="md:col-span-2">
                  <Label htmlFor="firstDayLastMenstruation">1st Day of Last Menstruation</Label>
                  <Input
                    id="firstDayLastMenstruation"
                    type="date"
                    value={formData.firstDayLastMenstruation ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, firstDayLastMenstruation: e.target.value }))}
                    className="mt-1"
                    required={formData.sex === 'female'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Critical safety field to screen for potential pregnancy (radiation may affect a fetus).
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Separator />

          {/* 3. Clinical Context & Results */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Clinical Context & Results
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Helps the radiologist know what to look for and records their expert opinion.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="indicationHistory">Indication / History</Label>
                <Textarea
                  id="indicationHistory"
                  value={formData.indicationHistory ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, indicationHistory: e.target.value }))}
                  placeholder="e.g., persistent cough, chest pain, routine physical"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="diagnosticImagingRequest">Diagnostic Imaging Request</Label>
                <select
                  id="diagnosticImagingRequest"
                  value={formData.diagnosticImagingRequest ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, diagnosticImagingRequest: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select body part / study type</option>
                  {DIAGNOSTIC_IMAGING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="findings">Findings</Label>
                <Textarea
                  id="findings"
                  value={formData.findings ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, findings: e.target.value }))}
                  placeholder="Detailed technical description of what the radiologist sees (e.g., lung condition, heart size, bone structure)"
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="impression">Impression</Label>
                <Textarea
                  id="impression"
                  value={formData.impression ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, impression: e.target.value }))}
                  placeholder="Summary or final diagnosis based on the findings"
                  rows={4}
                  required
                />
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save X-Ray Report'}
        </Button>
      </div>
    </form>
  );
}

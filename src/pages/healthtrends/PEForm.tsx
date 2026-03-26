import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HealthTrendsLayout } from '@/components/healthtrends/HealthTrendsLayout';
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
import { peReviewOfSystemsSchema, type PeReviewOfSystemsFormData } from '@/lib/healthtrends-validation';
import { Construction } from 'lucide-react';

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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    },
  });

  useEffect(() => {
    if (!authLoading && (!user || !canAccess)) navigate('/');
  }, [user, authLoading, canAccess, navigate]);

  useEffect(() => {
    if (!examCode || !user || !canAccess) return;

    (async () => {
      setLoading(true);
      const { data: emp, error: e1 } = await supabase.from('ape_employees').select('*').eq('exam_code', examCode).maybeSingle();
      if (e1 || !emp) {
        toast({ title: 'Not found', description: 'Invalid exam code.', variant: 'destructive' });
        navigate('/healthtrends/pe-encoding');
        setLoading(false);
        return;
      }
      setEmployee({
        id: emp.id,
        exam_code: emp.exam_code,
        name: emp.name,
        exam_date: emp.exam_date,
        company_code: emp.company_code,
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
        });
      }
      setLoading(false);
    })();
  }, [examCode, user, canAccess, navigate]);

  const onSaveTab1 = form.handleSubmit(async (values) => {
    if (!employee) return;
    setSaving(true);
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
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'ape_employee_id' }
      );
      if (error) throw error;
      toast({ title: 'Saved', description: 'Present illness / review of systems updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  });

  if (authLoading || loading || !user || !canAccess) {
    return (
      <HealthTrendsLayout>
        <div className="flex justify-center py-20 text-sm text-muted-foreground">Loading…</div>
      </HealthTrendsLayout>
    );
  }

  if (!employee) return null;

  return (
    <HealthTrendsLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Physical examination</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {employee.exam_code} · {employee.name} · Exam date {employee.exam_date} · Co. {employee.company_code}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate('/healthtrends/pe-encoding')}>
            Back to search
          </Button>
        </div>

        <Tabs defaultValue="ros" className="w-full">
          <TabsList className="h-9 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ros" className="text-xs">
              Present illness / ROS
            </TabsTrigger>
            <TabsTrigger value="ob" className="text-xs">
              Obstetrical history
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

              <Button type="submit" size="sm" className="h-8" disabled={saving}>
                {saving ? 'Saving…' : 'Save section'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="ob" className="mt-4">
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-2">
                <Construction className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-sm">Obstetrical history</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  This section is under development. Check back in a future release.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HealthTrendsLayout>
  );
}

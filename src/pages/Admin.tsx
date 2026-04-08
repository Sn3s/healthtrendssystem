import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from '@/components/Modal';
import {
  Users,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Activity,
  ClipboardList,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type ApeEmployee = Database['public']['Tables']['ape_employees']['Row'];
type PeSummary = Pick<
  Database['public']['Tables']['pe_records']['Row'],
  'ape_employee_id' | 'physical_exam_saved_at' | 'laboratory_saved_at'
>;

export default function Admin({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [employees, setEmployees] = useState<ApeEmployee[]>([]);
  const [peRows, setPeRows] = useState<PeSummary[]>([]);
  const [companies, setCompanies] = useState<{ company_code: string; name: string }[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!userRoles.includes('admin')) navigate('/');
      else loadData();
    }
  }, [user, authLoading, userRoles, navigate]);

  const loadData = async () => {
    try {
      const [empRes, peRes, coRes, patientsRes, visitsRes] = await Promise.all([
        supabase.from('ape_employees').select('id, company_code, employee_number, exam_code, exam_date, name, age, gender').order('exam_date', { ascending: false }),
        supabase.from('pe_records').select('ape_employee_id, physical_exam_saved_at, laboratory_saved_at'),
        supabase.from('ape_companies').select('company_code, name'),
        supabase.from('patients').select('*'),
        supabase.from('visits').select('*'),
      ]);

      if (empRes.error) throw empRes.error;
      if (peRes.error) throw peRes.error;
      if (coRes.error) throw coRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (visitsRes.error) throw visitsRes.error;

      setEmployees(empRes.data || []);
      setPeRows(peRes.data || []);
      setCompanies(coRes.data || []);
      setPatients(patientsRes.data || []);
      setVisits(visitsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const peByEmployee = useMemo(() => {
    const m = new Map<string, PeSummary>();
    for (const r of peRows) {
      m.set(r.ape_employee_id, r);
    }
    return m;
  }, [peRows]);

  const peStats = useMemo(() => {
    const total = employees.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    for (const e of employees) {
      const pe = peByEmployee.get(e.id);
      if (!pe) {
        notStarted++;
        continue;
      }
      if (pe.physical_exam_saved_at && pe.laboratory_saved_at) completed++;
      else inProgress++;
    }
    const pending = notStarted + inProgress;
    return { total, completed, inProgress, notStarted, pending };
  }, [employees, peByEmployee]);

  const companyName = (code: string) => companies.find((c) => c.company_code === code)?.name ?? code;

  const byCompany = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of employees) {
      acc[e.company_code] = (acc[e.company_code] || 0) + 1;
    }
    return Object.entries(acc)
      .map(([code, count]) => ({ code, count, name: companyName(code) }))
      .sort((a, b) => b.count - a.count);
  }, [employees, companies]);

  const handleReset = async () => {
    try {
      await supabase.from('departmental_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('visits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setPatients([]);
      setVisits([]);
      setShowResetModal(false);

      toast({
        title: 'Data reset complete',
        description: 'Legacy patient and visit data has been cleared. APE / PE records were not changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        Loading...
      </div>
    );
  }

  const maxCompanyCount = byCompany[0]?.count ?? 1;

  return (
    <Layout title="Admin · Physical examination" role="admin" embedded={embedded}>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            APE overview
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Counts are based on registered APE examinees and whether both the Physical Examination and Laboratory
            sections have been saved in the PE form.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Users className="h-8 w-8 text-primary shrink-0" />
                <span className="text-3xl font-bold tabular-nums">{peStats.total}</span>
              </div>
              <p className="text-sm font-medium">Total patients</p>
              <p className="text-xs text-muted-foreground mt-1">Registered examinees (APE registry)</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                <span className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {peStats.completed}
                </span>
              </div>
              <p className="text-sm font-medium">Completed visits</p>
              <p className="text-xs text-muted-foreground mt-1">Physical + laboratory sections both saved</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Clock className="h-8 w-8 text-amber-500 shrink-0" />
                <span className="text-3xl font-bold tabular-nums">{peStats.pending}</span>
              </div>
              <p className="text-sm font-medium">Pending</p>
              <p className="text-xs text-muted-foreground mt-1">Not yet fully documented (no PE or partial)</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <ClipboardList className="h-8 w-8 text-blue-600 shrink-0" />
                <span className="text-3xl font-bold tabular-nums text-blue-700 dark:text-blue-400">
                  {peStats.inProgress}
                </span>
              </div>
              <p className="text-sm font-medium">In progress</p>
              <p className="text-xs text-muted-foreground mt-1">PE record exists; one section still missing</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Pending breakdown
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-muted-foreground">Not started</span>
                  <span className="font-semibold tabular-nums">{peStats.notStarted}</span>
                </div>
                <p className="text-xs text-muted-foreground">No PE record saved yet for this examinee.</p>
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-muted-foreground">Partially complete</span>
                  <span className="font-semibold tabular-nums">{peStats.inProgress}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  PE record exists but physical exam or laboratory section still needs to be saved.
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Examinees by company
              </h3>
              {byCompany.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No registered examinees yet.</p>
              ) : (
                <div className="space-y-3">
                  {byCompany.map(({ code, name, count }) => (
                    <div key={code} className="space-y-1">
                      <div className="flex justify-between text-sm gap-2">
                        <span className="font-medium truncate" title={`${name} (${code})`}>
                          {name}
                          <span className="text-muted-foreground font-normal ml-1">({code})</span>
                        </span>
                        <span className="text-muted-foreground tabular-nums shrink-0">{count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(count / maxCompanyCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">System management</h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">APE / physical examination data</strong> (companies, employees,
                  and <code className="text-xs bg-muted px-1 rounded">pe_records</code>) is not removed by the action
                  below. Use the PE encoding workspace to manage examinees.
                </p>
              </div>
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Danger zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear legacy <strong>patients</strong> and <strong>visits</strong> tables (and departmental logs).
                  This does not affect APE registry or PE forms.
                </p>
                <Button variant="destructive" onClick={() => setShowResetModal(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear legacy patient data
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm data reset"
        onConfirm={handleReset}
        confirmText="Clear legacy data"
        variant="danger"
      >
        <p>This will permanently delete:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>{patients.length} patients (legacy table)</li>
          <li>{visits.length} visits (legacy table)</li>
          <li>Departmental logs linked to those workflows</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          APE employees and PE records are <strong>not</strong> deleted.
        </p>
        <p className="mt-2 font-semibold text-destructive">This cannot be undone.</p>
      </Modal>
    </Layout>
  );
}

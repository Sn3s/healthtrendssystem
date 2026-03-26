import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HealthTrendsLayout } from '@/components/healthtrends/HealthTrendsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { apeCompanySchema, apeEmployeeRowSchema, bulkImportSchema } from '@/lib/healthtrends-validation';
import type { ApeEmployeeRow } from '@/lib/healthtrends-validation';
import { Plus, Trash2, Building2, Upload, Users, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type RegistryEmployee = {
  id: string;
  company_code: string;
  employee_number: number;
  exam_code: string;
  exam_date: string;
  name: string;
  address: string;
  contact_number: string;
  age: number;
  gender: string;
};

const emptyRow = (): ApeEmployeeRow => ({
  name: '',
  address: '',
  contact_number: '',
  age: 0,
  gender: 'male',
});

export default function HealthTrendsDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [companies, setCompanies] = useState<{ company_code: string; name: string }[]>([]);
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<ApeEmployeeRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<RegistryEmployee[]>([]);

  const canAccess = userRoles.includes('encoder') || userRoles.includes('admin');

  useEffect(() => {
    if (!authLoading && (!user || !canAccess)) navigate('/');
  }, [user, authLoading, canAccess, navigate]);

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('ape_companies').select('company_code, name').order('company_code');
    if (error) {
      toast({ title: 'Could not load companies', description: error.message, variant: 'destructive' });
      return;
    }
    setCompanies(data ?? []);
  };

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('ape_employees')
      .select('id, company_code, employee_number, exam_code, exam_date, name, address, contact_number, age, gender')
      .order('company_code', { ascending: true })
      .order('employee_number', { ascending: true });
    if (error) {
      toast({ title: 'Could not load employees', description: error.message, variant: 'destructive' });
      return;
    }
    setEmployees((data ?? []) as RegistryEmployee[]);
  };

  const refreshRegistry = async () => {
    await Promise.all([loadCompanies(), loadEmployees()]);
  };

  useEffect(() => {
    if (user && canAccess) refreshRegistry();
  }, [user, canAccess]);

  const addCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = apeCompanySchema.safeParse({ company_code: companyCode.trim(), name: companyName.trim() });
    if (!parsed.success) {
      toast({ title: 'Validation', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('ape_companies').insert({
      company_code: parsed.data.company_code,
      name: parsed.data.name,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Company added', description: `${parsed.data.company_code} — ${parsed.data.name}` });
    setCompanyCode('');
    setCompanyName('');
    refreshRegistry();
  };

  const updateRow = (i: number, patch: Partial<ApeEmployeeRow>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const registerBulk = async () => {
    const parsedBulk = bulkImportSchema.safeParse({
      company_code: selectedCompany,
      exam_date: examDate,
      rows,
    });
    if (!parsedBulk.success) {
      toast({ title: 'Validation', description: parsedBulk.error.errors[0].message, variant: 'destructive' });
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const r = apeEmployeeRowSchema.safeParse(rows[i]);
      if (!r.success) {
        toast({ title: `Row ${i + 1}`, description: r.error.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    try {
      const { data: maxRow } = await supabase
        .from('ape_employees')
        .select('employee_number')
        .eq('company_code', selectedCompany)
        .order('employee_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      let next = (maxRow?.employee_number ?? 0) + 1;
      const inserts = rows.map((row) => {
        const empNum = next++;
        const exam_code = `${selectedCompany}-${String(empNum).padStart(3, '0')}`;
        return {
          company_code: selectedCompany,
          employee_number: empNum,
          exam_code,
          exam_date: examDate,
          name: row.name.trim(),
          address: row.address.trim(),
          contact_number: row.contact_number.trim(),
          age: row.age,
          gender: row.gender,
          created_by: user?.id ?? null,
        };
      });

      const { error } = await supabase.from('ape_employees').insert(inserts);
      if (error) throw error;

      toast({
        title: 'Employees registered',
        description: `${inserts.length} record(s). Exam codes: ${inserts.map((i) => i.exam_code).join(', ')}`,
      });
      setRows([emptyRow()]);
      refreshRegistry();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || !canAccess) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <HealthTrendsLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Bulk import employee lists for annual physical exams (APE).</p>
        </div>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Registered companies
            </CardTitle>
            <CardDescription className="text-xs">All companies in the system. Add new ones below the table.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <ScrollArea className="h-[min(240px,40vh)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs h-9 w-28">Company ID</TableHead>
                    <TableHead className="text-xs h-9">Company name</TableHead>
                    <TableHead className="text-xs h-9 w-24 text-right">Employees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-muted-foreground py-6 text-center">
                        No companies yet. Add one using the form below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((c) => {
                      const count = employees.filter((e) => e.company_code === c.company_code).length;
                      return (
                        <TableRow key={c.company_code}>
                          <TableCell className="font-mono text-xs py-1.5">{c.company_code}</TableCell>
                          <TableCell className="text-xs py-1.5">{c.name}</TableCell>
                          <TableCell className="text-xs py-1.5 text-right tabular-nums">{count}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            <form onSubmit={addCompany} className="flex flex-wrap gap-2 items-end border-t pt-4">
              <div className="space-y-1">
                <Label className="text-xs">Company ID</Label>
                <Input
                  className="h-8 w-24 text-sm"
                  placeholder="001"
                  maxLength={3}
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs">Company name</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" className="h-8">
                Add company
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              All employees
            </CardTitle>
            <CardDescription className="text-xs">
              Registered employees with exam codes. Open PE encoding from a row.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <ScrollArea className="h-[min(420px,55vh)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs h-9 whitespace-nowrap">Exam code</TableHead>
                    <TableHead className="text-xs h-9 whitespace-nowrap">Exam date</TableHead>
                    <TableHead className="text-xs h-9 whitespace-nowrap">Co.</TableHead>
                    <TableHead className="text-xs h-9 min-w-[120px]">Company</TableHead>
                    <TableHead className="text-xs h-9 min-w-[140px]">Name</TableHead>
                    <TableHead className="text-xs h-9 min-w-[160px]">Address</TableHead>
                    <TableHead className="text-xs h-9 whitespace-nowrap">Contact</TableHead>
                    <TableHead className="text-xs h-9 w-12">Age</TableHead>
                    <TableHead className="text-xs h-9 w-20">Gender</TableHead>
                    <TableHead className="text-xs h-9 w-16">PE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-xs text-muted-foreground py-8 text-center">
                        No employees registered yet. Use bulk import below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((e) => {
                      const co = companies.find((c) => c.company_code === e.company_code);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs py-1.5 whitespace-nowrap">{e.exam_code}</TableCell>
                          <TableCell className="text-xs py-1.5 whitespace-nowrap">{e.exam_date}</TableCell>
                          <TableCell className="font-mono text-xs py-1.5 whitespace-nowrap">{e.company_code}</TableCell>
                          <TableCell className="text-xs py-1.5 max-w-[160px] truncate" title={co?.name}>
                            {co?.name ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs py-1.5">{e.name}</TableCell>
                          <TableCell className="text-xs py-1.5 text-muted-foreground max-w-[200px] truncate" title={e.address}>
                            {e.address || '—'}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 whitespace-nowrap">{e.contact_number || '—'}</TableCell>
                          <TableCell className="text-xs py-1.5 tabular-nums">{e.age}</TableCell>
                          <TableCell className="text-xs py-1.5 capitalize">{e.gender}</TableCell>
                          <TableCell className="py-1 px-1">
                            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs" asChild>
                              <Link to={`/healthtrends/pe/${encodeURIComponent(e.exam_code)}`}>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Employee list (table import)
            </CardTitle>
            <CardDescription className="text-xs">
              Add rows like a spreadsheet. Unique exam code{' '}
              <code className="text-xs bg-muted px-1 rounded">{'{company_id}-{employee_number}'}</code> and exam date are
              generated on save.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 min-w-[160px]">
                <Label className="text-xs">Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.company_code} value={c.company_code}>
                        {c.company_code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Exam date (all rows)</Label>
                <Input type="date" className="h-8 text-sm w-40" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-xs h-8 py-1">#</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[140px]">Name</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[160px]">Address</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[100px]">Contact</TableHead>
                    <TableHead className="text-xs h-8 py-1 w-16">Age</TableHead>
                    <TableHead className="text-xs h-8 py-1 w-28">Gender</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/50">
                      <TableCell className="text-xs text-muted-foreground py-1">{i + 1}</TableCell>
                      <TableCell className="py-1 px-1">
                        <Input
                          className="h-7 text-xs"
                          value={row.name}
                          onChange={(e) => updateRow(i, { name: e.target.value })}
                          placeholder="Full name"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-1">
                        <Input
                          className="h-7 text-xs"
                          value={row.address}
                          onChange={(e) => updateRow(i, { address: e.target.value })}
                          placeholder="Address"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-1">
                        <Input
                          className="h-7 text-xs"
                          value={row.contact_number}
                          onChange={(e) => updateRow(i, { contact_number: e.target.value })}
                          placeholder="Phone"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-1">
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          min={0}
                          max={150}
                          value={row.age || ''}
                          onChange={(e) => updateRow(i, { age: parseInt(e.target.value, 10) || 0 })}
                        />
                      </TableCell>
                      <TableCell className="py-1 px-1">
                        <Select value={row.gender} onValueChange={(v) => updateRow(i, { gender: v as ApeEmployeeRow['gender'] })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1 px-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={rows.length <= 1}
                          onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add row
              </Button>
              <Button size="sm" className="h-8" disabled={saving || !selectedCompany} onClick={registerBulk}>
                {saving ? 'Saving…' : 'Generate exam codes & register'}
              </Button>
            </div>
            {selectedCompany && (
              <p className="text-xs text-muted-foreground">
                Preview format: <strong>{selectedCompany}-XXX</strong> (employee numbers assigned sequentially per company).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </HealthTrendsLayout>
  );
}

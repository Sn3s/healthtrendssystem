import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  apeCompanySchema,
  apeEmployeeRowSchema,
  bulkImportSchema,
  placeholderEmployeeEmail,
} from '@/lib/healthtrends-validation';
import type { ApeEmployeeRow } from '@/lib/healthtrends-validation';
import { Plus, Trash2, Building2, Upload, Users, FileDown } from 'lucide-react';
import { employeeCsvTemplate, parseEmployeeCsv } from '@/lib/parseEmployeeCsv';

type RegistryEmployee = {
  id: string;
  company_code: string;
  employee_number: number;
  exam_code: string;
  exam_date: string;
  name: string;
  address: string;
  contact_number: string;
  email: string;
  age: number;
  gender: string;
};

const emptyRow = (): ApeEmployeeRow => ({
  name: '',
  address: '',
  contact_number: '',
  email: '',
  age: 0,
  gender: 'male',
});

export default function HealthTrendsDashboard({ embedded = false }: { embedded?: boolean }) {
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
  /** `all` = no filter; otherwise `company_code`. Add more filter values here when extending. */
  const [employeeCompanyFilter, setEmployeeCompanyFilter] = useState<string>('all');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canAccess = userRoles.includes('encoder') || userRoles.includes('admin');

  /** Dropdown options: extend this shape (e.g. date ranges) without changing the Select wiring. */
  const employeeFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All companies' },
      ...companies.map((c) => ({
        value: c.company_code,
        label: `${c.company_code} — ${c.name}`,
      })),
    ];
  }, [companies]);

  const filteredEmployees = useMemo(() => {
    if (employeeCompanyFilter === 'all') return employees;
    return employees.filter((e) => e.company_code === employeeCompanyFilter);
  }, [employees, employeeCompanyFilter]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!embedded && !canAccess) navigate('/');
    }
  }, [user, authLoading, canAccess, navigate, embedded]);

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('ape_companies').select('company_code, name').order('company_code');
    if (error) {
      toast({ title: 'Could not load companies', description: error.message, variant: 'destructive' });
      return;
    }
    setCompanies(data ?? []);
  };

  const loadEmployees = async () => {
    // Use * so this works before the `email` migration is applied (Postgres errors if you SELECT a missing column).
    const { data, error } = await supabase
      .from('ape_employees')
      .select('*')
      .order('company_code', { ascending: true })
      .order('employee_number', { ascending: true });
    if (error) {
      toast({ title: 'Could not load employees', description: error.message, variant: 'destructive' });
      return;
    }
    setEmployees(
      (data ?? []).map((e) => {
        const row = e as RegistryEmployee & { email?: string | null };
        return {
          id: row.id,
          company_code: row.company_code,
          employee_number: row.employee_number,
          exam_code: row.exam_code,
          exam_date: row.exam_date,
          name: row.name,
          address: row.address,
          contact_number: row.contact_number,
          email: row.email?.trim() ?? '',
          age: row.age,
          gender: row.gender,
        };
      }),
    );
  };

  const refreshRegistry = async () => {
    await Promise.all([loadCompanies(), loadEmployees()]);
  };

  useEffect(() => {
    if (user && canAccess) refreshRegistry();
  }, [user, canAccess]);

  useEffect(() => {
    if (employeeCompanyFilter === 'all') return;
    if (!companies.some((c) => c.company_code === employeeCompanyFilter)) {
      setEmployeeCompanyFilter('all');
    }
  }, [companies, employeeCompanyFilter]);

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

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast({ title: 'Please choose a CSV file', variant: 'destructive' });
      return;
    }
    try {
      const text = await file.text();
      const { rows: parsed, skipped } = parseEmployeeCsv(text);
      if (parsed.length === 0) {
        const hint = skipped
          .slice(0, 6)
          .map((s) => `Line ${s.line}: ${s.reason}`)
          .join('\n');
        toast({
          title: 'No valid employee rows',
          description: hint || 'Check column order or use the template.',
          variant: 'destructive',
        });
        return;
      }
      setRows(parsed);
      toast({
        title: 'CSV loaded',
        description: `Imported ${parsed.length} employee row(s).${skipped.length ? ` ${skipped.length} row(s) skipped.` : ''}`,
      });
      if (skipped.length) {
        toast({
          title: 'Some rows were skipped',
          description: skipped
            .slice(0, 10)
            .map((s) => `Line ${s.line}: ${s.reason}`)
            .join(' · '),
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Could not read file',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([employeeCsvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ape-employees-template.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          email: row.email.trim() || placeholderEmployeeEmail(row.name, `${selectedCompany}-${empNum}`),
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
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        Loading…
      </div>
    );
  }

  const body = (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Bulk import employee lists for annual physical exams (APE).</p>
        </div>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              All employees
            </CardTitle>
            <CardDescription className="text-xs">
              Registered employees with exam codes. Filter by company, then click a row (or press Enter when focused) to open the
              physical exam form.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 max-w-md">
              <Label htmlFor="employee-company-filter" className="text-xs shrink-0">
                Company
              </Label>
              <Select value={employeeCompanyFilter} onValueChange={setEmployeeCompanyFilter}>
                <SelectTrigger id="employee-company-filter" className="h-9 text-sm w-full sm:min-w-[280px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  {employeeFilterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[min(420px,55vh)] overflow-auto rounded-md border">
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
                    <TableHead className="text-xs h-9 min-w-[180px]">Email</TableHead>
                    <TableHead className="text-xs h-9 w-12">Age</TableHead>
                    <TableHead className="text-xs h-9 w-20">Gender</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-xs text-muted-foreground py-8 text-center">
                        No employees registered yet. Use bulk import below.
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-xs text-muted-foreground py-8 text-center">
                        No employees for this company. Change the filter above or register employees for this company.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((e) => {
                      const co = companies.find((c) => c.company_code === e.company_code);
                      const openPe = () => navigate(`/pe/${encodeURIComponent(e.exam_code)}`);
                      return (
                        <TableRow
                          key={e.id}
                          tabIndex={0}
                          className="cursor-pointer hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          aria-label={`Open physical exam for ${e.name}, ${e.exam_code}`}
                          onClick={openPe}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              openPe();
                            }
                          }}
                        >
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
                          <TableCell className="text-xs py-1.5 text-muted-foreground max-w-[200px] truncate" title={e.email}>
                            {e.email || '—'}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 tabular-nums">{e.age}</TableCell>
                          <TableCell className="text-xs py-1.5 capitalize">{e.gender}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Registered companies
            </CardTitle>
            <CardDescription className="text-xs">All companies in the system. Add new ones below the table.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <div className="max-h-[min(240px,40vh)] overflow-auto rounded-md border">
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
            </div>
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
              <Upload className="h-4 w-4" />
              Employee list (table import)
            </CardTitle>
            <CardDescription className="text-xs">
              Add rows below, or upload a CSV. Unique exam code{' '}
              <code className="text-xs bg-muted px-1 rounded">{'{company_id}-{employee_number}'}</code> and exam date are
              set from the fields above when you save.
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

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                className="hidden"
                aria-label="Upload employee CSV"
                onChange={handleCsvFile}
              />
              <Button type="button" variant="secondary" size="sm" className="h-8" onClick={() => csvInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload CSV
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={downloadCsvTemplate}>
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                Download template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV with header row: <code className="bg-muted px-1 rounded">name</code>,{' '}
              <code className="bg-muted px-1 rounded">address</code>, <code className="bg-muted px-1 rounded">contact_number</code>,{' '}
              <code className="bg-muted px-1 rounded">email</code>, <code className="bg-muted px-1 rounded">age</code>,{' '}
              <code className="bg-muted px-1 rounded">gender</code>. Or six columns in that order without a header (legacy five-column
              files without <code className="bg-muted px-1 rounded">email</code> still work; a placeholder is filled on save). Gender:
              male, female, other (or m/f/o).
            </p>

            <div className="max-h-[min(360px,50vh)] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-xs h-8 py-1">#</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[140px]">Name</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[160px]">Address</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[100px]">Contact</TableHead>
                    <TableHead className="text-xs h-8 py-1 min-w-[160px]">Email</TableHead>
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
                          className="h-7 text-xs"
                          type="email"
                          value={row.email}
                          onChange={(e) => updateRow(i, { email: e.target.value })}
                          placeholder="name@example.com"
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
  );

  if (embedded) return body;

  return <HealthTrendsLayout>{body}</HealthTrendsLayout>;
}

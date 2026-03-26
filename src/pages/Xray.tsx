import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { XrayReportForm } from '@/components/xray/XrayReportForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Plus } from 'lucide-react';

export default function Xray() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [showForm, setShowForm] = useState(true);
  const state = location.state as { visit?: any; patient?: any; prefill?: { name: string; date_of_birth: string; gender: string } } | null;
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; date_of_birth: string; gender: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; date_of_birth: string; gender: string } | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const canAccess = userRoles.includes('encoder') || userRoles.includes('doctor') || userRoles.includes('admin');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canAccess) {
        navigate('/');
      } else {
        loadRecentReports();
      }
    }
  }, [user, authLoading, canAccess, navigate]);

  useEffect(() => {
    if (state?.patient) {
      setSelectedPatient({ id: state.patient.id, name: state.patient.name, date_of_birth: state.patient.date_of_birth, gender: state.patient.gender });
    }
  }, [state?.patient?.id]);

  const loadRecentReports = async () => {
    const { data } = await supabase
      .from('xray_reports')
      .select('id, control_number, patient_name, report_date, diagnostic_imaging_request')
      .order('created_at', { ascending: false })
      .limit(10);
    setRecentReports(data ?? []);
  };

  const handlePatientSearch = async () => {
    if (!patientSearch.trim()) return;
    const { data } = await supabase
      .from('patients')
      .select('id, name, date_of_birth, gender')
      .or(`name.ilike.%${patientSearch}%,patient_number.ilike.%${patientSearch}%`)
      .limit(5);
    setSearchResults(data ?? []);
  };

  const handleSelectPatient = (p: { id: string; name: string; date_of_birth: string; gender: string }) => {
    setSelectedPatient(p);
    setSearchResults([]);
    setPatientSearch('');
  };

  const handleFormSuccess = () => {
    loadRecentReports();
    setSelectedPatient(null);
  };

  if (authLoading) {
    return <div className="flex justify-center min-h-screen items-center">Loading...</div>;
  }

  return (
    <Layout title="X-Ray Reports" role="encoder">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="flex-1 max-w-md">
            <Label>Link to Patient (optional)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Search by name or patient number"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
              />
              <Button type="button" variant="outline" onClick={handlePatientSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-40 overflow-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSelectPatient(p)}
                  >
                    {p.name} — {p.date_of_birth} ({p.gender})
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Pre-filling:</span>
                <span className="font-medium">{selectedPatient.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                  Clear
                </Button>
              </div>
            )}
          </div>
          <Button
            variant={showForm ? 'secondary' : 'default'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Hide Form' : <><Plus className="h-4 w-4 mr-2" />New X-Ray Report</>}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              New X-Ray Report
            </h3>
            <XrayReportForm
              visitId={state?.visit?.id}
              patientId={selectedPatient?.id ?? state?.patient?.id}
              initialPatient={selectedPatient ? { name: selectedPatient.name, date_of_birth: selectedPatient.date_of_birth, gender: selectedPatient.gender } : state?.prefill}
              onSuccess={handleFormSuccess}
            />
          </Card>
        )}

        {recentReports.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent X-Ray Reports</h3>
            <div className="space-y-2">
              {recentReports.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium">{r.control_number}</span>
                    <span className="text-muted-foreground ml-2">— {r.patient_name}</span>
                    <span className="text-muted-foreground ml-2">({r.diagnostic_imaging_request})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{r.report_date}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

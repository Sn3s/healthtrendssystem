import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FileText, Download, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Patient({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientVisits, setPatientVisits] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!userRoles.includes('patient')) navigate('/');
    }
  }, [user, authLoading, userRoles, navigate]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_number', searchId)
        .single();

      if (patientError) throw patientError;

      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*, departmental_logs(*)')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      setSelectedPatient(patient);
      setPatientVisits(visits || []);
      
      toast({
        title: "Records Found",
        description: `Found ${visits?.length || 0} visit(s) for ${patient.name}`,
      });
    } catch (error: any) {
      setSelectedPatient(null);
      setPatientVisits([]);
      toast({
        title: "Patient Not Found",
        description: "Please check your Patient ID",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (visit: any) => {
    toast({
      title: "PDF Download",
      description: "Generating visit summary PDF...",
    });
  };

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>
        Loading...
      </div>
    );
  }

  return (
    <Layout title="Patient Portal" role="patient" embedded={embedded}>
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            Search Your Records
          </h3>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Patient ID</Label>
              <Input
                placeholder="Enter your Patient ID (e.g., P-100001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} className="mt-6" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>

        {selectedPatient && (
          <>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium mt-1">{selectedPatient.name}</p>
                </div>
                <div>
                  <Label>Patient ID</Label>
                  <p className="text-sm font-medium mt-1">{selectedPatient.patient_number}</p>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <p className="text-sm font-medium mt-1">{selectedPatient.date_of_birth}</p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <p className="text-sm font-medium mt-1 capitalize">{selectedPatient.gender}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Visit History ({patientVisits.length})
              </h3>

              {patientVisits.map(visit => (
                <Card key={visit.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">{visit.department}</h4>
                      <p className="text-sm text-muted-foreground">Visit ID: {visit.visit_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {new Date(visit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      visit.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : visit.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <Label>Chief Complaint</Label>
                    <p className="text-sm mt-1">{visit.chief_complaint}</p>
                  </div>

                  {visit.status === 'completed' && visit.final_diagnosis && (
                    <>
                      <div className="mb-4 p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
                        <Label className="text-accent-foreground">Final Diagnosis</Label>
                        <p className="text-sm mt-2 font-medium">{visit.final_diagnosis}</p>
                      </div>

                      {visit.departmental_logs?.length > 0 && (
                        <div className="mb-4">
                          <Label>Departmental Findings</Label>
                          <div className="space-y-2 mt-2">
                            {visit.departmental_logs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-muted rounded-lg text-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium">{log.department}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-muted-foreground text-xs mb-1">{log.provider_name}</p>
                                <p>{log.findings}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button onClick={() => handleDownloadPDF(visit)} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Summary PDF
                      </Button>
                    </>
                  )}

                  {visit.status !== 'completed' && (
                    <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Results Pending</p>
                        <p className="text-sm text-muted-foreground">
                          Your visit is currently {visit.status}. Results will be available once completed.
                        </p>
                      </div>
                    </div>
                  )}

                  {visit.status !== 'completed' && visit.departmental_logs?.length > 0 && (
                    <div className="mt-4">
                      <Label>Preliminary Findings</Label>
                      <div className="space-y-2 mt-2">
                        {visit.departmental_logs.map((log: any) => (
                          <div key={log.id} className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium">{log.department}</p>
                            <p className="text-muted-foreground text-xs">{log.provider_name}</p>
                            <p className="mt-1">{log.findings}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {patientVisits.length === 0 && (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No visit history found</p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

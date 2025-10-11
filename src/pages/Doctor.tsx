import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/Modal';
import { DEPARTMENTS } from '@/types/hospital';
import { Stethoscope, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Doctor() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEPARTMENTS[0]);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'finding' | 'complete'>('finding');
  const [findings, setFindings] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [providerName, setProviderName] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userRoles.includes('doctor')) {
        navigate('/');
      } else {
        loadUserDepartment();
      }
    }
  }, [user, authLoading, userRoles, navigate]);

  useEffect(() => {
    if (userDepartment) {
      setSelectedDepartment(userDepartment);
      loadData();
    }
  }, [userDepartment]);

  const loadUserDepartment = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('department')
        .eq('user_id', user?.id)
        .eq('role', 'doctor')
        .single();

      if (error) throw error;
      setUserDepartment(data.department);

      // Get provider name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (profile?.full_name) {
        setProviderName(profile.full_name);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    try {
      const [patientsRes, visitsRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase
          .from('visits')
          .select('*, departmental_logs(*)')
          .eq('department', selectedDepartment)
          .in('status', ['pending', 'in-progress'])
          .order('created_at', { ascending: false })
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (visitsRes.error) throw visitsRes.error;

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

  const handleAddFinding = async () => {
    if (!selectedVisit) return;

    try {
      const { error: logError } = await supabase.from('departmental_logs').insert([{
        visit_id: selectedVisit.id,
        department: selectedDepartment,
        provider_name: providerName,
        findings,
        recorded_by: user?.id,
      }]);

      if (logError) throw logError;

      const { error: visitError } = await supabase
        .from('visits')
        .update({ status: 'in-progress' })
        .eq('id', selectedVisit.id);

      if (visitError) throw visitError;

      await loadData();
      setSelectedVisit(null);
      setFindings('');
      setIsModalOpen(false);

      toast({
        title: "Finding Recorded",
        description: "Departmental log has been added",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCompleteVisit = async () => {
    if (!selectedVisit) return;

    try {
      const { error } = await supabase
        .from('visits')
        .update({
          status: 'completed',
          final_diagnosis: finalDiagnosis,
          completed_at: new Date().toISOString(),
        })
        .eq('id', selectedVisit.id);

      if (error) throw error;

      await loadData();
      setSelectedVisit(null);
      setFinalDiagnosis('');
      setIsModalOpen(false);

      toast({
        title: "Visit Completed",
        description: "Patient visit has been finalized",
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout title="Doctor Portal" role="doctor">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-primary" />
              Department Console
            </h3>
            <div className="w-64">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <Label>Provider Name</Label>
            <input
              type="text"
              className="w-full p-2 border border-border rounded-md"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-lg font-semibold">
            Pending Appointments ({visits.length})
          </h3>
          
          {visits.map(visit => {
            const patient = patients.find(p => p.id === visit.patient_id);
            return (
              <Card key={visit.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{patient?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {patient?.patient_number} | Visit ID: {visit.visit_number}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      DOB: {patient?.date_of_birth} | Gender: {patient?.gender}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    visit.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                <div className="mb-4">
                  <Label>Chief Complaint</Label>
                  <p className="text-sm mt-1">{visit.chief_complaint}</p>
                </div>

                {visit.departmental_logs?.length > 0 && (
                  <div className="mb-4">
                    <Label>Previous Findings</Label>
                    <div className="space-y-2 mt-2">
                      {visit.departmental_logs.map((log: any) => (
                        <div key={log.id} className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{log.department}</p>
                          <p className="text-muted-foreground">{log.provider_name}</p>
                          <p className="mt-1">{log.findings}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setModalType('finding');
                      setIsModalOpen(true);
                    }}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Finding
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setModalType('complete');
                      setIsModalOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Visit
                  </Button>
                </div>
              </Card>
            );
          })}

          {visits.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending appointments for this department</p>
            </Card>
          )}
        </div>
      </div>

      {modalType === 'finding' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Departmental Finding"
          onConfirm={handleAddFinding}
          confirmText="Save Finding"
        >
          <div className="space-y-4">
            <div>
              <Label>Department</Label>
              <p className="text-sm font-medium mt-1">{selectedDepartment}</p>
            </div>
            <div>
              <Label>Provider</Label>
              <p className="text-sm font-medium mt-1">{providerName}</p>
            </div>
            <div>
              <Label>Findings</Label>
              <Textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Enter examination findings, test results, or observations..."
                rows={6}
              />
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'complete' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Finalize Diagnosis & Complete Visit"
          onConfirm={handleCompleteVisit}
          confirmText="Complete Visit"
          variant="warning"
        >
          <div className="space-y-4">
            <div>
              <Label>Final Diagnosis</Label>
              <Textarea
                value={finalDiagnosis}
                onChange={(e) => setFinalDiagnosis(e.target.value)}
                placeholder="Enter the final diagnosis..."
                rows={6}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will mark the visit as completed and make results available to the patient.
            </p>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

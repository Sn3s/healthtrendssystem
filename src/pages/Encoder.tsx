import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/Modal';
import { DEPARTMENTS } from '@/types/hospital';
import { Search, UserPlus, ClipboardList, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { patientSchema, visitSchema } from '@/lib/validation';

export default function Encoder() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDOB, setSearchDOB] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'register' | 'assign'>('register');
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    contactNumber: '',
    address: '',
  });
  
  const [visitData, setVisitData] = useState({
    department: '',
    chiefComplaint: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userRoles.includes('encoder')) {
        navigate('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, userRoles, navigate]);

  const loadData = async () => {
    try {
      const [patientsRes, visitsRes] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('visits').select('*, departmental_logs(*)').in('status', ['pending', 'in-progress']).order('created_at', { ascending: false })
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

  const handleSearch = () => {
    let found: any = null;
    
    if (searchTerm.startsWith('P-')) {
      found = patients.find(p => p.patient_number === searchTerm);
    } else if (searchTerm && searchDOB) {
      found = patients.find(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        p.date_of_birth === searchDOB
      );
    }
    
    if (found) {
      setSelectedPatient(found);
      setFormData({
        name: found.name,
        dateOfBirth: found.date_of_birth,
        gender: found.gender,
        contactNumber: found.contact_number,
        address: found.address,
      });
      toast({
        title: "Patient Found",
        description: `${found.name} (${found.patient_number})`,
      });
    } else {
      setSelectedPatient(null);
      toast({
        title: "Patient Not Found",
        description: "Please register as new patient",
        variant: "destructive",
      });
    }
  };

  const handleRegisterPatient = async () => {
    try {
      // Validate input
      const validationResult = patientSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        return;
      }

      const patientNumber = selectedPatient?.patient_number || (await supabase.rpc('generate_patient_number').single()).data;

      const patientData = {
        patient_number: patientNumber,
        name: formData.name,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        contact_number: formData.contactNumber,
        address: formData.address,
        created_by: user?.id,
      };

      if (selectedPatient) {
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', selectedPatient.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('patients')
          .insert([patientData])
          .select()
          .single();

        if (error) throw error;
        setSelectedPatient(data);
      }

      await loadData();
      setIsModalOpen(false);
      
      toast({
        title: selectedPatient ? "Patient Updated" : "Patient Registered",
        description: `${formData.name} (${patientNumber})`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssignVisit = async () => {
    if (!selectedPatient) return;
    
    try {
      // Validate input
      const validationResult = visitSchema.safeParse(visitData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        return;
      }

      const visitNumber = (await supabase.rpc('generate_visit_number').single()).data;

      const { error } = await supabase.from('visits').insert([{
        visit_number: visitNumber,
        patient_id: selectedPatient.id,
        department: visitData.department,
        chief_complaint: visitData.chiefComplaint,
        status: 'pending',
        created_by: user?.id,
      }]);

      if (error) throw error;

      await loadData();
      setVisitData({ department: '', chiefComplaint: '' });
      setIsModalOpen(false);
      
      toast({
        title: "Visit Assigned",
        description: `${visitNumber} - ${visitData.department}`,
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
    <Layout title="Encoder Portal" role="encoder">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            Patient Search
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label>Search by Patient ID or Name</Label>
              <Input
                placeholder="P-100001 or Patient Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Date of Birth (for name search)</Label>
              <Input
                type="date"
                value={searchDOB}
                onChange={(e) => setSearchDOB(e.target.value)}
              />
            </div>
            
            <Button onClick={handleSearch} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search Patient
            </Button>
          </div>

          {selectedPatient && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Selected Patient</h4>
              <p className="text-sm text-muted-foreground">
                {selectedPatient.name} ({selectedPatient.patient_number})
              </p>
              <p className="text-sm text-muted-foreground">
                DOB: {selectedPatient.date_of_birth}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => {
                setModalType('register');
                setIsModalOpen(true);
              }}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {selectedPatient ? 'Update Patient' : 'Register New Patient'}
            </Button>
            
            {selectedPatient && (
              <Button
                onClick={() => {
                  setModalType('assign');
                  setIsModalOpen(true);
                }}
                className="w-full"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Assign Visit
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Active Visits ({visits.length})
          </h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {visits.map(visit => {
              const patient = patients.find(p => p.id === visit.patient_id);
              return (
                <div key={visit.id} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{patient?.name}</p>
                      <p className="text-sm text-muted-foreground">{visit.visit_number}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary">{visit.department}</p>
                  <p className="text-sm text-muted-foreground mt-1">{visit.chief_complaint}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(visit.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {modalType === 'register' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedPatient ? 'Update Patient' : 'Register New Patient'}
          onConfirm={handleRegisterPatient}
          confirmText={selectedPatient ? 'Update' : 'Register'}
        >
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'assign' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Assign New Visit"
          onConfirm={handleAssignVisit}
          confirmText="Assign"
        >
          <div className="space-y-4">
            <div>
              <Label>Department</Label>
              <Select value={visitData.department} onValueChange={(value) => setVisitData({ ...visitData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chief Complaint</Label>
              <Textarea
                value={visitData.chiefComplaint}
                onChange={(e) => setVisitData({ ...visitData, chiefComplaint: e.target.value })}
                placeholder="Describe the patient's main concern..."
              />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/Modal';
import { Patient, Visit, DEPARTMENTS, Gender, VisitStatus } from '@/types/hospital';
import { Search, UserPlus, ClipboardList, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Encoder() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDOB, setSearchDOB] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'register' | 'assign'>('register');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as Gender,
    contactNumber: '',
    address: '',
  });
  
  const [visitData, setVisitData] = useState({
    department: '',
    chiefComplaint: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    const storedVisits = JSON.parse(localStorage.getItem('visits') || '[]');
    setPatients(storedPatients);
    setVisits(storedVisits);
  };

  const generatePatientId = () => {
    const maxId = patients.reduce((max, p) => {
      const num = parseInt(p.id.split('-')[1]);
      return num > max ? num : max;
    }, 100000);
    return `P-${maxId + 1}`;
  };

  const generateVisitId = () => {
    const maxId = visits.reduce((max, v) => {
      const num = parseInt(v.id.split('-')[1]);
      return num > max ? num : max;
    }, 200000);
    return `V-${maxId + 1}`;
  };

  const handleSearch = () => {
    let found: Patient | null = null;
    
    if (searchTerm.startsWith('P-')) {
      found = patients.find(p => p.id === searchTerm) || null;
    } else if (searchTerm && searchDOB) {
      found = patients.find(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        p.dateOfBirth === searchDOB
      ) || null;
    }
    
    if (found) {
      setSelectedPatient(found);
      setFormData({
        name: found.name,
        dateOfBirth: found.dateOfBirth,
        gender: found.gender,
        contactNumber: found.contactNumber,
        address: found.address,
      });
      toast({
        title: "Patient Found",
        description: `${found.name} (${found.id})`,
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

  const handleRegisterPatient = () => {
    const newPatient: Patient = {
      id: selectedPatient?.id || generatePatientId(),
      ...formData,
      createdAt: selectedPatient?.createdAt || new Date().toISOString(),
    };
    
    let updatedPatients;
    if (selectedPatient) {
      updatedPatients = patients.map(p => p.id === selectedPatient.id ? newPatient : p);
    } else {
      updatedPatients = [...patients, newPatient];
    }
    
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);
    setSelectedPatient(newPatient);
    setIsModalOpen(false);
    
    toast({
      title: selectedPatient ? "Patient Updated" : "Patient Registered",
      description: `${newPatient.name} (${newPatient.id})`,
    });
  };

  const handleAssignVisit = () => {
    if (!selectedPatient) return;
    
    const newVisit: Visit = {
      id: generateVisitId(),
      patientId: selectedPatient.id,
      department: visitData.department,
      chiefComplaint: visitData.chiefComplaint,
      status: 'pending' as VisitStatus,
      createdAt: new Date().toISOString(),
      departmentalLogs: [],
    };
    
    const updatedVisits = [...visits, newVisit];
    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setVisits(updatedVisits);
    setVisitData({ department: '', chiefComplaint: '' });
    setIsModalOpen(false);
    
    toast({
      title: "Visit Assigned",
      description: `${newVisit.id} - ${newVisit.department}`,
    });
  };

  const activeVisits = visits.filter(v => v.status !== 'completed');

  return (
    <Layout title="Encoder Portal" role="encoder">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Search & Registration */}
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
                {selectedPatient.name} ({selectedPatient.id})
              </p>
              <p className="text-sm text-muted-foreground">
                DOB: {selectedPatient.dateOfBirth}
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

        {/* Active Visits */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Active Visits ({activeVisits.length})
          </h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {activeVisits.map(visit => {
              const patient = patients.find(p => p.id === visit.patientId);
              return (
                <div key={visit.id} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{patient?.name}</p>
                      <p className="text-sm text-muted-foreground">{visit.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary">{visit.department}</p>
                  <p className="text-sm text-muted-foreground mt-1">{visit.chiefComplaint}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(visit.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Registration Modal */}
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
              <Select value={formData.gender} onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}>
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

      {/* Assign Visit Modal */}
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

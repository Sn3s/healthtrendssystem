import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/Modal';
import { Patient, Visit, DEPARTMENTS, DepartmentalLog } from '@/types/hospital';
import { Stethoscope, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Doctor() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEPARTMENTS[0]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'finding' | 'complete'>('finding');
  const [findings, setFindings] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [providerName, setProviderName] = useState('Dr. Smith');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    const storedVisits = JSON.parse(localStorage.getItem('visits') || '[]');
    setPatients(storedPatients);
    setVisits(storedVisits);
  };

  const filteredVisits = visits.filter(
    v => v.department === selectedDepartment && v.status !== 'completed'
  );

  const handleAddFinding = () => {
    if (!selectedVisit) return;

    const newLog: DepartmentalLog = {
      id: `DL-${Date.now()}`,
      department: selectedDepartment,
      provider: providerName,
      findings,
      timestamp: new Date().toISOString(),
    };

    const updatedVisits = visits.map(v =>
      v.id === selectedVisit.id
        ? {
            ...v,
            status: 'in-progress' as const,
            departmentalLogs: [...v.departmentalLogs, newLog],
          }
        : v
    );

    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setVisits(updatedVisits);
    setSelectedVisit(null);
    setFindings('');
    setIsModalOpen(false);

    toast({
      title: "Finding Recorded",
      description: "Departmental log has been added",
    });
  };

  const handleCompleteVisit = () => {
    if (!selectedVisit) return;

    const updatedVisits = visits.map(v =>
      v.id === selectedVisit.id
        ? {
            ...v,
            status: 'completed' as const,
            finalDiagnosis,
            completedAt: new Date().toISOString(),
          }
        : v
    );

    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setVisits(updatedVisits);
    setSelectedVisit(null);
    setFinalDiagnosis('');
    setIsModalOpen(false);

    toast({
      title: "Visit Completed",
      description: "Patient visit has been finalized",
    });
  };

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
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
            Pending Appointments ({filteredVisits.length})
          </h3>
          
          {filteredVisits.map(visit => {
            const patient = patients.find(p => p.id === visit.patientId);
            return (
              <Card key={visit.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{patient?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {visit.patientId} | Visit ID: {visit.id}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      DOB: {patient?.dateOfBirth} | Gender: {patient?.gender}
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
                  <p className="text-sm mt-1">{visit.chiefComplaint}</p>
                </div>

                {visit.departmentalLogs.length > 0 && (
                  <div className="mb-4">
                    <Label>Previous Findings</Label>
                    <div className="space-y-2 mt-2">
                      {visit.departmentalLogs.map(log => (
                        <div key={log.id} className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{log.department}</p>
                          <p className="text-muted-foreground">{log.provider}</p>
                          <p className="mt-1">{log.findings}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.timestamp).toLocaleString()}
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

          {filteredVisits.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending appointments for this department</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Finding Modal */}
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

      {/* Complete Visit Modal */}
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

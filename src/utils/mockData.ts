import { Patient, Visit } from '@/types/hospital';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-100001',
    name: 'Maria Santos',
    dateOfBirth: '1985-03-15',
    gender: 'female',
    contactNumber: '+63 912 345 6789',
    address: '123 Rizal Street, Manila',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'P-100002',
    name: 'Juan Dela Cruz',
    dateOfBirth: '1990-07-22',
    gender: 'male',
    contactNumber: '+63 923 456 7890',
    address: '456 Bonifacio Avenue, Quezon City',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'P-100003',
    name: 'Ana Reyes',
    dateOfBirth: '1978-11-08',
    gender: 'female',
    contactNumber: '+63 934 567 8901',
    address: '789 Luna Street, Makati',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_VISITS: Visit[] = [
  {
    id: 'V-200001',
    patientId: 'P-100001',
    department: 'Internal Medicine & Surgery',
    chiefComplaint: 'Persistent cough and fever',
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    finalDiagnosis: 'Acute Bronchitis',
    departmentalLogs: [
      {
        id: 'DL-1',
        department: 'DOH-Accredited Secondary Laboratory',
        provider: 'Dr. Sarah Lee',
        findings: 'CBC shows elevated WBC count indicating infection',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'DL-2',
        department: 'Imaging & X-Ray Facilities',
        provider: 'Dr. Michael Chen',
        findings: 'Chest X-ray shows no signs of pneumonia',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'V-200002',
    patientId: 'P-100002',
    department: 'Eye Center',
    chiefComplaint: 'Blurred vision and eye strain',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    departmentalLogs: [
      {
        id: 'DL-3',
        department: 'Eye Center',
        provider: 'Dr. Patricia Wong',
        findings: 'Initial examination shows myopia progression',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'V-200003',
    patientId: 'P-100003',
    department: 'Dermatology & Ophthalmology',
    chiefComplaint: 'Skin rash on arms',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    departmentalLogs: [],
  },
];

export function initializeMockData() {
  const existingPatients = localStorage.getItem('patients');
  const existingVisits = localStorage.getItem('visits');
  
  if (!existingPatients) {
    localStorage.setItem('patients', JSON.stringify(MOCK_PATIENTS));
  }
  
  if (!existingVisits) {
    localStorage.setItem('visits', JSON.stringify(MOCK_VISITS));
  }
}

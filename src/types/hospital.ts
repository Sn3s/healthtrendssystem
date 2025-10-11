export type UserRole = 'encoder' | 'doctor' | 'patient' | 'admin';

export type Gender = 'male' | 'female' | 'other';

export type VisitStatus = 'pending' | 'in-progress' | 'completed';

export interface Patient {
  id: string; // Format: P-XXXXXX
  name: string;
  dateOfBirth: string;
  gender: Gender;
  contactNumber: string;
  address: string;
  createdAt: string;
}

export interface DepartmentalLog {
  id: string;
  department: string;
  provider: string;
  findings: string;
  timestamp: string;
}

export interface Visit {
  id: string; // Format: V-XXXXXX
  patientId: string;
  department: string;
  chiefComplaint: string;
  status: VisitStatus;
  createdAt: string;
  finalDiagnosis?: string;
  departmentalLogs: DepartmentalLog[];
  completedAt?: string;
}

export const DEPARTMENTS = [
  'Internal Medicine & Surgery',
  'Dermatology & Ophthalmology',
  'ENT & Pediatrics',
  'OB Gyn and Rehab Medicine',
  'Ambulatory Surgical Clinic',
  'Dental Center',
  'Eye Center',
  'DOH-Accredited Secondary Laboratory',
  'Imaging & X-Ray Facilities',
  'DOH-Accredited Drug Testing Center'
] as const;

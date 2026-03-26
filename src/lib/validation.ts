import { z } from 'zod';

// Patient registration validation
export const patientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: "Please select a gender" }) }),
  contactNumber: z.string().regex(/^[0-9+\-\s()]+$/, "Invalid phone number format").max(20, "Phone number too long"),
  address: z.string().trim().min(1, "Address is required").max(500, "Address must be less than 500 characters")
});

// Visit assignment validation
export const visitSchema = z.object({
  department: z.string().min(1, "Department is required"),
  chiefComplaint: z.string().trim().min(1, "Chief complaint is required").max(2000, "Chief complaint must be less than 2000 characters")
});

// Medical findings validation
export const findingsSchema = z.object({
  findings: z.string().trim().min(1, "Findings are required").max(5000, "Findings must be less than 5000 characters"),
  providerName: z.string().trim().min(1, "Provider name is required").max(100, "Provider name must be less than 100 characters")
});

// Final diagnosis validation
export const diagnosisSchema = z.object({
  finalDiagnosis: z.string().trim().min(1, "Final diagnosis is required").max(5000, "Final diagnosis must be less than 5000 characters")
});

// X-Ray Report validation
export const xrayReportSchema = z.object({
  // Administrative & Identification
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  companyAffiliation: z.string().trim().max(200).optional().or(z.literal("")),
  requestingPhysician: z.string().trim().min(1, "Requesting physician is required").max(100),
  radiologicTechnologist: z.string().trim().min(1, "Radiologic technologist is required").max(100),
  radiologist: z.string().trim().min(1, "Radiologist is required").max(100),
  // Patient Demographics
  patientName: z.string().trim().min(1, "Patient name is required").max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  sex: z.enum(["male", "female"], { errorMap: () => ({ message: "Please select sex" }) }),
  firstDayLastMenstruation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().or(z.literal("")),
  // Clinical Context & Results
  indicationHistory: z.string().trim().min(1, "Indication/History is required").max(2000),
  diagnosticImagingRequest: z.string().trim().min(1, "Diagnostic imaging request is required").max(500),
  findings: z.string().trim().min(1, "Findings are required").max(10000),
  impression: z.string().trim().min(1, "Impression is required").max(2000),
}).refine(
  (data) => {
    if (data.sex === "female") {
      return !!data.firstDayLastMenstruation && /^\d{4}-\d{2}-\d{2}$/.test(data.firstDayLastMenstruation);
    }
    return true;
  },
  { message: "1st day of last menstruation is required for female patients (safety screening for radiation)", path: ["firstDayLastMenstruation"] }
);

export type XrayReportFormData = z.infer<typeof xrayReportSchema>;

// Authentication validation
export const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password must be less than 72 characters"),
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Full name must be less than 100 characters").optional()
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;
export type FindingsFormData = z.infer<typeof findingsSchema>;
export type DiagnosisFormData = z.infer<typeof diagnosisSchema>;
export type AuthFormData = z.infer<typeof authSchema>;

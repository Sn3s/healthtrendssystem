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

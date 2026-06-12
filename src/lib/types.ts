export type Gender = 'M' | 'F';

export type SampleStatus = 'collected' | 'processing' | 'completed' | 'rejected';

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Sample {
  id: string;
  patientId: string;
  type: string;
  collectedAt: string;
  status: SampleStatus;
  notes: string;
}

export interface TestResult {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'normal' | 'high' | 'low' | '';
}

export interface TestOrder {
  id: string;
  patientId: string;
  sampleId: string;
  tests: string[];
  status: OrderStatus;
  orderedAt: string;
  completedAt: string;
  results: TestResult[];
  notes: string;
}

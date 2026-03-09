// Core TypeScript types and interfaces for MedVoice AI

// Organization Types
export type SubscriptionTier = 'essentials' | 'growth' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'cancelled';

export interface OrganizationCreateInput {
  name: string;
  specialty?: string;
  practiceName?: string;
  phone?: string;
  email?: string;
  callVolume?: string;
  subscriptionTier?: SubscriptionTier;
}

// User Types
export type UserRole = 'admin' | 'staff' | 'clinician';
export type UserPermissions = {
  canManageUsers?: boolean;
  canManagePatients?: boolean;
  canManageAppointments?: boolean;
  canViewReports?: boolean;
  canManageSettings?: boolean;
  canAccessEMR?: boolean;
};

export interface UserCreateInput {
  organizationId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  permissions?: UserPermissions;
}

// Location Types
export interface LocationCreateInput {
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  businessHours?: BusinessHours;
  timezone?: string;
}

export interface LocationUpdateInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  businessHours?: BusinessHours;
  timezone?: string;
  isActive?: boolean;
}

// User-Location Assignment Types
export interface UserLocationAssignment {
  userId: string;
  locationId: string;
}

// Patient Types
export type Gender = 'M' | 'F' | 'Other' | 'Prefer not to say';

export interface PatientCreateInput {
  organizationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emrPatientId?: string;
  medicalRecordNumber?: string;
  primaryLocationId?: string;
}

// Appointment Types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type AppointmentType = 'consultation' | 'follow-up' | 'procedure' | 'screening' | 'other';

export interface AppointmentCreateInput {
  organizationId: string;
  patientId: string;
  locationId: string;
  scheduledAt: Date;
  duration?: number;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  reason?: string;
  notes?: string;
  providerName?: string;
  providerId?: string;
  emrAppointmentId?: string;
  createdById?: string;
}

// Call Types
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer';
export type CallOutcome = 'scheduled' | 'cancelled' | 'transferred' | 'voicemail' | 'question_answered' | 'no_action';
export type CallIntent = 'schedule' | 'cancel' | 'reschedule' | 'question' | 'emergency' | 'other';

export interface CallCreateInput {
  organizationId: string;
  patientId?: string;
  locationId?: string;
  callSid?: string;
  phoneNumber: string;
  direction: CallDirection;
  status?: CallStatus;
  startedAt?: Date;
  aiAgentUsed?: boolean;
  aiAgentId?: string;
  handledById?: string;
}

export interface CallUpdateInput {
  status?: CallStatus;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  aiTranscript?: string;
  aiIntent?: CallIntent;
  aiConfidence?: number;
  outcome?: CallOutcome;
  notes?: string;
  recordingUrl?: string;
  recordingDuration?: number;
  transcriptionUrl?: string;
}

// EMR Integration Types
export type EMRSystem = 'epic' | 'cerner' | 'athena' | 'allscripts' | 'custom';
export type IntegrationType = 'api' | 'hl7' | 'fhir' | 'custom';
export type IntegrationStatus = 'active' | 'inactive' | 'error';
export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';
export type SyncStatus = 'success' | 'error' | 'partial';

export interface EMRIntegrationCreateInput {
  organizationId: string;
  emrSystem: EMRSystem;
  integrationType: IntegrationType;
  apiEndpoint?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  hl7Endpoint?: string;
  fhirBaseUrl?: string;
  syncAppointments?: boolean;
  syncPatients?: boolean;
  syncDirection?: SyncDirection;
  doctorId?: string; // Associate with specific doctor
}

// Organization Settings Types
export type AIVoicePersonality = 'empathetic' | 'professional' | 'friendly' | 'custom';
export type AfterHoursRouting = 'voicemail' | 'ai_agent' | 'forward';

export interface BusinessHours {
  [key: string]: {
    open: string; // HH:mm format
    close: string; // HH:mm format
    closed?: boolean;
  };
}

export interface OrganizationSettingsInput {
  organizationId: string;
  aiVoiceEnabled?: boolean;
  aiVoicePersonality?: AIVoicePersonality;
  aiVoiceCloneId?: string;
  smsNotifications?: boolean;
  emailNotifications?: boolean;
  businessHours?: BusinessHours;
  timezone?: string;
  afterHoursRouting?: AfterHoursRouting;
}

// Phone Number Types
export type PhoneNumberType = 'main' | 'backup' | 'location_specific';
export type PhoneNumberPurpose = 'voice' | 'sms' | 'voice_sms' | 'fax';
export type PortStatus = 'not_ported' | 'port_requested' | 'port_pending' | 'ported' | 'port_failed' | 'forwarding';
export type NumberSource = 'twilio' | 'ported' | 'forwarded' | 'existing_carrier';

export interface PhoneNumberCreateInput {
  phoneNumber: string;
  organizationId?: string;
  locationId?: string;
  numberType?: PhoneNumberType;
  purpose?: PhoneNumberPurpose;
  isPrimary?: boolean;
  twilioSid?: string;
  twilioAccountSid?: string;
  portStatus?: PortStatus;
  portRequestId?: string;
  numberSource?: NumberSource;
  friendlyName?: string;
  notes?: string;
}

export interface PhoneNumberUpdateInput {
  numberType?: PhoneNumberType;
  purpose?: PhoneNumberPurpose;
  isPrimary?: boolean;
  isActive?: boolean;
  verified?: boolean;
  portStatus?: PortStatus;
  portRequestId?: string;
  portRequestedAt?: Date;
  portCompletedAt?: Date;
  portFailureReason?: string;
  twilioSid?: string;
  friendlyName?: string;
  notes?: string;
}

// Audit Log Types
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'access' | 'export';
export type AuditResourceType = 'patient' | 'appointment' | 'call' | 'user' | 'organization' | 'location' | 'emr_integration' | 'settings' | 'phone_number';

export interface AuditLogCreateInput {
  organizationId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

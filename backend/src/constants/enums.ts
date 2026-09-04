// User Roles
export enum UserRole {
  PATIENT = 'patient',
  BLOOD_DONOR = 'blood_donor',
  VOLUNTEER = 'volunteer',
  MONEY_DONOR = 'money_donor',
  MEDICINE_DONOR = 'medicine_donor',
  EQUIPMENT_DONOR = 'equipment_donor',
  FAMILY_MEMBER = 'family_member',
  HOSPITAL = 'hospital',
  BLOOD_BANK = 'blood_bank',
  NGO = 'ngo',
  AMBULANCE_PROVIDER = 'ambulance_provider',
  GOVERNMENT_ORGANIZATION = 'government_organization',
  PHARMACY = 'pharmacy',
  SPONSOR = 'sponsor',
  ADMIN = 'admin',
}

// Account Types
export enum AccountType {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
}

// Organization Types
export enum OrganizationType {
  HOSPITAL = 'hospital',
  BLOOD_BANK = 'blood_bank',
  NGO = 'ngo',
  AMBULANCE_PROVIDER = 'ambulance_provider',
  GOVERNMENT_ORGANIZATION = 'government_organization',
  PHARMACY = 'pharmacy',
  SPONSOR = 'sponsor',
}

// Verification Status
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// Account Status
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// Blood Groups
export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Emergency Status
export enum EmergencyStatus {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

// Emergency Types
export enum EmergencyType {
  ACCIDENT = 'accident',
  CARDIAC_ARREST = 'cardiac_arrest',
  STROKE = 'stroke',
  RESPIRATORY = 'respiratory',
  BURN = 'burn',
  FRACTURE = 'fracture',
  POISONING = 'poisoning',
  CHILDBIRTH = 'childbirth',
  OTHER = 'other',
}

// Ambulance Status
export enum AmbulanceStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  EN_ROUTE = 'en_route',
  AT_SCENE = 'at_scene',
  TRANSPORTING = 'transporting',
  AT_HOSPITAL = 'at_hospital',
  RETURNING = 'returning',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

// Campaign Status
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  GOAL_REACHED = 'goal_reached',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

// Transaction Status
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Transaction Type
export enum TransactionType {
  CAMPAIGN_DONATION = 'campaign_donation',
  BLOOD_DONATION_REWARD = 'blood_donation_reward',
  AMBULANCE_PAYMENT = 'ambulance_payment',
  HOSPITAL_PAYMENT = 'hospital_payment',
  MEDICINE_DONATION = 'medicine_donation',
  EQUIPMENT_DONATION = 'equipment_donation',
}

// Notification Types
export enum NotificationType {
  EMERGENCY_CREATED = 'emergency_created',
  EMERGENCY_UPDATED = 'emergency_updated',
  BLOOD_REQUEST = 'blood_request',
  DONATION_RECEIVED = 'donation_received',
  CAMPAIGN_UPDATED = 'campaign_updated',
  HOSPITAL_RESOURCES_UPDATED = 'hospital_resources_updated',
  AMBULANCE_LOCATION = 'ambulance_location',
  VOLUNTEER_ASSIGNED = 'volunteer_assigned',
  VERIFICATION_STATUS = 'verification_status',
  PAYMENT_RECEIVED = 'payment_received',
  OTP_SENT = 'otp_sent',
  SYSTEM = 'system',
}

// OTP Types
export enum OTPType {
  EMAIL_VERIFICATION = 'email_verification',
  MOBILE_VERIFICATION = 'mobile_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN = 'login',
}

// Medicine Donation Status
export enum MedicineDonationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COLLECTED = 'collected',
  DISTRIBUTED = 'distributed',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

// Equipment Status
export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  DONATED = 'donated',
  LOST = 'lost',
}

// Volunteer Task Status
export enum VolunteerTaskStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Socket Events
export enum SocketEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',

  // Emergency
  EMERGENCY_CREATED = 'emergency:created',
  EMERGENCY_UPDATED = 'emergency:updated',
  EMERGENCY_CANCELLED = 'emergency:cancelled',

  // Blood
  BLOOD_REQUEST_CREATED = 'blood:request_created',
  BLOOD_DONATION_RECEIVED = 'blood:donation_received',
  BLOOD_ALERT = 'blood:alert',

  // Campaign
  CAMPAIGN_UPDATED = 'campaign:updated',
  DONATION_RECEIVED = 'campaign:donation_received',

  // Hospital
  HOSPITAL_RESOURCES_UPDATED = 'hospital:resources_updated',

  // Ambulance
  AMBULANCE_LOCATION_UPDATE = 'ambulance:location_update',
  AMBULANCE_ASSIGNED = 'ambulance:assigned',
  AMBULANCE_ETA_UPDATE = 'ambulance:eta_update',

  // Volunteer
  VOLUNTEER_ASSIGNED = 'volunteer:assigned',
  TASK_UPDATED = 'task:updated',

  // Chat
  CHAT_MESSAGE = 'chat:message',
  CHAT_TYPING = 'chat:typing',
  CHAT_STOP_TYPING = 'chat:stop_typing',
  CHAT_READ = 'chat:read',
  CHAT_MEDIA = 'chat:media',

  // Notifications
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification:read',

  // Presence
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
}

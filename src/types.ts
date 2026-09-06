export type UserRole = 'admin' | 'staff' | 'parent';

export type NotificationPreference = 'email_only' | 'sms_only' | 'email_and_sms';

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';

export type NotificationDeliveryStatus = 'Pending' | 'Sent' | 'Delivered' | 'Failed';

export interface School {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address: string;
  phone: string;
  email: string;
  opening_time: string; // e.g. "07:30"
  late_threshold: string; // e.g. "08:15"
  allow_parent_preference_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  school_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassLevel {
  id: string;
  school_id: string;
  name: string; // 'Creche 1', 'Creche 2', 'Reception 1', ..., 'Primary 5'
  order_index: number;
  has_streams: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Stream {
  id: string;
  school_id: string;
  class_id: string;
  name: string | null; // 'Wisdom', 'Knowledge', or null for Creche
  capacity: number; // default 20
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  student_id: string; // unique within school (e.g. SSN-2026-001)
  full_name: string;
  photo_url?: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female';
  class_id: string;
  stream_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  school_id: string;
  profile_id?: string;
  full_name: string;
  email: string;
  phone: string; // Nigerian phone e.g. +2348012345678
  relationship: string; // 'Father', 'Mother', 'Guardian', 'Uncle', 'Aunt'
  notification_preference: NotificationPreference;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentParent {
  id: string;
  school_id: string;
  student_id: string;
  parent_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface AuthorizedPickup {
  id: string;
  school_id: string;
  student_id: string;
  full_name: string;
  phone: string;
  relationship: string;
  photo_url?: string;
  id_number_ref?: string; // NIN / Driver's license / School ID pass
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: string; // ISO string
  recorded_by: string; // profile id
  recorded_by_name?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface PickupRecord {
  id: string;
  school_id: string;
  student_id: string;
  pickup_person_id: string;
  pickup_person_name: string;
  relationship: string;
  date: string; // YYYY-MM-DD
  exact_time: string; // e.g. "03:15 PM"
  timestamp: string;
  releasing_staff_id: string;
  releasing_staff_name: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  school_id: string;
  student_id?: string;
  student_name?: string;
  recipient_type: 'parent';
  recipient_id?: string;
  recipient_name: string;
  channel: 'sms' | 'email';
  destination: string; // phone number or email address
  event_type: 'arrival' | 'pickup' | 'system';
  message_title: string;
  message_body: string;
  status: NotificationDeliveryStatus;
  provider: string; // 'Termii', 'Resend', 'Termii (Simulated)', etc.
  provider_ref?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_id: string;
  default_capacity: number;
  opening_time: string;
  late_threshold: string;
  allow_parent_preference_change: boolean;
  arrival_sms_template: string;
  pickup_sms_template: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  school_id: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Composite student view with class, stream, parents, and authorized pickups
export interface StudentWithDetails extends Student {
  class_name: string;
  stream_name: string | null;
  display_class: string; // e.g. "Reception 1 – Wisdom" or "Creche 1"
  parents: Parent[];
  authorized_pickups: AuthorizedPickup[];
  today_attendance?: AttendanceRecord;
  today_pickup?: PickupRecord;
}

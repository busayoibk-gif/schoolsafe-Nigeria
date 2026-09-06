import {
  School,
  Profile,
  ClassLevel,
  Stream,
  Student,
  Parent,
  StudentParent,
  AuthorizedPickup,
  AttendanceRecord,
  PickupRecord,
  NotificationRecord,
  SchoolSettings,
  AuditLog,
  StudentWithDetails,
  AttendanceStatus,
  NotificationPreference,
} from '../types';
import {
  DEFAULT_SCHOOL,
  DEFAULT_SETTINGS,
  DEFAULT_PROFILES,
  DEFAULT_CLASSES,
  DEFAULT_STREAMS,
  DEFAULT_PARENTS,
  DEFAULT_STUDENTS,
  DEFAULT_STUDENT_PARENTS,
  DEFAULT_AUTHORIZED_PICKUPS,
  DEFAULT_ATTENDANCE,
  DEFAULT_PICKUPS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_AUDIT_LOGS,
} from '../data/seedData';
import { getLagosDate, getLagosTime, formatClassStream, isTimeLate, parseNigerianPhone } from '../utils/nigerian';

const STORAGE_KEY_PREFIX = 'schoolsafe_ng_';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

class SchoolSafeStore {
  public school: School;
  public settings: SchoolSettings;
  public profiles: Profile[];
  public currentProfile: Profile;
  public classes: ClassLevel[];
  public streams: Stream[];
  public students: Student[];
  public parents: Parent[];
  public studentParents: StudentParent[];
  public authorizedPickups: AuthorizedPickup[];
  public attendance: AttendanceRecord[];
  public pickups: PickupRecord[];
  public notifications: NotificationRecord[];
  public auditLogs: AuditLog[];

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.school = loadFromStorage<School>('school', DEFAULT_SCHOOL);
    this.settings = loadFromStorage<SchoolSettings>('settings', DEFAULT_SETTINGS);
    this.profiles = loadFromStorage<Profile[]>('profiles', DEFAULT_PROFILES);
    this.currentProfile = loadFromStorage<Profile>('current_profile', DEFAULT_PROFILES[0]);
    this.classes = loadFromStorage<ClassLevel[]>('classes', DEFAULT_CLASSES);
    this.streams = loadFromStorage<Stream[]>('streams', DEFAULT_STREAMS);
    this.students = loadFromStorage<Student[]>('students', DEFAULT_STUDENTS);
    this.parents = loadFromStorage<Parent[]>('parents', DEFAULT_PARENTS);
    this.studentParents = loadFromStorage<StudentParent[]>('student_parents', DEFAULT_STUDENT_PARENTS);
    this.authorizedPickups = loadFromStorage<AuthorizedPickup[]>('authorized_pickups', DEFAULT_AUTHORIZED_PICKUPS);
    this.attendance = loadFromStorage<AttendanceRecord[]>('attendance', DEFAULT_ATTENDANCE);
    this.pickups = loadFromStorage<PickupRecord[]>('pickups', DEFAULT_PICKUPS);
    this.notifications = loadFromStorage<NotificationRecord[]>('notifications', DEFAULT_NOTIFICATIONS);
    this.auditLogs = loadFromStorage<AuditLog[]>('audit_logs', DEFAULT_AUDIT_LOGS);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    saveToStorage('school', this.school);
    saveToStorage('settings', this.settings);
    saveToStorage('profiles', this.profiles);
    saveToStorage('current_profile', this.currentProfile);
    saveToStorage('classes', this.classes);
    saveToStorage('streams', this.streams);
    saveToStorage('students', this.students);
    saveToStorage('parents', this.parents);
    saveToStorage('student_parents', this.studentParents);
    saveToStorage('authorized_pickups', this.authorizedPickups);
    saveToStorage('attendance', this.attendance);
    saveToStorage('pickups', this.pickups);
    saveToStorage('notifications', this.notifications);
    saveToStorage('audit_logs', this.auditLogs);
    this.notify();
  }

  // Log an action to Audit Logs
  public logAudit(action: string, entity: string, entityId: string, metadata?: Record<string, any>): void {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      school_id: this.school.id,
      user_id: this.currentProfile.id,
      user_name: this.currentProfile.full_name,
      user_role: this.currentProfile.role,
      action,
      entity,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs = [log, ...this.auditLogs];
    this.persist();
  }

  // User & Profile Management
  public setCurrentUserRole(role: 'admin' | 'staff' | 'parent'): void {
    const target = this.profiles.find((p) => p.role === role);
    if (target) {
      this.currentProfile = target;
      this.logAudit('SWITCH_ROLE', 'user', target.id, { role });
      this.persist();
    }
  }

  public loginUser(email: string, role?: 'admin' | 'staff' | 'parent'): boolean {
    const existing = this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      this.currentProfile = existing;
      this.logAudit('USER_LOGIN', 'user', existing.id, { email });
      this.persist();
      return true;
    }
    // Create new profile for this email
    const newProfile: Profile = {
      id: `usr_${Date.now()}`,
      school_id: this.school.id,
      email,
      full_name: email.split('@')[0],
      role: role || 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles = [...this.profiles, newProfile];
    this.currentProfile = newProfile;
    this.logAudit('USER_LOGIN_NEW', 'user', newProfile.id, { email, role: newProfile.role });
    this.persist();
    return true;
  }

  // Stream & Capacity Calculations
  public getStreamStats(streamId: string): {
    stream: Stream;
    className: string;
    displayName: string;
    currentStudents: number;
    capacity: number;
    availableSpaces: number;
    isFull: boolean;
  } {
    const stream = this.streams.find((s) => s.id === streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }
    const classObj = this.classes.find((c) => c.id === stream.class_id);
    const className = classObj ? classObj.name : 'Unknown Class';
    const displayName = formatClassStream(className, stream.name);

    const currentStudents = this.students.filter(
      (s) => s.stream_id === streamId && s.is_active
    ).length;

    const capacity = stream.capacity;
    const availableSpaces = Math.max(0, capacity - currentStudents);
    const isFull = currentStudents >= capacity;

    return {
      stream,
      className,
      displayName,
      currentStudents,
      capacity,
      availableSpaces,
      isFull,
    };
  }

  public updateStreamCapacity(streamId: string, newCapacity: number): { success: boolean; error?: string } {
    // Authorization check: Only School Administrator can change capacity
    if (this.currentProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only a School Administrator can change class stream capacity.',
      };
    }

    if (newCapacity < 1) {
      return { success: false, error: 'Capacity must be at least 1 student.' };
    }

    const streamIndex = this.streams.findIndex((s) => s.id === streamId);
    if (streamIndex === -1) {
      return { success: false, error: 'Stream not found.' };
    }

    const currentCount = this.students.filter((s) => s.stream_id === streamId && s.is_active).length;
    if (newCapacity < currentCount) {
      return {
        success: false,
        error: `Cannot reduce capacity to ${newCapacity}. Current active enrollment is ${currentCount} students.`,
      };
    }

    const stream = this.streams[streamIndex];
    const prevCap = stream.capacity;
    this.streams[streamIndex] = {
      ...stream,
      capacity: newCapacity,
      updated_at: new Date().toISOString(),
    };

    const stats = this.getStreamStats(streamId);
    this.logAudit('STREAM_CAPACITY_CHANGED', 'stream', streamId, {
      stream: stats.displayName,
      previousCapacity: prevCap,
      newCapacity,
    });

    this.persist();
    return { success: true };
  }

  // Student details resolver
  public getStudentWithDetails(studentId: string, targetDate: string = getLagosDate()): StudentWithDetails | null {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return null;

    const classObj = this.classes.find((c) => c.id === student.class_id);
    const stream = this.streams.find((s) => s.id === student.stream_id);
    const className = classObj?.name || 'Class';
    const streamName = stream?.name || null;
    const display_class = formatClassStream(className, streamName);

    // Linked parents
    const parentLinks = this.studentParents.filter((sp) => sp.student_id === student.id);
    const parents = parentLinks
      .map((sp) => this.parents.find((p) => p.id === sp.parent_id))
      .filter((p): p is Parent => Boolean(p && p.is_active));

    // Authorized pickups
    const authorized_pickups = this.authorizedPickups.filter(
      (ap) => ap.student_id === student.id && ap.is_active
    );

    // Attendance for targetDate
    const today_attendance = this.attendance.find(
      (a) => a.student_id === student.id && a.date === targetDate
    );

    // Pickup for targetDate
    const today_pickup = this.pickups.find(
      (p) => p.student_id === student.id && p.date === targetDate
    );

    return {
      ...student,
      class_name: className,
      stream_name: streamName,
      display_class,
      parents,
      authorized_pickups,
      today_attendance,
      today_pickup,
    };
  }

  public getAllStudentsWithDetails(targetDate: string = getLagosDate()): StudentWithDetails[] {
    let list = this.students;

    // Role-based visibility:
    // Parents must NEVER be able to view another family's children!
    if (this.currentProfile.role === 'parent') {
      const parentRecord = this.parents.find((p) => p.profile_id === this.currentProfile.id || p.email === this.currentProfile.email);
      if (parentRecord) {
        const myStudentIds = new Set(
          this.studentParents
            .filter((sp) => sp.parent_id === parentRecord.id)
            .map((sp) => sp.student_id)
        );
        list = list.filter((s) => myStudentIds.has(s.id));
      } else {
        list = [];
      }
    }

    return list
      .map((s) => this.getStudentWithDetails(s.id, targetDate))
      .filter((s): s is StudentWithDetails => s !== null);
  }

  // Create Student with Class Capacity Enforcement
  public addStudent(studentData: {
    student_id: string;
    full_name: string;
    date_of_birth: string;
    gender: 'Male' | 'Female';
    class_id: string;
    stream_id: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    photo_url?: string;
    parent_ids?: string[];
  }): { success: boolean; student?: Student; error?: string } {
    // Authorization check
    if (this.currentProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only an Administrator can add students.' };
    }

    // Required fields validation
    if (!studentData.student_id?.trim()) return { success: false, error: 'Student ID is required.' };
    if (!studentData.full_name?.trim()) return { success: false, error: 'Student full name is required.' };
    if (!studentData.class_id) return { success: false, error: 'Class is required.' };
    if (!studentData.stream_id) return { success: false, error: 'Stream is required.' };
    if (!studentData.emergency_contact_name?.trim()) return { success: false, error: 'Emergency contact name is required.' };
    if (!studentData.emergency_contact_phone?.trim()) return { success: false, error: 'Emergency contact phone is required.' };

    // Unique Student ID check
    const existing = this.students.find(
      (s) => s.student_id.toLowerCase() === studentData.student_id.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: `Student ID "${studentData.student_id}" is already assigned to another student.` };
    }

    // Class Capacity Check (CRITICAL RULE)
    const streamStats = this.getStreamStats(studentData.stream_id);
    if (streamStats.isFull) {
      return {
        success: false,
        error: `Class Full: ${streamStats.displayName} has reached its maximum capacity of ${streamStats.capacity} students. Contact School Administrator to increase capacity before admitting new students.`,
      };
    }

    const newStudent: Student = {
      id: `stu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      school_id: this.school.id,
      student_id: studentData.student_id.trim().toUpperCase(),
      full_name: studentData.full_name.trim(),
      photo_url: studentData.photo_url || undefined,
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
      class_id: studentData.class_id,
      stream_id: studentData.stream_id,
      emergency_contact_name: studentData.emergency_contact_name.trim(),
      emergency_contact_phone: studentData.emergency_contact_phone.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.students = [newStudent, ...this.students];

    // Link parents if provided
    if (studentData.parent_ids && studentData.parent_ids.length > 0) {
      studentData.parent_ids.forEach((pId, idx) => {
        this.studentParents.push({
          id: `sp_${Date.now()}_${idx}`,
          school_id: this.school.id,
          student_id: newStudent.id,
          parent_id: pId,
          is_primary: idx === 0,
          created_at: new Date().toISOString(),
        });
      });
    }

    this.logAudit('STUDENT_CREATED', 'student', newStudent.id, {
      name: newStudent.full_name,
      student_id: newStudent.student_id,
      class_stream: streamStats.displayName,
    });

    this.persist();
    return { success: true, student: newStudent };
  }

  public updateStudent(
    studentId: string,
    updates: Partial<Student>
  ): { success: boolean; student?: Student; error?: string } {
    if (this.currentProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only an Administrator can update students.' };
    }

    const index = this.students.findIndex((s) => s.id === studentId);
    if (index === -1) return { success: false, error: 'Student not found.' };

    const current = this.students[index];

    // If changing stream, verify the new stream has available capacity
    if (updates.stream_id && updates.stream_id !== current.stream_id) {
      const targetStats = this.getStreamStats(updates.stream_id);
      if (targetStats.isFull) {
        return {
          success: false,
          error: `Cannot transfer: Target stream ${targetStats.displayName} is full (${targetStats.capacity}/${targetStats.capacity}).`,
        };
      }
    }

    this.students[index] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.logAudit('STUDENT_UPDATED', 'student', studentId, { updates });
    this.persist();
    return { success: true, student: this.students[index] };
  }

  public toggleStudentStatus(studentId: string): { success: boolean; error?: string } {
    if (this.currentProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only an Administrator can change student status.' };
    }
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    student.is_active = !student.is_active;
    student.updated_at = new Date().toISOString();

    this.logAudit(
      student.is_active ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED',
      'student',
      studentId,
      { student: student.full_name, active: student.is_active }
    );
    this.persist();
    return { success: true };
  }

  // Authorized Pickups Management
  public addAuthorizedPickup(data: {
    student_id: string;
    full_name: string;
    phone: string;
    relationship: string;
    id_number_ref?: string;
    photo_url?: string;
  }): { success: boolean; authorizedPickup?: AuthorizedPickup; error?: string } {
    if (!data.student_id || !data.full_name?.trim() || !data.phone?.trim() || !data.relationship?.trim()) {
      return { success: false, error: 'Student, full name, phone number, and relationship are required.' };
    }

    const phoneResult = parseNigerianPhone(data.phone);
    if (!phoneResult.isValid) {
      return { success: false, error: phoneResult.error || 'Invalid Nigerian phone number.' };
    }

    const newPickup: AuthorizedPickup = {
      id: `pku_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      school_id: this.school.id,
      student_id: data.student_id,
      full_name: data.full_name.trim(),
      phone: phoneResult.formatted,
      relationship: data.relationship.trim(),
      id_number_ref: data.id_number_ref?.trim() || undefined,
      photo_url: data.photo_url || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.authorizedPickups = [newPickup, ...this.authorizedPickups];
    this.logAudit('AUTHORIZED_PICKUP_ADDED', 'authorized_pickup', newPickup.id, {
      student_id: data.student_id,
      pickup_person: newPickup.full_name,
      relationship: newPickup.relationship,
    });

    this.persist();
    return { success: true, authorizedPickup: newPickup };
  }

  // Attendance Recording with Duplicate Protection & Notification Trigger
  public async recordAttendance(params: {
    student_id: string;
    status: AttendanceStatus;
    remarks?: string;
    targetDate?: string;
    overrideDuplicate?: boolean;
  }): Promise<{
    success: boolean;
    record?: AttendanceRecord;
    error?: string;
    duplicateWarning?: boolean;
    notificationResults?: any[];
  }> {
    const targetDate = params.targetDate || getLagosDate();
    const existing = this.attendance.find(
      (a) => a.student_id === params.student_id && a.date === targetDate
    );

    if (existing && !params.overrideDuplicate) {
      return {
        success: false,
        duplicateWarning: true,
        error: `Attendance for this student has already been recorded today as "${existing.status}". Do you wish to make an authorized correction?`,
        record: existing,
      };
    }

    const studentDetails = this.getStudentWithDetails(params.student_id, targetDate);
    if (!studentDetails) {
      return { success: false, error: 'Student not found.' };
    }

    const nowLagosTime = getLagosTime();
    const isoTimestamp = new Date().toISOString();

    let record: AttendanceRecord;
    if (existing) {
      // Authorized correction
      existing.status = params.status;
      existing.remarks = params.remarks || existing.remarks;
      existing.updated_at = isoTimestamp;
      record = existing;
      this.logAudit('ATTENDANCE_CORRECTED', 'attendance', record.id, {
        student: studentDetails.full_name,
        new_status: params.status,
      });
    } else {
      record = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        school_id: this.school.id,
        student_id: params.student_id,
        date: targetDate,
        status: params.status,
        timestamp: isoTimestamp,
        recorded_by: this.currentProfile.id,
        recorded_by_name: this.currentProfile.full_name,
        remarks: params.remarks,
        created_at: isoTimestamp,
        updated_at: isoTimestamp,
      };
      this.attendance = [record, ...this.attendance];
      this.logAudit('ATTENDANCE_RECORDED', 'attendance', record.id, {
        student: studentDetails.full_name,
        status: params.status,
        time: nowLagosTime,
      });
    }

    // Save attendance immediately!
    this.persist();

    // Trigger Notifications if student arrived ('Present' or 'Late')
    let notificationResults: any[] = [];
    if (params.status === 'Present' || params.status === 'Late') {
      try {
        notificationResults = await this.dispatchNotificationEvent({
          eventType: 'arrival',
          student: studentDetails,
          time: nowLagosTime,
          date: targetDate,
        });
      } catch (err) {
        console.error('Notification dispatch error:', err);
        // Important: never discard attendance if notification dispatch fails
      }
    }

    return { success: true, record, notificationResults };
  }

  // Pickup Recording with Strict Authorized Person Validation & Duplicate Protection
  public async recordPickup(params: {
    student_id: string;
    pickup_person_id: string;
    remarks?: string;
    targetDate?: string;
    overrideDuplicate?: boolean;
  }): Promise<{
    success: boolean;
    record?: PickupRecord;
    error?: string;
    duplicateWarning?: boolean;
    notificationResults?: any[];
  }> {
    const targetDate = params.targetDate || getLagosDate();
    const existing = this.pickups.find(
      (p) => p.student_id === params.student_id && p.date === targetDate
    );

    if (existing && !params.overrideDuplicate) {
      return {
        success: false,
        duplicateWarning: true,
        error: `Student has already been marked as Picked Up today by ${existing.pickup_person_name} at ${existing.exact_time}. Do you wish to make an authorized correction?`,
        record: existing,
      };
    }

    const studentDetails = this.getStudentWithDetails(params.student_id, targetDate);
    if (!studentDetails) {
      return { success: false, error: 'Student not found.' };
    }

    // STRICT VALIDATION: Only active authorized pickup persons can be selected
    const pickupPerson = this.authorizedPickups.find(
      (ap) => ap.id === params.pickup_person_id && ap.student_id === params.student_id
    );

    if (!pickupPerson) {
      return {
        success: false,
        error: 'Unauthorized Pickup: The selected individual is not registered on this student\'s authorized pickup list.',
      };
    }

    if (!pickupPerson.is_active) {
      return {
        success: false,
        error: `Unauthorized Pickup: ${pickupPerson.full_name} is marked INACTIVE on the authorized pickup registry. Release denied.`,
      };
    }

    const nowLagosTime = getLagosTime();
    const isoTimestamp = new Date().toISOString();

    let record: PickupRecord;
    if (existing) {
      existing.pickup_person_id = pickupPerson.id;
      existing.pickup_person_name = pickupPerson.full_name;
      existing.relationship = pickupPerson.relationship;
      existing.exact_time = nowLagosTime;
      existing.timestamp = isoTimestamp;
      existing.releasing_staff_id = this.currentProfile.id;
      existing.releasing_staff_name = this.currentProfile.full_name;
      existing.remarks = params.remarks || existing.remarks;
      existing.updated_at = isoTimestamp;
      record = existing;
      this.logAudit('PICKUP_CORRECTED', 'pickup', record.id, {
        student: studentDetails.full_name,
        pickup_person: pickupPerson.full_name,
      });
    } else {
      record = {
        id: `pkr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        school_id: this.school.id,
        student_id: params.student_id,
        pickup_person_id: pickupPerson.id,
        pickup_person_name: pickupPerson.full_name,
        relationship: pickupPerson.relationship,
        date: targetDate,
        exact_time: nowLagosTime,
        timestamp: isoTimestamp,
        releasing_staff_id: this.currentProfile.id,
        releasing_staff_name: this.currentProfile.full_name,
        remarks: params.remarks,
        created_at: isoTimestamp,
        updated_at: isoTimestamp,
      };
      this.pickups = [record, ...this.pickups];
      this.logAudit('PICKUP_RECORDED', 'pickup', record.id, {
        student: studentDetails.full_name,
        pickup_person: pickupPerson.full_name,
        time: nowLagosTime,
      });
    }

    // Persist pickup record immediately
    this.persist();

    // Trigger Notification Dispatch
    let notificationResults: any[] = [];
    try {
      notificationResults = await this.dispatchNotificationEvent({
        eventType: 'pickup',
        student: studentDetails,
        time: nowLagosTime,
        date: targetDate,
        pickupPerson: {
          full_name: pickupPerson.full_name,
          relationship: pickupPerson.relationship,
        },
      });
    } catch (err) {
      console.error('Pickup notification error:', err);
    }

    return { success: true, record, notificationResults };
  }

  // Dispatch SMS & Email Notifications via AI Studio server-side API endpoints
  public async dispatchNotificationEvent(payload: {
    eventType: 'arrival' | 'pickup';
    student: StudentWithDetails;
    time: string;
    date: string;
    pickupPerson?: { full_name: string; relationship: string };
  }): Promise<any[]> {
    const parents = payload.student.parents;
    if (!parents || parents.length === 0) {
      return [];
    }

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: payload.eventType,
          student: {
            id: payload.student.id,
            full_name: payload.student.full_name,
            student_id: payload.student.student_id,
            class_name: payload.student.class_name,
            stream_name: payload.student.stream_name,
          },
          school: {
            id: this.school.id,
            name: this.school.name,
          },
          time: payload.time,
          date: payload.date,
          parents: parents.map((p) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            phone: p.phone,
            notification_preference: p.notification_preference,
          })),
          pickupPerson: payload.pickupPerson,
        }),
      });

      const data = await res.json();
      const results: any[] = data.results || [];

      // Save each notification outcome to this.notifications
      const newNotifs: NotificationRecord[] = results.map((r) => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        school_id: this.school.id,
        student_id: payload.student.id,
        student_name: payload.student.full_name,
        recipient_type: 'parent',
        recipient_id: r.parent_id,
        recipient_name: r.parent_name,
        channel: r.channel,
        destination: r.recipient,
        event_type: payload.eventType,
        message_title:
          payload.eventType === 'arrival'
            ? `Arrival: ${payload.student.full_name}`
            : `Pickup: ${payload.student.full_name}`,
        message_body:
          payload.eventType === 'arrival'
            ? `SchoolSafe: Your child ${payload.student.full_name} has arrived at school at ${payload.time}.`
            : `SchoolSafe: ${payload.student.full_name} has been picked up by ${payload.pickupPerson?.full_name || 'Authorized person'} at ${payload.time}.`,
        status: r.status,
        provider: r.provider || 'Termii/Resend',
        provider_ref: r.message_id,
        error_message: r.error || undefined,
        sent_at: r.sent_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }));

      this.notifications = [...newNotifs, ...this.notifications];
      this.persist();

      return results;
    } catch (err: any) {
      console.error('Server notification dispatch failed:', err);
      // Create a failed notification record so staff can see and retry
      parents.forEach((p) => {
        this.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          school_id: this.school.id,
          student_id: payload.student.id,
          student_name: payload.student.full_name,
          recipient_type: 'parent',
          recipient_id: p.id,
          recipient_name: p.full_name,
          channel: p.notification_preference === 'email_only' ? 'email' : 'sms',
          destination: p.notification_preference === 'email_only' ? p.email : p.phone,
          event_type: payload.eventType,
          message_title: `${payload.eventType === 'arrival' ? 'Arrival' : 'Pickup'} Notification`,
          message_body: `Notification for ${payload.student.full_name}`,
          status: 'Failed',
          provider: p.notification_preference === 'email_only' ? 'Resend' : 'Termii',
          error_message: err?.message || 'Server connection error during notification dispatch',
          created_at: new Date().toISOString(),
        });
      });
      this.persist();
      return [];
    }
  }

  // Retry a failed notification
  public async retryNotification(notificationId: string): Promise<boolean> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (!notif) return false;

    notif.status = 'Pending';
    this.persist();

    try {
      if (notif.channel === 'sms') {
        const res = await fetch('/api/notifications/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notif.destination,
            message: notif.message_body,
          }),
        });
        const data = await res.json();
        notif.status = data.status || (res.ok ? 'Sent' : 'Failed');
        notif.provider_ref = data.messageId;
        notif.error_message = data.error;
      } else {
        const res = await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notif.destination,
            subject: notif.message_title,
            text: notif.message_body,
          }),
        });
        const data = await res.json();
        notif.status = data.status || (res.ok ? 'Sent' : 'Failed');
        notif.provider_ref = data.messageId;
        notif.error_message = data.error;
      }
      notif.sent_at = new Date().toISOString();
      this.persist();
      return notif.status === 'Sent' || notif.status === 'Delivered';
    } catch (e: any) {
      notif.status = 'Failed';
      notif.error_message = e?.message || 'Retry failed';
      this.persist();
      return false;
    }
  }

  // Parent Management & Preference Update
  public updateParentPreference(parentId: string, preference: NotificationPreference): { success: boolean; error?: string } {
    const parent = this.parents.find((p) => p.id === parentId);
    if (!parent) return { success: false, error: 'Parent not found.' };

    // Check if administrator allows parents to update their preference
    if (this.currentProfile.role === 'parent' && !this.settings.allow_parent_preference_change) {
      return {
        success: false,
        error: 'School Administrator has locked notification preference updates. Please contact the school office.',
      };
    }

    parent.notification_preference = preference;
    parent.updated_at = new Date().toISOString();

    this.logAudit('PARENT_PREFERENCE_UPDATED', 'parent', parentId, {
      parent: parent.full_name,
      newPreference: preference,
    });
    this.persist();
    return { success: true };
  }

  public addParent(data: {
    full_name: string;
    email: string;
    phone: string;
    relationship: string;
    notification_preference?: NotificationPreference;
  }): { success: boolean; parent?: Parent; error?: string } {
    if (this.currentProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only an Administrator can add parents.' };
    }

    if (!data.full_name?.trim()) return { success: false, error: 'Parent full name is required.' };
    if (!data.phone?.trim()) return { success: false, error: 'Parent phone number is required.' };

    const phoneCheck = parseNigerianPhone(data.phone);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.error || 'Invalid Nigerian phone number.' };
    }

    const newParent: Parent = {
      id: `par_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      school_id: this.school.id,
      full_name: data.full_name.trim(),
      email: data.email?.trim() || '',
      phone: phoneCheck.formatted,
      relationship: data.relationship || 'Guardian',
      notification_preference: data.notification_preference || 'email_and_sms',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.parents = [newParent, ...this.parents];
    this.logAudit('PARENT_CREATED', 'parent', newParent.id, {
      parent: newParent.full_name,
      phone: newParent.phone,
    });
    this.persist();
    return { success: true, parent: newParent };
  }

  // School Settings Update (Admin Only)
  public updateSettings(newSettings: Partial<SchoolSettings>, newSchool?: Partial<School>): { success: boolean; error?: string } {
    if (this.currentProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only a School Administrator can modify settings.' };
    }

    this.settings = {
      ...this.settings,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };

    if (newSchool) {
      this.school = {
        ...this.school,
        ...newSchool,
        updated_at: new Date().toISOString(),
      };
    }

    this.logAudit('SETTINGS_UPDATED', 'settings', this.settings.id, { newSettings });
    this.persist();
    return { success: true };
  }

  // Convenience aliases for views
  public get notificationLogs(): NotificationRecord[] {
    return this.notifications;
  }

  public get users(): Profile[] {
    return this.profiles;
  }

  public getPickupsForDate(date: string): PickupRecord[] {
    return this.pickups.filter((p) => p.date === date);
  }

  public addAuditLog(action: string, entity: string, entityId: string, metadata?: Record<string, any>): void {
    this.logAudit(action, entity, entityId, metadata);
  }
}

export const store = new SchoolSafeStore();

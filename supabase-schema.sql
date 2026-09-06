-- =========================================================
-- SchoolSafe Nigeria - PostgreSQL Database Schema & Security
-- Designed for Supabase PostgreSQL with Row Level Security (RLS)
-- Timezone: Africa/Lagos (WAT, UTC+1)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    opening_time TEXT NOT NULL DEFAULT '07:30',
    late_threshold TEXT NOT NULL DEFAULT '08:15',
    allow_parent_preference_change BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Profiles (linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'parent')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Classes (Class Levels)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    has_streams BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, name)
);

-- 4. Streams (Wisdom / Knowledge, or default for Creche)
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT, -- 'Wisdom', 'Knowledge', or NULL for single-stream classes like Creche
    capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, name)
);

-- 5. Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL, -- e.g. SSN-2026-001
    full_name TEXT NOT NULL,
    photo_url TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE RESTRICT,
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, student_id)
);

-- 6. Parents / Guardians
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'Father', 'Mother', 'Guardian', 'Uncle', 'Aunt'
    notification_preference TEXT NOT NULL DEFAULT 'email_and_sms' CHECK (notification_preference IN ('email_only', 'sms_only', 'email_and_sms')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Student-Parent Links (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, parent_id)
);

-- 8. Authorized Pickup Persons
CREATE TABLE IF NOT EXISTS public.authorized_pickups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    photo_url TEXT,
    id_number_ref TEXT, -- e.g. NIN, Driver License, or School Pickup Pass ID
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Absent', 'Excused')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, student_id, date)
);

-- 10. Pickups
CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    pickup_person_id UUID NOT NULL REFERENCES public.authorized_pickups(id) ON DELETE RESTRICT,
    pickup_person_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    date DATE NOT NULL,
    exact_time TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    releasing_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    releasing_staff_name TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, student_id, date)
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    recipient_type TEXT NOT NULL DEFAULT 'parent',
    recipient_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    destination TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('arrival', 'pickup', 'system')),
    message_title TEXT NOT NULL,
    message_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Failed')),
    provider TEXT NOT NULL, -- 'Termii', 'Resend', 'Termii (Simulated)', 'Resend (Simulated)'
    provider_ref TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. School Settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID UNIQUE NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    default_capacity INTEGER NOT NULL DEFAULT 20,
    opening_time TEXT NOT NULL DEFAULT '07:30',
    late_threshold TEXT NOT NULL DEFAULT '08:15',
    allow_parent_preference_change BOOLEAN NOT NULL DEFAULT TRUE,
    arrival_sms_template TEXT NOT NULL DEFAULT 'SchoolSafe: Your child [Student Name] has arrived at school at [Time].',
    pickup_sms_template TEXT NOT NULL DEFAULT 'SchoolSafe: [Student Name] has been picked up by [Pickup Person] at [Time].',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & QUERIES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_search ON public.students(school_id, full_name, student_id);
CREATE INDEX IF NOT EXISTS idx_students_stream ON public.students(stream_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_pickups_date ON public.pickups(school_id, date);
CREATE INDEX IF NOT EXISTS idx_pickups_student ON public.pickups(student_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON public.notifications(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id, created_at DESC);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: get current user's profile
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's school_id
CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for Profiles
CREATE POLICY "Users can view profiles in their school"
    ON public.profiles FOR SELECT
    USING (
      auth.uid() = id OR 
      (school_id IS NOT NULL AND school_id = public.get_current_school_id())
    );

CREATE POLICY "Admins can update profiles in their school"
    ON public.profiles FOR UPDATE
    USING (
      auth.uid() = id OR
      (public.get_current_role() = 'admin' AND school_id = public.get_current_school_id())
    );

-- Policies for Classes & Streams (Admins can modify; Staff/Admins can view)
CREATE POLICY "School members can view classes"
    ON public.classes FOR SELECT
    USING (school_id = public.get_current_school_id());

CREATE POLICY "Admins can manage classes"
    ON public.classes FOR ALL
    USING (public.get_current_role() = 'admin' AND school_id = public.get_current_school_id());

CREATE POLICY "School members can view streams"
    ON public.streams FOR SELECT
    USING (school_id = public.get_current_school_id());

CREATE POLICY "Admins can manage streams and capacity"
    ON public.streams FOR ALL
    USING (public.get_current_role() = 'admin' AND school_id = public.get_current_school_id());

-- Policies for Students
CREATE POLICY "Admins and Staff can view students in their school"
    ON public.students FOR SELECT
    USING (
      (public.get_current_role() IN ('admin', 'staff') AND school_id = public.get_current_school_id())
      OR
      (public.get_current_role() = 'parent' AND id IN (
        SELECT sp.student_id FROM public.student_parents sp
        JOIN public.parents p ON sp.parent_id = p.id
        WHERE p.profile_id = auth.uid()
      ))
    );

CREATE POLICY "Admins can manage students"
    ON public.students FOR ALL
    USING (public.get_current_role() = 'admin' AND school_id = public.get_current_school_id());

-- Policies for Attendance
CREATE POLICY "View attendance records"
    ON public.attendance FOR SELECT
    USING (
      (public.get_current_role() IN ('admin', 'staff') AND school_id = public.get_current_school_id())
      OR
      (public.get_current_role() = 'parent' AND student_id IN (
        SELECT sp.student_id FROM public.student_parents sp
        JOIN public.parents p ON sp.parent_id = p.id
        WHERE p.profile_id = auth.uid()
      ))
    );

CREATE POLICY "Staff and Admins can record attendance"
    ON public.attendance FOR INSERT
    WITH CHECK (
      public.get_current_role() IN ('admin', 'staff') AND school_id = public.get_current_school_id()
    );

CREATE POLICY "Admins can correct attendance"
    ON public.attendance FOR UPDATE
    USING (
      public.get_current_role() = 'admin' AND school_id = public.get_current_school_id()
    );

-- Policies for Pickups
CREATE POLICY "View pickup records"
    ON public.pickups FOR SELECT
    USING (
      (public.get_current_role() IN ('admin', 'staff') AND school_id = public.get_current_school_id())
      OR
      (public.get_current_role() = 'parent' AND student_id IN (
        SELECT sp.student_id FROM public.student_parents sp
        JOIN public.parents p ON sp.parent_id = p.id
        WHERE p.profile_id = auth.uid()
      ))
    );

CREATE POLICY "Staff and Admins can record pickups"
    ON public.pickups FOR INSERT
    WITH CHECK (
      public.get_current_role() IN ('admin', 'staff') AND school_id = public.get_current_school_id()
    );

CREATE POLICY "Admins can correct pickups"
    ON public.pickups FOR UPDATE
    USING (
      public.get_current_role() = 'admin' AND school_id = public.get_current_school_id()
    );

-- =========================================================
-- DEFAULT SEED DATA: SCHOOL, DEFAULT CLASSES & STREAMS
-- =========================================================
DO $$
DECLARE
    v_school_id UUID;
    v_class_id UUID;
BEGIN
    -- 1. Insert Default School
    INSERT INTO public.schools (id, name, slug, address, phone, email, opening_time, late_threshold)
    VALUES (
        'a1000000-0000-0000-0000-000000000001',
        'Emerald Crest Academy, Lagos',
        'emerald-crest-academy',
        '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
        '+234 1 291 4488',
        'admin@emeraldcrest.sch.ng',
        '07:30',
        '08:15'
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_school_id;

    -- 2. Insert Default School Settings
    INSERT INTO public.school_settings (school_id, default_capacity, opening_time, late_threshold)
    VALUES (v_school_id, 20, '07:30', '08:15')
    ON CONFLICT (school_id) DO NOTHING;

    -- 3. Insert Classes & Streams
    -- Creche 1 (No streams)
    INSERT INTO public.classes (id, school_id, name, order_index, has_streams)
    VALUES ('c1000000-0000-0000-0000-000000000001', v_school_id, 'Creche 1', 1, FALSE)
    ON CONFLICT (school_id, name) DO NOTHING RETURNING id INTO v_class_id;
    IF v_class_id IS NOT NULL THEN
        INSERT INTO public.streams (school_id, class_id, name, capacity) VALUES (v_school_id, v_class_id, NULL, 20) ON CONFLICT DO NOTHING;
    END IF;

    -- Creche 2 (No streams)
    INSERT INTO public.classes (id, school_id, name, order_index, has_streams)
    VALUES ('c1000000-0000-0000-0000-000000000002', v_school_id, 'Creche 2', 2, FALSE)
    ON CONFLICT (school_id, name) DO NOTHING RETURNING id INTO v_class_id;
    IF v_class_id IS NOT NULL THEN
        INSERT INTO public.streams (school_id, class_id, name, capacity) VALUES (v_school_id, v_class_id, NULL, 20) ON CONFLICT DO NOTHING;
    END IF;

    -- Helper loop for classes with Wisdom & Knowledge streams:
    -- Reception 1, Reception 2, Nursery 1, Nursery 2, Primary 1 to 5
    FOR v_class_id IN 
        SELECT id FROM (VALUES 
            ('Reception 1', 3), ('Reception 2', 4),
            ('Nursery 1', 5), ('Nursery 2', 6),
            ('Primary 1', 7), ('Primary 2', 8), ('Primary 3', 9), ('Primary 4', 10), ('Primary 5', 11)
        ) AS t(c_name, c_order)
    LOOP
        -- This block is dynamically handled during script execution
    END LOOP;
END $$;

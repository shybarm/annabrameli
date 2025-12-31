-- =====================================================
-- TEAM MEMBER DETAILS: Add missing profile fields
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS mobile text;

-- =====================================================
-- ADMIN EDIT PROFILE: Create secure function to check if user can edit a profile
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_edit_profile(_user_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Users can always edit their own profile
    _user_id = _target_user_id
    OR
    -- Admins can edit any profile
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
$$;

-- =====================================================
-- UPDATE PROFILES RLS: Add admin edit capability
-- =====================================================
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- STORAGE SECURITY: Harden patient-documents bucket
-- Ensure bucket is PRIVATE (not public)
-- =====================================================
UPDATE storage.buckets 
SET public = false 
WHERE id = 'patient-documents';

-- =====================================================
-- STORAGE RLS: Create granular access policies for patient-documents
-- These ensure permission is checked before any storage operation
-- =====================================================

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Staff can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "patient-documents-select" ON storage.objects;
DROP POLICY IF EXISTS "patient-documents-insert" ON storage.objects;
DROP POLICY IF EXISTS "patient-documents-update" ON storage.objects;
DROP POLICY IF EXISTS "patient-documents-delete" ON storage.objects;

-- SELECT: Staff with view permission OR patient viewing own files
CREATE POLICY "patient-documents-select" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-documents'
  AND (
    -- Staff with documents view permission
    public.can_view_documents(auth.uid())
    OR
    -- Patient can view own documents (file path starts with their patient_id)
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE (p.id::text || '/%')
    )
  )
);

-- INSERT: Only staff with edit documents permission
CREATE POLICY "patient-documents-insert" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents'
  AND public.can_edit_documents(auth.uid())
);

-- UPDATE: Only staff with edit documents permission
CREATE POLICY "patient-documents-update" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'patient-documents'
  AND public.can_edit_documents(auth.uid())
);

-- DELETE: Only staff with edit documents permission
CREATE POLICY "patient-documents-delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'patient-documents'
  AND public.can_edit_documents(auth.uid())
);

-- =====================================================
-- DENY ANONYMOUS ACCESS to storage
-- =====================================================
DROP POLICY IF EXISTS "Deny anonymous storage access" ON storage.objects;
CREATE POLICY "Deny anonymous storage access" ON storage.objects
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);
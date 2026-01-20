-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in uploads bucket
CREATE POLICY "Public read access for uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow service role (API) to upload/manage all files
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'service_role'
);

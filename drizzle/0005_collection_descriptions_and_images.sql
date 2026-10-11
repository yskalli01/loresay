ALTER TABLE "collections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_description_limit" CHECK ("description" IS NULL OR char_length("description") <= 1000);--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collection-images',
  'collection-images',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

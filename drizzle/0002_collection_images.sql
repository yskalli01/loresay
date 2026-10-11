ALTER TABLE "collections" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_image_url_limit" CHECK ("image_url" IS NULL OR char_length("image_url") <= 2000);

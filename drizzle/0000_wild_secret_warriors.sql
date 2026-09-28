CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."ingestion_job_status" AS ENUM('queued', 'running', 'succeeded', 'failed_retryable', 'failed_terminal');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('draft', 'processing', 'ready', 'failed', 'deleted', 'purged');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('note', 'document', 'url', 'connector');--> statement-breakpoint
CREATE TABLE "answer_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"chunk_id" uuid,
	"source_id_snapshot" uuid NOT NULL,
	"source_type_snapshot" "source_type" NOT NULL,
	"source_title_snapshot" varchar(200) NOT NULL,
	"source_fingerprint_snapshot" text NOT NULL,
	"source_content_id_snapshot" uuid NOT NULL,
	"content_version_snapshot" integer NOT NULL,
	"chunk_position_snapshot" integer NOT NULL,
	"chunk_hash_snapshot" text NOT NULL,
	"location_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quote" varchar(1000),
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_citations_rank_range" CHECK ("answer_citations"."rank" between 1 and 20)
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_content_limit" CHECK (char_length("chat_messages"."content") <= 32768)
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_threads_title_limit" CHECK (char_length("chat_threads"."title") <= 200)
);
--> statement-breakpoint
CREATE TABLE "chunk_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"dimensions" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chunk_embeddings_dimensions_match" CHECK ("chunk_embeddings"."dimensions" = 1536)
);
--> statement-breakpoint
CREATE TABLE "collection_sources" (
	"collection_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_sources_pk" PRIMARY KEY("collection_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_name_limit" CHECK (char_length("collections"."name") <= 200)
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "ingestion_job_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"retryable" boolean DEFAULT true NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_jobs_attempts_valid" CHECK ("ingestion_jobs"."attempts" >= 0),
	CONSTRAINT "ingestion_jobs_terminal_not_retryable" CHECK ("ingestion_jobs"."status" != 'failed_terminal' or "ingestion_jobs"."retryable" = false)
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "source_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"status" "source_status" NOT NULL,
	"fingerprint" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_sources_title_limit" CHECK (char_length("knowledge_sources"."title") <= 200)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrieval_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retrieval_run_id" uuid NOT NULL,
	"chunk_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retrieval_results_rank_range" CHECK ("retrieval_results"."rank" between 1 and 50)
);
--> statement-breakpoint
CREATE TABLE "retrieval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"query" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"prompt_context_hash" text NOT NULL,
	"duration_ms" integer,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retrieval_runs_duration_valid" CHECK ("retrieval_runs"."duration_ms" is null or "retrieval_runs"."duration_ms" >= 0),
	CONSTRAINT "retrieval_runs_token_count_valid" CHECK ("retrieval_runs"."token_count" is null or "retrieval_runs"."token_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "source_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_content_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"token_count" integer NOT NULL,
	"content_hash" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_chunks_position_positive" CHECK ("source_chunks"."position" > 0),
	CONSTRAINT "source_chunks_token_count_valid" CHECK ("source_chunks"."token_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "source_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"text" text NOT NULL,
	"content_hash" text NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_contents_version_positive" CHECK ("source_contents"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "source_tags" (
	"source_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_tags_pk" PRIMARY KEY("source_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_limit" CHECK (char_length("tags"."name") <= 40)
);
--> statement-breakpoint
ALTER TABLE "answer_citations" ADD CONSTRAINT "answer_citations_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_citations" ADD CONSTRAINT "answer_citations_chunk_id_source_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunk_embeddings" ADD CONSTRAINT "chunk_embeddings_chunk_id_source_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_sources" ADD CONSTRAINT "collection_sources_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_sources" ADD CONSTRAINT "collection_sources_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_results" ADD CONSTRAINT "retrieval_results_retrieval_run_id_retrieval_runs_id_fk" FOREIGN KEY ("retrieval_run_id") REFERENCES "public"."retrieval_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_results" ADD CONSTRAINT "retrieval_results_chunk_id_source_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_runs" ADD CONSTRAINT "retrieval_runs_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_chunks" ADD CONSTRAINT "source_chunks_source_content_id_source_contents_id_fk" FOREIGN KEY ("source_content_id") REFERENCES "public"."source_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_chunks" ADD CONSTRAINT "source_chunks_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_contents" ADD CONSTRAINT "source_contents_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_tags" ADD CONSTRAINT "source_tags_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_tags" ADD CONSTRAINT "source_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answer_citations_message_rank_idx" ON "answer_citations" USING btree ("message_id","rank");--> statement-breakpoint
CREATE INDEX "chat_messages_thread_created_idx" ON "chat_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_threads_user_updated_idx" ON "chat_threads" USING btree ("user_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "chunk_embeddings_model_hash_idx" ON "chunk_embeddings" USING btree ("chunk_id","provider","model","content_hash");--> statement-breakpoint
CREATE INDEX "chunk_embeddings_vector_idx" ON "chunk_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "collections_user_name_idx" ON "collections" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "ingestion_jobs_source_created_idx" ON "ingestion_jobs" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_sources_active_fingerprint_idx" ON "knowledge_sources" USING btree ("user_id","type","fingerprint") WHERE "knowledge_sources"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "knowledge_sources_user_updated_idx" ON "knowledge_sources" USING btree ("user_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "knowledge_sources_user_status_idx" ON "knowledge_sources" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "retrieval_results_run_rank_idx" ON "retrieval_results" USING btree ("retrieval_run_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "retrieval_runs_message_idx" ON "retrieval_runs" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_chunks_content_position_idx" ON "source_chunks" USING btree ("source_content_id","position");--> statement-breakpoint
CREATE INDEX "source_chunks_source_active_idx" ON "source_chunks" USING btree ("source_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "source_contents_source_version_idx" ON "source_contents" USING btree ("source_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "source_contents_one_active_idx" ON "source_contents" USING btree ("source_id") WHERE "source_contents"."active" = true;--> statement-breakpoint
CREATE INDEX "source_contents_source_idx" ON "source_contents" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");

--> statement-breakpoint
-- Owner scoped row level security policies.

alter table profiles enable row level security;
alter table knowledge_sources enable row level security;
alter table source_contents enable row level security;
alter table source_chunks enable row level security;
alter table chunk_embeddings enable row level security;
alter table ingestion_jobs enable row level security;
alter table collections enable row level security;
alter table collection_sources enable row level security;
alter table tags enable row level security;
alter table source_tags enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table retrieval_runs enable row level security;
alter table retrieval_results enable row level security;
alter table answer_citations enable row level security;

create policy "profiles are owner scoped" on profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());

create policy "knowledge sources are owner scoped" on knowledge_sources
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "source contents are owner scoped" on source_contents
  for all using (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = source_contents.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = source_contents.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "source chunks are owner scoped" on source_chunks
  for all using (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = source_chunks.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = source_chunks.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "chunk embeddings are owner scoped" on chunk_embeddings
  for all using (
    exists (
      select 1 from source_chunks
      join knowledge_sources on knowledge_sources.id = source_chunks.source_id
      where source_chunks.id = chunk_embeddings.chunk_id
      and knowledge_sources.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from source_chunks
      join knowledge_sources on knowledge_sources.id = source_chunks.source_id
      where source_chunks.id = chunk_embeddings.chunk_id
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "ingestion jobs are owner scoped" on ingestion_jobs
  for all using (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = ingestion_jobs.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from knowledge_sources
      where knowledge_sources.id = ingestion_jobs.source_id
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "collections are owner scoped" on collections
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "collection sources are owner scoped" on collection_sources
  for all using (
    exists (
      select 1 from collections
      where collections.id = collection_sources.collection_id
      and collections.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from collections
      join knowledge_sources on knowledge_sources.id = collection_sources.source_id
      where collections.id = collection_sources.collection_id
      and collections.user_id = auth.uid()
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "tags are owner scoped" on tags
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "source tags are owner scoped" on source_tags
  for all using (
    exists (
      select 1 from tags
      where tags.id = source_tags.tag_id
      and tags.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tags
      join knowledge_sources on knowledge_sources.id = source_tags.source_id
      where tags.id = source_tags.tag_id
      and tags.user_id = auth.uid()
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "chat threads are owner scoped" on chat_threads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "chat messages are owner scoped" on chat_messages
  for all using (
    exists (
      select 1 from chat_threads
      where chat_threads.id = chat_messages.thread_id
      and chat_threads.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_threads
      where chat_threads.id = chat_messages.thread_id
      and chat_threads.user_id = auth.uid()
    )
  );

create policy "retrieval runs are owner scoped" on retrieval_runs
  for all using (
    exists (
      select 1 from chat_messages
      join chat_threads on chat_threads.id = chat_messages.thread_id
      where chat_messages.id = retrieval_runs.message_id
      and chat_threads.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_messages
      join chat_threads on chat_threads.id = chat_messages.thread_id
      where chat_messages.id = retrieval_runs.message_id
      and chat_threads.user_id = auth.uid()
    )
  );

create policy "retrieval results are owner scoped" on retrieval_results
  for all using (
    exists (
      select 1 from retrieval_runs
      join chat_messages on chat_messages.id = retrieval_runs.message_id
      join chat_threads on chat_threads.id = chat_messages.thread_id
      where retrieval_runs.id = retrieval_results.retrieval_run_id
      and chat_threads.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from retrieval_runs
      join chat_messages on chat_messages.id = retrieval_runs.message_id
      join chat_threads on chat_threads.id = chat_messages.thread_id
      join source_chunks on source_chunks.id = retrieval_results.chunk_id
      join knowledge_sources on knowledge_sources.id = source_chunks.source_id
      where retrieval_runs.id = retrieval_results.retrieval_run_id
      and chat_threads.user_id = auth.uid()
      and knowledge_sources.user_id = auth.uid()
    )
  );

create policy "answer citations are owner scoped" on answer_citations
  for all using (
    exists (
      select 1 from chat_messages
      join chat_threads on chat_threads.id = chat_messages.thread_id
      where chat_messages.id = answer_citations.message_id
      and chat_threads.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_messages
      join chat_threads on chat_threads.id = chat_messages.thread_id
      where chat_messages.id = answer_citations.message_id
      and chat_threads.user_id = auth.uid()
    )
  );


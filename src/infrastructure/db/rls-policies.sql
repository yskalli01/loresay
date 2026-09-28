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

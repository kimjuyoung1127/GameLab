create or replace function public.create_upload_session_with_files(
  p_session jsonb,
  p_files jsonb,
  p_suggestions jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  file_row jsonb;
  suggestion_row jsonb;
begin
  insert into public.sst_sessions (
    id,
    name,
    device_type,
    status,
    file_count,
    progress,
    score,
    created_at
  )
  values (
    p_session->>'id',
    p_session->>'name',
    coalesce(p_session->>'device_type', 'Unknown'),
    coalesce(p_session->>'status', 'pending'),
    coalesce((p_session->>'file_count')::int, 0),
    coalesce((p_session->>'progress')::int, 0),
    nullif(p_session->>'score', '')::numeric,
    coalesce((p_session->>'created_at')::timestamptz, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    device_type = excluded.device_type,
    status = excluded.status,
    file_count = excluded.file_count,
    progress = excluded.progress,
    score = excluded.score,
    created_at = excluded.created_at;

  for file_row in select * from jsonb_array_elements(p_files)
  loop
    insert into public.sst_audio_files (
      id,
      session_id,
      filename,
      duration,
      sample_rate,
      status,
      audio_url,
      created_at
    )
    values (
      file_row->>'id',
      file_row->>'session_id',
      file_row->>'filename',
      file_row->>'duration',
      file_row->>'sample_rate',
      file_row->>'status',
      file_row->>'audio_url',
      coalesce((file_row->>'created_at')::timestamptz, now())
    );
  end loop;

  for suggestion_row in select * from jsonb_array_elements(p_suggestions)
  loop
    insert into public.sst_suggestions (
      id,
      audio_id,
      label,
      confidence,
      description,
      start_time,
      end_time,
      freq_low,
      freq_high,
      status,
      created_at
    )
    values (
      suggestion_row->>'id',
      suggestion_row->>'audio_id',
      suggestion_row->>'label',
      coalesce((suggestion_row->>'confidence')::int, 0),
      coalesce(suggestion_row->>'description', ''),
      coalesce((suggestion_row->>'start_time')::double precision, 0),
      coalesce((suggestion_row->>'end_time')::double precision, 0),
      coalesce((suggestion_row->>'freq_low')::int, 0),
      coalesce((suggestion_row->>'freq_high')::int, 0),
      coalesce(suggestion_row->>'status', 'pending'),
      coalesce((suggestion_row->>'created_at')::timestamptz, now())
    );
  end loop;
end;
$$;

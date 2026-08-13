-- Backfill `project_links` from legacy fields like `video_url` in portfolio_items

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'project_links'
  ) THEN
    -- For rows with a non-null video_url and empty project_links, append a link entry
    UPDATE public.portfolio_items
    SET project_links = COALESCE(project_links, '[]'::jsonb) || to_jsonb(ARRAY[
      jsonb_build_object('label', 'Video', 'url', video_url, 'type', 'demo')
    ])::jsonb
    WHERE (project_links IS NULL OR project_links = '[]'::jsonb)
      AND video_url IS NOT NULL
      AND trim(video_url) <> '';

    -- If other legacy columns exist (e.g., "project_url"), add similar backfills here
  END IF;
END;
$$;


ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_unique_daily UNIQUE (user_id, entry_date);

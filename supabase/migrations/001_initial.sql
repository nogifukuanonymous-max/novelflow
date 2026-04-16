-- ══════════════════════════════════════════════════════════
-- NovelFlow — Supabase Migration v1.0
-- 実行順序: このファイルを Supabase SQL Editor に貼り付けて実行
-- ══════════════════════════════════════════════════════════

-- ── 拡張機能 ──
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- 全文検索用

-- ══════════════════════════════════════════════════════════
-- 1. USERS（profiles テーブル）
--    Supabase Auth の auth.users と 1:1 で紐付け
-- ══════════════════════════════════════════════════════════
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    varchar(50)  not null,
  username        varchar(30)  not null unique,
  avatar_url      text,
  bio             text,
  role            varchar(20)  not null default 'reader'
                    check (role in ('reader','author','admin')),
  is_banned       boolean      not null default false,
  follower_count  integer      not null default 0,
  following_count integer      not null default 0,
  work_count      integer      not null default 0,
  total_like_count integer     not null default 0,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  deleted_at      timestamptz
);

-- Auth 新規登録時に自動でプロフィール行を作成するトリガー
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username',
             'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- 2. FOLLOWS
-- ══════════════════════════════════════════════════════════
create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- フォロー数をカウンタで維持
create or replace function public.update_follow_counts()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = following_count - 1 where id = old.follower_id;
    update public.profiles set follower_count  = follower_count  - 1 where id = old.followee_id;
  end if;
  return null;
end;
$$;
create trigger trg_follow_counts
  after insert or delete on public.follows
  for each row execute procedure public.update_follow_counts();

-- ══════════════════════════════════════════════════════════
-- 3. TAGS
-- ══════════════════════════════════════════════════════════
create table public.tags (
  id    uuid primary key default uuid_generate_v4(),
  name  varchar(50) not null unique
);

-- ══════════════════════════════════════════════════════════
-- 4. NOVEL_WORKS
-- ══════════════════════════════════════════════════════════
create table public.novel_works (
  id                   uuid primary key default uuid_generate_v4(),
  author_id            uuid not null references public.profiles(id) on delete cascade,
  title                varchar(200) not null,
  synopsis             text,
  genre                varchar(30)  not null
                         check (genre in ('romance','sf','fantasy','horror','mystery','comedy','historical','other')),
  age_rating           varchar(10)  not null default 'all'
                         check (age_rating in ('all','r15','r18')),
  serial_status        varchar(20)  not null default 'ongoing'
                         check (serial_status in ('ongoing','completed','hiatus')),
  reading_mode         varchar(20)  not null default 'both'
                         check (reading_mode in ('both','flip_only','scroll_only')),
  thumbnail_url        text,
  total_char_count     integer      not null default 0,
  episode_count        smallint     not null default 0,
  like_count           integer      not null default 0,
  read_complete_count  integer      not null default 0,
  is_published         boolean      not null default false,
  published_at         timestamptz,
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now(),
  deleted_at           timestamptz
);

-- タグ中間テーブル
create table public.work_tags (
  work_id  uuid not null references public.novel_works(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (work_id, tag_id)
);

-- 全文検索インデックス（title + synopsis）
create index idx_works_fts on public.novel_works
  using gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(synopsis,'')));
create index idx_works_title_trgm on public.novel_works using gin(title gin_trgm_ops);
create index idx_works_author    on public.novel_works(author_id);
create index idx_works_genre     on public.novel_works(genre, serial_status, is_published);
create index idx_works_likes     on public.novel_works(like_count desc);
create index idx_works_published on public.novel_works(published_at desc);

-- ══════════════════════════════════════════════════════════
-- 5. NAME_CHARS（名前変換キャラクター）
-- ══════════════════════════════════════════════════════════
create table public.name_chars (
  id           uuid primary key default uuid_generate_v4(),
  work_id      uuid not null references public.novel_works(id) on delete cascade,
  display_name varchar(50)  not null,
  reading      varchar(100) not null,
  gender       varchar(10)  check (gender in ('male','female','neutral')),
  sort_order   smallint     not null default 0,
  created_at   timestamptz  not null default now()
);
create index idx_name_chars_work on public.name_chars(work_id, sort_order);

-- ══════════════════════════════════════════════════════════
-- 6. CHAPTERS
-- ══════════════════════════════════════════════════════════
create table public.chapters (
  id         uuid primary key default uuid_generate_v4(),
  work_id    uuid not null references public.novel_works(id) on delete cascade,
  title      varchar(100) not null,
  sort_order smallint     not null default 0,
  created_at timestamptz  not null default now()
);
create index idx_chapters_work on public.chapters(work_id, sort_order);

-- ══════════════════════════════════════════════════════════
-- 7. EPISODES
-- ══════════════════════════════════════════════════════════
create table public.episodes (
  id           uuid primary key default uuid_generate_v4(),
  work_id      uuid not null references public.novel_works(id) on delete cascade,
  chapter_id   uuid references public.chapters(id) on delete set null,
  title        varchar(200) not null,
  body_json    jsonb        not null default '{}',
  char_count   integer      not null default 0,
  sort_order   smallint     not null default 0,
  is_published boolean      not null default false,
  publish_at   timestamptz,
  has_image    boolean      not null default false,
  has_video    boolean      not null default false,
  like_count   integer      not null default 0,
  published_at timestamptz,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now(),
  deleted_at   timestamptz
);
create index idx_episodes_work       on public.episodes(work_id, sort_order);
create index idx_episodes_publish_at on public.episodes(publish_at) where is_published = false;

-- エピソード公開時に novel_works のカウンタを更新
create or replace function public.update_work_episode_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.is_published = true then
    update public.novel_works
    set episode_count = episode_count + 1,
        total_char_count = total_char_count + new.char_count,
        published_at = coalesce(published_at, now()),
        updated_at = now()
    where id = new.work_id;
  elsif tg_op = 'UPDATE' then
    if old.is_published = false and new.is_published = true then
      update public.novel_works
      set episode_count = episode_count + 1,
          total_char_count = total_char_count + new.char_count,
          published_at = coalesce(published_at, now()),
          updated_at = now()
      where id = new.work_id;
    elsif old.is_published = true and new.is_published = false then
      update public.novel_works
      set episode_count = greatest(0, episode_count - 1),
          total_char_count = greatest(0, total_char_count - old.char_count),
          updated_at = now()
      where id = new.work_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_episode_count
  after insert or update on public.episodes
  for each row execute procedure public.update_work_episode_count();

-- ══════════════════════════════════════════════════════════
-- 8. EPISODE_MEDIA_SLOTS
-- ══════════════════════════════════════════════════════════
create table public.episode_media_slots (
  id                 uuid primary key default uuid_generate_v4(),
  episode_id         uuid not null references public.episodes(id) on delete cascade,
  slot_key           varchar(50)  not null,
  default_media_url  text,
  default_media_type varchar(10)  check (default_media_type in ('image','video')),
  alt_text           varchar(300),
  sort_order         smallint     not null default 0,
  created_at         timestamptz  not null default now(),
  unique (episode_id, slot_key)
);
create index idx_slots_episode on public.episode_media_slots(episode_id, sort_order);

-- ══════════════════════════════════════════════════════════
-- 9. MEDIA_PACKS
-- ══════════════════════════════════════════════════════════
create table public.media_packs (
  id               uuid primary key default uuid_generate_v4(),
  work_id          uuid not null references public.novel_works(id) on delete cascade,
  author_id        uuid not null references public.profiles(id) on delete cascade,
  pack_name        varchar(100) not null,
  description      text,
  thumbnail_url    text,
  file_url         text,
  signature_hash   varchar(255) not null,
  version          varchar(20)  not null default '1.0.0',
  is_published     boolean      not null default false,
  download_count   integer      not null default 0,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);
create index idx_packs_work on public.media_packs(work_id, is_published);

create table public.pack_media_maps (
  id              uuid primary key default uuid_generate_v4(),
  pack_id         uuid not null references public.media_packs(id) on delete cascade,
  slot_id         uuid not null references public.episode_media_slots(id) on delete cascade,
  media_url       text not null,
  media_type      varchar(10) not null check (media_type in ('image','video')),
  file_size_bytes bigint,
  unique (pack_id, slot_id)
);
create index idx_pack_maps on public.pack_media_maps(pack_id, slot_id);

-- ══════════════════════════════════════════════════════════
-- 10. USER_PACK_IMPORTS
-- ══════════════════════════════════════════════════════════
create table public.user_pack_imports (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  pack_id     uuid not null references public.media_packs(id) on delete cascade,
  is_active   boolean      not null default false,
  imported_at timestamptz  not null default now(),
  unique (user_id, pack_id)
);
create index idx_pack_imports_user on public.user_pack_imports(user_id, is_active);

-- ══════════════════════════════════════════════════════════
-- 11. BOOKMARKS
-- ══════════════════════════════════════════════════════════
create table public.bookmarks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  work_id     uuid not null references public.novel_works(id) on delete cascade,
  folder_name varchar(50),
  created_at  timestamptz not null default now(),
  unique (user_id, work_id)
);
create index idx_bookmarks_user on public.bookmarks(user_id, created_at desc);

-- ══════════════════════════════════════════════════════════
-- 12. READ_PROGRESSES
-- ══════════════════════════════════════════════════════════
create table public.read_progresses (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  work_id             uuid not null references public.novel_works(id) on delete cascade,
  last_episode_id     uuid references public.episodes(id) on delete set null,
  last_scroll_pct     smallint,
  last_flip_page      smallint,
  completed_at        timestamptz,
  updated_at          timestamptz not null default now(),
  unique (user_id, work_id)
);
create index idx_progress_user on public.read_progresses(user_id, updated_at desc);

-- ══════════════════════════════════════════════════════════
-- 13. LIKES
-- ══════════════════════════════════════════════════════════
create table public.likes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, episode_id)
);
create index idx_likes_episode on public.likes(episode_id);

-- いいね時に episode / work のカウンタを更新
create or replace function public.update_like_counts()
returns trigger language plpgsql as $$
declare
  v_work_id uuid;
begin
  select work_id into v_work_id from public.episodes where id = coalesce(new.episode_id, old.episode_id);
  if tg_op = 'INSERT' then
    update public.episodes    set like_count = like_count + 1 where id = new.episode_id;
    update public.novel_works set like_count = like_count + 1 where id = v_work_id;
    update public.profiles    set total_like_count = total_like_count + 1
      where id = (select author_id from public.novel_works where id = v_work_id);
  elsif tg_op = 'DELETE' then
    update public.episodes    set like_count = greatest(0, like_count - 1) where id = old.episode_id;
    update public.novel_works set like_count = greatest(0, like_count - 1) where id = v_work_id;
    update public.profiles    set total_like_count = greatest(0, total_like_count - 1)
      where id = (select author_id from public.novel_works where id = v_work_id);
  end if;
  return null;
end;
$$;
create trigger trg_like_counts
  after insert or delete on public.likes
  for each row execute procedure public.update_like_counts();

-- ══════════════════════════════════════════════════════════
-- 14. COMMENTS
-- ══════════════════════════════════════════════════════════
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  body        text not null check (char_length(body) <= 500),
  like_count  integer not null default 0,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_comments_episode on public.comments(episode_id, created_at desc);

-- ══════════════════════════════════════════════════════════
-- 15. NOTIFICATIONS
-- ══════════════════════════════════════════════════════════
create table public.notifications (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           varchar(30) not null
                   check (type in ('like','follow','comment','new_episode','new_pack','system')),
  actor_id       uuid references public.profiles(id) on delete set null,
  work_id        uuid references public.novel_works(id) on delete set null,
  episode_id     uuid references public.episodes(id)   on delete set null,
  pack_id        uuid references public.media_packs(id) on delete set null,
  message        text,
  is_read        boolean     not null default false,
  created_at     timestamptz not null default now()
);
create index idx_notif_user on public.notifications(user_id, is_read, created_at desc);

-- ══════════════════════════════════════════════════════════
-- 16. REPORTS
-- ══════════════════════════════════════════════════════════
create table public.reports (
  id           uuid primary key default uuid_generate_v4(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  varchar(20) not null check (target_type in ('work','episode','comment','user')),
  target_id    uuid not null,
  reason       varchar(50) not null
                 check (reason in ('spam','copyright','age_rating','violence','other')),
  detail       text,
  status       varchar(20) not null default 'pending'
                 check (status in ('pending','reviewed','dismissed','action_taken')),
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_reports_status on public.reports(status, created_at desc);

-- ══════════════════════════════════════════════════════════
-- 17. RLS（Row Level Security）ポリシー
-- ══════════════════════════════════════════════════════════

-- profiles
alter table public.profiles enable row level security;
create policy "profiles_select_all"  on public.profiles for select using (deleted_at is null);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);

-- novel_works
alter table public.novel_works enable row level security;
create policy "works_select_published" on public.novel_works for select
  using (is_published = true and deleted_at is null);
create policy "works_select_own"       on public.novel_works for select
  using (author_id = auth.uid());
create policy "works_insert_own"       on public.novel_works for insert
  with check (author_id = auth.uid());
create policy "works_update_own"       on public.novel_works for update
  using (author_id = auth.uid());
create policy "works_delete_own"       on public.novel_works for delete
  using (author_id = auth.uid());

-- episodes（公開エピソードは誰でも読める、下書きは作者のみ）
alter table public.episodes enable row level security;
create policy "episodes_select_published" on public.episodes for select
  using (is_published = true and deleted_at is null);
create policy "episodes_select_own" on public.episodes for select
  using ((select author_id from public.novel_works where id = work_id) = auth.uid());
create policy "episodes_write_own" on public.episodes for all
  using ((select author_id from public.novel_works where id = work_id) = auth.uid());

-- name_chars, chapters, episode_media_slots（作品作者のみ編集）
alter table public.name_chars enable row level security;
create policy "name_chars_all" on public.name_chars for all
  using ((select author_id from public.novel_works where id = work_id) = auth.uid());
create policy "name_chars_select" on public.name_chars for select
  using ((select is_published from public.novel_works where id = work_id) = true);

alter table public.chapters enable row level security;
create policy "chapters_select" on public.chapters for select using (true);
create policy "chapters_write"  on public.chapters for all
  using ((select author_id from public.novel_works where id = work_id) = auth.uid());

-- bookmarks
alter table public.bookmarks enable row level security;
create policy "bookmarks_own" on public.bookmarks for all using (user_id = auth.uid());

-- read_progresses
alter table public.read_progresses enable row level security;
create policy "progress_own" on public.read_progresses for all using (user_id = auth.uid());

-- likes
alter table public.likes enable row level security;
create policy "likes_select" on public.likes for select using (true);
create policy "likes_write"  on public.likes for all using (user_id = auth.uid());

-- comments
alter table public.comments enable row level security;
create policy "comments_select" on public.comments for select
  using (is_hidden = false and deleted_at is null);
create policy "comments_write" on public.comments for insert
  with check (user_id = auth.uid());
create policy "comments_delete" on public.comments for delete
  using (user_id = auth.uid());

-- notifications
alter table public.notifications enable row level security;
create policy "notif_own" on public.notifications for all using (user_id = auth.uid());

-- media_packs
alter table public.media_packs enable row level security;
create policy "packs_select_published" on public.media_packs for select
  using (is_published = true);
create policy "packs_write_own" on public.media_packs for all
  using (author_id = auth.uid());

-- user_pack_imports
alter table public.user_pack_imports enable row level security;
create policy "pack_imports_own" on public.user_pack_imports for all
  using (user_id = auth.uid());

-- follows
alter table public.follows enable row level security;
create policy "follows_select" on public.follows for select using (true);
create policy "follows_write"  on public.follows for all using (follower_id = auth.uid());

-- reports
alter table public.reports enable row level security;
create policy "reports_insert" on public.reports for insert with check (reporter_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- 18. SEED DATA（開発用サンプルデータ）
-- ══════════════════════════════════════════════════════════
-- ※ 実際のユーザーIDは auth.users から取得して置き換えること

-- タグ
insert into public.tags (name) values
  ('恋愛'),('純愛'),('再会'),('SF'),('図書館'),('ホラー'),('怪異'),
  ('ファンタジー'),('魔法'),('歴史'),('コメディ'),('日常')
on conflict (name) do nothing;

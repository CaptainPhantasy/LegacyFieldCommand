-- Migration: Add item comments, attachments, and activity logs tables
-- This supports ItemDetailsPanel features: Updates, Files, and Activity tabs

-- ============================================================================
-- 1. ITEM COMMENTS (Updates/Comments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Item Comments
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view comments for accessible items" ON public.item_comments;
DROP POLICY IF EXISTS "Users can create comments for accessible items" ON public.item_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.item_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.item_comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.item_comments;

-- Users can view comments for items they can access (via board)
CREATE POLICY "Users can view comments for accessible items"
  ON public.item_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_comments.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- Users can create comments for items they can access
CREATE POLICY "Users can create comments for accessible items"
  ON public.item_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_comments.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.item_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.item_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_comments_item_id ON public.item_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_user_id ON public.item_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_created_at ON public.item_comments(created_at DESC);

-- ============================================================================
-- 2. ITEM ATTACHMENTS (Files)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.item_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.item_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Item Attachments
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view attachments for accessible items" ON public.item_attachments;
DROP POLICY IF EXISTS "Users can upload attachments for accessible items" ON public.item_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.item_attachments;
DROP POLICY IF EXISTS "Admins can delete any attachment" ON public.item_attachments;

-- Users can view attachments for items they can access
CREATE POLICY "Users can view attachments for accessible items"
  ON public.item_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_attachments.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- Users can upload attachments for items they can access
CREATE POLICY "Users can upload attachments for accessible items"
  ON public.item_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_attachments.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.item_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any attachment
CREATE POLICY "Admins can delete any attachment"
  ON public.item_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_attachments_item_id ON public.item_attachments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_attachments_user_id ON public.item_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_item_attachments_created_at ON public.item_attachments(created_at DESC);

-- ============================================================================
-- 3. ITEM ACTIVITY LOGS (Activity tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.item_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- e.g., 'created', 'updated', 'moved', 'comment_added', 'attachment_added'
  details JSONB DEFAULT '{}'::jsonb, -- Additional context (what changed, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.item_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Item Activity Logs
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view activity for accessible items" ON public.item_activity_logs;
DROP POLICY IF EXISTS "System can create activity logs" ON public.item_activity_logs;

-- Users can view activity for items they can access
CREATE POLICY "Users can view activity for accessible items"
  ON public.item_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_activity_logs.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- System can create activity logs (via service role or authenticated users)
CREATE POLICY "System can create activity logs"
  ON public.item_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_activity_logs.item_id
      AND EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_activity_logs_item_id ON public.item_activity_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_item_activity_logs_user_id ON public.item_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_item_activity_logs_created_at ON public.item_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_activity_logs_action ON public.item_activity_logs(action);

-- ============================================================================
-- 4. TRIGGERS (Auto-update updated_at for comments)
-- ============================================================================

-- Create or replace function to update updated_at
CREATE OR REPLACE FUNCTION update_item_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_item_comments_updated_at_trigger ON public.item_comments;
CREATE TRIGGER update_item_comments_updated_at_trigger
  BEFORE UPDATE ON public.item_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_item_comments_updated_at();


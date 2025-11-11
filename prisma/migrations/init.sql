-- 建立 hr_saved_artifacts 資料表
-- 如果使用 Prisma，可以執行 `npm run db:push` 或 `npm run db:migrate`
-- 如果想手動執行 SQL，可以使用這個檔案

CREATE TABLE IF NOT EXISTS hr_saved_artifacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL DEFAULT 'default_user',
  step       TEXT NOT NULL CHECK (step IN ('job_intake', 'sourcing', 'screening', 'interview')),
  input_text TEXT NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_hr_saved_artifacts_user_id ON hr_saved_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_saved_artifacts_step ON hr_saved_artifacts(step);
CREATE INDEX IF NOT EXISTS idx_hr_saved_artifacts_created_at ON hr_saved_artifacts(created_at DESC);


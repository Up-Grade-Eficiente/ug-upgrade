
-- ══════════════════════════════════════════
-- SISTEMA DE TRIAL 7 DIAS
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════

-- Adiciona colunas de trial na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ativo BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_inicio TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expira TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_plano TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_tipo TEXT;

-- Índice para consultas rápidas de trial
CREATE INDEX IF NOT EXISTS idx_profiles_trial ON profiles(trial_ativo, trial_expira);

-- View para trials próximos de expirar (útil para admin)
CREATE OR REPLACE VIEW trials_expirando AS
SELECT id, nome, email, trial_plano, trial_expira,
  EXTRACT(EPOCH FROM (trial_expira - NOW())) / 86400 AS dias_restantes
FROM profiles
WHERE trial_ativo = true
  AND trial_expira > NOW()
ORDER BY trial_expira ASC;

-- ============================================
-- MIGRAÇÃO: Adicionar campo default_target (Meta 100%)
-- Projeto: Meu Indicador Inteligente
-- Data: 2026-01-20
-- ============================================

-- 1. Adicionar coluna default_target na tabela indicator_templates
ALTER TABLE indicator_templates 
ADD COLUMN IF NOT EXISTS default_target NUMERIC DEFAULT NULL;

-- 2. Comentário descritivo
COMMENT ON COLUMN indicator_templates.default_target IS 'Meta ideal (100%) do indicador. Valor de referência principal para cálculo de status.';

-- 3. Migrar dados existentes: usar default_critical_threshold como valor inicial
-- (IMPORTANTE: Isto afeta templates existentes que não tem meta definida)
UPDATE indicator_templates 
SET default_target = COALESCE(default_critical_threshold, 100)
WHERE default_target IS NULL;

-- 4. (Opcional) Tornar o campo obrigatório para novos registros
-- CUIDADO: Apenas execute após confirmar que todos os registros têm valor
-- ALTER TABLE indicator_templates ALTER COLUMN default_target SET NOT NULL;

-- ============================================
-- VERIFICAÇÃO: Execute após a migração
-- ============================================
SELECT 
  name, 
  default_target,
  default_warning_threshold, 
  default_critical_threshold 
FROM indicator_templates 
ORDER BY name;

-- =====================================================
-- QUICK MIGRATION: Apenas o Essencial
-- Execute este arquivo se quiser apenas a estrutura básica
-- =====================================================

-- 1. Criar ENUMs
CREATE TYPE indicator_direction AS ENUM ('HIGHER_BETTER', 'LOWER_BETTER', 'NEUTRAL_RANGE');
CREATE TYPE unit_type AS ENUM ('currency', 'percentage', 'integer', 'decimal');

-- 2. Adicionar Colunas
ALTER TABLE indicator_templates 
  ADD COLUMN direction indicator_direction DEFAULT 'HIGHER_BETTER',
  ADD COLUMN unit_type unit_type DEFAULT 'integer',
  ADD COLUMN calc_method TEXT DEFAULT 'simple_formula',
  ADD COLUMN default_warning_threshold NUMERIC(10,2),
  ADD COLUMN default_critical_threshold NUMERIC(10,2),
  ADD COLUMN input_fields JSONB DEFAULT '{"fixed": [], "daily": []}';

-- 3. Criar Índices
CREATE INDEX idx_templates_direction ON indicator_templates(direction);
CREATE INDEX idx_templates_unit_type ON indicator_templates(unit_type);
CREATE INDEX idx_templates_input_fields ON indicator_templates USING GIN (input_fields);

-- 4. Inserir Churn como Teste
INSERT INTO indicator_templates (
  name, description, formula, importance, segment, complexity, icon_name, required_data,
  direction, unit_type, calc_method, default_warning_threshold, default_critical_threshold, input_fields
) VALUES (
  'Taxa de Churn',
  'Percentual de clientes que cancelaram.',
  '(Cancelamentos / Clientes ativos) × 100',
  'Essencial para medir retenção.',
  'Geral', 'Intermediário', 'TrendingDown',
  '["Clientes ativos", "Cancelamentos"]',
  'LOWER_BETTER', 'percentage', 'churn_rate', 5.0, 8.0,
  '{"fixed": ["clientes_inicio"], "daily": ["cancelamentos"]}'::jsonb
);

-- Pronto! ✅


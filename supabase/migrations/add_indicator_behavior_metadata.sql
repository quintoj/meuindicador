-- =====================================================
-- MIGRAÇÃO: Adicionar Metadados de Comportamento
-- Sistema: Meu Gestor - Indicadores Dinâmicos
-- Data: Janeiro 2026
-- =====================================================

-- 1. CRIAR ENUMS
-- =====================================================

-- Enum para direção do indicador (melhor alto ou baixo?)
CREATE TYPE indicator_direction AS ENUM (
  'HIGHER_BETTER',    -- Verde = Alto (Vendas, Faturamento, NPS)
  'LOWER_BETTER',     -- Verde = Baixo (Churn, Inadimplência, Custos)
  'NEUTRAL_RANGE'     -- Verde = No meio (Temperatura, Estoque, Food Cost)
);

-- Enum para tipo de unidade
CREATE TYPE unit_type AS ENUM (
  'currency',         -- R$ (Reais)
  'percentage',       -- % (Percentual)
  'integer',          -- # (Número inteiro)
  'decimal'           -- Decimal (1.5, 2.3)
);

-- 2. ADICIONAR COLUNAS À TABELA indicator_templates
-- =====================================================

-- Direção do indicador (comportamento de sucesso)
ALTER TABLE indicator_templates 
  ADD COLUMN direction indicator_direction DEFAULT 'HIGHER_BETTER';

-- Tipo de unidade
ALTER TABLE indicator_templates 
  ADD COLUMN unit_type unit_type DEFAULT 'integer';

-- Método de cálculo (usado pelo frontend)
ALTER TABLE indicator_templates 
  ADD COLUMN calc_method TEXT DEFAULT 'simple_formula';

-- Limites padrão para alertas
ALTER TABLE indicator_templates 
  ADD COLUMN default_warning_threshold NUMERIC(10,2);

ALTER TABLE indicator_templates 
  ADD COLUMN default_critical_threshold NUMERIC(10,2);

-- Schema de inputs (define campos fixos vs diários)
ALTER TABLE indicator_templates 
  ADD COLUMN input_fields JSONB DEFAULT '{"fixed": [], "daily": []}';

-- Adicionar comentários (documentação no banco)
COMMENT ON COLUMN indicator_templates.direction IS 'Define se valor alto é bom (HIGHER_BETTER), baixo é bom (LOWER_BETTER) ou ideal no meio (NEUTRAL_RANGE)';
COMMENT ON COLUMN indicator_templates.unit_type IS 'Tipo de unidade: currency (R$), percentage (%), integer (#), decimal (1.5)';
COMMENT ON COLUMN indicator_templates.calc_method IS 'Método de cálculo usado pelo frontend: simple_formula, sum_vs_goal, percentage_of_total, flow_balance, etc';
COMMENT ON COLUMN indicator_templates.default_warning_threshold IS 'Valor limite para status Amarelo (Warning)';
COMMENT ON COLUMN indicator_templates.default_critical_threshold IS 'Valor limite para status Vermelho (Critical)';
COMMENT ON COLUMN indicator_templates.input_fields IS 'Schema JSON dos campos de input: {"fixed": ["meta_mensal"], "daily": ["vendas_dia"]}';

-- 3. ATUALIZAR INDICADORES EXISTENTES (Opcional)
-- =====================================================

-- Atualizar indicadores de faturamento/receita
UPDATE indicator_templates 
SET 
  direction = 'HIGHER_BETTER',
  unit_type = 'currency'
WHERE 
  name ILIKE '%faturamento%' 
  OR name ILIKE '%receita%'
  OR name ILIKE '%ticket%';

-- Atualizar indicadores de percentual/taxa
UPDATE indicator_templates 
SET 
  unit_type = 'percentage'
WHERE 
  name ILIKE '%taxa%' 
  OR name ILIKE '%percentual%'
  OR name ILIKE '%%';

-- Atualizar indicadores onde baixo é melhor
UPDATE indicator_templates 
SET 
  direction = 'LOWER_BETTER'
WHERE 
  name ILIKE '%evasão%' 
  OR name ILIKE '%custo%'
  OR name ILIKE '%cancelamento%';

-- 4. INSERT DE TESTE: INDICADOR DE CHURN
-- =====================================================

INSERT INTO indicator_templates (
  name,
  description,
  formula,
  importance,
  segment,
  complexity,
  icon_name,
  required_data,
  direction,
  unit_type,
  calc_method,
  default_warning_threshold,
  default_critical_threshold,
  input_fields,
  created_at
) VALUES (
  'Taxa de Churn (Cancelamento)',
  
  'Percentual de clientes que cancelaram em relação ao total de clientes ativos no início do período. Indica o nível de retenção e satisfação dos clientes.',
  
  '(Cancelamentos no período / Clientes ativos no início) × 100',
  
  'Essencial para medir a saúde do negócio e capacidade de retenção. Churn alto indica problemas na qualidade do serviço, atendimento ou valor percebido. É mais barato reter clientes do que adquirir novos.',
  
  'Geral',
  
  'Intermediário',
  
  'TrendingDown',
  
  '["Clientes ativos no início do período", "Cancelamentos no período"]',
  
  'LOWER_BETTER',
  
  'percentage',
  
  'churn_rate',
  
  5.0,
  
  8.0,
  
  '{
    "fixed": ["clientes_inicio"],
    "daily": ["cancelamentos"],
    "calculation": "percentage_of_base"
  }',
  
  NOW()
);

-- 5. INSERT DE TESTE: INDICADOR NPS (Net Promoter Score)
-- =====================================================

INSERT INTO indicator_templates (
  name,
  description,
  formula,
  importance,
  segment,
  complexity,
  icon_name,
  required_data,
  direction,
  unit_type,
  calc_method,
  default_warning_threshold,
  default_critical_threshold,
  input_fields
) VALUES (
  'NPS - Net Promoter Score',
  
  'Indicador de satisfação e lealdade dos clientes. Varia de -100 a +100, medindo a probabilidade de recomendação.',
  
  '% Promotores (9-10) - % Detratores (0-6)',
  
  'Principal métrica de satisfação do cliente e crescimento orgânico. NPS alto indica clientes satisfeitos que promovem seu negócio gratuitamente.',
  
  'Geral',
  
  'Avançado',
  
  'Heart',
  
  '["Promotores (nota 9-10)", "Detratores (nota 0-6)", "Total de respondentes"]',
  
  'HIGHER_BETTER',
  
  'integer',
  
  'nps_score',
  
  30,
  
  10,
  
  '{
    "fixed": [],
    "daily": ["promotores", "detratores", "neutros"],
    "calculation": "nps_formula"
  }'
);

-- 6. INSERT DE TESTE: INDICADOR FOOD COST (Neutral Range)
-- =====================================================

INSERT INTO indicator_templates (
  name,
  description,
  formula,
  importance,
  segment,
  complexity,
  icon_name,
  required_data,
  direction,
  unit_type,
  calc_method,
  default_warning_threshold,
  default_critical_threshold,
  input_fields
) VALUES (
  'Food Cost %',
  
  'Percentual do custo dos ingredientes sobre o faturamento. Ideal entre 28-35% dependendo do tipo de restaurante.',
  
  '(Custo dos Ingredientes / Faturamento Total) × 100',
  
  'Controla a margem de lucro e eficiência no uso dos ingredientes. Muito baixo pode indicar preços altos (risco de perder clientes), muito alto indica prejuízo.',
  
  'Restaurante',
  
  'Intermediário',
  
  'UtensilsCrossed',
  
  '["Custo dos ingredientes", "Faturamento total", "Estoque inicial", "Estoque final"]',
  
  'NEUTRAL_RANGE',
  
  'percentage',
  
  'percentage_of_revenue',
  
  35.0,
  
  40.0,
  
  '{
    "fixed": ["meta_food_cost"],
    "daily": ["custo_ingredientes", "faturamento"],
    "calculation": "percentage_ratio",
    "ideal_range": {"min": 28, "max": 35}
  }'
);

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para buscar por direção
CREATE INDEX idx_templates_direction ON indicator_templates(direction);

-- Índice para buscar por tipo de unidade
CREATE INDEX idx_templates_unit_type ON indicator_templates(unit_type);

-- Índice para buscar por método de cálculo
CREATE INDEX idx_templates_calc_method ON indicator_templates(calc_method);

-- Índice GIN para busca no JSONB input_fields
CREATE INDEX idx_templates_input_fields ON indicator_templates USING GIN (input_fields);

-- 8. CRIAR VIEW PARA ANÁLISE
-- =====================================================

CREATE OR REPLACE VIEW v_indicator_templates_analysis AS
SELECT 
  id,
  name,
  segment,
  complexity,
  direction,
  unit_type,
  calc_method,
  default_warning_threshold,
  default_critical_threshold,
  input_fields,
  CASE 
    WHEN direction = 'HIGHER_BETTER' THEN 'Verde = Alto'
    WHEN direction = 'LOWER_BETTER' THEN 'Verde = Baixo'
    WHEN direction = 'NEUTRAL_RANGE' THEN 'Verde = No meio'
  END as behavior_description,
  jsonb_array_length(required_data::jsonb) as num_required_fields,
  created_at
FROM indicator_templates
ORDER BY segment, name;

-- 9. FUNÇÃO HELPER: Calcular Status baseado em Direction
-- =====================================================

CREATE OR REPLACE FUNCTION get_indicator_status(
  current_value NUMERIC,
  target_value NUMERIC,
  direction indicator_direction,
  warning_threshold NUMERIC,
  critical_threshold NUMERIC
) RETURNS TEXT AS $$
DECLARE
  performance_pct NUMERIC;
  status TEXT;
BEGIN
  -- Calcular performance como percentual
  IF target_value > 0 THEN
    performance_pct := (current_value / target_value) * 100;
  ELSE
    performance_pct := current_value;
  END IF;

  -- Determinar status baseado na direção
  CASE direction
    WHEN 'HIGHER_BETTER' THEN
      IF performance_pct >= 100 THEN status := 'success';
      ELSIF performance_pct >= warning_threshold THEN status := 'warning';
      ELSE status := 'critical';
      END IF;
      
    WHEN 'LOWER_BETTER' THEN
      IF current_value <= critical_threshold THEN status := 'success';
      ELSIF current_value <= warning_threshold THEN status := 'warning';
      ELSE status := 'critical';
      END IF;
      
    WHEN 'NEUTRAL_RANGE' THEN
      IF current_value BETWEEN critical_threshold AND warning_threshold THEN 
        status := 'success';
      ELSIF ABS(current_value - target_value) < 10 THEN 
        status := 'warning';
      ELSE 
        status := 'critical';
      END IF;
  END CASE;

  RETURN status;
END;
$$ LANGUAGE plpgsql;

-- 10. GRANT PERMISSIONS (se necessário)
-- =====================================================

-- Permitir leitura para usuários autenticados
GRANT SELECT ON indicator_templates TO authenticated;

-- Permitir uso dos novos tipos
GRANT USAGE ON TYPE indicator_direction TO authenticated;
GRANT USAGE ON TYPE unit_type TO authenticated;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Para verificar os dados inseridos:
-- SELECT * FROM v_indicator_templates_analysis;

-- Para testar a função de status:
-- SELECT get_indicator_status(3.5, 5.0, 'LOWER_BETTER', 5.0, 8.0);


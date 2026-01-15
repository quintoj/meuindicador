-- =====================================================
-- QUERIES ÚTEIS: Metadados de Comportamento
-- =====================================================

-- 1. LISTAR TODOS OS INDICADORES COM NOVOS CAMPOS
-- =====================================================
SELECT 
  name,
  segment,
  direction,
  unit_type,
  calc_method,
  default_warning_threshold,
  default_critical_threshold,
  input_fields->>'calculation' as calculation_type
FROM indicator_templates
ORDER BY segment, name;


-- 2. BUSCAR INDICADORES POR DIREÇÃO
-- =====================================================

-- Indicadores onde ALTO é melhor
SELECT name, description, direction
FROM indicator_templates
WHERE direction = 'HIGHER_BETTER';

-- Indicadores onde BAIXO é melhor
SELECT name, description, direction
FROM indicator_templates
WHERE direction = 'LOWER_BETTER';

-- Indicadores com range neutro
SELECT name, description, direction
FROM indicator_templates
WHERE direction = 'NEUTRAL_RANGE';


-- 3. BUSCAR INDICADORES POR TIPO DE UNIDADE
-- =====================================================

-- Indicadores em Reais
SELECT name, unit_type, formula
FROM indicator_templates
WHERE unit_type = 'currency';

-- Indicadores em Percentual
SELECT name, unit_type, formula
FROM indicator_templates
WHERE unit_type = 'percentage';


-- 4. TESTAR FUNÇÃO DE STATUS
-- =====================================================

-- Teste 1: Churn baixo (BOM - Verde)
SELECT get_indicator_status(
  3.5,              -- Churn atual: 3.5%
  5.0,              -- Meta: 5%
  'LOWER_BETTER',   -- Quanto menor, melhor
  5.0,              -- Warning: 5%
  8.0               -- Critical: 8%
);
-- Resultado esperado: 'success'

-- Teste 2: Churn médio (ATENÇÃO - Amarelo)
SELECT get_indicator_status(
  6.0,              -- Churn atual: 6%
  5.0,              -- Meta: 5%
  'LOWER_BETTER',
  5.0,
  8.0
);
-- Resultado esperado: 'warning'

-- Teste 3: Churn alto (CRÍTICO - Vermelho)
SELECT get_indicator_status(
  9.0,              -- Churn atual: 9%
  5.0,              -- Meta: 5%
  'LOWER_BETTER',
  5.0,
  8.0
);
-- Resultado esperado: 'critical'

-- Teste 4: Vendas acima da meta (BOM - Verde)
SELECT get_indicator_status(
  120000,           -- Vendas: R$ 120k
  100000,           -- Meta: R$ 100k
  'HIGHER_BETTER',  -- Quanto maior, melhor
  80.0,             -- Warning: 80% da meta
  60.0              -- Critical: 60% da meta
);
-- Resultado esperado: 'success'


-- 5. ANALISAR INPUT FIELDS (JSONB)
-- =====================================================

-- Ver todos os campos fixos
SELECT 
  name,
  input_fields->'fixed' as campos_fixos
FROM indicator_templates
WHERE input_fields->'fixed' IS NOT NULL;

-- Ver todos os campos diários
SELECT 
  name,
  input_fields->'daily' as campos_diarios
FROM indicator_templates
WHERE input_fields->'daily' IS NOT NULL;

-- Buscar indicadores que usam cálculo específico
SELECT 
  name,
  input_fields->>'calculation' as calculo
FROM indicator_templates
WHERE input_fields->>'calculation' = 'churn_rate';


-- 6. ESTATÍSTICAS DO CATÁLOGO
-- =====================================================

-- Distribuição por direção
SELECT 
  direction,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM indicator_templates
GROUP BY direction;

-- Distribuição por tipo de unidade
SELECT 
  unit_type,
  COUNT(*) as total
FROM indicator_templates
GROUP BY unit_type;

-- Indicadores por segmento e direção
SELECT 
  segment,
  direction,
  COUNT(*) as total
FROM indicator_templates
GROUP BY segment, direction
ORDER BY segment, direction;


-- 7. ATUALIZAR UM INDICADOR EXISTENTE
-- =====================================================

-- Exemplo: Atualizar "Ticket Médio" com novos metadados
UPDATE indicator_templates
SET 
  direction = 'HIGHER_BETTER',
  unit_type = 'currency',
  calc_method = 'sum_vs_goal',
  default_warning_threshold = 80.0,
  default_critical_threshold = 60.0,
  input_fields = '{
    "fixed": ["meta_mensal"],
    "daily": ["vendas_dia", "clientes_dia"],
    "calculation": "average_ticket"
  }'::jsonb
WHERE name ILIKE '%ticket médio%';


-- 8. INSERIR NOVO INDICADOR (Exemplo: CAC - Custo de Aquisição)
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
  'CAC - Custo de Aquisição de Cliente',
  'Quanto você gasta para conquistar cada novo cliente. Essencial para avaliar eficiência de marketing.',
  'Investimento em Marketing / Novos Clientes',
  'Fundamental para rentabilidade. CAC deve ser menor que o LTV (valor vitalício do cliente).',
  'Geral',
  'Intermediário',
  'DollarSign',
  '["Investimento em marketing", "Novos clientes adquiridos"]',
  'LOWER_BETTER',
  'currency',
  'cac_calculation',
  150.0,
  250.0,
  '{
    "fixed": ["meta_cac"],
    "daily": ["investimento_marketing", "novos_clientes"],
    "calculation": "cost_per_acquisition"
  }'
);


-- 9. BUSCAR INDICADORES COM THRESHOLDS CRÍTICOS
-- =====================================================

-- Indicadores com limite crítico definido
SELECT 
  name,
  direction,
  default_warning_threshold,
  default_critical_threshold,
  CASE 
    WHEN direction = 'LOWER_BETTER' 
    THEN 'Alerta quando > ' || default_critical_threshold
    WHEN direction = 'HIGHER_BETTER' 
    THEN 'Alerta quando < ' || default_critical_threshold
    ELSE 'Fora do range ideal'
  END as regra_alerta
FROM indicator_templates
WHERE default_critical_threshold IS NOT NULL;


-- 10. VIEW: DASHBOARD DE MONITORAMENTO (Exemplo)
-- =====================================================

CREATE OR REPLACE VIEW v_user_indicators_with_status AS
SELECT 
  ui.id,
  ui.user_id,
  ui.name as indicator_name,
  ui.current_value,
  ui.target_value,
  it.direction,
  it.unit_type,
  it.default_warning_threshold,
  it.default_critical_threshold,
  
  -- Calcular status automaticamente
  get_indicator_status(
    ui.current_value,
    ui.target_value,
    it.direction,
    it.default_warning_threshold,
    it.default_critical_threshold
  ) as status,
  
  -- Performance %
  CASE 
    WHEN ui.target_value > 0 
    THEN ROUND((ui.current_value / ui.target_value) * 100, 1)
    ELSE NULL
  END as performance_pct,
  
  ui.updated_at
FROM user_indicators ui
JOIN indicator_templates it ON ui.template_id = it.id
WHERE ui.is_active = true;

-- Testar a view
-- SELECT * FROM v_user_indicators_with_status WHERE user_id = 'SEU_USER_ID';


-- 11. FUNÇÃO: Sugerir Indicadores baseado em Segmento
-- =====================================================

CREATE OR REPLACE FUNCTION suggest_indicators(
  user_segment business_segment
) RETURNS TABLE (
  name TEXT,
  description TEXT,
  complexity complexity_level,
  direction indicator_direction
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.name,
    it.description,
    it.complexity,
    it.direction
  FROM indicator_templates it
  WHERE it.segment = user_segment
    OR it.segment = 'Geral'
  ORDER BY 
    CASE it.complexity 
      WHEN 'Fácil' THEN 1
      WHEN 'Intermediário' THEN 2
      WHEN 'Avançado' THEN 3
    END,
    it.name;
END;
$$ LANGUAGE plpgsql;

-- Testar sugestões
-- SELECT * FROM suggest_indicators('Restaurante');


-- 12. LIMPAR/RESETAR DADOS DE TESTE
-- =====================================================

-- CUIDADO: Apaga indicadores de teste
DELETE FROM indicator_templates
WHERE name IN (
  'Taxa de Churn (Cancelamento)',
  'NPS - Net Promoter Score',
  'Food Cost %',
  'CAC - Custo de Aquisição de Cliente'
);

-- =====================================================
-- FIM DAS QUERIES
-- =====================================================


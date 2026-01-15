-- =====================================================
-- SCRIPT DE TESTE DE CARGA - VALIDAÇÃO DE SEMÁFORO
-- =====================================================
-- Objetivo: Inserir cenários de teste para validar 
--           a lógica de cores (Verde/Amarelo/Vermelho)
-- 
-- User ID: b1e19597-96e9-457a-aac0-bd17417fb003
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := 'b1e19597-96e9-457a-aac0-bd17417fb003';
  v_template_id UUID;
BEGIN
  
  -- =====================================================
  -- LIMPEZA: Remover dados anteriores deste usuário
  -- =====================================================
  RAISE NOTICE '🧹 Limpando dados anteriores...';
  
  DELETE FROM user_indicators 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Dados limpos!';
  
  -- =====================================================
  -- CENÁRIO 1: CHURN - VERMELHO (Ruim)
  -- =====================================================
  -- Meta: 5% | Valor Atual: 10%
  -- Direction: LOWER_BETTER → 10 > 5 = VERMELHO 🔴
  -- =====================================================
  
  RAISE NOTICE '📊 Inserindo Cenário 1: Churn (VERMELHO)...';
  
  SELECT id INTO v_template_id 
  FROM indicator_templates 
  WHERE name ILIKE '%churn%' 
     OR name ILIKE '%cancelamento%'
  LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    INSERT INTO user_indicators (
      user_id,
      indicator_template_id,
      name,
      current_value,
      target_value,
      format,
      last_inputs,
      is_active
    ) VALUES (
      v_user_id,
      v_template_id,
      'Taxa de Churn (Cancelamento)',
      10.0,  -- Valor atual: 10%
      5.0,   -- Meta: 5%
      'percentage',
      '{"fixed": {"ativos_inicio": "100"}, "daily": {"cancelamentos": "10"}}',
      true
    );
    RAISE NOTICE '✅ Churn inserido (ID: %)', v_template_id;
  ELSE
    RAISE NOTICE '⚠️ Template "Churn" não encontrado. Criando...';
    
    -- Criar template se não existir
    INSERT INTO indicator_templates (
      name, 
      description, 
      formula, 
      importance,
      segment,
      complexity,
      icon_name,
      direction,
      unit_type,
      calc_method,
      input_fields,
      required_data
    ) VALUES (
      'Taxa de Churn (Cancelamento)',
      'Percentual de clientes que cancelaram em relação ao total de clientes ativos',
      '(cancelamentos / ativos_inicio) * 100',
      'Essencial para medir saúde do negócio e capacidade de retenção',
      'Geral',
      'Intermediário',
      'TrendingDown',
      'LOWER_BETTER',
      'percentage',
      'formula',
      '{"fixed": ["ativos_inicio"], "daily": ["cancelamentos"]}',
      '["ativos_inicio", "cancelamentos"]'
    ) RETURNING id INTO v_template_id;
    
    -- Inserir o indicador para o usuário
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Taxa de Churn (Cancelamento)', 10.0, 5.0, 'percentage',
      '{"fixed": {"ativos_inicio": "100"}, "daily": {"cancelamentos": "10"}}', true
    );
    RAISE NOTICE '✅ Template e indicador Churn criados!';
  END IF;
  
  -- =====================================================
  -- CENÁRIO 2: VENDAS - VERDE (Bom)
  -- =====================================================
  -- Meta: 20 | Valor Atual: 25
  -- Direction: HIGHER_BETTER → 25 > 20 = VERDE 🟢
  -- =====================================================
  
  RAISE NOTICE '📊 Inserindo Cenário 2: Vendas (VERDE)...';
  
  SELECT id INTO v_template_id 
  FROM indicator_templates 
  WHERE name ILIKE '%vendas%'
  LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Vendas Diárias', 25.0, 20.0, 'number',
      '{"daily": {"vendas_quantidade": "25"}}', true
    );
    RAISE NOTICE '✅ Vendas inserido (ID: %)', v_template_id;
  ELSE
    RAISE NOTICE '⚠️ Template "Vendas" não encontrado. Criando...';
    
    INSERT INTO indicator_templates (
      name, description, formula, importance, segment, complexity, icon_name,
      direction, unit_type, calc_method, input_fields, required_data
    ) VALUES (
      'Vendas Diárias',
      'Total de vendas realizadas no dia',
      'vendas_quantidade',
      'Indica o desempenho comercial diário',
      'Geral', 'Fácil', 'ShoppingCart',
      'HIGHER_BETTER', 'integer', 'formula',
      '{"daily": ["vendas_quantidade"]}', '["vendas_quantidade"]'
    ) RETURNING id INTO v_template_id;
    
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Vendas Diárias', 25.0, 20.0, 'number',
      '{"daily": {"vendas_quantidade": "25"}}', true
    );
    RAISE NOTICE '✅ Template e indicador Vendas criados!';
  END IF;
  
  -- =====================================================
  -- CENÁRIO 3: INADIMPLÊNCIA - VERDE (Bom)
  -- =====================================================
  -- Meta: 5% | Valor Atual: 2%
  -- Direction: LOWER_BETTER → 2 < 5 = VERDE 🟢
  -- =====================================================
  
  RAISE NOTICE '📊 Inserindo Cenário 3: Inadimplência (VERDE)...';
  
  SELECT id INTO v_template_id 
  FROM indicator_templates 
  WHERE name ILIKE '%inadimpl%'
  LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Taxa de Inadimplência', 2.0, 5.0, 'percentage',
      '{"fixed": {"total_previsto": "1000"}, "daily": {"nao_pagos": "20"}}', true
    );
    RAISE NOTICE '✅ Inadimplência inserido (ID: %)', v_template_id;
  ELSE
    RAISE NOTICE '⚠️ Template "Inadimplência" não encontrado. Criando...';
    
    INSERT INTO indicator_templates (
      name, description, formula, importance, segment, complexity, icon_name,
      direction, unit_type, calc_method, input_fields, required_data
    ) VALUES (
      'Taxa de Inadimplência',
      'Percentual de pagamentos não realizados em relação ao total previsto',
      '(nao_pagos / total_previsto) * 100',
      'Indica saúde financeira e risco de crédito',
      'Geral', 'Intermediário', 'AlertCircle',
      'LOWER_BETTER', 'percentage', 'formula',
      '{"fixed": ["total_previsto"], "daily": ["nao_pagos"]}',
      '["total_previsto", "nao_pagos"]'
    ) RETURNING id INTO v_template_id;
    
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Taxa de Inadimplência', 2.0, 5.0, 'percentage',
      '{"fixed": {"total_previsto": "1000"}, "daily": {"nao_pagos": "20"}}', true
    );
    RAISE NOTICE '✅ Template e indicador Inadimplência criados!';
  END IF;
  
  -- =====================================================
  -- CENÁRIO 4: LUCRO POR M² - VERDE (Bom)
  -- =====================================================
  -- Meta: 40 | Valor Atual: 50
  -- Direction: HIGHER_BETTER → 50 > 40 = VERDE 🟢
  -- =====================================================
  
  RAISE NOTICE '📊 Inserindo Cenário 4: Lucro por m² (VERDE)...';
  
  SELECT id INTO v_template_id 
  FROM indicator_templates 
  WHERE name ILIKE '%lucro%m%'
     OR name ILIKE '%lucro por m%'
  LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Lucro por m²', 50.0, 40.0, 'currency',
      '{"fixed": {"area": "100"}, "daily": {"vendas": "10000", "despesas": "5000"}}', true
    );
    RAISE NOTICE '✅ Lucro por m² inserido (ID: %)', v_template_id;
  ELSE
    RAISE NOTICE '⚠️ Template "Lucro por m²" não encontrado. Criando...';
    
    INSERT INTO indicator_templates (
      name, description, formula, importance, segment, complexity, icon_name,
      direction, unit_type, calc_method, input_fields, required_data
    ) VALUES (
      'Lucro por m²',
      'Lucro líquido dividido pela área do estabelecimento',
      '(vendas - despesas) / area',
      'Mede eficiência do uso do espaço físico',
      'Restaurante', 'Intermediário', 'DollarSign',
      'HIGHER_BETTER', 'currency', 'formula',
      '{"fixed": ["area"], "daily": ["vendas", "despesas"]}',
      '["area", "vendas", "despesas"]'
    ) RETURNING id INTO v_template_id;
    
    INSERT INTO user_indicators (
      user_id, indicator_template_id, name, current_value, target_value, format, last_inputs, is_active
    ) VALUES (
      v_user_id, v_template_id, 'Lucro por m²', 50.0, 40.0, 'currency',
      '{"fixed": {"area": "100"}, "daily": {"vendas": "10000", "despesas": "5000"}}', true
    );
    RAISE NOTICE '✅ Template e indicador Lucro por m² criados!';
  END IF;
  
  -- =====================================================
  -- RESUMO
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ CARGA COMPLETA!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indicadores inseridos para user_id: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔴 VERMELHO: Churn 10%% (meta 5%%) - LOWER_BETTER';
  RAISE NOTICE '🟢 VERDE:    Vendas 25 (meta 20) - HIGHER_BETTER';
  RAISE NOTICE '🟢 VERDE:    Inadimplência 2%% (meta 5%%) - LOWER_BETTER';
  RAISE NOTICE '🟢 VERDE:    Lucro/m² R$ 50 (meta R$ 40) - HIGHER_BETTER';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  
END $$;

-- =====================================================
-- VERIFICAÇÃO: Consultar os dados inseridos
-- =====================================================

SELECT 
  ui.name AS indicador,
  ui.current_value AS valor_atual,
  ui.target_value AS meta,
  ui.format,
  it.direction,
  CASE 
    WHEN it.direction = 'HIGHER_BETTER' THEN
      CASE 
        WHEN ui.current_value >= ui.target_value THEN '🟢 VERDE'
        WHEN ui.current_value >= ui.target_value * 0.8 THEN '🟡 AMARELO'
        ELSE '🔴 VERMELHO'
      END
    WHEN it.direction = 'LOWER_BETTER' THEN
      CASE 
        WHEN ui.current_value <= ui.target_value THEN '🟢 VERDE'
        WHEN ui.current_value <= ui.target_value * 1.2 THEN '🟡 AMARELO'
        ELSE '🔴 VERMELHO'
      END
    ELSE '⚪ NEUTRO'
  END AS status_esperado
FROM user_indicators ui
JOIN indicator_templates it ON ui.indicator_template_id = it.id
WHERE ui.user_id = 'b1e19597-96e9-457a-aac0-bd17417fb003'
  AND ui.is_active = true
ORDER BY ui.created_at;


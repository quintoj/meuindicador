-- ============================================
-- MIGRAÇÃO: Adicionar campos de agregação e meta temporal
-- Projeto: Meu Indicador Inteligente
-- Data: 2026-01-21
-- Descrição: Evolução para suportar diferentes períodos e agregações
-- ============================================

-- 1. Adicionar coluna frequencia_meta (diária, semanal, mensal)
ALTER TABLE user_indicators 
ADD COLUMN IF NOT EXISTS frequencia_meta TEXT DEFAULT 'mensal'
CHECK (frequencia_meta IN ('diaria', 'semanal', 'mensal'));

-- 2. Adicionar coluna tipo_agregacao (como calcular o valor no período)
ALTER TABLE user_indicators 
ADD COLUMN IF NOT EXISTS tipo_agregacao TEXT DEFAULT 'soma'
CHECK (tipo_agregacao IN ('soma', 'media', 'ultimo_valor'));

-- 3. Adicionar coluna direcao_meta (maior ou menor é melhor)
ALTER TABLE user_indicators 
ADD COLUMN IF NOT EXISTS direcao_meta TEXT DEFAULT 'maior_melhor'
CHECK (direcao_meta IN ('maior_melhor', 'menor_melhor'));

-- 4. Comentários descritivos
COMMENT ON COLUMN user_indicators.frequencia_meta IS 'Frequência da meta: diaria, semanal ou mensal';
COMMENT ON COLUMN user_indicators.tipo_agregacao IS 'Como agregar valores: soma (vendas), media (nps), ultimo_valor (estoque)';
COMMENT ON COLUMN user_indicators.direcao_meta IS 'Direção positiva: maior_melhor (vendas) ou menor_melhor (reclamações)';

-- 5. Atualizar registros existentes com valores inteligentes baseados no formato
-- Indicadores de moeda geralmente somam (vendas, faturamento)
UPDATE user_indicators 
SET tipo_agregacao = 'soma', 
    direcao_meta = 'maior_melhor',
    frequencia_meta = 'mensal'
WHERE format = 'currency' AND tipo_agregacao IS NULL;

-- Indicadores de percentual geralmente fazem média (NPS, taxa)
UPDATE user_indicators 
SET tipo_agregacao = 'media', 
    direcao_meta = 'maior_melhor',
    frequencia_meta = 'mensal'
WHERE format = 'percentage' AND tipo_agregacao IS NULL;

-- Indicadores numéricos geralmente somam (contagens)
UPDATE user_indicators 
SET tipo_agregacao = 'soma', 
    direcao_meta = 'maior_melhor',
    frequencia_meta = 'mensal'
WHERE format = 'number' AND tipo_agregacao IS NULL;

-- ============================================
-- VERIFICAÇÃO: Execute após a migração
-- ============================================
SELECT 
  name,
  format,
  frequencia_meta,
  tipo_agregacao,
  direcao_meta
FROM user_indicators 
LIMIT 10;

-- =====================================================
-- Adicionar coluna para persistir inputs do usuário
-- =====================================================

-- Adicionar coluna last_inputs (JSONB) à tabela user_indicators
ALTER TABLE user_indicators 
ADD COLUMN IF NOT EXISTS last_inputs JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN user_indicators.last_inputs IS 
'Armazena os últimos valores digitados pelo usuário nos campos dinâmicos do modal de lançamento. Formato: {"campo1": "valor1", "campo2": "valor2"}';

-- Criar índice GIN para busca rápida no JSONB
CREATE INDEX IF NOT EXISTS idx_user_indicators_last_inputs 
ON user_indicators USING GIN (last_inputs);

-- Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_indicators' 
  AND column_name = 'last_inputs';


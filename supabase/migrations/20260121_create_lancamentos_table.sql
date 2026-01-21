-- ============================================
-- MIGRAÇÃO: Criar tabela de lançamentos (Time Series)
-- Projeto: Meu Indicador Inteligente
-- Data: 2026-01-21
-- Descrição: Histórico de valores realizados dos indicadores
-- ============================================

-- 1. Criar tabela lancamentos
CREATE TABLE IF NOT EXISTS lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES user_indicators(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  data_referencia date NOT NULL,
  observacao text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraint: impedir lançamentos duplicados no mesmo dia
  CONSTRAINT unique_lancamento_por_dia UNIQUE (indicador_id, data_referencia)
);

-- 2. Comentários descritivos
COMMENT ON TABLE lancamentos IS 'Histórico de lançamentos (valores realizados) dos indicadores do usuário';
COMMENT ON COLUMN lancamentos.indicador_id IS 'Referência ao indicador do usuário (user_indicators)';
COMMENT ON COLUMN lancamentos.user_id IS 'ID do usuário que fez o lançamento';
COMMENT ON COLUMN lancamentos.valor IS 'Valor realizado do indicador nesta data';
COMMENT ON COLUMN lancamentos.data_referencia IS 'Data a que se refere o lançamento';
COMMENT ON COLUMN lancamentos.observacao IS 'Observações opcionais sobre o lançamento';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_referencia 
  ON lancamentos(data_referencia DESC);

CREATE INDEX IF NOT EXISTS idx_lancamentos_indicador_id 
  ON lancamentos(indicador_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id 
  ON lancamentos(user_id);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS: usuário só acessa seus próprios lançamentos

-- SELECT: visualizar próprios lançamentos
CREATE POLICY "Usuários veem apenas seus lançamentos"
  ON lancamentos
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: criar lançamentos para si mesmo
CREATE POLICY "Usuários criam lançamentos para si mesmos"
  ON lancamentos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: atualizar próprios lançamentos
CREATE POLICY "Usuários atualizam apenas seus lançamentos"
  ON lancamentos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: deletar próprios lançamentos
CREATE POLICY "Usuários deletam apenas seus lançamentos"
  ON lancamentos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lancamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lancamentos_updated_at
  BEFORE UPDATE ON lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_lancamentos_updated_at();

-- ============================================
-- VERIFICAÇÃO: Execute após a migração
-- ============================================
-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lancamentos'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'lancamentos';

-- Verificar políticas RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lancamentos';

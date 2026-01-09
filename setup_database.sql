-- =====================================================
-- Script de Setup do Banco de Dados - Meu Indicador
-- =====================================================
-- Este script cria todas as tabelas necessárias para
-- o sistema de gestão de indicadores (KPIs)
-- =====================================================

-- =====================================================
-- 1. EXTENSÕES
-- =====================================================
-- Habilita extensão UUID para gerar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. ENUMS (Tipos Enumerados)
-- =====================================================

-- Enum para complexidade dos indicadores
CREATE TYPE complexity_level AS ENUM ('Fácil', 'Intermediário', 'Avançado');

-- Enum para segmentos de negócio
CREATE TYPE business_segment AS ENUM (
  'Academia',
  'Restaurante',
  'Contabilidade',
  'PetShop',
  'Geral'
);

-- Enum para formato de exibição dos valores
CREATE TYPE value_format AS ENUM ('currency', 'percentage', 'number');

-- =====================================================
-- 3. TABELA: indicator_templates
-- =====================================================
-- Armazena os templates de indicadores disponíveis na loja
CREATE TABLE IF NOT EXISTS indicator_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  formula TEXT NOT NULL,
  importance TEXT NOT NULL,
  segment business_segment NOT NULL DEFAULT 'Geral',
  complexity complexity_level NOT NULL DEFAULT 'Fácil',
  icon_name VARCHAR(100), -- Nome do ícone do Lucide React (ex: 'DollarSign', 'Users')
  required_data JSONB DEFAULT '[]'::jsonb, -- Array de strings com os dados necessários
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Índices para melhor performance
  CONSTRAINT indicator_templates_name_unique UNIQUE (name)
);

-- Índices para busca e filtragem
CREATE INDEX idx_indicator_templates_segment ON indicator_templates(segment);
CREATE INDEX idx_indicator_templates_complexity ON indicator_templates(complexity);
CREATE INDEX idx_indicator_templates_name_search ON indicator_templates USING gin(to_tsvector('portuguese', name || ' ' || description));

-- =====================================================
-- 4. TABELA: user_indicators
-- =====================================================
-- Armazena os indicadores adicionados pelos usuários ao dashboard
CREATE TABLE IF NOT EXISTS user_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Referência ao usuário (Supabase Auth)
  indicator_template_id UUID NOT NULL REFERENCES indicator_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Nome personalizado (pode ser diferente do template)
  current_value NUMERIC(15, 2) DEFAULT 0,
  target_value NUMERIC(15, 2),
  format value_format NOT NULL DEFAULT 'number',
  segment VARCHAR(100), -- Segmento do indicador
  icon_name VARCHAR(100), -- Ícone do indicador
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER, -- Posição no dashboard (para ordenação)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Constraint para evitar duplicatas
  CONSTRAINT user_indicators_user_template_unique UNIQUE (user_id, indicator_template_id)
);

-- Índices
CREATE INDEX idx_user_indicators_user_id ON user_indicators(user_id);
CREATE INDEX idx_user_indicators_template_id ON user_indicators(indicator_template_id);
CREATE INDEX idx_user_indicators_active ON user_indicators(user_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- 5. TABELA: indicator_history
-- =====================================================
-- Armazena histórico de valores dos indicadores ao longo do tempo
CREATE TABLE IF NOT EXISTS indicator_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_indicator_id UUID NOT NULL REFERENCES user_indicators(id) ON DELETE CASCADE,
  value NUMERIC(15, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT, -- Notas opcionais sobre o registro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas de histórico
CREATE INDEX idx_indicator_history_user_indicator ON indicator_history(user_indicator_id);
CREATE INDEX idx_indicator_history_recorded_at ON indicator_history(recorded_at DESC);
CREATE INDEX idx_indicator_history_user_date ON indicator_history(user_indicator_id, recorded_at DESC);

-- =====================================================
-- 6. TABELA: user_profiles (Opcional - se usar perfis customizados)
-- =====================================================
-- Armazena informações adicionais do perfil do usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY, -- Mesmo ID do usuário do Supabase Auth
  full_name VARCHAR(255),
  business_name VARCHAR(255),
  business_segment business_segment,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_indicator_templates_updated_at
  BEFORE UPDATE ON indicator_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_indicators_updated_at
  BEFORE UPDATE ON user_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) - Políticas de Segurança
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE indicator_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para indicator_templates (público - todos podem ler)
CREATE POLICY "Todos podem visualizar templates de indicadores"
  ON indicator_templates
  FOR SELECT
  USING (true);

-- Políticas para user_indicators (usuários só veem seus próprios indicadores)
CREATE POLICY "Usuários podem ver seus próprios indicadores"
  ON user_indicators
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios indicadores"
  ON user_indicators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios indicadores"
  ON user_indicators
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios indicadores"
  ON user_indicators
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para indicator_history
CREATE POLICY "Usuários podem ver histórico de seus indicadores"
  ON indicator_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_indicators
      WHERE user_indicators.id = indicator_history.user_indicator_id
      AND user_indicators.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir histórico de seus indicadores"
  ON indicator_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_indicators
      WHERE user_indicators.id = indicator_history.user_indicator_id
      AND user_indicators.user_id = auth.uid()
    )
  );

-- Políticas para user_profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seus próprios perfis"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 9. DADOS INICIAIS (Seed Data)
-- =====================================================

-- Inserir indicadores padrão baseados nos dados estáticos do código
INSERT INTO indicator_templates (name, description, formula, importance, segment, complexity, icon_name, required_data) VALUES
-- Academia
('Clientes Ativos', 
 'Número de clientes com contrato vigente e acesso liberado à academia',
 'Soma de todos os clientes com status ''ativo''',
 'Indica a base de clientes recorrentes e a estabilidade da receita mensal',
 'Academia',
 'Fácil',
 'Users',
 '["Lista de clientes", "Status do contrato", "Data de vencimento"]'::jsonb),

('Taxa de Evasão',
 'Percentual de clientes que cancelaram em relação ao total de ativos',
 '(Cancelamentos no período / Clientes ativos) × 100',
 'Mede a retenção de clientes e indica problemas na qualidade do serviço',
 'Academia',
 'Intermediário',
 'TrendingUp',
 '["Cancelamentos", "Total de clientes ativos", "Período de análise"]'::jsonb),

('Check-ins por Cliente',
 'Média de visitas mensais por cliente ativo',
 'Total de check-ins no mês / Número de clientes ativos',
 'Indica o engajamento dos clientes e uso efetivo da academia',
 'Academia',
 'Fácil',
 'Target',
 '["Registro de check-ins", "Clientes ativos", "Período"]'::jsonb),

-- Restaurante
('Ticket Médio',
 'Valor médio gasto por cliente em cada visita',
 'Faturamento total / Número de clientes atendidos',
 'Indica o valor percebido pelos clientes e eficiência nas vendas',
 'Restaurante',
 'Fácil',
 'DollarSign',
 '["Faturamento diário", "Número de clientes", "Período"]'::jsonb),

('Food Cost',
 'Percentual do custo dos ingredientes sobre a receita',
 '(Custo dos ingredientes / Receita total) × 100',
 'Controla a margem de lucro e eficiência no uso dos ingredientes',
 'Restaurante',
 'Intermediário',
 'Percent',
 '["Custo dos ingredientes", "Receita total", "Estoque"]'::jsonb),

('Giro de Mesa',
 'Quantas vezes cada mesa é ocupada por dia',
 'Número de ocupações / Número de mesas disponíveis',
 'Mede a eficiência operacional e capacidade de atendimento',
 'Restaurante',
 'Intermediário',
 'Clock',
 '["Ocupações por mesa", "Número de mesas", "Horário de funcionamento"]'::jsonb),

-- Pet Shop
('Atendimentos (Banho/Tosa)',
 'Número total de serviços de banho e tosa realizados',
 'Soma de todos os serviços de banho e tosa no período',
 'Principal indicador de volume de serviços e capacidade operacional',
 'PetShop',
 'Fácil',
 'PawPrint',
 '["Agendamentos", "Serviços realizados", "Período"]'::jsonb),

('Taxa de Recompra',
 'Percentual de clientes que retornam para novas compras',
 '(Clientes que compraram novamente / Total de clientes) × 100',
 'Indica fidelização dos clientes e qualidade dos produtos/serviços',
 'PetShop',
 'Intermediário',
 'Heart',
 '["Histórico de compras", "Clientes únicos", "Período de análise"]'::jsonb),

-- Contabilidade
('Receita Recorrente Mensal',
 'Valor mensal garantido dos contratos de clientes ativos',
 'Soma dos valores mensais de todos os contratos ativos',
 'Previsibilidade da receita e base para planejamento financeiro',
 'Contabilidade',
 'Fácil',
 'DollarSign',
 '["Contratos ativos", "Valor mensal", "Status do cliente"]'::jsonb),

('SLA de Entrega',
 'Percentual de entregas realizadas dentro do prazo acordado',
 '(Entregas no prazo / Total de entregas) × 100',
 'Mede a qualidade do serviço e satisfação dos clientes',
 'Contabilidade',
 'Intermediário',
 'Clock',
 '["Data de entrega", "Prazo acordado", "Status da entrega"]'::jsonb),

-- Genéricos
('CAC - Custo de Aquisição',
 'Quanto custa para adquirir um novo cliente',
 'Investimento em marketing / Número de novos clientes',
 'Essencial para avaliar a eficiência dos investimentos em marketing',
 'Geral',
 'Intermediário',
 'DollarSign',
 '["Gastos com marketing", "Novos clientes", "Período"]'::jsonb),

('LTV - Lifetime Value',
 'Valor total que um cliente gera durante todo relacionamento',
 'Ticket médio × Frequência × Tempo de vida',
 'Fundamental para estratégias de retenção e investimento em clientes',
 'Geral',
 'Avançado',
 'Award',
 '["Ticket médio", "Frequência de compra", "Tempo de relacionamento"]'::jsonb)

ON CONFLICT (name) DO NOTHING; -- Evita duplicatas se executar o script múltiplas vezes

-- =====================================================
-- 10. COMENTÁRIOS NAS TABELAS (Documentação)
-- =====================================================

COMMENT ON TABLE indicator_templates IS 'Templates de indicadores disponíveis na loja para os usuários escolherem';
COMMENT ON TABLE user_indicators IS 'Indicadores adicionados pelos usuários ao seu dashboard pessoal';
COMMENT ON TABLE indicator_history IS 'Histórico de valores dos indicadores ao longo do tempo';
COMMENT ON TABLE user_profiles IS 'Perfis adicionais dos usuários com informações do negócio';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Para executar este script no Supabase:
-- 1. Acesse o SQL Editor no painel do Supabase
-- 2. Cole este script completo
-- 3. Execute o script
-- =====================================================


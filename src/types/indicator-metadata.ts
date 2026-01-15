// =====================================================
// TYPES: Metadados de Comportamento dos Indicadores
// =====================================================

/**
 * Define o comportamento do indicador em relação aos valores
 * - HIGHER_BETTER: Verde quando alto (ex: Vendas, Faturamento)
 * - LOWER_BETTER: Verde quando baixo (ex: Churn, Custos)
 * - NEUTRAL_RANGE: Verde no meio/range ideal (ex: Food Cost)
 */
export type IndicatorDirection = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'NEUTRAL_RANGE';

/**
 * Tipo de unidade para formatação do valor
 */
export type UnitType = 'currency' | 'percentage' | 'integer' | 'decimal';

/**
 * Status visual do indicador
 */
export type IndicatorStatus = 'success' | 'warning' | 'critical' | 'neutral';

/**
 * Schema de inputs dinâmicos
 */
export interface InputFieldsSchema {
  /** Campos preenchidos uma vez (ex: meta mensal, base de clientes) */
  fixed: string[];
  
  /** Campos preenchidos periodicamente (ex: vendas do dia, cancelamentos) */
  daily: string[];
  
  /** Método de cálculo usado pelo frontend */
  calculation?: string;
  
  /** Range ideal para indicadores NEUTRAL_RANGE */
  ideal_range?: {
    min: number;
    max: number;
  };
}

/**
 * Template de indicador com metadados comportamentais
 */
export interface IndicatorTemplateWithMetadata {
  id: string;
  name: string;
  description: string;
  formula: string;
  importance: string;
  segment: string;
  complexity: string;
  icon_name: string;
  required_data: string[];
  
  // Novos campos
  direction: IndicatorDirection;
  unit_type: UnitType;
  calc_method: string;
  default_warning_threshold?: number;
  default_critical_threshold?: number;
  input_fields: InputFieldsSchema;
  
  created_at: string;
  updated_at?: string;
}

/**
 * Configuração de thresholds (limites de alerta)
 */
export interface IndicatorThresholds {
  warning: number;
  critical: number;
}

/**
 * Resultado do cálculo de status
 */
export interface StatusCalculation {
  status: IndicatorStatus;
  performance_pct: number;
  message: string;
  color: string;
  icon: string;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calcula o status do indicador baseado em sua direção
 */
export function calculateIndicatorStatus(
  currentValue: number,
  targetValue: number,
  direction: IndicatorDirection,
  thresholds: IndicatorThresholds
): StatusCalculation {
  const performancePct = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  
  let status: IndicatorStatus = 'neutral';
  let message = '';
  let color = '';
  let icon = '';
  
  switch (direction) {
    case 'HIGHER_BETTER':
      if (performancePct >= 100) {
        status = 'success';
        message = 'Meta atingida!';
        color = 'text-green-600';
        icon = 'CheckCircle';
      } else if (performancePct >= thresholds.warning) {
        status = 'warning';
        message = 'Atenção: Abaixo da meta';
        color = 'text-yellow-600';
        icon = 'AlertCircle';
      } else {
        status = 'critical';
        message = 'Crítico: Muito abaixo da meta';
        color = 'text-red-600';
        icon = 'XCircle';
      }
      break;
      
    case 'LOWER_BETTER':
      if (currentValue <= thresholds.critical) {
        status = 'success';
        message = 'Excelente! Dentro do esperado';
        color = 'text-green-600';
        icon = 'CheckCircle';
      } else if (currentValue <= thresholds.warning) {
        status = 'warning';
        message = 'Atenção: Acima do ideal';
        color = 'text-yellow-600';
        icon = 'AlertCircle';
      } else {
        status = 'critical';
        message = 'Crítico: Muito acima do aceitável';
        color = 'text-red-600';
        icon = 'XCircle';
      }
      break;
      
    case 'NEUTRAL_RANGE':
      const ideal_min = thresholds.critical;
      const ideal_max = thresholds.warning;
      
      if (currentValue >= ideal_min && currentValue <= ideal_max) {
        status = 'success';
        message = 'No range ideal';
        color = 'text-green-600';
        icon = 'CheckCircle';
      } else if (Math.abs(currentValue - targetValue) < 10) {
        status = 'warning';
        message = 'Próximo do ideal';
        color = 'text-yellow-600';
        icon = 'AlertCircle';
      } else {
        status = 'critical';
        message = 'Fora do range ideal';
        color = 'text-red-600';
        icon = 'XCircle';
      }
      break;
  }
  
  return { status, performance_pct: performancePct, message, color, icon };
}

/**
 * Formata o valor de acordo com o tipo de unidade
 */
export function formatIndicatorValue(value: number, unitType: UnitType): string {
  switch (unitType) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
      
    case 'percentage':
      return `${value.toFixed(1)}%`;
      
    case 'integer':
      return Math.round(value).toLocaleString('pt-BR');
      
    case 'decimal':
      return value.toFixed(2).replace('.', ',');
      
    default:
      return value.toString();
  }
}

/**
 * Retorna a descrição amigável da direção
 */
export function getDirectionDescription(direction: IndicatorDirection): string {
  const descriptions = {
    'HIGHER_BETTER': 'Quanto maior, melhor',
    'LOWER_BETTER': 'Quanto menor, melhor',
    'NEUTRAL_RANGE': 'Ideal dentro do range'
  };
  
  return descriptions[direction] || '';
}

/**
 * Retorna o emoji/ícone baseado na direção
 */
export function getDirectionIcon(direction: IndicatorDirection): string {
  const icons = {
    'HIGHER_BETTER': 'TrendingUp',
    'LOWER_BETTER': 'TrendingDown',
    'NEUTRAL_RANGE': 'Target'
  };
  
  return icons[direction] || 'HelpCircle';
}

/**
 * Valida se um valor está dentro do range esperado
 */
export function isValueInRange(
  value: number,
  direction: IndicatorDirection,
  thresholds: IndicatorThresholds
): boolean {
  switch (direction) {
    case 'HIGHER_BETTER':
      return value >= thresholds.warning;
      
    case 'LOWER_BETTER':
      return value <= thresholds.warning;
      
    case 'NEUTRAL_RANGE':
      return value >= thresholds.critical && value <= thresholds.warning;
      
    default:
      return true;
  }
}

/**
 * Gera inputs dinâmicos baseado no schema
 */
export function generateDynamicInputs(schema: InputFieldsSchema) {
  return {
    fixedInputs: schema.fixed.map(field => ({
      name: field,
      label: field,
      type: 'number',
      frequency: 'fixed',
      placeholder: 'Digite o valor'
    })),
    
    dailyInputs: schema.daily.map(field => ({
      name: field,
      label: field,
      type: 'number',
      frequency: 'daily',
      placeholder: 'Valor do período'
    }))
  };
}

/**
 * Aplica cálculo baseado no método
 */
export function applyCalculationMethod(
  method: string,
  inputs: Record<string, number>
): number {
  const values = Object.values(inputs);
  
  switch (method) {
    case 'churn_rate':
      // Cancelamentos / Base × 100
      return values.length >= 2 ? (values[1] / values[0]) * 100 : 0;
      
    case 'nps_score':
      // Promotores - Detratores
      return values.length >= 2 ? values[0] - values[1] : 0;
      
    case 'percentage_of_total':
    case 'percentage_of_revenue':
      // Parte / Todo × 100
      return values.length >= 2 ? (values[0] / values[1]) * 100 : 0;
      
    case 'average_ticket':
      // Vendas / Clientes
      return values.length >= 2 ? values[0] / values[1] : 0;
      
    case 'cac_calculation':
    case 'cost_per_acquisition':
      // Investimento / Novos Clientes
      return values.length >= 2 ? values[0] / values[1] : 0;
      
    case 'simple_formula':
    default:
      // Soma simples ou primeiro valor
      return values.reduce((sum, val) => sum + val, 0);
  }
}

/**
 * Retorna cor do badge baseado no status
 */
export function getStatusBadgeColor(status: IndicatorStatus): string {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  
  return colors[status] || colors.neutral;
}

/**
 * Retorna recomendação baseada no status e direção
 */
export function getRecommendation(
  status: IndicatorStatus,
  direction: IndicatorDirection,
  currentValue: number,
  targetValue: number
): string {
  if (status === 'success') {
    return '✅ Continue assim! Seu indicador está saudável.';
  }
  
  if (direction === 'HIGHER_BETTER') {
    const diff = targetValue - currentValue;
    return `⚠️ Você precisa aumentar em ${formatIndicatorValue(diff, 'currency')} para atingir a meta.`;
  }
  
  if (direction === 'LOWER_BETTER') {
    const diff = currentValue - targetValue;
    return `⚠️ Você precisa reduzir em ${formatIndicatorValue(diff, 'currency')} para atingir a meta.`;
  }
  
  return '⚠️ Ajuste seus valores para o range ideal.';
}

// =====================================================
// CONSTANTS
// =====================================================

export const DEFAULT_THRESHOLDS: Record<IndicatorDirection, IndicatorThresholds> = {
  HIGHER_BETTER: {
    warning: 80,
    critical: 60
  },
  LOWER_BETTER: {
    warning: 5,
    critical: 3
  },
  NEUTRAL_RANGE: {
    warning: 35,
    critical: 28
  }
};

export const CALC_METHODS = {
  SIMPLE: 'simple_formula',
  CHURN: 'churn_rate',
  NPS: 'nps_score',
  PERCENTAGE: 'percentage_of_total',
  AVERAGE: 'average_ticket',
  CAC: 'cac_calculation',
  BALANCE: 'flow_balance',
  SUM_VS_GOAL: 'sum_vs_goal'
} as const;


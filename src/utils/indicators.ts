/**
 * ============================================
 * LÓGICA CORRIGIDA DE STATUS DE INDICADORES
 * ============================================
 * 
 * Implementa a matriz de decisão correta para:
 * - HIGHER_BETTER (Vendas, Faturamento) → Verde se ALTO
 * - LOWER_BETTER (Churn, Despesas) → Verde se BAIXO
 * - NEUTRAL_RANGE (Estoque, Temperatura) → Verde se no range
 */

export type IndicatorDirection = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'NEUTRAL_RANGE';
export type StatusColor = 'success' | 'warning' | 'danger';

export interface IndicatorStatus {
  color: StatusColor;
  percentage: number;
  isPositive: boolean;
  text: string;
}

/**
 * Calcula o status do indicador baseado na direção (direction)
 * 🔧 v1.27: Agora usa thresholds do template quando fornecidos
 */
export function calculateIndicatorStatus(
  value: number,
  target: number,
  direction: IndicatorDirection = 'HIGHER_BETTER',
  warningThreshold?: number | null,
  criticalThreshold?: number | null
): IndicatorStatus {

  // Evitar divisão por zero
  if (target === 0) {
    return {
      color: 'danger',
      percentage: 0,
      isPositive: false,
      text: 'Meta não definida'
    };
  }

  const percentage = (value / target) * 100;

  // ====================================
  // HIGHER_BETTER: Quanto maior, melhor
  // ====================================
  if (direction === 'HIGHER_BETTER') {
    // 🔧 CORREÇÃO v1.27: Usa thresholds do template se fornecidos
    const warning = warningThreshold !== null && warningThreshold !== undefined ? warningThreshold : (target * 0.8);
    const critical = criticalThreshold !== null && criticalThreshold !== undefined ? criticalThreshold : target;

    if (value >= critical) {
      return {
        color: 'success',
        percentage,
        isPositive: true,
        text: 'acima da meta'
      };
    }

    if (value >= warning) {
      return {
        color: 'warning',
        percentage,
        isPositive: false,
        text: 'próximo da meta'
      };
    }

    return {
      color: 'danger',
      percentage,
      isPositive: false,
      text: 'abaixo da meta'
    };
  }

  // ====================================
  // LOWER_BETTER: Quanto menor, melhor
  // ====================================
  if (direction === 'LOWER_BETTER') {
    // 🔧 CORREÇÃO v1.27: Usa thresholds do template se fornecidos
    const warning = warningThreshold !== null && warningThreshold !== undefined ? warningThreshold : target;
    const critical = criticalThreshold !== null && criticalThreshold !== undefined ? criticalThreshold : (target * 1.2);

    // 🟢 Verde: Valor abaixo ou igual ao threshold de warning
    if (value <= warning) {
      return {
        color: 'success',
        percentage,
        isPositive: true,
        text: 'dentro da meta'
      };
    }

    // 🟡 Amarelo: Entre warning e critical
    if (value <= critical) {
      return {
        color: 'warning',
        percentage,
        isPositive: false,
        text: 'acima da meta'
      };
    }

    // 🔴 Vermelho: Acima do critical
    return {
      color: 'danger',
      percentage,
      isPositive: false,
      text: 'muito acima da meta'
    };
  }

  // ====================================
  // NEUTRAL_RANGE: Deve estar no range
  // ====================================
  if (direction === 'NEUTRAL_RANGE') {
    const tolerance = 0.1; // 10% de tolerância
    const lowerBound = target * (1 - tolerance);
    const upperBound = target * (1 + tolerance);

    if (value >= lowerBound && value <= upperBound) {
      return {
        color: 'success',
        percentage,
        isPositive: true,
        text: 'no range ideal'
      };
    }

    const warningTolerance = 0.2; // 20%
    const warningLowerBound = target * (1 - warningTolerance);
    const warningUpperBound = target * (1 + warningTolerance);

    if (value >= warningLowerBound && value <= warningUpperBound) {
      return {
        color: 'warning',
        percentage,
        isPositive: false,
        text: 'próximo do ideal'
      };
    }

    return {
      color: 'danger',
      percentage,
      isPositive: false,
      text: 'fora do range'
    };
  }

  // Fallback (não deveria acontecer)
  return {
    color: 'danger',
    percentage: 0,
    isPositive: false,
    text: 'direção desconhecida'
  };
}

/**
 * Retorna APENAS o status (success, warning, danger) do indicador
 * Função simplificada para uso em filtros e contagens
 * 🔧 v1.27: Agora suporta thresholds do template
 */
export function getIndicatorStatus(
  value: number,
  target: number,
  direction: IndicatorDirection = 'HIGHER_BETTER',
  warningThreshold?: number | null,
  criticalThreshold?: number | null
): StatusColor {
  // Usa a função completa e extrai apenas a cor
  const fullStatus = calculateIndicatorStatus(value, target, direction, warningThreshold, criticalThreshold);
  return fullStatus.color;
}

/**
 * Retorna o texto de diferença formatado (SEM considerar direção)
 * @deprecated Use getDifferenceTextWithDirection para lógica correta
 */
export function getDifferenceText(
  value: number,
  target: number,
  direction: IndicatorDirection = 'HIGHER_BETTER'
): { value: number; percentage: string } {
  const diff = Math.abs(value - target);
  const percentage = target !== 0 ? Math.abs((diff / target) * 100) : 0;

  return {
    value: diff,
    percentage: percentage.toFixed(1)
  };
}

/**
 * Retorna o texto de diferença CORRETO baseado na direção e status
 * ✅ MAIOR_MELHOR (Vendas): "R$ 55 acima da meta" (verde) ou "Faltam R$ 55" (vermelho)
 * ✅ MENOR_MELHOR (Custos): "R$ 20 abaixo do teto" (verde) ou "R$ 30 excedido" (vermelho)
 */
export function getDifferenceTextWithDirection(
  value: number,
  target: number,
  direction: IndicatorDirection = 'HIGHER_BETTER'
): { value: number; percentage: string; text: string; isPositive: boolean } {
  const diff = Math.abs(value - target);
  const percentage = target !== 0 ? Math.abs((diff / target) * 100) : 0;

  // MAIOR_MELHOR (Vendas, Faturamento)
  if (direction === 'HIGHER_BETTER') {
    if (value >= target) {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'acima da meta',
        isPositive: true
      };
    } else {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'faltam para a meta',
        isPositive: false
      };
    }
  }

  // MENOR_MELHOR (Custos, Reclamações)
  if (direction === 'LOWER_BETTER') {
    if (value <= target) {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'abaixo do teto',
        isPositive: true
      };
    } else {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'excedido',
        isPositive: false
      };
    }
  }

  // NEUTRAL_RANGE
  if (direction === 'NEUTRAL_RANGE') {
    const tolerance = target * 0.1;
    if (Math.abs(value - target) <= tolerance) {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'dentro do range ideal',
        isPositive: true
      };
    } else {
      return {
        value: diff,
        percentage: percentage.toFixed(1),
        text: 'fora do range',
        isPositive: false
      };
    }
  }

  // Fallback
  return {
    value: diff,
    percentage: percentage.toFixed(1),
    text: 'de diferença da meta',
    isPositive: false
  };
}

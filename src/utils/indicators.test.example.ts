/**
 * ============================================
 * EXEMPLOS DE TESTE DA LÓGICA DE STATUS
 * ============================================
 * 
 * Este arquivo demonstra como a lógica corrigida funciona.
 * Execute mentalmente ou use um console para testar.
 */

import { calculateIndicatorStatus } from './indicators';

console.log('====================================');
console.log('TESTE 1: Faturamento (HIGHER_BETTER)');
console.log('====================================');

// Cenário: Faturamento de R$ 85.000 com meta de R$ 100.000
const teste1 = calculateIndicatorStatus(85000, 100000, 'HIGHER_BETTER');
console.log('Valor: R$ 85.000 | Meta: R$ 100.000');
console.log('Resultado:', teste1);
// ✅ Esperado: warning (amarelo) - 85% da meta (abaixo de 90%)

console.log('\n====================================');
console.log('TESTE 2: Churn (LOWER_BETTER) ❌ ANTES ESTAVA ERRADO');
console.log('====================================');

// Cenário: Churn de 10% com meta de 5%
const teste2 = calculateIndicatorStatus(10, 5, 'LOWER_BETTER');
console.log('Valor: 10% | Meta: 5%');
console.log('Resultado:', teste2);
// ✅ Esperado: danger (vermelho) - muito acima da meta (200%)
// ❌ ANTES: success (verde) - lógica estava invertida!

console.log('\n====================================');
console.log('TESTE 3: Churn Bom (LOWER_BETTER)');
console.log('====================================');

// Cenário: Churn de 3% com meta de 5%
const teste3 = calculateIndicatorStatus(3, 5, 'LOWER_BETTER');
console.log('Valor: 3% | Meta: 5%');
console.log('Resultado:', teste3);
// ✅ Esperado: success (verde) - abaixo da meta (60%)

console.log('\n====================================');
console.log('TESTE 4: Inadimplência (LOWER_BETTER)');
console.log('====================================');

// Cenário: Inadimplência de 8% com meta de 5%
const teste4 = calculateIndicatorStatus(8, 5, 'LOWER_BETTER');
console.log('Valor: 8% | Meta: 5%');
console.log('Resultado:', teste4);
// ✅ Esperado: danger (vermelho) - acima do limite

console.log('\n====================================');
console.log('TESTE 5: Estoque (NEUTRAL_RANGE)');
console.log('====================================');

// Cenário: Estoque de 95 unidades com meta de 100
const teste5 = calculateIndicatorStatus(95, 100, 'NEUTRAL_RANGE');
console.log('Valor: 95 | Meta: 100 (±10%)');
console.log('Resultado:', teste5);
// ✅ Esperado: success (verde) - dentro do range (90-110)

console.log('\n====================================');
console.log('MATRIZ DE DECISÃO IMPLEMENTADA:');
console.log('====================================');
console.log(`
HIGHER_BETTER (Vendas, Faturamento):
  🟢 Verde:   valor >= meta (100%+)
  🟡 Amarelo: valor >= meta * 0.8 (80%-99%)
  🔴 Vermelho: valor < meta * 0.8 (<80%)

LOWER_BETTER (Churn, Despesas, Inadimplência):
  🟢 Verde:   valor <= meta (100% ou menos)
  🟡 Amarelo: valor <= meta * 1.2 (101%-120%)
  🔴 Vermelho: valor > meta * 1.2 (>120%)

NEUTRAL_RANGE (Estoque, Temperatura):
  🟢 Verde:   meta ± 10%
  🟡 Amarelo: meta ± 20%
  🔴 Vermelho: fora do range
`);

/*
====================================
CENÁRIO REAL DO BUG REPORTADO:
====================================

Antes da correção:
- Churn: 10%
- Meta: 5%
- Lógica antiga: 10/5 * 100 = 200% ➔ >= 100% ➔ 🟢 VERDE (ERRADO!)

Depois da correção:
- Churn: 10%
- Meta: 5%
- Direction: LOWER_BETTER
- Lógica nova: 10 > 5 * 1.2 (6) ➔ 🔴 VERMELHO (CORRETO!)
*/


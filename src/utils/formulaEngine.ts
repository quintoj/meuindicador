/**
 * Motor de Cálculo de Fórmulas
 * 
 * Avalia fórmulas matemáticas substituindo variáveis por valores numéricos.
 * Usado para indicadores calculados como Food Cost, Ticket Médio, etc.
 */

export interface FormulaVariable {
    slug: string;
    nome: string;
    tipo: "currency" | "percentage" | "number";
}

/**
 * Avalia uma fórmula substituindo slugs por valores numéricos
 * 
 * @param formula - Expressão matemática com slugs (ex: "(custo / faturamento) * 100")
 * @param variables - Mapa de slug -> valor numérico
 * @returns Resultado do cálculo ou null se houver erro
 * 
 * @example
 * evaluateFormula("(custo / faturamento) * 100", { custo: 1500, faturamento: 10000 })
 * // Retorna: 15
 */
export const evaluateFormula = (
    formula: string,
    variables: Record<string, number>
): number | null => {
    try {
        // Substituir cada slug pelo seu valor numérico
        let expression = formula;

        for (const [slug, value] of Object.entries(variables)) {
            // Usar regex global para substituir todas as ocorrências
            const regex = new RegExp(`\\b${slug}\\b`, 'g');
            expression = expression.replace(regex, value.toString());
        }

        // Avaliar expressão de forma segura usando Function()
        // Isso é mais seguro que eval() pois não tem acesso ao escopo externo
        const result = new Function(`'use strict'; return (${expression})`)();

        // Validar resultado
        return typeof result === 'number' && !isNaN(result) && isFinite(result)
            ? result
            : null;
    } catch (error) {
        console.error('Erro ao avaliar fórmula:', error);
        return null;
    }
};

/**
 * Valida se todas as variáveis necessárias foram preenchidas
 */
export const validateVariables = (
    inputFields: FormulaVariable[],
    variables: Record<string, number>
): boolean => {
    return inputFields.every(field => {
        const value = variables[field.slug];
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    });
};

/**
 * Formata um valor de acordo com o tipo
 */
export const formatVariableValue = (
    value: number,
    tipo: "currency" | "percentage" | "number"
): string => {
    switch (tipo) {
        case "currency":
            return new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(value);
        case "percentage":
            return `${value.toFixed(1)}%`;
        default:
            return value.toLocaleString("pt-BR");
    }
};

import { supabase } from "@/integrations/supabase/client";

/**
 * Analisa os indicadores usando a Edge Function 'analyze-metrics' do Supabase.
 * @param indicadores Lista de indicadores (KPIs) para análise.
 * @param niche O nicho/categoria ativa para contextualizar a análise.
 * @returns Uma frase de insight gerada pela IA ou uma mensagem de erro amigável.
 */
export const analisarIndicadores = async (indicadores: any[], niche: string): Promise<string> => {
    try {
        if (!indicadores || indicadores.length === 0) {
            return "Ainda não tenho dados suficientes para gerar uma análise. Adicione indicadores e faça lançamentos!";
        }

        // Mapeia os dados com log de debug e múltiplas tentativas de acesso às propriedades
        const metricsData = indicadores.map(kpi => {
            console.log("🔍 KPI Bruto (Debug):", kpi);
            return {
                nome: kpi.name || kpi.nome || "Indicador",
                valor: kpi.realizado_periodo ?? kpi.current_value ?? kpi.value ?? 0,
                meta: kpi.target_value ?? kpi.meta ?? kpi.target ?? 0,
                unidade: kpi.templates_indicadores?.unidade || kpi.template?.unit_type || kpi.format || ''
            };
        });

        console.log("Payload enviado para IA:", metricsData);

        const metricsPayload = JSON.stringify(metricsData);

        const { data, error } = await supabase.functions.invoke('analyze-metrics', {
            body: {
                niche: niche || 'Geral',
                metrics: metricsPayload
            }
        });

        if (error) {
            console.error("Erro na Edge Function:", error);
            throw error;
        }

        return data.analysis || "Não foi possível gerar um insight no momento.";

    } catch (error) {
        console.error("Erro ao gerar análise inteligente:", error);
        return "IA temporariamente em manutenção, mas seus dados estão seguros!";
    }
};

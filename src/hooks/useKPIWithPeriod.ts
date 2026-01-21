import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateAggregatedValue, calculateProportionalTarget } from "@/utils/aggregation";
import type { DateRange } from "@/components/dashboard/DateRangeFilter";
import { format } from "date-fns";

interface KPIData {
    id: string;
    name: string;
    format: "currency" | "percentage" | "number";
    target_value: number | null;
    frequencia_meta: string | null;
    tipo_agregacao: string | null;
    direcao_meta: string | null;
    template: any;
}

interface AggregatedKPI extends KPIData {
    realizado_periodo: number;
    meta_proporcional: number;
    lancamentos_count: number;
}

/**
 * Hook customizado para buscar KPIs com dados agregados por período
 */
export const useKPIWithPeriod = (dateRange: DateRange) => {
    const [kpis, setKpis] = useState<AggregatedKPI[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKPIsWithPeriod = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Buscar usuário
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setKpis([]);
                return;
            }

            // 2. Buscar todos os indicadores ativos do usuário
            const { data: indicators, error: indicatorsError } = await supabase
                .from("user_indicators")
                .select(`
            *,
            template:indicator_templates(*)
          `)
                .eq("user_id", user.id)
                .eq("is_active", true)
                .order("position", { ascending: true, nullsFirst: false });

            if (indicatorsError) {
                console.error("Erro ao buscar indicadores:", indicatorsError);
                setKpis([]);
                return;
            }

            if (!indicators || indicators.length === 0) {
                setKpis([]);
                return;
            }

            // 3. Buscar lançamentos de TODOS os indicadores no período
            const indicatorIds = indicators.map((i) => i.id);
            const dataInicio = format(dateRange.from, "yyyy-MM-dd");
            const dataFim = format(dateRange.to, "yyyy-MM-dd");

            const { data: lancamentos, error: lancamentosError } = await supabase
                .from("lancamentos")
                .select("*")
                .in("indicador_id", indicatorIds)
                .gte("data_referencia", dataInicio)
                .lte("data_referencia", dataFim);

            if (lancamentosError) {
                console.error("Erro ao buscar lançamentos:", lancamentosError);
            }

            // 4. Mapear cada indicador com seus lançamentos agregados
            const aggregatedKPIs: AggregatedKPI[] = indicators.map((indicator: any) => {
                // Filtrar lançamentos deste indicador
                const indicatorLancamentos = lancamentos?.filter(
                    (l) => l.indicador_id === indicator.id
                ) || [];

                // Pegar configurações (usar defaults se não existir)
                const tipoAgregacao = (indicator.tipo_agregacao || "soma") as any;
                const frequenciaMeta = (indicator.frequencia_meta || "mensal") as any;

                // Calcular valor agregado
                const realizado = calculateAggregatedValue(
                    indicatorLancamentos,
                    tipoAgregacao
                );

                // Calcular meta proporcional
                const metaBase =
                    indicator.target_value ??
                    indicator.template?.default_target ??
                    indicator.template?.default_critical_threshold ??
                    0;

                const metaProporcional = calculateProportionalTarget(
                    metaBase,
                    frequenciaMeta,
                    dateRange.from,
                    dateRange.to
                );

                return {
                    ...indicator,
                    realizado_periodo: realizado,
                    meta_proporcional: metaProporcional,
                    lancamentos_count: indicatorLancamentos.length,
                };
            });

            setKpis(aggregatedKPIs);
        } catch (err) {
            console.error("Erro inesperado ao buscar KPIs com período:", err);
            setKpis([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchKPIsWithPeriod();
    }, [fetchKPIsWithPeriod]);

    // Expor refetch para atualização manual (Live Reload)
    return { kpis, loading, refetch: fetchKPIsWithPeriod };
};


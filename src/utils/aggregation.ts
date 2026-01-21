import { differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

type TipoAgregacao = "soma" | "media" | "ultimo_valor";
type FrequenciaMeta = "diaria" | "semanal" | "mensal";

interface Lancamento {
    id: string;
    valor: number;
    data_referencia: string;
}

/**
 * Calcula o valor agregado dos lançamentos baseado no tipo de agregação
 * @param lancamentos Array de lançamentos no período
 * @param tipoAgregacao Tipo de agregação (soma, media, ultimo_valor)
 * @returns Valor agregado
 */
export function calculateAggregatedValue(
    lancamentos: Lancamento[],
    tipoAgregacao: TipoAgregacao = "soma"
): number {
    if (lancamentos.length === 0) return 0;

    switch (tipoAgregacao) {
        case "soma":
            return lancamentos.reduce((acc, l) => acc + Number(l.valor), 0);

        case "media":
            const soma = lancamentos.reduce((acc, l) => acc + Number(l.valor), 0);
            return soma / lancamentos.length;

        case "ultimo_valor":
            // Ordenar por data e pegar o mais recente
            const sorted = [...lancamentos].sort(
                (a, b) =>
                    new Date(b.data_referencia).getTime() -
                    new Date(a.data_referencia).getTime()
            );
            return Number(sorted[0].valor);

        default:
            return 0;
    }
}

/**
 * Calcula a meta proporcional baseada no período selecionado
 * @param metaBase Meta base configurada no indicador
 * @param frequenciaMeta Frequência da meta (diaria, semanal, mensal)
 * @param dataInicio Data de início do período filtrado
 * @param dataFim Data de fim do período filtrado
 * @returns Meta ajustada proporcionalmente ao período
 */
export function calculateProportionalTarget(
    metaBase: number,
    frequenciaMeta: FrequenciaMeta = "mensal",
    dataInicio: Date,
    dataFim: Date
): number {
    // Calcular dias no período selecionado
    const diasSelecionados = differenceInDays(dataFim, dataInicio) + 1;

    switch (frequenciaMeta) {
        case "diaria":
            // Meta diária: multiplicar pelos dias selecionados
            return metaBase * diasSelecionados;

        case "semanal":
            // Meta semanal: proporcional aos dias (meta / 7 * dias)
            return (metaBase / 7) * diasSelecionados;

        case "mensal":
            // Meta mensal: proporcional aos dias do mês
            // Usar o mês de referência da data de início
            const inicioMes = startOfMonth(dataInicio);
            const fimMes = endOfMonth(dataInicio);
            const diasNoMes = differenceInDays(fimMes, inicioMes) + 1;

            // Se o período é maior ou igual ao mês completo, returna a meta cheia
            if (diasSelecionados >= diasNoMes) {
                return metaBase;
            }

            // Caso contrário, calcular proporcionalmente
            return (metaBase / diasNoMes) * diasSelecionados;

        default:
            return metaBase;
    }
}

/**
 * Detecta o tipo de período baseado nas datas
 * @param dataInicio Data de início
 * @param dataFim Data de fim
 * @returns Tipo do período detectado
 */
export function detectPeriodType(
    dataInicio: Date,
    dataFim: Date
): "dia" | "semana" | "mes" | "customizado" {
    const dias = differenceInDays(dataFim, dataInicio) + 1;

    if (dias === 1) return "dia";
    if (dias === 7) {
        // Verificar se é uma semana completa
        const inicioSemana = startOfWeek(dataInicio, { weekStartsOn: 0 });
        const fimSemana = endOfWeek(dataInicio, { weekStartsOn: 0 });
        if (
            dataInicio.getTime() === inicioSemana.getTime() &&
            dataFim.getTime() === fimSemana.getTime()
        ) {
            return "semana";
        }
    }

    // Verificar se é um mês completo
    const inicioMes = startOfMonth(dataInicio);
    const fimMes = endOfMonth(dataInicio);
    if (
        dataInicio.getTime() === inicioMes.getTime() &&
        dataFim.getTime() === fimMes.getTime()
    ) {
        return "mes";
    }

    return "customizado";
}

/**
 * Formata o nome do período para exibição
 * @param dataInicio Data de início
 * @param dataFim Data de fim
 * @returns String formatada do período
 */
export function formatPeriodName(dataInicio: Date, dataFim: Date): string {
    const tipo = detectPeriodType(dataInicio, dataFim);

    switch (tipo) {
        case "dia":
            return dataInicio.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
            });
        case "semana":
            return `Semana de ${dataInicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
        case "mes":
            return dataInicio.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
            });
        case "customizado":
            return `${dataInicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${dataFim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
    }
}

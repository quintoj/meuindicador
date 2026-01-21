
import { getIndicatorStatus, type IndicatorDirection } from "@/utils/indicators";

// ==========================================
// 1. Base de Conhecimento (Dicionário de Dicas)
// ==========================================
const TIPS_KNOWLEDGE_BASE = {
    keywords: [
        {
            terms: ["custo", "cost", "despesa", "gasto", "cmv"],
            bad: "Revise as fichas técnicas e verifique o lixo da cozinha. Desperdício é o vilão aqui.",
            good: "Ótima gestão de compras! Mantenha os estoques enxutos para maximizar o caixa."
        },
        {
            terms: ["venda", "faturamento", "receita", "ticket", "fat"],
            bad: "Que tal lançar uma promoção relâmpago ou contactar clientes inativos para reverter?",
            good: "O time de vendas está voando! Aproveite o fluxo para oferecer produtos de maior valor."
        },
        {
            terms: ["cliente", "nps", "satisfação", "reclamação"],
            bad: "Atenção ao atendimento. Um cliente insatisfeito impacta mais que dez satisfeitos.",
            good: "Seus clientes estão felizes! Peça avaliações no Google/TripAdvisor."
        }
    ],
    default: {
        bad: "Monitore este número de perto amanhã para identificar a causa raiz.",
        good: "Continue monitorando para garantir consistência."
    }
};

const INTRO_PHRASES = [
    "Analisei seus números de hoje...",
    "Aqui está o resumo do seu dia...",
    "Consultor Virtual informando...",
    "Dei uma olhada na sua performance..."
];

const CONCLUSION_PHRASES = [
    "Amanhã é um novo dia para bater recordes!",
    "Foco no processo que o resultado vem.",
    "Bons negócios!",
    "Vamos pra cima!"
];

// ==========================================
// 2. Serviço de Análise
// ==========================================

export const analisarIndicadores = (indicadores: any[]): Promise<string> => {
    return new Promise((resolve) => {
        // Simula delay de 2.5 segundos ("pensando...")
        setTimeout(() => {
            if (!indicadores || indicadores.length === 0) {
                resolve("Ainda não tenho dados suficientes para gerar uma análise. Adicione indicadores e faça lançamentos!");
                return;
            }

            // A. Processamento: Classificar Indicadores
            const criticos: any[] = [];
            const bons: any[] = [];

            indicadores.forEach(kpi => {
                const direction = (kpi.template?.direction as IndicatorDirection) || 'HIGHER_BETTER';
                const warningThreshold = kpi.template?.default_warning_threshold;
                const criticalThreshold = kpi.template?.default_critical_threshold;

                // Usar a lógica robusta de utils
                const status = getIndicatorStatus(kpi.value, kpi.target, direction, warningThreshold, criticalThreshold);

                if (status === 'danger') {
                    criticos.push({ ...kpi, status });
                } else if (status === 'success') {
                    bons.push({ ...kpi, status });
                }
            });

            // Ordenar críticos pelo maior "desvio" (simplificado aqui por ordem de chegada ou lógica customizada se necessário)
            // Vou considerar o primeiro da lista como o "pior" para simplificar a demo, 
            // ou poderia calcular (Valor/Meta) absoluto.

            // B. Geração do Texto
            const intro = INTRO_PHRASES[Math.floor(Math.random() * INTRO_PHRASES.length)];
            const conclusion = CONCLUSION_PHRASES[Math.floor(Math.random() * CONCLUSION_PHRASES.length)];

            let markdown = `### 🤖 Análise do Dia\n${intro}\n\n`;

            if (criticos.length > 0) {
                markdown += `Encontrei **${criticos.length} ponto${criticos.length > 1 ? 's' : ''} de atenção**.\n\n`;

                // Listar críticos
                criticos.forEach((kpi, index) => {
                    const nome = kpi.name;
                    const format = kpi.format || 'number';
                    const valorFormatado = format === 'percentage' ? `${kpi.value}%` : kpi.value;
                    const metaFormatted = format === 'percentage' ? `${kpi.target}%` : kpi.target;

                    // Encontrar dica
                    const tipObj = TIPS_KNOWLEDGE_BASE.keywords.find(k =>
                        k.terms.some(term => nome.toLowerCase().includes(term))
                    );
                    const dica = tipObj ? tipObj.bad : TIPS_KNOWLEDGE_BASE.default.bad;

                    markdown += `🚨 **${nome} (${valorFormatado})**: Está fora da meta (${metaFormatted}).\n`;

                    // Exibe dica apenas para o primeiro (prioritário) ou para todos se quiser
                    if (index === 0) {
                        markdown += `> **Sugestão:** ${dica}\n\n`;
                    }
                });
            } else {
                markdown += `Nenhum ponto crítico detectado. Parabéns pela operação hoje!\n\n`;
            }

            if (bons.length > 0) {
                markdown += `✅ **Destaques Positivos:**\n`;
                // Listar bons (limitado a 3 para não poluir)
                bons.slice(0, 3).forEach((kpi, index) => {
                    const nome = kpi.name;
                    // Encontrar dica boa (opcional, ou só elogio genérico para o melhor)
                    if (index === 0) {
                        const tipObj = TIPS_KNOWLEDGE_BASE.keywords.find(k =>
                            k.terms.some(term => nome.toLowerCase().includes(term))
                        );
                        const elogio = tipObj ? tipObj.good : "Dentro da meta! Continue assim.";
                        markdown += `- **${nome}**: ${elogio}\n`;
                    } else {
                        markdown += `- **${nome}**: Bateu a meta.\n`;
                    }
                });
                markdown += `\n`;
            }

            markdown += `\n${conclusion}`;

            resolve(markdown);
        }, 2500);
    });
};

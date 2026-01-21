import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bot } from "lucide-react";
import { analisarIndicadores } from "@/services/aiService";
import ReactMarkdown from "react-markdown";

interface IAInsightsCardProps {
    kpis: any[];
}

export const IAInsightsCard = ({ kpis }: IAInsightsCardProps) => {
    const [loading, setLoading] = useState(false);
    const [analise, setAnalise] = useState<string | null>(null);

    const handleGerarAnalise = async () => {
        setLoading(true);
        setAnalise(null); // Limpa análise anterior
        try {
            // Passa os dados reais para o serviço
            const resultado = await analisarIndicadores(kpis);
            setAnalise(resultado);
        } catch (error) {
            console.error("Erro ao gerar análise:", error);
            setAnalise("Desculpe, não consegui gerar a análise agora. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-indigo-900">
                        Consultor Virtual
                    </CardTitle>
                </div>
                <CardDescription>
                    Receba insights automáticos sobre seus resultados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!analise && !loading && (
                    <div className="text-center py-6">
                        <Button
                            onClick={handleGerarAnalise}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full shadow-md transition-all hover:scale-[1.02]"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar Análise Inteligente
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3">
                            Clique para analisar os dados de hoje.
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 animate-pulse">
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <Sparkles className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-indigo-600">
                            Analisando seus dados com IA...
                        </p>
                    </div>
                )}

                {analise && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="prose prose-sm prose-indigo max-w-none bg-white p-4 rounded-lg border border-indigo-50 shadow-sm">
                            <ReactMarkdown
                                components={{
                                    h3: ({ node, ...props }) => <h3 className="text-indigo-800 font-bold text-base mt-0 mb-2" {...props} />,
                                    strong: ({ node, ...props }) => <span className="font-bold text-indigo-900" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-2 bg-indigo-50/50 italic text-indigo-700" {...props} />
                                }}
                            >
                                {analise}
                            </ReactMarkdown>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGerarAnalise}
                            className="w-full mt-3 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                            Refazer Análise
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

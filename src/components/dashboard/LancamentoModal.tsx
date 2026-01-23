import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Save, Trash2, Calculator, Info } from "lucide-react";
import { useLancamentos } from "@/hooks/useLancamentos";
import { evaluateFormula, validateVariables, type FormulaVariable } from "@/utils/formulaEngine";

interface LancamentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    indicador: {
        id: string;
        name: string;
        format: "currency" | "percentage" | "number";
        current_value?: number;
        template?: {
            input_fields?: Array<{
                slug: string;
                nome: string;
                tipo: "currency" | "percentage" | "number";
            }>;
            formula?: string;
        };
    };
    onSaveSuccess?: () => void;
}

export const LancamentoModal = ({
    isOpen,
    onClose,
    indicador,
    onSaveSuccess,
}: LancamentoModalProps) => {
    const [data, setData] = useState<string>("");
    const [valor, setValor] = useState<string>("");
    const [observacao, setObservacao] = useState<string>("");
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Estados para variáveis e fórmulas
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [calculatedValue, setCalculatedValue] = useState<number | null>(null);

    const { lancamentos, loading, fetchLancamentos, upsertLancamento, deleteLancamento } =
        useLancamentos();

    // Garantir que input_fields seja um array plano, tratando objetos {daily, fixed} ou strings JSON
    const parsedFields = useMemo(() => {
        const raw = indicador.template?.input_fields as any;
        console.log("Template Input Fields Raw:", raw);
        if (!raw) return [];

        let dataToProcess = raw;

        // Tentar parsear se for string
        if (typeof raw === 'string') {
            try {
                dataToProcess = JSON.parse(raw);
            } catch (e) {
                console.error("Erro no parse de input_fields:", e);
                return [];
            }
        }

        // Caso 1: Array Direto
        if (Array.isArray(dataToProcess)) return dataToProcess;

        // Caso 2: Objeto Estruturado { daily: [], fixed: [] }
        if (typeof dataToProcess === 'object' && dataToProcess !== null) {
            const daily = Array.isArray(dataToProcess.daily) ? dataToProcess.daily : [];
            const fixed = Array.isArray(dataToProcess.fixed) ? dataToProcess.fixed : [];
            const combined = [...daily, ...fixed];
            if (combined.length > 0) return combined;
        }

        return [];
    }, [indicador.template?.input_fields]);

    // Detectar se indicador possui variáveis válidas e não vazias
    const temVariaveis = parsedFields && parsedFields.length > 0;

    // Limpar estado valor ao entrar no modo variáveis
    useEffect(() => {
        if (temVariaveis) {
            setValor("");
        }
    }, [temVariaveis]);

    // Helper para obter data YYYY-MM-DD em fuso local
    const getLocalMapDate = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    // Inicializar com data de hoje (Local Time)
    useEffect(() => {
        setData(getLocalMapDate());
    }, []);

    // Unified Data Fetch: Busca histórico (5 dias) + Data Selecionada
    useEffect(() => {
        if (!isOpen || !data || !indicador.id) return;

        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const today = new Date();
                const fiveDaysAgo = new Date(today);
                fiveDaysAgo.setDate(today.getDate() - 5);

                // Converter data selecionada (string YYYY-MM-DD) para Date local
                const [ano, mes, dia] = data.split('-').map(Number);
                const selectedDate = new Date(ano, mes - 1, dia);

                // Definir range abrangente - se selecionado for anterior ao histórico, busca desde lá
                const startFunc = selectedDate < fiveDaysAgo ? selectedDate : fiveDaysAgo;
                // data final sempre "hoje" ou selectedDate se for futuro (futuro não permitido, mas seguro)
                const endFunc = selectedDate > today ? selectedDate : today;

                // Formatar YYYY-MM-DD
                const formatDate = (d: Date) => {
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };

                await fetchLancamentos(indicador.id, formatDate(startFunc), formatDate(endFunc));
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [data, isOpen, indicador.id]);

    // Preencher campos se já existe lançamento
    useEffect(() => {
        if (lancamentos.length > 0) {
            const lancamento = lancamentos.find(l => l.data_referencia === data);
            if (lancamento) {
                setValor(String(lancamento.valor));
                setObservacao(lancamento.observacao || "");
            } else {
                setValor("");
                setObservacao("");
            }
        }
    }, [lancamentos, data]);

    // Calcular valor quando variáveis mudarem
    useEffect(() => {
        if (!temVariaveis || !indicador.template?.formula) return;

        // Converter strings para números
        const numericVariables: Record<string, number> = {};
        for (const [slug, value] of Object.entries(variables)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                numericVariables[slug] = num;
            }
        }

        // Verificar se todas as variáveis foram preenchidas - SUPORTE FIXO PARA STRING FIELDS
        const allFieldsFilled = parsedFields.every((field: any) => {
            const slug = typeof field === 'string' ? field : field.slug;
            return numericVariables[slug] !== undefined;
        });

        if (allFieldsFilled) {
            const result = evaluateFormula(indicador.template.formula, numericVariables);

            // Garantir que resultado seja válido antes de liberar
            if (result !== null && !isNaN(result) && isFinite(result)) {
                setCalculatedValue(result);
                setValor(result.toString());
            } else {
                setCalculatedValue(null);
                setValor("");
            }
        } else {
            setCalculatedValue(null);
            setValor("");
        }
    }, [variables, temVariaveis, indicador.template]);

    const handleVariableChange = (slug: string, value: string) => {
        setVariables(prev => ({
            ...prev,
            [slug]: value
        }));
    };

    const handleSalvar = async () => {
        const valorNumerico = parseFloat(valor);

        if (isNaN(valorNumerico)) {
            return;
        }

        // Persistência das Variáveis (Metadata)
        let observacaoFinal = observacao.trim();
        if (temVariaveis) {
            const varsStr = Object.entries(variables)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
            observacaoFinal = `[Variáveis: ${varsStr}] ${observacaoFinal}`;
        }

        const success = await upsertLancamento({
            indicador_id: indicador.id,
            data_referencia: data,
            valor: valorNumerico,
            observacao: observacaoFinal || undefined,
        });

        if (success) {
            // Recarregar histórico
            const hoje = new Date();
            const cincodias = new Date(hoje);
            cincodias.setDate(cincodias.getDate() - 5);
            await fetchLancamentos(indicador.id, cincodias.toISOString().split("T")[0], hoje.toISOString().split("T")[0]);

            onSaveSuccess?.();
            setValor("");
            setObservacao("");
            setVariables({});
        }
    };

    const handleDelete = async (lancamentoId: string) => {
        const success = await deleteLancamento(lancamentoId);
        if (success) {
            onSaveSuccess?.();
        }
    };

    const formatarData = (dataStr: string) => {
        const date = new Date(dataStr + "T00:00:00");
        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    };

    const formatarValor = (value: number) => {
        switch (indicador.format) {
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

    const formatarPlaceholder = () => {
        switch (indicador.format) {
            case "currency":
                return "Ex: 1500.00";
            case "percentage":
                return "Ex: 85.5";
            case "number":
                return "Ex: 120";
            default:
                return "";
        }
    };

    const formatarUnidade = () => {
        switch (indicador.format) {
            case "currency":
                return "R$";
            case "percentage":
                return "%";
            default:
                return "";
        }
    };

    const renderVariableInput = (field: any) => {
        // Normalização: Se vier como string, trata como slug. Se objeto, extrai propriedades.
        const isString = typeof field === 'string';
        const slug = isString ? field : field.slug;
        const displayName = isString ? slug : (field.nome || field.name || field.slug);
        const tipoFormat = isString ? 'number' : (field.tipo as "currency" | "percentage" | "number" || 'number');
        const description = isString ? null : (field.description || field.help);

        return (
            <div key={slug} className="space-y-2">
                <Label htmlFor={slug} className="text-sm font-medium">
                    {displayName} {tipoFormat === "currency" && "(R$)"} {tipoFormat === "percentage" && "(%)"}
                </Label>
                <div className="relative">
                    {tipoFormat === "currency" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                            R$
                        </span>
                    )}
                    <Input
                        id={slug}
                        type="number"
                        step="any"
                        value={variables[slug] || ""}
                        onChange={(e) => handleVariableChange(slug, e.target.value)}
                        placeholder={tipoFormat === "currency" ? "0.00" : tipoFormat === "percentage" ? "0.0" : "0"}
                        className={`text-lg font-medium h-12 ${tipoFormat === "currency" ? "pl-12" : ""}`}
                    />
                    {tipoFormat === "percentage" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                            %
                        </span>
                    )}
                </div>
                {description && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/80 mt-1 px-1">
                        <Info className="w-3 h-3" />
                        <span>{description}</span>
                    </div>
                )}
            </div>
        );
    };

    // Histórico: Últimos 5 dias, excluindo o dia atual
    const historicoFiltrado = lancamentos.filter(l => l.data_referencia !== data).slice(0, 5);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Calendar className="w-6 h-6 text-primary" />
                        Lançar Valor
                    </DialogTitle>
                    <DialogDescription>
                        Registre o valor realizado de{" "}
                        <span className="font-semibold text-foreground">
                            {indicador.name}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Seletor de Data */}
                    <div className="space-y-2">
                        <Label htmlFor="data" className="text-sm font-medium">
                            Data de Referência
                        </Label>
                        <Input
                            id="data"
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            max={getLocalMapDate()}
                            className="text-base"
                        />
                    </div>

                    {/* Renderização Condicional: Variáveis ou Valor Único */}
                    {temVariaveis ? (
                        <>
                            <div className="space-y-6">
                                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Calculator className="w-4 h-4" />
                                            Dados do Indicador
                                        </h4>
                                        <Badge variant="secondary" className="text-xs">
                                            {parsedFields.length} campos
                                        </Badge>
                                    </div>

                                    {parsedFields.map((field: any) => renderVariableInput(field))}
                                </div>
                            </div>

                            {/* Resultado Calculado */}
                            {/* Resultado Calculado - Estilo "Unlock Save" */}
                            {temVariaveis && valor && (
                                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-indigo-600" />
                                        <span className="text-indigo-700 font-medium">Resultado Calculado:</span>
                                    </div>
                                    <span className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-200 pb-0.5">
                                        {formatarValor(parseFloat(valor))}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Input de Valor Simples */
                        <div className="space-y-2">
                            <Label htmlFor="valor" className="text-sm font-medium">
                                Valor Realizado {formatarUnidade() && `(${formatarUnidade()})`}
                            </Label>
                            <div className="relative">
                                {isLoadingData ? (
                                    <div className="flex items-center justify-center h-16 border rounded-lg bg-muted/50">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            Carregando...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {indicador.format === "currency" && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                                                R$
                                            </span>
                                        )}
                                        <Input
                                            id="valor"
                                            type="number"
                                            step="any"
                                            value={valor}
                                            onChange={(e) => setValor(e.target.value)}
                                            placeholder={formatarPlaceholder()}
                                            className={`text-2xl font-bold h-16 text-center ${indicador.format === "currency" ? "pl-12" : ""
                                                }`}
                                            autoFocus
                                        />
                                        {indicador.format === "percentage" && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                                                %
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label htmlFor="observacao" className="text-sm font-medium">
                            Observações (opcional)
                        </Label>
                        <Textarea
                            id="observacao"
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Adicione anotações sobre este lançamento..."
                            className="resize-none"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSalvar}
                        className="flex-1 bg-gradient-primary text-white hover:opacity-90"
                        disabled={loading || !valor || isLoadingData}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Lançamento
                            </>
                        )}
                    </Button>
                </div>

                {/* Histórico e Tabela */}
                <Separator className="my-4" />
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Histórico Recente
                    </h3>

                    {historicoFiltrado.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-2 font-medium">Data</th>
                                        <th className="text-right p-2 font-medium">Valor</th>
                                        <th className="text-center p-2 font-medium w-12">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {historicoFiltrado.map((lancamento) => (
                                        <tr
                                            key={lancamento.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-2">{formatarData(lancamento.data_referencia)}</td>
                                            <td className="p-2 text-right font-medium">
                                                {formatarValor(lancamento.valor)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(lancamento.id)}
                                                    disabled={loading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 border rounded-lg bg-muted/10">
                            <p className="text-sm text-muted-foreground">
                                Nenhum lançamento recente encontrado.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

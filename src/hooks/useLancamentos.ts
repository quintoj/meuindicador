import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Database } from "@/integrations/supabase/types";

type Lancamento = Tables<"lancamentos">;
type LancamentoInsert = Database["public"]["Tables"]["lancamentos"]["Insert"];

interface UseLancamentosReturn {
    lancamentos: Lancamento[];
    loading: boolean;
    fetchLancamentos: (
        indicadorId: string,
        dataInicio: string,
        dataFim: string
    ) => Promise<void>;
    fetchHistory: (
        indicadorId: string,
        limit?: number
    ) => Promise<void>;
    upsertLancamento: (params: {
        indicador_id: string;
        data_referencia: string;
        valor: number;
        observacao?: string;
    }) => Promise<boolean>;
    updateLancamento: (
        id: string,
        params: { data_referencia?: string; valor?: number; observacao?: string }
    ) => Promise<boolean>;
    deleteLancamento: (lancamentoId: string) => Promise<boolean>;
}

/**
 * Hook para gerenciar lançamentos (time series) de indicadores
 * 
 * Funcionalidades:
 * - fetchLancamentos: Busca lançamentos em um intervalo de datas
 * - upsertLancamento: Insere ou atualiza lançamento (usando UNIQUE constraint)
 */
export const useLancamentos = (): UseLancamentosReturn => {
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    /**
     * Busca lançamentos de um indicador em um período
     * @param indicadorId ID do indicador (user_indicators.id)
     * @param dataInicio Data inicial (formato: YYYY-MM-DD)
     * @param dataFim Data final (formato: YYYY-MM-DD)
     */
    const fetchLancamentos = async (
        indicadorId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<void> => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("lancamentos")
                .select("*")
                .eq("indicador_id", indicadorId)
                .gte("data_referencia", dataInicio)
                .lte("data_referencia", dataFim)
                .order("data_referencia", { ascending: false });

            if (error) {
                console.error("Erro ao buscar lançamentos:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar dados",
                    description: "Não foi possível buscar os lançamentos.",
                });
                return;
            }

            setLancamentos(data || []);
        } catch (err) {
            console.error("Erro inesperado ao buscar lançamentos:", err);
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao buscar os lançamentos.",
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Busca o histórico de lançamentos (últimos N registros)
     * @param indicadorId ID do indicador
     * @param limit Limite de registros (default: 30)
     */
    const fetchHistory = async (
        indicadorId: string,
        limit: number = 30
    ): Promise<void> => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("lancamentos")
                .select("*")
                .eq("indicador_id", indicadorId)
                .order("data_referencia", { ascending: false })
                .limit(limit);

            if (error) {
                console.error("Erro ao buscar histórico:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar histórico",
                    description: "Não foi possível buscar os lançamentos.",
                });
                return;
            }

            setLancamentos(data || []);
        } catch (err) {
            console.error("Erro inesperado ao buscar histórico:", err);
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao buscar o histórico.",
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Insere ou atualiza um lançamento
     * Usa UPSERT baseado na constraint UNIQUE (indicador_id, data_referencia)
     * 
     * @param params Dados do lançamento
     * @returns true se sucesso, false caso contrário
     */
    const upsertLancamento = async (params: {
        indicador_id: string;
        data_referencia: string;
        valor: number;
        observacao?: string;
    }): Promise<boolean> => {
        try {
            setLoading(true);

            // Obter user_id do usuário autenticado
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    variant: "destructive",
                    title: "Não autenticado",
                    description: "Você precisa estar logado para fazer lançamentos.",
                });
                return false;
            }

            // Preparar dados do lançamento
            const lancamentoData: LancamentoInsert = {
                indicador_id: params.indicador_id,
                user_id: user.id,
                data_referencia: params.data_referencia,
                valor: params.valor,
                observacao: params.observacao || null,
            };

            // Upsert: insere se não existir, atualiza se já existir
            const { error } = await supabase
                .from("lancamentos")
                .upsert(lancamentoData, {
                    onConflict: "indicador_id,data_referencia", // Constraint única
                    ignoreDuplicates: false, // Atualizar duplicatas
                });

            if (error) {
                console.error("Erro ao salvar lançamento:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao salvar",
                    description: error.message || "Não foi possível salvar o lançamento.",
                });
                return false;
            }

            toast({
                title: "Lançamento salvo!",
                description: "O valor foi registrado com sucesso.",
            });

            return true;
        } catch (err) {
            console.error("Erro inesperado ao salvar lançamento:", err);
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao salvar o lançamento.",
            });
            return false;
        } finally {
            setLoading(false);
        }
    };



    /**
     * Atualiza um lançamento específico pelo ID
     */
    const updateLancamento = async (
        id: string,
        params: { data_referencia?: string; valor?: number; observacao?: string }
    ): Promise<boolean> => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from("lancamentos")
                .update(params)
                .eq("id", id);

            if (error) {
                console.error("Erro ao atualizar lançamento:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar",
                    description: error.message.includes("unique")
                        ? "Já existe um lançamento para esta data."
                        : "Não foi possível atualizar o registro.",
                });
                return false;
            }

            toast({
                title: "Lançamento atualizado!",
                description: "O registro foi alterado com sucesso.",
            });
            return true;
        } catch (err) {
            console.error("Erro inesperado ao atualizar:", err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deleta um lançamento
     * @param lancamentoId UUID do lançamento
     * @returns true se sucesso, false caso contrário
     */
    const deleteLancamento = async (lancamentoId: string): Promise<boolean> => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from("lancamentos")
                .delete()
                .eq("id", lancamentoId);

            if (error) {
                console.error("Erro ao deletar lançamento:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao deletar",
                    description: error.message || "Não foi possível deletar o lançamento.",
                });
                return false;
            }

            toast({
                title: "Lançamento deletado!",
                description: "O registro foi removido com sucesso.",
            });

            // Atualizar lista local removendo o item deletado
            setLancamentos((prev) => prev.filter((l) => l.id !== lancamentoId));

            return true;
        } catch (err) {
            console.error("Erro inesperado ao deletar lançamento:", err);
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao deletar o lançamento.",
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        lancamentos,
        loading,
        fetchLancamentos,
        fetchHistory,
        upsertLancamento,
        updateLancamento,
        deleteLancamento,
    };
};

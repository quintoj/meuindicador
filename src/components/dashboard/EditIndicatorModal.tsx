import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: "currency" | "percentage" | "number";
  icon: any;
  segment: string;
}

interface EditIndicatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KPI;
  onUpdate: () => void;
}

const EditIndicatorModal = ({ open, onOpenChange, kpi, onUpdate }: EditIndicatorModalProps) => {
  const [name, setName] = useState(kpi.name);
  const [target, setTarget] = useState(kpi.target.toString());
  const [format, setFormat] = useState<"currency" | "percentage" | "number">(kpi.format);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Verificar se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('❌ [EditIndicator] Erro ao buscar usuário:', userError);
          setIsAdmin(false);
          return;
        }

        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Buscar o role do perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ [EditIndicator] Erro ao buscar perfil:', profileError);
          setIsAdmin(false);
          return;
        }

        console.log('🔐 [EditIndicator] Role:', profile?.role);
        setIsAdmin(profile?.role === 'ADMIN');
      } catch (err) {
        console.error('💥 [EditIndicator] Erro inesperado:', err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // Resetar valores quando abrir
  useEffect(() => {
    if (open) {
      setName(kpi.name);
      setTarget(kpi.target.toString());
      setFormat(kpi.format);
    }
  }, [open, kpi]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const targetNum = parseFloat(target) || 0;

      if (!name.trim()) {
        toast({
          variant: "destructive",
          title: "Nome obrigatório",
          description: "Por favor, insira um nome para o indicador.",
        });
        setLoading(false);
        return;
      }

      // Se não é admin e tentou mudar o nome, reverter para o nome original
      const finalName = isAdmin ? name.trim() : kpi.name;

      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado.",
        });
        setLoading(false);
        return;
      }

      // UPDATE na tabela user_indicators
      const { error } = await (supabase as any)
        .from('user_indicators')
        .update({
          name: finalName,
          target_value: targetNum,
          format: format,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kpi.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Indicador atualizado!",
        description: `${finalName} foi atualizado com sucesso.`,
      });

      onOpenChange(false);
      onUpdate();

    } catch (err: any) {
      console.error('Erro ao atualizar indicador:', err);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: err.message || "Não foi possível atualizar o indicador.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado.",
        });
        setDeleting(false);
        return;
      }

      // Desativar o indicador (soft delete)
      const { error } = await (supabase as any)
        .from('user_indicators')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kpi.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Indicador removido!",
        description: `${kpi.name} foi removido do seu dashboard.`,
      });

      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate();

    } catch (err: any) {
      console.error('Erro ao remover indicador:', err);
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: err.message || "Não foi possível remover o indicador.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
              <Edit className="w-6 h-6" />
              <span>Editar Indicador</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nome do Indicador */}
            <div className="space-y-2">
              <Label htmlFor="indicatorName" className="text-base font-semibold flex items-center space-x-2">
                <span>Nome do Indicador</span>
                {!isAdmin && (
                  <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Admin</span>
                  </Badge>
                )}
              </Label>
              <Input
                id="indicatorName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                placeholder="Ex: Ticket Médio"
                disabled={loading || !isAdmin}
              />
              {!isAdmin && (
                <p className="text-xs text-muted-foreground flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Apenas administradores podem alterar o nome do indicador</span>
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <Label htmlFor="indicatorTarget" className="text-base font-semibold">
                Meta (Target)
              </Label>
              <Input
                id="indicatorTarget"
                type="number"
                step="0.01"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="text-lg h-12"
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                O valor alvo que você deseja atingir para este indicador
              </p>
            </div>

            {/* Formato de Exibição */}
            <div className="space-y-2">
              <Label htmlFor="indicatorFormat" className="text-base font-semibold">
                Formato de Exibição
              </Label>
              <select
                id="indicatorFormat"
                value={format}
                onChange={(e) => setFormat(e.target.value as "currency" | "percentage" | "number")}
                disabled={loading}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="number">Número (1.234)</option>
                <option value="currency">Moeda (R$ 1.234,00)</option>
                <option value="percentage">Porcentagem (12,34%)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Como os valores deste indicador serão exibidos no dashboard
              </p>
            </div>

            {/* Preview */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Preview:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{name || "Nome do Indicador"}</span>
                    <span className="text-xl font-bold text-primary">
                      {format === "currency"
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpi.value)
                        : format === "percentage"
                          ? `${kpi.value.toFixed(1)}%`
                          : kpi.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Remover */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleting}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Indicador do Dashboard
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || deleting || !name.trim()}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover <strong>{kpi.name}</strong> do seu dashboard.
              O histórico de dados será mantido, mas o indicador não aparecerá mais.
              Você pode adicioná-lo novamente pela Loja de Indicadores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditIndicatorModal;


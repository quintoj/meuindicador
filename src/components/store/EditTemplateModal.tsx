import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Plus, X, Trash2 } from "lucide-react";
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

interface EditTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  templateId: string;
  initialData: {
    name: string;
    description: string;
    formula: string;
    importance: string;
    segment: string;
    complexity: string;
    icon_name: string;
    required_data: string[];
  };
}

const EditTemplateModal = ({ open, onOpenChange, onSuccess, templateId, initialData }: EditTemplateModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [importance, setImportance] = useState("");
  const [segment, setSegment] = useState<string>("Geral");
  const [complexity, setComplexity] = useState<string>("Fácil");
  const [iconName, setIconName] = useState("");
  const [requiredDataInput, setRequiredDataInput] = useState("");
  const [requiredDataList, setRequiredDataList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Carregar dados iniciais quando abrir
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setFormula(initialData.formula);
      setImportance(initialData.importance);
      setSegment(initialData.segment);
      setComplexity(initialData.complexity);
      setIconName(initialData.icon_name || "");
      setRequiredDataList(initialData.required_data || []);
    }
  }, [open, initialData]);

  const handleAddRequiredData = () => {
    if (requiredDataInput.trim()) {
      setRequiredDataList([...requiredDataList, requiredDataInput.trim()]);
      setRequiredDataInput("");
    }
  };

  const handleRemoveRequiredData = (index: number) => {
    setRequiredDataList(requiredDataList.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!name || !description || !formula || !importance) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
        });
        setLoading(false);
        return;
      }

      // Atualizar template
      const { error } = await (supabase as any)
        .from('indicator_templates')
        .update({
          name: name.trim(),
          description: description.trim(),
          formula: formula.trim(),
          importance: importance.trim(),
          segment: segment,
          complexity: complexity,
          icon_name: iconName.trim() || null,
          required_data: JSON.stringify(requiredDataList),
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) {
        // Log detalhado do erro
        console.error('Erro detalhado ao atualizar template:', error.message || error);
        console.error('Código do erro:', error.code);

        // Erro de nome duplicado
        if (error.code === '23505') {
          toast({
            variant: "destructive",
            title: "Nome duplicado",
            description: "Já existe um indicador com este nome.",
          });
          setLoading(false);
          return;
        }

        // Erro de permissão RLS
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          toast({
            variant: "destructive",
            title: "Permissão negada",
            description: "Você não tem permissão de Admin para editar templates.",
          });
          setLoading(false);
          return;
        }

        throw error;
      }

      toast({
        title: "Template atualizado!",
        description: `${name} foi atualizado com sucesso.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erro detalhado:', err.message || err);
      console.error('Objeto completo:', err);

      const errorMessage = err.message || '';
      if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        toast({
          variant: "destructive",
          title: "Sem permissão de Admin",
          description: "Você não tem permissão de Admin para editar templates.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: err.message || "Não foi possível atualizar o template.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Deletar template
      const { error } = await (supabase as any)
        .from('indicator_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('Erro detalhado ao deletar:', error.message || error);
        
        // Erro de permissão
        if (error.code === '42501' || error.message?.includes('permission')) {
          toast({
            variant: "destructive",
            title: "Permissão negada",
            description: "Você não tem permissão de Admin para deletar templates.",
          });
          setDeleting(false);
          return;
        }

        // Erro de referência (template em uso)
        if (error.code === '23503') {
          toast({
            variant: "destructive",
            title: "Template em uso",
            description: "Este template não pode ser deletado pois está sendo usado por usuários.",
          });
          setDeleting(false);
          return;
        }

        throw error;
      }

      toast({
        title: "Template deletado!",
        description: `${name} foi removido da loja com sucesso.`,
      });

      setShowDeleteDialog(false);
      onOpenChange(false);
      onSuccess();
      
    } catch (err: any) {
      console.error('Erro detalhado:', err.message || err);
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: err.message || "Não foi possível deletar o template.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
              <Edit className="w-6 h-6" />
              <span>Editar Template</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                Nome do Indicador *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ticket Médio"
                disabled={loading}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Descrição *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que este indicador mede..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Fórmula */}
            <div className="space-y-2">
              <Label htmlFor="formula" className="text-base font-semibold">
                Fórmula *
              </Label>
              <Textarea
                id="formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex: Faturamento total / Número de clientes"
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Importância */}
            <div className="space-y-2">
              <Label htmlFor="importance" className="text-base font-semibold">
                Por que é importante? *
              </Label>
              <Textarea
                id="importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                placeholder="Explique a importância deste indicador..."
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Segmento e Complexidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="segment" className="text-base font-semibold">
                  Segmento *
                </Label>
                <select
                  id="segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Geral">Geral</option>
                  <option value="Academia">Academia</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Contabilidade">Contabilidade</option>
                  <option value="PetShop">Pet Shop</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity" className="text-base font-semibold">
                  Complexidade *
                </Label>
                <select
                  id="complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
            </div>

            {/* Ícone */}
            <div className="space-y-2">
              <Label htmlFor="iconName" className="text-base font-semibold">
                Nome do Ícone (Lucide React)
              </Label>
              <Input
                id="iconName"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="Ex: DollarSign, Users, Target"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Opções: Users, DollarSign, Percent, Target, Clock, PawPrint, Heart, Award, etc.
              </p>
            </div>

            {/* Dados Necessários */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Dados Necessários
              </Label>
              <div className="flex space-x-2">
                <Input
                  value={requiredDataInput}
                  onChange={(e) => setRequiredDataInput(e.target.value)}
                  placeholder="Ex: Faturamento mensal"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequiredData();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddRequiredData}
                  disabled={loading || !requiredDataInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {requiredDataList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requiredDataList.map((data, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {data}
                      <button
                        onClick={() => handleRemoveRequiredData(index)}
                        className="ml-1 hover:text-destructive"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Deletar */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleting}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Template da Loja
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                ⚠️ Atenção: Esta ação não pode ser desfeita
              </p>
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
              disabled={loading || deleting}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
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
            <AlertDialogTitle>Deletar Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar <strong>{name}</strong> da loja de indicadores.
              <br /><br />
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Os usuários que já adicionaram 
              este indicador não serão afetados, mas ele não estará mais disponível na loja para novos usuários.
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
                  Deletando...
                </>
              ) : (
                "Deletar Template"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditTemplateModal;


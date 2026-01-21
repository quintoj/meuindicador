
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { useLancamentos } from "@/hooks/useLancamentos";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    indicador: {
        id: string;
        name: string;
        format: "currency" | "percentage" | "number";
        template?: {
            formula?: string;
        };
    };
    onDataChange?: () => void;
}

export const HistoryModal = ({ isOpen, onClose, indicador, onDataChange }: HistoryModalProps) => {
    const { lancamentos, loading, fetchHistory, updateLancamento, deleteLancamento } = useLancamentos();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ date: string; value: string }>({ date: "", value: "" });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Determines if the indicator is calculated via formula
    const isCalculated = !!indicador.template?.formula;

    useEffect(() => {
        if (isOpen && indicador.id) {
            fetchHistory(indicador.id, 30);
            setEditingId(null);
        }
    }, [isOpen, indicador.id]);

    const handleEdit = (lancamento: any) => {
        setEditingId(lancamento.id);
        setEditValues({
            date: lancamento.data_referencia,
            value: String(lancamento.valor)
        });
    }

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({ date: "", value: "" });
    }

    const handleSave = async (id: string) => {
        const valorNumerico = parseFloat(editValues.value);
        if (isNaN(valorNumerico) || !editValues.date) return;

        const success = await updateLancamento(id, {
            data_referencia: editValues.date,
            valor: valorNumerico
        });

        if (success) {
            setEditingId(null);
            await fetchHistory(indicador.id, 30);
            onDataChange?.();
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return;
        const success = await deleteLancamento(deleteId);
        if (success) {
            setDeleteId(null);
            await fetchHistory(indicador.id, 30);
            onDataChange?.();
        }
    }

    const formatValue = (val: number) => {
        if (indicador.format === 'currency') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (indicador.format === 'percentage') return val.toFixed(1) + '%';
        return val.toLocaleString('pt-BR');
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Histórico de Lançamentos</DialogTitle>
                    <DialogDescription>
                        Gerencie os últimos lançamentos do indicador <strong>{indicador.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {isCalculated && (
                    <Alert className="mb-4 bg-yellow-50 text-yellow-900 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                            Este é um indicador calculado. Alterar valores manualmente pode gerar inconsistências com as variáveis originais.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 overflow-auto border rounded-md">
                    {loading && lancamentos.length === 0 ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Data</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="hidden md:table-cell">Observação</TableHead>
                                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lancamentos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Nenhum lançamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lancamentos.map((lancamento) => (
                                        <TableRow key={lancamento.id}>
                                            {editingId === lancamento.id ? (
                                                <>
                                                    <TableCell>
                                                        <Input
                                                            type="date"
                                                            value={editValues.date}
                                                            onChange={(e) => setEditValues(prev => ({ ...prev, date: e.target.value }))}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={editValues.value}
                                                            onChange={(e) => setEditValues(prev => ({ ...prev, value: e.target.value }))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                                        {lancamento.observacao || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSave(lancamento.id)}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={handleCancelEdit}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="font-medium">
                                                        {format(new Date(lancamento.data_referencia + 'T00:00:00'), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatValue(Number(lancamento.valor))}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate" title={lancamento.observacao || ''}>
                                                        {lancamento.observacao || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(lancamento)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeleteId(lancamento.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento do histórico.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

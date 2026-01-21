import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface DateRange {
    from: Date;
    to: Date;
}

interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

export const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
    const presets = [
        {
            label: "Hoje",
            getValue: () => {
                const today = new Date();
                return {
                    from: startOfDay(today),
                    to: endOfDay(today),
                };
            },
        },
        {
            label: "Ontem",
            getValue: () => {
                const yesterday = subDays(new Date(), 1);
                return {
                    from: startOfDay(yesterday),
                    to: endOfDay(yesterday),
                };
            },
        },
        {
            label: "Últimos 7 dias",
            getValue: () => ({
                from: startOfDay(subDays(new Date(), 6)),
                to: endOfDay(new Date()),
            }),
        },
        {
            label: "Este Mês",
            getValue: () => ({
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date()),
            }),
        },
        {
            label: "Mês Passado",
            getValue: () => {
                const lastMonth = subDays(startOfMonth(new Date()), 1);
                return {
                    from: startOfMonth(lastMonth),
                    to: endOfMonth(lastMonth),
                };
            },
        },
    ];

    const formatRange = () => {
        if (!value.from || !value.to) return "Selecione o período";

        const fromStr = format(value.from, "dd MMM", { locale: ptBR });
        const toStr = format(value.to, "dd MMM", { locale: ptBR });

        if (fromStr === toStr) return fromStr;
        return `${fromStr} - ${toStr}`;
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Botões de preset */}
            {presets.map((preset) => (
                <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(preset.getValue())}
                    className={cn(
                        "text-xs",
                        value.from &&
                        value.to &&
                        format(value.from, "yyyy-MM-dd") ===
                        format(preset.getValue().from, "yyyy-MM-dd") &&
                        format(value.to, "yyyy-MM-dd") ===
                        format(preset.getValue().to, "yyyy-MM-dd") &&
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {preset.label}
                </Button>
            ))}

            {/* Seletor customizado */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "justify-start text-left font-normal text-xs",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatRange()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Início</label>
                            <Calendar
                                mode="single"
                                selected={value.from}
                                onSelect={(date) => {
                                    if (date) {
                                        onChange({ ...value, from: startOfDay(date) });
                                    }
                                }}
                                locale={ptBR}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Fim</label>
                            <Calendar
                                mode="single"
                                selected={value.to}
                                onSelect={(date) => {
                                    if (date) {
                                        onChange({ ...value, to: endOfDay(date) });
                                    }
                                }}
                                locale={ptBR}
                                disabled={(date) => date < value.from}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Calendar, 
  Loader2, 
  BarChart3, 
  Plus, 
  Dumbbell,
  Clock,
  PawPrint,
  Heart,
  Award,
  Zap,
  AlertCircle,
  HelpCircle,
  UtensilsCrossed,
  Calculator,
  Building,
  ShoppingCart
} from "lucide-react";
import { Link } from "react-router-dom";
import KPICard from "@/components/dashboard/KPICard";
import AIChat from "@/components/ai/AIChat";
import UserHelpGuide from "@/components/dashboard/UserHelpGuide";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { getIndicatorStatus, type IndicatorDirection } from "@/utils/indicators";
import type { LucideIcon } from "lucide-react";

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: "currency" | "percentage" | "number";
  icon: LucideIcon;
  segment: string;
  template?: {
    id: string;
    name: string;
    formula: string;
    required_data: any;
    input_fields: any;
    calc_method: string;
    direction: string;
    unit_type: string;
  };
}

// Mapeamento robusto de nomes de ícones para componentes
// Garante que todos os ícones usados no banco estão mapeados
const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Dumbbell,
  UtensilsCrossed,
  Calculator,
  PawPrint,
  Building,
  DollarSign,
  Users,
  Percent,
  TrendingUp,
  Target,
  Clock,
  ShoppingCart,
  Heart,
  Award,
  Zap,
  AlertCircle,
  HelpCircle,
};

// Função segura para obter o componente de ícone pelo nome
// Sempre retorna um ícone válido, usando HelpCircle como fallback
const getIcon = (iconName: string | null): LucideIcon => {
  // Se não há nome de ícone, retorna HelpCircle
  if (!iconName || iconName.trim() === '') {
    return HelpCircle;
  }
  
  // Normaliza o nome do ícone (remove espaços, capitaliza primeira letra)
  const normalizedName = iconName.trim();
  
  // Verifica se o ícone existe no mapa
  const icon = iconMap[normalizedName];
  
  // Se não encontrar, retorna HelpCircle como fallback seguro
  if (!icon) {
    console.warn(`Ícone "${iconName}" não encontrado no mapa. Usando HelpCircle como fallback.`);
    return HelpCircle;
  }
  
  return icon;
};

const Dashboard = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // KPIs estáticos como fallback
  const staticKPIs: KPI[] = [
    {
      id: "1",
      name: "Faturamento Mensal",
      value: 85420,
      target: 100000,
      format: "currency" as const,
      icon: DollarSign,
      segment: "Geral"
    },
    {
      id: "2", 
      name: "Ticket Médio",
      value: 127.50,
      target: 150,
      format: "currency" as const,
      icon: TrendingUp,
      segment: "Vendas"
    },
    {
      id: "3",
      name: "Taxa de Conversão",
      value: 23.4,
      target: 25,
      format: "percentage" as const,
      icon: Percent,
      segment: "Marketing"
    },
    {
      id: "4",
      name: "Clientes Ativos",
      value: 892,
      target: 1000,
      format: "number" as const,
      icon: Users,
      segment: "Clientes"
    },
    {
      id: "5",
      name: "Margem Bruta",
      value: 34.2,
      target: 40,
      format: "percentage" as const, 
      icon: TrendingUp,
      segment: "Financeiro"
    },
    {
      id: "6",
      name: "Novos Clientes",
      value: 45,
      target: 50,
      format: "number" as const,
      icon: Users,
      segment: "Aquisição"
    }
  ];

  // Função para buscar indicadores do usuário
  const fetchUserIndicators = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Usuário não autenticado');
        setKpis([]);
        return;
      }

      // 🔧 FONTE DA VERDADE: Buscar TODOS os campos do template
      // Para garantir que mudanças no template sejam refletidas imediatamente
      const { data, error } = await (supabase as any)
        .from('user_indicators')
        .select(`
          *,
          template:indicator_templates(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erro ao buscar indicadores do usuário:', error);
        setKpis([]);
        return;
      }

      if (data && data.length > 0) {
        console.log('Dados buscados do banco (com template):', data);
        
        // Mapear dados do Supabase para o formato esperado
        const mappedKPIs: KPI[] = data.map((item: any) => {
          // 🔧 Meta (Target): se o usuário não definiu (NULL), usar a meta padrão do template (admin)
          const userTargetRaw = item.target_value;
          const templateDefaultTargetRaw = item.template?.default_critical_threshold;
          const resolvedTarget =
            userTargetRaw !== null && userTargetRaw !== undefined
              ? Number(userTargetRaw)
              : (templateDefaultTargetRaw !== null && templateDefaultTargetRaw !== undefined
                  ? Number(templateDefaultTargetRaw)
                  : 0);

          return {
          id: String(item.id),
          name: item.name || '',
          value: Number(item.current_value) || 0,
          target: resolvedTarget,
          format: item.format || 'number',
          icon: getIcon(item.icon_name),
          segment: item.segment || 'Geral',
          template: item.template || undefined // 👈 Incluir template no KPI
          };
        });
        
        console.log('KPIs mapeados (com template):', mappedKPIs);
        setKpis(mappedKPIs);
      } else {
        // Nenhum indicador encontrado - dashboard vazio
        setKpis([]);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar indicadores:', err);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar indicadores do usuário do Supabase
  useEffect(() => {
    fetchUserIndicators();
  }, [fetchUserIndicators]);

  // Filtrar KPIs baseado na busca
  const filteredKPIs = kpis.filter(kpi =>
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estatísticas usando a lógica centralizada
  // 🔧 CORRIGIDO: Agora respeita HIGHER_BETTER vs LOWER_BETTER
  // 🔧 v1.27: Agora usa thresholds do template
  const stats = kpis.reduce((acc, kpi) => {
    const direction = (kpi.template?.direction as IndicatorDirection) || 'HIGHER_BETTER';
    const warningThreshold = kpi.template?.default_warning_threshold;
    const criticalThreshold = kpi.template?.default_critical_threshold;
    const status = getIndicatorStatus(kpi.value, kpi.target, direction, warningThreshold, criticalThreshold);
    
    if (status === 'success') acc.success++;
    else if (status === 'warning') acc.warning++;
    else if (status === 'danger') acc.danger++;
    
    return acc;
  }, { 
    total: kpis.length,
    success: 0,  // Verde (Acima/Dentro da Meta)
    warning: 0,  // Amarelo (Próximo da Meta)
    danger: 0    // Vermelho (Abaixo/Fora da Meta)
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        showAddButton={true}
        showSettings={true}
        title="Dashboard"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Acompanhe seus indicadores de performance em tempo real</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Última atualização: hoje às 14:30</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-success text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Acima/Dentro da Meta</p>
                    <p className="text-2xl font-bold">{stats.success}</p>
                  </div>
                  <Target className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-warning text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Próximo da Meta</p>
                    <p className="text-2xl font-bold">{stats.warning}</p>
                  </div>
                  <Target className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-danger text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Abaixo/Fora da Meta</p>
                    <p className="text-2xl font-bold">{stats.danger}</p>
                  </div>
                  <Target className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de KPIs</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KPIs Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Seus Indicadores</h2>
              <div className="flex items-center space-x-2">
                <UserHelpGuide />
                <Input 
                  placeholder="Buscar indicador..." 
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Carregando indicadores...</h3>
                <p className="text-muted-foreground">Buscando dados do banco de dados</p>
              </div>
            ) : (
              <>
                {filteredKPIs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredKPIs.map((kpi) => (
                      <KPICard key={kpi.id} kpi={kpi} onUpdate={fetchUserIndicators} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchTerm ? 'Nenhum indicador encontrado' : 'Bem-vindo ao Meu Indicador!'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Tente ajustar sua busca.' 
                        : 'Você ainda não adicionou nenhum indicador. Comece visitando a Loja de Indicadores!'}
                    </p>
                    {!searchTerm && (
                      <Link to="/store">
                        <Button className="bg-gradient-primary text-white hover:opacity-90 mt-2">
                          <Plus className="w-4 h-4 mr-2" />
                          Ir para a Loja
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Add New KPI Card */}
            <Link to="/store">
              <Card className="mt-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors cursor-pointer bg-gradient-card">
                <CardContent className="p-8 text-center">
                  <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Adicionar Novo KPI</h3>
                  <p className="text-muted-foreground">Escolha entre centenas de indicadores para o seu segmento</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* AI Chat Sidebar */}
          <div className="lg:col-span-1">
            <AIChat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
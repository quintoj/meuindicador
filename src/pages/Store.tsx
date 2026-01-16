import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, Info, Edit,
  Dumbbell, UtensilsCrossed, Calculator, 
  PawPrint, Building, DollarSign, Users, 
  Percent, TrendingUp, Target, Clock,
  ShoppingCart, Heart, Award, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import AddTemplateModal from "@/components/store/AddTemplateModal";
import EditTemplateModal from "@/components/store/EditTemplateModal";
import AdminHelpGuide from "@/components/admin/AdminHelpGuide";
import type { Tables } from "@/integrations/supabase/types";

interface Indicator {
  id: string;
  name: string;
  description: string;
  formula: string;
  importance: string;
  segment: string;
  complexity: "Fácil" | "Intermediário" | "Avançado";
  icon: any;
  required_data: string[];
}

// Mapeamento de nomes de ícones para componentes
import { BarChart3 as BarChart3Icon } from "lucide-react";

const iconMap: Record<string, any> = {
  BarChart3: BarChart3Icon,
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
};

// Função para obter o componente de ícone pelo nome
const getIcon = (iconName: string | null) => {
  if (!iconName) return Building;
  return iconMap[iconName] || Building;
};

// Emails de admin - aceita ambos os emails (antigo e novo)
const ADMIN_EMAILS = [
  "admin@meuindicador.com",
  "admin@meugestor.com"  // Email antigo mantido para compatibilidade
];

const Store = () => {
  const [selectedSegment, setSelectedSegment] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingIndicator, setAddingIndicator] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Tables<'indicator_templates'> | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Indicadores estáticos como fallback
  const staticIndicators: Indicator[] = [
    // Academia
    {
      id: "aca_01", name: "Clientes Ativos", segment: "Academia",
      description: "Número de clientes com contrato vigente e acesso liberado à academia",
      formula: "Soma de todos os clientes com status 'ativo'",
      importance: "Indica a base de clientes recorrentes e a estabilidade da receita mensal",
      complexity: "Fácil", icon: Users,
      required_data: ["Lista de clientes", "Status do contrato", "Data de vencimento"]
    },
    {
      id: "aca_02", name: "Taxa de Evasão", segment: "Academia", 
      description: "Percentual de clientes que cancelaram em relação ao total de ativos",
      formula: "(Cancelamentos no período / Clientes ativos) × 100",
      importance: "Mede a retenção de clientes e indica problemas na qualidade do serviço",
      complexity: "Intermediário", icon: TrendingUp,
      required_data: ["Cancelamentos", "Total de clientes ativos", "Período de análise"]
    },
    {
      id: "aca_03", name: "Check-ins por Cliente", segment: "Academia",
      description: "Média de visitas mensais por cliente ativo",
      formula: "Total de check-ins no mês / Número de clientes ativos", 
      importance: "Indica o engajamento dos clientes e uso efetivo da academia",
      complexity: "Fácil", icon: Target,
      required_data: ["Registro de check-ins", "Clientes ativos", "Período"]
    },

    // Restaurante
    {
      id: "rest_01", name: "Ticket Médio", segment: "Restaurante",
      description: "Valor médio gasto por cliente em cada visita",
      formula: "Faturamento total / Número de clientes atendidos",
      importance: "Indica o valor percebido pelos clientes e eficiência nas vendas",
      complexity: "Fácil", icon: DollarSign,
      required_data: ["Faturamento diário", "Número de clientes", "Período"]
    },
    {
      id: "rest_02", name: "Food Cost", segment: "Restaurante",
      description: "Percentual do custo dos ingredientes sobre a receita",
      formula: "(Custo dos ingredientes / Receita total) × 100",
      importance: "Controla a margem de lucro e eficiência no uso dos ingredientes",
      complexity: "Intermediário", icon: Percent,
      required_data: ["Custo dos ingredientes", "Receita total", "Estoque"]
    },
    {
      id: "rest_03", name: "Giro de Mesa", segment: "Restaurante",
      description: "Quantas vezes cada mesa é ocupada por dia",
      formula: "Número de ocupações / Número de mesas disponíveis",
      importance: "Mede a eficiência operacional e capacidade de atendimento",
      complexity: "Intermediário", icon: Clock,
      required_data: ["Ocupações por mesa", "Número de mesas", "Horário de funcionamento"]
    },

    // Pet Shop
    {
      id: "pet_01", name: "Atendimentos (Banho/Tosa)", segment: "PetShop",
      description: "Número total de serviços de banho e tosa realizados",
      formula: "Soma de todos os serviços de banho e tosa no período",
      importance: "Principal indicador de volume de serviços e capacidade operacional",
      complexity: "Fácil", icon: PawPrint,
      required_data: ["Agendamentos", "Serviços realizados", "Período"]
    },
    {
      id: "pet_02", name: "Taxa de Recompra", segment: "PetShop",
      description: "Percentual de clientes que retornam para novas compras",
      formula: "(Clientes que compraram novamente / Total de clientes) × 100", 
      importance: "Indica fidelização dos clientes e qualidade dos produtos/serviços",
      complexity: "Intermediário", icon: Heart,
      required_data: ["Histórico de compras", "Clientes únicos", "Período de análise"]
    },

    // Contabilidade  
    {
      id: "cont_01", name: "Receita Recorrente Mensal", segment: "Contabilidade",
      description: "Valor mensal garantido dos contratos de clientes ativos",
      formula: "Soma dos valores mensais de todos os contratos ativos",
      importance: "Previsibilidade da receita e base para planejamento financeiro",
      complexity: "Fácil", icon: DollarSign,
      required_data: ["Contratos ativos", "Valor mensal", "Status do cliente"]
    },
    {
      id: "cont_02", name: "SLA de Entrega", segment: "Contabilidade",
      description: "Percentual de entregas realizadas dentro do prazo acordado",
      formula: "(Entregas no prazo / Total de entregas) × 100",
      importance: "Mede a qualidade do serviço e satisfação dos clientes",
      complexity: "Intermediário", icon: Clock,
      required_data: ["Data de entrega", "Prazo acordado", "Status da entrega"]
    },

    // Genéricos
    {
      id: "gen_01", name: "CAC - Custo de Aquisição", segment: "Geral",
      description: "Quanto custa para adquirir um novo cliente",
      formula: "Investimento em marketing / Número de novos clientes",
      importance: "Essencial para avaliar a eficiência dos investimentos em marketing",
      complexity: "Intermediário", icon: DollarSign,
      required_data: ["Gastos com marketing", "Novos clientes", "Período"]
    },
    {
      id: "gen_02", name: "LTV - Lifetime Value", segment: "Geral", 
      description: "Valor total que um cliente gera durante todo relacionamento",
      formula: "Ticket médio × Frequência × Tempo de vida",
      importance: "Fundamental para estratégias de retenção e investimento em clientes",
      complexity: "Avançado", icon: Award,
      required_data: ["Ticket médio", "Frequência de compra", "Tempo de relacionamento"]
    }
  ];

  // Verificar se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Verifica se o email está na lista de admins
      if (user) {
        // 1. Vai no banco buscar o cargo real do usuário
        const { data: profile } = await supabase
          .from('user_profiles') // Confirme se o nome da sua tabela é 'profiles' ou 'user_profiles'
          .select('role')
          .eq('id', user.id)
          .single();
      
        // 2. Verifica se é Admin (aceita maiúsculo ou minúsculo)
        if (profile?.role === 'ADMIN' || profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  // Buscar indicadores do Supabase
  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('indicator_templates')
        .select('*')
        .order('name');

        if (error) {
          console.error('Erro ao buscar indicadores:', error);
          // Usar dados estáticos como fallback em caso de erro
          setIndicators(staticIndicators);
          return;
        }

        if (data && data.length > 0) {
          // Mapear dados do Supabase para o formato esperado
          const mappedIndicators: Indicator[] = data.map((item: Tables<'indicator_templates'>) => {
            // Processar required_data que pode ser JSONB
            let requiredDataArray: string[] = [];
            if (item.required_data) {
              if (Array.isArray(item.required_data)) {
                requiredDataArray = item.required_data as string[];
              } else if (typeof item.required_data === 'string') {
                try {
                  requiredDataArray = JSON.parse(item.required_data);
                } catch {
                  requiredDataArray = [];
                }
              }
            }

            return {
              id: String(item.id), // Converter UUID para string
              name: item.name || '',
              description: item.description || '',
              formula: item.formula || '',
              importance: item.importance || '',
              segment: item.segment || 'Geral',
              complexity: (item.complexity || 'Fácil') as "Fácil" | "Intermediário" | "Avançado",
              icon: getIcon(item.icon_name),
              required_data: requiredDataArray
            };
          });
          setIndicators(mappedIndicators);
        } else {
          // Tabela vazia, usar dados estáticos como fallback
          setIndicators(staticIndicators);
        }
    } catch (err) {
      console.error('Erro inesperado ao buscar indicadores:', err);
      // Usar dados estáticos como fallback em caso de erro
      setIndicators(staticIndicators);
    } finally {
      setLoading(false);
    }
  };

  // Calcular contagem de indicadores por segmento
  const getSegmentCount = (segmentId: string) => {
    if (segmentId === "Todos") {
      return indicators.length;
    }
    return indicators.filter(ind => ind.segment === segmentId).length;
  };

  const segments = [
    { id: "Todos", name: "Todos", icon: Building, count: getSegmentCount("Todos") },
    { id: "Academia", name: "Academias", icon: Dumbbell, count: getSegmentCount("Academia") },
    { id: "Restaurante", name: "Restaurantes", icon: UtensilsCrossed, count: getSegmentCount("Restaurante") },
    { id: "Contabilidade", name: "Contabilidade", icon: Calculator, count: getSegmentCount("Contabilidade") },
    { id: "PetShop", name: "Pet Shops", icon: PawPrint, count: getSegmentCount("PetShop") },
    { id: "Geral", name: "Genéricos", icon: Building, count: getSegmentCount("Geral") },
  ];

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSegment = selectedSegment === "Todos" || indicator.segment === selectedSegment;
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSegment && matchesSearch;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Fácil": return "bg-success/10 text-success border-success/20";
      case "Intermediário": return "bg-warning/10 text-warning border-warning/20"; 
      case "Avançado": return "bg-danger/10 text-danger border-danger/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  // Função para adicionar indicador ao dashboard
  const handleAddToDashboard = async (indicator: Indicator) => {
    try {
      setAddingIndicator(indicator.id);
      
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para adicionar indicadores.",
        });
        navigate("/auth");
        return;
      }

      // Buscar o template completo do indicador no banco de dados
      const { data: templateData, error: templateError } = await (supabase as any)
        .from('indicator_templates')
        .select('*')
        .eq('id', indicator.id)
        .single();

      if (templateError || !templateData) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível encontrar o template do indicador.",
        });
        return;
      }

      // 🔧 CORREÇÃO: Verificar se já existe um registro inativo (soft deleted)
      const { data: existingIndicator } = await (supabase as any)
        .from('user_indicators')
        .select('id, is_active, target_value')
        .eq('user_id', user.id)
        .eq('indicator_template_id', templateData.id)
        .maybeSingle();

      // Se existe um registro inativo, reativá-lo em vez de inserir novo
      if (existingIndicator && !existingIndicator.is_active) {
        console.log('♻️ Reativando indicador existente:', existingIndicator.id);
        
        // 🔧 Se o usuário não tinha meta pessoal, re-sincroniza com a meta padrão do template (admin)
        const shouldSyncTarget =
          existingIndicator.target_value === null ||
          existingIndicator.target_value === undefined ||
          Number(existingIndicator.target_value) === 0;

        const { error: updateError } = await (supabase as any)
          .from('user_indicators')
          .update({
            is_active: true,
            ...(shouldSyncTarget ? { target_value: templateData.default_critical_threshold || null } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingIndicator.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Indicador reativado!",
          description: `${indicator.name} foi adicionado novamente ao seu dashboard.`,
        });

        navigate("/dashboard");
        setAddingIndicator(null);
        return;
      }

      // Se já existe e está ativo, avisar o usuário
      if (existingIndicator && existingIndicator.is_active) {
        toast({
          variant: "destructive",
          title: "Indicador já adicionado",
          description: "Este indicador já está ativo no seu dashboard.",
        });
        setAddingIndicator(null);
        return;
      }

      // Determinar o formato baseado no nome ou segmento
      let format: "currency" | "percentage" | "number" = "number";
      const nameLower = indicator.name.toLowerCase();
      if (nameLower.includes("percentual") || nameLower.includes("taxa") || nameLower.includes("%")) {
        format = "percentage";
      } else if (nameLower.includes("receita") || nameLower.includes("faturamento") || nameLower.includes("valor") || nameLower.includes("ticket")) {
        format = "currency";
      }

      // 🔧 v1.27: Sincronizar meta inicial com threshold do template
      // Copia default_critical_threshold do template como meta inicial do usuário
      const initialTarget = templateData.default_critical_threshold || null;
      
      console.log('📦 Adicionando indicador com meta inicial do template:', {
        template_name: templateData.name,
        default_critical_threshold: templateData.default_critical_threshold,
        initial_target: initialTarget
      });

      // Inserir novo indicador na tabela user_indicators
      const { data, error } = await (supabase as any)
        .from('user_indicators')
        .insert({
          user_id: user.id,
          indicator_template_id: templateData.id,
          name: templateData.name,
          current_value: 0,
          target_value: initialTarget,  // 🔧 Meta inicial sincronizada!
          format: format,
          segment: templateData.segment || 'Geral',
          icon_name: templateData.icon_name,
          is_active: true,
          position: null, // Será definido automaticamente ou depois
        })
        .select()
        .single();

      if (error) {
        // Verificar se é erro de duplicata (não deveria acontecer mais)
        if (error.code === '23505' || error.message.includes('unique')) {
          toast({
            variant: "destructive",
            title: "Indicador já adicionado",
            description: "Este indicador já está no seu dashboard.",
          });
          setAddingIndicator(null);
          return;
        }

        toast({
          variant: "destructive",
          title: "Erro ao adicionar",
          description: "Não foi possível adicionar o indicador. Tente novamente.",
        });
        return;
      }

      // Sucesso
      toast({
        title: "Indicador adicionado!",
        description: `${indicator.name} foi adicionado ao seu dashboard com sucesso.`,
      });

      // Redirecionar para o dashboard após 1 segundo
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (err) {
      console.error('Erro inesperado ao adicionar indicador:', err);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      });
    } finally {
      setAddingIndicator(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header showBackButton={true} />
      
      <AddTemplateModal
        open={showAddTemplateModal}
        onOpenChange={setShowAddTemplateModal}
        onSuccess={fetchIndicators}
      />

      <EditTemplateModal
        open={showEditTemplateModal}
        onOpenChange={setShowEditTemplateModal}
        template={editingTemplate}
        onSuccess={fetchIndicators}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Loja de Indicadores</h1>
            <p className="text-muted-foreground">Escolha os KPIs perfeitos para o seu segmento e comece a monitorar agora mesmo</p>
          </div>
          {isAdmin && (
            <div className="flex items-center space-x-3">
              <AdminHelpGuide />
              <Button
                onClick={() => setShowAddTemplateModal(true)}
                className="bg-gradient-primary text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar indicadores..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Segments */}
        <Tabs value={selectedSegment} onValueChange={setSelectedSegment} className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 h-auto p-2 bg-muted/30">
            {segments.map(segment => {
              const Icon = segment.icon;
              return (
                <TabsTrigger
                  key={segment.id}
                  value={segment.id}
                  className="flex flex-col items-center space-y-2 p-4 h-auto data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{segment.name}</div>
                    <div className="text-xs opacity-70">{segment.count} KPIs</div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedSegment} className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Carregando indicadores...</h3>
                <p className="text-muted-foreground">Buscando dados do banco de dados</p>
              </div>
            ) : filteredIndicators.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum indicador encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca ou escolher outro segmento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIndicators.map((indicator) => {
                  const Icon = indicator.icon;
                  return (
                    <Card key={indicator.id} className="bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-300 group">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {indicator.name}
                                {(indicator as any).is_system_template && (
    <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-foreground ring-1 ring-inset ring-primary/10">
    Padrão do Sistema
  </span>
)}
                              </CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                {indicator.segment}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getComplexityColor(indicator.complexity)} border text-xs`}>
                              {indicator.complexity}
                            </Badge>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // 🔧 CORREÇÃO: Buscar template completo do banco com TODOS os campos
                                  const { data: fullTemplate, error } = await supabase
                                    .from('indicator_templates')
                                    .select('*')
                                    .eq('id', indicator.id)
                                    .single();
                                  
                                  if (error) {
                                    console.error('Erro ao buscar template completo:', error);
                                    toast({
                                      variant: "destructive",
                                      title: "Erro",
                                      description: "Não foi possível carregar o template.",
                                    });
                                    return;
                                  }
                                  
                                  console.log('📦 Template completo carregado:', fullTemplate);
                                  setEditingTemplate(fullTemplate);
                                  setShowEditTemplateModal(true);
                                }}
                                title="Editar Template (Admin)"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {indicator.description}
                        </p>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Calculator className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Fórmula</span>
                            </div>
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              {indicator.formula}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Info className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Por que é importante?</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {indicator.importance}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <ShoppingCart className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Dados necessários</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {indicator.required_data.map((data, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {data}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-gradient-primary text-white hover:opacity-90 mt-4"
                          onClick={() => handleAddToDashboard(indicator)}
                          disabled={addingIndicator === indicator.id}
                        >
                          {addingIndicator === indicator.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar ao Dashboard
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Store;
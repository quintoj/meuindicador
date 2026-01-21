import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    FileText, Settings, User, ArrowLeft, Printer, Target, TrendingUp,
    Calendar, Info, Lightbulb, AlertTriangle, CheckCircle, LogIn,
    BarChart3, Edit3, Eye, Filter, PlusCircle, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

/* ─────────────────────────────────────────────────────────────
   COMPONENTES AUXILIARES
───────────────────────────────────────────────────────────── */

const Step = ({ number, children }: { number: number; children: React.ReactNode }) => (
    <div className="flex items-start gap-4 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {number}
        </div>
        <div className="flex-1 text-sm text-muted-foreground pt-1">{children}</div>
    </div>
);

const Callout = ({ type, title, children }: { type: "info" | "warning" | "success"; title?: string; children: React.ReactNode }) => {
    const styles = {
        info: { bg: "bg-blue-50 border-blue-300", icon: <Lightbulb className="h-5 w-5 text-blue-600" /> },
        warning: { bg: "bg-yellow-50 border-yellow-300", icon: <AlertTriangle className="h-5 w-5 text-yellow-600" /> },
        success: { bg: "bg-green-50 border-green-300", icon: <CheckCircle className="h-5 w-5 text-green-600" /> },
    }[type];
    return (
        <div className={`border-l-4 p-4 rounded-r-lg ${styles.bg} my-6 flex gap-3`}>
            <div className="shrink-0 pt-0.5">{styles.icon}</div>
            <div className="flex-1 text-sm text-foreground">
                {title && <strong className="block mb-1">{title}</strong>}
                {children}
            </div>
        </div>
    );
};

const ChapterHeader = ({ icon: Icon, number, title }: { icon: any; number: number; title: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b print:break-before-page">
        <div className="p-3 bg-primary/10 rounded-xl">
            <Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capítulo {number}</span>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────────────────────── */

const Help = () => {
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-background print:bg-white">
            {/* Header – oculto na impressão */}
            <div className="print:hidden">
                <Header title="Manual de Ajuda" />
            </div>

            {/* Barra de ações – oculta na impressão */}
            <div className="container mx-auto px-4 py-4 flex items-center justify-between print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg">
                    <Printer className="h-4 w-4" /> Baixar Manual Completo (PDF)
                </Button>
            </div>

            {/* ══════════════════════════════════════════════════════════
          CAPA DO MANUAL (apenas impressão)
      ══════════════════════════════════════════════════════════ */}
            <div className="hidden print:flex print:flex-col print:items-center print:justify-center print:min-h-[70vh] print:text-center print:border-b print:pb-12 print:mb-12">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6">
                    <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-extrabold mb-4">Meu Indicador</h1>
                <p className="text-2xl text-gray-600 mb-2">Manual Oficial de Operação</p>
                <p className="text-lg text-gray-500">Guia Completo para Usuários e Administradores</p>
                <p className="text-sm text-gray-400 mt-8">Documento gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 0 – PRIMEIROS PASSOS (LOGIN)
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={LogIn} number={0} title="Primeiros Passos – Acessando o Sistema" />

                    <p className="text-muted-foreground mb-6">
                        Antes de tudo, você precisa acessar sua conta. O sistema utiliza autenticação segura via e-mail e senha.
                    </p>

                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <h3 className="font-bold text-lg mb-4">Como fazer Login</h3>
                            <Step number={1}>Acesse a URL do sistema (ex: <code className="bg-muted px-2 py-1 rounded text-xs">seusite.vercel.app</code>).</Step>
                            <Step number={2}>Clique em <strong>"Entrar"</strong> ou <strong>"Acessar Conta"</strong>.</Step>
                            <Step number={3}>Insira seu <strong>e-mail</strong> e <strong>senha</strong> cadastrados.</Step>
                            <Step number={4}>Clique em <strong>"Entrar"</strong>. Você será redirecionado para o Dashboard.</Step>
                        </CardContent>
                    </Card>

                    <Callout type="info" title="💡 Esqueceu a senha?">
                        Na tela de login, clique em <strong>"Esqueci minha senha"</strong>. Um e-mail será enviado com um link para redefinir sua senha de forma segura.
                    </Callout>

                    <Callout type="warning" title="⚠️ Primeiro acesso?">
                        Se você ainda não possui conta, clique em <strong>"Criar conta"</strong> e preencha seus dados. Após o cadastro, você receberá um e-mail de confirmação.
                    </Callout>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 1 – O CONCEITO (ONBOARDING)
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={Eye} number={1} title="O Conceito – Entendendo o Sistema" />

                    <p className="text-muted-foreground mb-6">
                        O <strong>Meu Indicador</strong> não é apenas um bloco de anotações. Ele funciona como o <strong>GPS do seu negócio</strong>,
                        mostrando em tempo real se você está no caminho certo para bater suas metas.
                    </p>

                    <h3 className="font-bold text-lg mb-4">🚦 O Significado das Cores</h3>
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <Badge className="bg-green-500 mb-2">Verde</Badge>
                            <p className="text-sm"><strong>Sucesso!</strong> Você está batendo ou superando a meta.</p>
                        </div>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Badge className="bg-yellow-500 mb-2">Amarelo</Badge>
                            <p className="text-sm"><strong>Atenção!</strong> Você está próximo, mas ainda não atingiu o objetivo.</p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Badge className="bg-red-500 mb-2">Vermelho</Badge>
                            <p className="text-sm"><strong>Perigo!</strong> Você está longe da meta ou ultrapassou limites críticos.</p>
                        </div>
                    </div>

                    <Callout type="success" title="📝 Exemplo Prático">
                        Se sua meta de vendas é R$ 30.000/mês e você já vendeu R$ 35.000, o card ficará <strong>verde</strong> com a mensagem
                        "R$ 5.000 acima da meta". Se vendeu apenas R$ 20.000, ficará <strong>vermelho</strong> com "Faltam R$ 10.000 para a meta".
                    </Callout>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 2 – CADASTRANDO INDICADORES (ADMIN)
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={Settings} number={2} title="Cadastrando Indicadores (Para Administradores)" />

                    <p className="text-muted-foreground mb-6">
                        Os administradores podem adicionar indicadores na <strong>Loja de Indicadores</strong>.
                        Cada indicador possui configurações que definem como o sistema calcula e exibe os resultados.
                    </p>

                    <h3 className="font-bold text-lg mb-4">📊 Tipos de Indicadores</h3>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground mb-6">
                        <li><strong>Fixo (Estrutura):</strong> Dados que não mudam com frequência, como número de funcionários ou capacidade máxima.</li>
                        <li><strong>Diário (Performance):</strong> Métricas que variam ao longo do tempo e precisam de lançamentos frequentes, como vendas ou visitas.</li>
                    </ul>

                    <h3 className="font-bold text-lg mb-4">⚙️ Configurações Importantes</h3>

                    <Card className="mb-4">
                        <CardContent className="pt-6">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-primary" /> Frequência da Meta
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Define o período para o qual a meta foi pensada. O sistema calcula a <strong>meta proporcional</strong> automaticamente.
                            </p>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• <strong>Mensal:</strong> Meta de R$ 30.000/mês → Se filtrar "Hoje", a meta do dia será R$ 1.000.</li>
                                <li>• <strong>Semanal:</strong> Meta se renova a cada 7 dias.</li>
                                <li>• <strong>Diária:</strong> A meta é fixa e não muda independente do período filtrado.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="pt-6">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-primary" /> Tipo de Agregação
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Define como o sistema combina múltiplos lançamentos no período filtrado.
                            </p>
                            <div className="space-y-3 text-sm">
                                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-blue-400">
                                    <strong>SOMA</strong> (Ex: Vendas) – Soma todos os valores. 100 + 100 = 200.
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-purple-400">
                                    <strong>MÉDIA</strong> (Ex: NPS, Satisfação) – Calcula a média aritmética. Ideal para percentuais.
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-orange-400">
                                    <strong>ÚLTIMO VALOR</strong> (Ex: Estoque, Saldo) – Considera apenas o registro mais recente.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-primary" /> Direção da Meta
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Indica se o objetivo é aumentar ou diminuir o número.
                            </p>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• <strong>Maior é Melhor:</strong> Vendas, Clientes, Lucro → Verde quando {">"}= meta.</li>
                                <li>• <strong>Menor é Melhor:</strong> Custos, Reclamações, Churn → Verde quando {"<"}= meta.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 3 – ROTINA DE LANÇAMENTOS
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={Edit3} number={3} title="Rotina de Lançamentos – O Coração do Sistema" />

                    <p className="text-muted-foreground mb-6">
                        O segredo de um bom BI é o <strong>dado atualizado</strong>. Recomendamos lançar valores <strong>diariamente</strong>
                        para ter uma visão real do progresso.
                    </p>

                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <h3 className="font-bold text-lg mb-4">📝 Como Lançar um Valor</h3>
                            <Step number={1}>No Dashboard, localize o card do indicador que deseja atualizar.</Step>
                            <Step number={2}>Clique no ícone de <strong>três pontos</strong> (⋮) no canto superior direito do card.</Step>
                            <Step number={3}>Selecione <strong>"Lançar Valor"</strong> no menu.</Step>
                            <Step number={4}>Preencha o <strong>valor</strong> e a <strong>data</strong> do lançamento.</Step>
                            <Step number={5}>Clique em <strong>"Salvar"</strong>. O card será atualizado automaticamente.</Step>
                        </CardContent>
                    </Card>

                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-muted-foreground" /> Corrigindo Erros
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Errou um lançamento? Sem problemas! No modal de lançamento, você verá o <strong>histórico dos últimos 5 registros</strong>.
                        Clique no ícone de lixeira para excluir registros incorretos.
                    </p>

                    <Callout type="info" title="💡 Correção Automática">
                        Se você lançar um valor para uma data que já possui um registro, o sistema irá <strong>atualizar automaticamente</strong> o valor antigo pelo novo. Não precisa excluir manualmente!
                    </Callout>

                    <Callout type="warning" title="⚠️ Consistência é a Chave">
                        Indicadores que dependem de <strong>SOMA</strong> (como vendas) acumulam os valores. Se você esquecer de lançar um dia,
                        os gráficos e comparações ficarão imprecisos. Crie o hábito de lançar no final de cada dia!
                    </Callout>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 4 – ANALISANDO O PASSADO (BI)
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={Filter} number={4} title="Analisando o Passado – Business Intelligence" />

                    <p className="text-muted-foreground mb-6">
                        Use o <strong>Filtro Global</strong> no topo do Dashboard para mudar o período de análise
                        e entender o comportamento dos seus indicadores ao longo do tempo.
                    </p>

                    <h3 className="font-bold text-lg mb-4">📅 Opções de Filtro</h3>
                    <div className="grid gap-3 md:grid-cols-2 mb-6">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <strong>Hoje</strong>
                            <p className="text-sm text-muted-foreground">Visualiza apenas o que aconteceu no dia atual.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <strong>Ontem</strong>
                            <p className="text-sm text-muted-foreground">Mostra os resultados do dia anterior.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <strong>Este Mês</strong>
                            <p className="text-sm text-muted-foreground">Acumulado desde o dia 1 até hoje.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <strong>Customizado</strong>
                            <p className="text-sm text-muted-foreground">Selecione qualquer intervalo de datas.</p>
                        </div>
                    </div>

                    <Callout type="success" title="📊 Meta Proporcional em Ação">
                        Quando você muda o filtro, a <strong>meta também se ajusta proporcionalmente</strong>.
                        Por exemplo, se sua meta mensal é R$ 30.000 e você filtra "Hoje" (dia 15 do mês),
                        a meta proporcional será R$ 15.000 (metade do mês já passou).
                    </Callout>

                    <h3 className="font-bold text-lg mb-4 mt-8">📈 Interpretando os Resultados</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• <strong>Barra de Progresso:</strong> Mostra visualmente o quanto você completou da meta.</li>
                        <li>• <strong>Texto de Diferença:</strong> Informa se você está "acima da meta" ou "faltam X para a meta".</li>
                        <li>• <strong>Ícone de Tendência:</strong> Seta para cima (positivo) ou para baixo (negativo).</li>
                    </ul>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CAPÍTULO 5 – DICAS AVANÇADAS
        ══════════════════════════════════════════════════════════ */}
                <section className="mb-16">
                    <ChapterHeader icon={Lightbulb} number={5} title="Dicas Avançadas e Boas Práticas" />

                    <div className="space-y-4">
                        <Callout type="info" title="💡 Crie uma Rotina de 5 Minutos">
                            Reserve 5 minutos no final de cada dia para lançar todos os seus indicadores.
                            Isso garante dados precisos e permite identificar problemas rapidamente.
                        </Callout>

                        <Callout type="success" title="📝 Use Indicadores Estratégicos">
                            Não crie dezenas de indicadores. Foque nos 5-10 mais importantes para sua operação.
                            Qualidade é melhor que quantidade.
                        </Callout>

                        <Callout type="warning" title="⚠️ Revise as Metas Periodicamente">
                            Metas muito fáceis ou muito difíceis perdem o sentido. Revise trimestralmente se os
                            números ainda fazem sentido para o seu negócio.
                        </Callout>

                        <Callout type="info" title="💡 Compartilhe com a Equipe">
                            Use o botão "Baixar PDF" para compartilhar relatórios com sua equipe ou gestores.
                            O documento é formatado profissionalmente e pronto para apresentações.
                        </Callout>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
            RODAPÉ (apenas impressão)
        ══════════════════════════════════════════════════════════ */}
                <div className="hidden print:block mt-16 pt-8 border-t text-center text-sm text-gray-500">
                    <p className="font-bold mb-2">Meu Indicador – Transformando Dados em Decisões</p>
                    <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
                    <p className="text-xs mt-2">Este documento é confidencial e para uso exclusivo do usuário registrado.</p>
                </div>
            </div>
        </div>
    );
};

export default Help;

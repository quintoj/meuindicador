import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminHelpGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-primary/20 hover:bg-primary/5"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Manual do Admin
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <span>Manual do Sistema - Guia do Administrador</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Aprenda a configurar e gerenciar indicadores de forma profissional
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] px-6 py-4">
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            {/* Seção 1: O Conceito da Engine */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                O Conceito da "Engine" (Motor de Cálculo)
              </h3>
              <p className="mb-3 leading-relaxed">
                O sistema opera com um <strong>motor dinâmico</strong>. Você define as regras, e o sistema executa automaticamente os cálculos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 flex items-center">
                    🔒 Variável Fixa (Fixed)
                  </h4>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Dados que <strong>não mudam durante o mês</strong> ou período. 
                    <br />Exemplos: Metragem do estabelecimento, Quantidade de funcionários, Meta mensal.
                  </p>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-500 font-medium">
                    💡 O gestor digita uma vez e o sistema lembra!
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-400 flex items-center">
                    📅 Variável Diária (Daily)
                  </h4>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    O <strong>dado vivo da operação</strong> que muda constantemente.
                    <br />Exemplos: Vendas do dia, Cancelamentos, Despesas diárias.
                  </p>
                  <p className="mt-2 text-xs text-purple-700 dark:text-purple-500 font-medium">
                    📊 O gestor lança todos os dias!
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 2: Regra do Semáforo */}
            <section className="pt-4 border-t">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                Regra do Semáforo (Polaridade / Direction)
              </h3>
              <p className="mb-3 leading-relaxed">
                A <strong>direção</strong> define como o sistema interpreta "bom" vs "ruim":
              </p>
              <ul className="space-y-3">
                <li className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900">
                  <div className="flex items-start space-x-2">
                    <span className="text-2xl">🟢</span>
                    <div>
                      <span className="font-bold text-green-700 dark:text-green-400">Quanto MAIOR, Melhor (HIGHER_BETTER)</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Para: Vendas, Faturamento, Lucro, NPS, Taxa de Retenção
                      </p>
                      <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                        <strong>Lógica:</strong> Se Resultado {'>='} Meta = <span className="text-green-600 font-bold">🟢 Verde</span> | 
                        Se {'<'} Meta = <span className="text-red-600 font-bold">🔴 Vermelho</span>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
                  <div className="flex items-start space-x-2">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <span className="font-bold text-red-700 dark:text-red-400">Quanto MENOR, Melhor (LOWER_BETTER)</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Para: Churn, Inadimplência, Despesas, Custo de Aquisição (CAC)
                      </p>
                      <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                        <strong>Lógica:</strong> Se Resultado {'<='} Meta = <span className="text-green-600 font-bold">🟢 Verde</span> | 
                        Se {'>'} Meta = <span className="text-red-600 font-bold">🔴 Vermelho</span>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex items-start space-x-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <span className="font-bold text-blue-700 dark:text-blue-400">Faixa Ideal (NEUTRAL_RANGE)</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Para: Estoque, Temperatura, Umidade (quando há um range ideal)
                      </p>
                      <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                        <strong>Lógica:</strong> Verde se dentro do range (Meta ± 10%) | Fora do range = Vermelho
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            {/* Seção 3: Como Criar um Novo Indicador */}
            <section className="pt-4 border-t">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                Como Criar um Novo Indicador (Passo a Passo)
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div className="flex-1">
                    <strong className="text-gray-900 dark:text-gray-100">Definição Básica:</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Dê um <strong>nome claro</strong> (ex: "Taxa de Churn (Cancelamento)") e escolha o <strong>Segmento</strong> (Geral, Academia, Restaurante, etc).
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div className="flex-1">
                    <strong className="text-gray-900 dark:text-gray-100">Construtor de Variáveis:</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Crie os <strong>"ingredientes"</strong> que o gestor vai fornecer.
                    </p>
                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      <strong>Exemplo: Lucro por m²</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li><code className="bg-white dark:bg-gray-900 px-1 rounded">vendas</code> (Diário) - Vendas do dia</li>
                        <li><code className="bg-white dark:bg-gray-900 px-1 rounded">despesas</code> (Diário) - Despesas do dia</li>
                        <li><code className="bg-white dark:bg-gray-900 px-1 rounded">area</code> (Fixo) - Metragem do estabelecimento</li>
                      </ul>
                    </div>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div className="flex-1">
                    <strong className="text-gray-900 dark:text-gray-100">Fórmula de Cálculo:</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Escreva a <strong>conta matemática exata</strong> usando os nomes das variáveis.
                    </p>
                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                      <strong>Exemplo:</strong> <code className="text-primary">(vendas - despesas) / area</code>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-2">
                      ⚠️ <strong>Atenção:</strong> Use exatamente os mesmos nomes das variáveis criadas no passo 2!
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <div className="flex-1">
                    <strong className="text-gray-900 dark:text-gray-100">Configurações de Comportamento:</strong>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1 list-disc list-inside ml-2">
                      <li><strong>Direção:</strong> Melhor subir ou descer? (HIGHER_BETTER / LOWER_BETTER)</li>
                      <li><strong>Unidade:</strong> Moeda (R$), Porcentagem (%), Número (#), Decimal</li>
                      <li><strong>Thresholds:</strong> Metas de Alerta (amarelo) e Crítica (vermelho)</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </section>

            {/* Seção 4: Solução de Problemas */}
            <section className="pt-4 border-t">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">4</span>
                Solução de Problemas Comuns
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">❌</span>
                    <div className="flex-1">
                      <strong className="text-red-700 dark:text-red-400">Erro: Valor absurdo (Ex: 3333% ou 0.001)</strong>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Causa:</strong> Divisão invertida na fórmula ou unidade errada.
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                        <strong>✅ Solução:</strong> Verifique se a fórmula está <code>(cancelamentos / ativos)</code> e não <code>(ativos / cancelamentos)</code>. 
                        Confirme se a unidade está correta (% vs número).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <strong className="text-yellow-700 dark:text-yellow-400">Erro: Campo de input volta zerado todo dia</strong>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Causa:</strong> A variável foi criada como "Diário" quando deveria ser "Fixo".
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                        <strong>✅ Solução:</strong> Edite o template e mude a variável de "Diário" para "Fixo". 
                        Campos fixos mantêm o valor entre lançamentos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">🔴</span>
                    <div className="flex-1">
                      <strong className="text-blue-700 dark:text-blue-400">Erro: Churn alto (10%) aparece verde quando deveria ser vermelho</strong>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Causa:</strong> Direção configurada errada (HIGHER_BETTER quando deveria ser LOWER_BETTER).
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                        <strong>✅ Solução:</strong> Edite o template e mude a Direção para "Menor é Melhor" (LOWER_BETTER).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">🔒</span>
                    <div className="flex-1">
                      <strong className="text-purple-700 dark:text-purple-400">Erro: "Você não tem permissão de Admin"</strong>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Causa:</strong> Seu email não está cadastrado como admin no sistema.
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                        <strong>✅ Solução:</strong> Verifique se está logado com <code>admin@meuindicador.com</code> ou <code>admin@meugestor.com</code>. 
                        Se precisar adicionar outro email, atualize a constante ADMIN_EMAILS no código.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 5: Boas Práticas */}
            <section className="pt-4 border-t">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">5</span>
                Boas Práticas e Dicas
              </h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Nomes descritivos:</strong> Use "Taxa de Churn (Cancelamento)" em vez de apenas "Churn".
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Variáveis em snake_case:</strong> O sistema converte automaticamente para <code>vendas_dia</code>.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Teste antes de publicar:</strong> Crie o indicador, adicione ao seu dashboard e teste o cálculo.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Defina thresholds:</strong> Meta de Alerta (5%) e Crítica (8%) para facilitar a vida do gestor.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Documentação clara:</strong> Preencha bem o campo "Por que é importante?" para ajudar os usuários.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground">
                📚 Manual do Sistema - Versão 1.0 | Última atualização: Janeiro 2026
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdminHelpGuide;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Mail, Building, Key, Save, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessSegment, setBusinessSegment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      setEmail(user.email || "");

      // Buscar perfil
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setBusinessName(profile.business_name || "");
        setBusinessSegment(profile.business_segment || "");
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para salvar configurações.",
        });
        return;
      }

      // Atualizar ou inserir perfil
      const { error } = await (supabase as any)
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          business_name: businessName,
          business_segment: businessSegment || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar as configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton={true} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informações da Conta */}
            <Card className="bg-gradient-card border-0 shadow-custom-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações da Conta</span>
                </CardTitle>
                <CardDescription>
                  Suas informações pessoais e dados de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações do Negócio */}
            <Card className="bg-gradient-card border-0 shadow-custom-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Informações do Negócio</span>
                </CardTitle>
                <CardDescription>
                  Dados da sua empresa ou negócio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome do Negócio</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessSegment">Segmento</Label>
                  <select
                    id="businessSegment"
                    value={businessSegment}
                    onChange={(e) => setBusinessSegment(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione um segmento</option>
                    <option value="Academia">Academia</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Contabilidade">Contabilidade</option>
                    <option value="PetShop">Pet Shop</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* API Key (Placeholder) */}
            <Card className="bg-gradient-card border-0 shadow-custom-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>API Key</span>
                </CardTitle>
                <CardDescription>
                  Configure suas integrações e chaves de API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em desenvolvimento</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta funcionalidade estará disponível em breve.
                </p>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-primary text-white hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;


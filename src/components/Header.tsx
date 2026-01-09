import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowLeft, Settings, Plus, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  showBackButton?: boolean;
  showAddButton?: boolean;
  showSettings?: boolean;
  title?: string;
}

const Header = ({ 
  showBackButton = false, 
  showAddButton = false,
  showSettings = false,
  title 
}: HeaderProps) => {
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Obter usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserName("");
          setLoading(false);
          return;
        }

        // Buscar perfil do usuário na tabela user_profiles
        const { data: profile, error } = await (supabase as any)
          .from('user_profiles')
          .select('full_name, business_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
        }

        // Usar o nome do perfil ou business_name ou email como fallback
        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (profile?.business_name) {
          setUserName(profile.business_name);
        } else if (user.email) {
          setUserName(user.email);
        } else {
          setUserName("Usuário");
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar perfil:', err);
        // Fallback para email se disponível
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserName(user.email);
        } else {
          setUserName("Usuário");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Meu Gestor</span>
          </Link>
          {title && (
            <Badge variant="secondary" className="ml-4">
              {title}
            </Badge>
          )}
          {!loading && userName && (
            <Badge variant="secondary" className="ml-2">
              {userName}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {showAddButton && (
            <Link to="/store">
              <Button variant="outline" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Adicionar KPI</span>
              </Button>
            </Link>
          )}
          {showSettings && (
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {!showBackButton && (
            <Link to="/store">
              <Button variant="outline">Loja de Indicadores</Button>
            </Link>
          )}
          {showBackButton && (
            <Link to="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          )}
          <Button variant="outline" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;


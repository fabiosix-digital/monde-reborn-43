import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Shield } from "lucide-react";
export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    login: "",
    password: ""
  });
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.authenticate(credentials.login, credentials.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Keeptur"
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <img src="/lovable-uploads/f6f14c3e-3352-4ebc-b005-0df0af815c32.png" alt="Keeptur" className="h-12 mx-auto" />
        </div>

        <Card className="animate-slide-up shadow-lg border-border/50">
          <CardHeader className="space-y-1 text-center">
            
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Email ou Login</Label>
                <Input id="login" type="text" placeholder="admin@empresa.monde.com.br" value={credentials.login} onChange={e => setCredentials({
                ...credentials,
                login: e.target.value
              })} required className="transition-all duration-300 focus:ring-2 focus:ring-primary/20" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={credentials.password} onChange={e => setCredentials({
                ...credentials,
                password: e.target.value
              })} required className="transition-all duration-300 focus:ring-2 focus:ring-primary/20" />
              </div>

              <Button type="submit" className="w-full" variant="hero" size="lg" disabled={loading}>
                {loading ? <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </> : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Problema para acessar?{" "}
                <a href="https://www.monde.com.br/suporte/" className="text-primary hover:underline">
                  Entre em contato com o suporte
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground animate-fade-in">
          <p>© 2024 Keeptur - Sistema de Gestão. Todos os direitos reservados.</p>
          
        </div>
      </div>
    </div>;
}
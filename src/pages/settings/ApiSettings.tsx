import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ApiSettings = () => {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState("sk_live_51234567890abcdefghijklmnopqrstuvwxyz");

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Chave API copiada",
      description: "A chave foi copiada para a área de transferência",
    });
  };

  const handleRegenerateApiKey = () => {
    toast({
      title: "Regenerar chave",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações de API</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas chaves de API e integrações
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chave de API</CardTitle>
          <CardDescription>
            Use esta chave para autenticar suas requisições à API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave de API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRegenerateApiKey}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Exemplo de uso</h4>
            <pre className="text-sm overflow-x-auto">
              <code>{`curl -X GET https://api.example.com/v1/contacts \\
  -H "Authorization: Bearer ${showApiKey ? apiKey : "YOUR_API_KEY"}"`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentação da API</CardTitle>
          <CardDescription>
            Acesse a documentação completa para integrar sua aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Acessar Documentação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiSettings;

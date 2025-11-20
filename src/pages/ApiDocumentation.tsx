import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ApiDocumentation() {
  const navigate = useNavigate();
  const [selectedEndpoint, setSelectedEndpoint] = useState("contacts");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '') + '.supabase.co/functions/v1/api-v1';

  const endpoints = {
    contacts: {
      name: "Contatos",
      description: "Gerencie contatos",
      methods: [
        {
          method: "GET",
          path: "/v1/contacts",
          description: "Listar todos os contatos",
          params: [
            { name: "limit", type: "number", description: "Limite de resultados (max 100)" },
            { name: "cursor", type: "string", description: "Cursor para paginação" },
            { name: "name_like", type: "string", description: "Filtrar por nome (busca parcial)" },
            { name: "email", type: "string", description: "Filtrar por email exato" },
            { name: "custom_fields.campo", type: "string", description: "Filtrar por campo personalizado" },
          ],
          example: `curl -X GET "${baseUrl}/v1/contacts?limit=10" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
        {
          method: "GET",
          path: "/v1/contacts/:id",
          description: "Buscar um contato específico",
          params: [],
          example: `curl -X GET "${baseUrl}/v1/contacts/{contact_id}" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
        {
          method: "POST",
          path: "/v1/contacts",
          description: "Criar novo contato",
          params: [],
          example: `curl -X POST "${baseUrl}/v1/contacts" \\
  -H "x-api-key: sk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 99999-9999",
    "company": "Empresa XYZ",
    "custom_fields": {
      "cargo": "Gerente"
    }
  }'`
        },
        {
          method: "PUT",
          path: "/v1/contacts/:id",
          description: "Atualizar contato",
          params: [],
          example: `curl -X PUT "${baseUrl}/v1/contacts/{contact_id}" \\
  -H "x-api-key: sk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva Santos",
    "phone": "(11) 88888-8888"
  }'`
        },
        {
          method: "DELETE",
          path: "/v1/contacts/:id",
          description: "Deletar contato",
          params: [],
          example: `curl -X DELETE "${baseUrl}/v1/contacts/{contact_id}" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
      ],
    },
    products: {
      name: "Produtos",
      description: "Gerencie produtos",
      methods: [
        {
          method: "GET",
          path: "/v1/products",
          description: "Listar todos os produtos",
          params: [
            { name: "limit", type: "number", description: "Limite de resultados" },
            { name: "cursor", type: "string", description: "Cursor para paginação" },
            { name: "is_active", type: "boolean", description: "Filtrar por status ativo" },
            { name: "category", type: "string", description: "Filtrar por categoria" },
          ],
          example: `curl -X GET "${baseUrl}/v1/products?limit=20&is_active=true" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
        {
          method: "POST",
          path: "/v1/products",
          description: "Criar novo produto",
          params: [],
          example: `curl -X POST "${baseUrl}/v1/products" \\
  -H "x-api-key: sk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Produto ABC",
    "description": "Descrição do produto",
    "price": 99.90,
    "sku": "PROD-001",
    "stock_quantity": 100,
    "is_active": true
  }'`
        },
      ],
    },
    appointments: {
      name: "Compromissos",
      description: "Gerencie compromissos",
      methods: [
        {
          method: "GET",
          path: "/v1/appointments",
          description: "Listar todos os compromissos",
          params: [
            { name: "limit", type: "number", description: "Limite de resultados" },
            { name: "start_time_gte", type: "datetime", description: "Data início maior ou igual" },
            { name: "status", type: "string", description: "Filtrar por status" },
          ],
          example: `curl -X GET "${baseUrl}/v1/appointments?status=scheduled" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
      ],
    },
    tasks: {
      name: "Tarefas",
      description: "Gerencie tarefas",
      methods: [
        {
          method: "GET",
          path: "/v1/tasks",
          description: "Listar todas as tarefas",
          params: [
            { name: "completed", type: "boolean", description: "Filtrar por status" },
            { name: "contact_id", type: "uuid", description: "Filtrar por contato" },
          ],
          example: `curl -X GET "${baseUrl}/v1/tasks?completed=false" \\
  -H "x-api-key: sk_live_your_api_key_here"`
        },
      ],
    },
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação da API</h1>
          <p className="text-muted-foreground mt-2">
            Referência completa para integração via API REST
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/settings?tab=api-keys")}>
          <BookOpen className="mr-2 h-4 w-4" />
          Gerenciar Chaves API
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
          <CardDescription>
            Todas as requisições devem incluir sua chave API no header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm mb-2">Adicione o header em todas as requisições:</p>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              x-api-key: sk_live_your_api_key_here
            </pre>
          </div>
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-sm">
              <strong>Base URL:</strong>
              <code className="ml-2 bg-background px-2 py-1 rounded">{baseUrl}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Todas as respostas seguem o formato JSON padronizado:
          </p>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "data": [...], // ou objeto único
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "pagination": {
      "total": 100,
      "limit": 50,
      "next_cursor": "2025-01-01T00:00:00Z"
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
            <TabsList className="grid grid-cols-4 w-full">
              {Object.entries(endpoints).map(([key, value]) => (
                <TabsTrigger key={key} value={key}>
                  {value.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(endpoints).map(([key, endpoint]) => (
              <TabsContent key={key} value={key} className="space-y-6 mt-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{endpoint.name}</h3>
                  <p className="text-muted-foreground">{endpoint.description}</p>
                </div>

                {endpoint.methods.map((method, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            method.method === "GET" ? "default" :
                            method.method === "POST" ? "secondary" :
                            method.method === "PUT" ? "outline" :
                            "destructive"
                          }
                        >
                          {method.method}
                        </Badge>
                        <code className="text-sm">{method.path}</code>
                      </div>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {method.params.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Parâmetros (Query String)</h4>
                          <div className="space-y-2">
                            {method.params.map((param, pidx) => (
                              <div key={pidx} className="flex gap-4 text-sm">
                                <code className="text-primary">{param.name}</code>
                                <Badge variant="outline" className="text-xs">
                                  {param.type}
                                </Badge>
                                <span className="text-muted-foreground">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Exemplo de Requisição</h4>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                          {method.example}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Receba notificações em tempo real sobre eventos no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Configure webhooks para receber notificações HTTP quando eventos importantes acontecerem.
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/settings?tab=webhooks")}
          >
            Configurar Webhooks
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Códigos de Status HTTP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <Badge variant="default">200</Badge>
              <span>Requisição bem-sucedida</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="secondary">201</Badge>
              <span>Recurso criado com sucesso</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="outline">204</Badge>
              <span>Requisição bem-sucedida sem conteúdo</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="destructive">400</Badge>
              <span>Requisição inválida</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="destructive">401</Badge>
              <span>Não autenticado (chave API inválida)</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="destructive">404</Badge>
              <span>Recurso não encontrado</span>
            </div>
            <div className="flex gap-4">
              <Badge variant="destructive">500</Badge>
              <span>Erro interno do servidor</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

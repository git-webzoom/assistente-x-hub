import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useWebhooks } from "@/hooks/useWebhooks";
import { Plus, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AVAILABLE_EVENTS = [
  { value: "contact.created", label: "Contato Criado" },
  { value: "contact.updated", label: "Contato Atualizado" },
  { value: "contact.deleted", label: "Contato Excluído" },
  { value: "product.created", label: "Produto Criado" },
  { value: "product.updated", label: "Produto Atualizado" },
  { value: "product.deleted", label: "Produto Excluído" },
  { value: "appointment.created", label: "Compromisso Criado" },
  { value: "appointment.updated", label: "Compromisso Atualizado" },
  { value: "appointment.deleted", label: "Compromisso Excluído" },
  { value: "task.created", label: "Tarefa Criada" },
  { value: "task.updated", label: "Tarefa Atualizada" },
  { value: "task.deleted", label: "Tarefa Excluída" },
  { value: "card.created", label: "Card Criado" },
  { value: "card.updated", label: "Card Atualizado" },
  { value: "card.deleted", label: "Card Excluído" },
];

export default function WebhooksSettings() {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook } = useWebhooks();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreateWebhook = () => {
    if (!newWebhookUrl || selectedEvents.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha a URL e selecione pelo menos um evento",
        variant: "destructive",
      });
      return;
    }

    createWebhook(
      { url: newWebhookUrl, events: selectedEvents },
      {
        onSuccess: () => {
          setNewWebhookUrl("");
          setSelectedEvents([]);
          setIsCreateDialogOpen(false);
        },
      }
    );
  };

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateWebhook({ id, updates: { is_active: !isActive } });
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copiado!",
      description: "Secret copiado para área de transferência",
    });
  };

  if (isLoading) {
    return <div className="p-6">Carregando webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure webhooks para receber notificações de eventos em tempo real
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Webhook</DialogTitle>
                  <DialogDescription>
                    Configure um endpoint para receber notificações de eventos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL do Webhook</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://seu-dominio.com/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eventos</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {AVAILABLE_EVENTS.map((event) => (
                        <div key={event.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.value}
                            checked={selectedEvents.includes(event.value)}
                            onCheckedChange={() => handleToggleEvent(event.value)}
                          />
                          <Label
                            htmlFor={event.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {event.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newWebhookUrl || selectedEvents.length === 0}
                    className="w-full"
                  >
                    Criar Webhook
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!webhooks || webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum webhook configurado ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event.split('.')[1]}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhook.is_active ? "default" : "secondary"}>
                        {webhook.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">
                          {webhook.secret.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(webhook.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                        >
                          {webhook.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como usar Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Verificação de Assinatura</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Cada requisição de webhook inclui um header <code>X-Webhook-Signature</code> para verificação:
            </p>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHash('sha256')
    .update(secret + JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

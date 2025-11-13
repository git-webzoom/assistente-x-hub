import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
}

const WebhookSettings = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "1",
      url: "https://example.com/webhook",
      enabled: true,
      events: ["contact.created", "contact.updated"],
    },
  ]);

  const availableEvents = [
    { id: "contact.created", label: "Contato criado" },
    { id: "contact.updated", label: "Contato atualizado" },
    { id: "contact.deleted", label: "Contato excluído" },
    { id: "card.created", label: "Card criado" },
    { id: "card.updated", label: "Card atualizado" },
    { id: "card.moved", label: "Card movido" },
  ];

  const handleAddWebhook = () => {
    const newWebhook: Webhook = {
      id: Date.now().toString(),
      url: "",
      enabled: true,
      events: [],
    };
    setWebhooks([...webhooks, newWebhook]);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
    toast({
      title: "Webhook removido",
      description: "O webhook foi removido com sucesso",
    });
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      )
    );
  };

  const handleToggleEvent = (webhookId: string, eventId: string) => {
    setWebhooks(
      webhooks.map((w) => {
        if (w.id === webhookId) {
          const events = w.events.includes(eventId)
            ? w.events.filter((e) => e !== eventId)
            : [...w.events, eventId];
          return { ...w, events };
        }
        return w;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Webhooks</h2>
          <p className="text-muted-foreground mt-1">
            Configure webhooks para receber notificações de eventos
          </p>
        </div>
        <Button onClick={handleAddWebhook}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={webhook.enabled}
                    onCheckedChange={() => handleToggleWebhook(webhook.id)}
                  />
                  <div>
                    <CardTitle>Webhook</CardTitle>
                    <CardDescription>
                      {webhook.events.length} evento(s) selecionado(s)
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`url-${webhook.id}`}>URL do Webhook</Label>
                <Input
                  id={`url-${webhook.id}`}
                  placeholder="https://example.com/webhook"
                  value={webhook.url}
                  onChange={(e) => {
                    setWebhooks(
                      webhooks.map((w) =>
                        w.id === webhook.id ? { ...w, url: e.target.value } : w
                      )
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${webhook.id}-${event.id}`}
                        checked={webhook.events.includes(event.id)}
                        onCheckedChange={() =>
                          handleToggleEvent(webhook.id, event.id)
                        }
                      />
                      <Label
                        htmlFor={`${webhook.id}-${event.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Testar Webhook
              </Button>
            </CardContent>
          </Card>
        ))}

        {webhooks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum webhook configurado
              </p>
              <Button onClick={handleAddWebhook}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WebhookSettings;

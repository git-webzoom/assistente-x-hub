import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Webhook {
  id: string;
  tenant_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string;
  created_at: string;
  updated_at: string;
}

export const useWebhooks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
  });

  const createWebhook = useMutation({
    mutationFn: async ({ url, events }: { url: string; events: string[] }) => {
      // Generate secret
      const secret = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("webhooks")
        .insert({ url, events, secret })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast({
        title: "Webhook criado",
        description: "Webhook criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o webhook",
        variant: "destructive",
      });
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Webhook> }) => {
      const { error } = await supabase
        .from("webhooks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast({
        title: "Webhook atualizado",
        description: "Webhook atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o webhook",
        variant: "destructive",
      });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast({
        title: "Webhook excluído",
        description: "Webhook excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o webhook",
        variant: "destructive",
      });
    },
  });

  return {
    webhooks,
    isLoading,
    createWebhook: createWebhook.mutate,
    updateWebhook: updateWebhook.mutate,
    deleteWebhook: deleteWebhook.mutate,
  };
};

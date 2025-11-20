import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export const useApiKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
  });

  const createApiKey = useMutation({
    mutationFn: async ({ name, rateLimit }: { name: string; rateLimit?: number }) => {
      // Call edge function to generate API key
      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: { name, rate_limit_per_minute: rateLimit || 60 }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Chave API criada",
        description: "Copie e guarde sua chave em local seguro. Ela não será mostrada novamente.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a chave API",
        variant: "destructive",
      });
    },
  });

  const updateApiKey = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApiKey> }) => {
      const { error } = await supabase
        .from("api_keys")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Chave atualizada",
        description: "Chave API atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a chave API",
        variant: "destructive",
      });
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Chave excluída",
        description: "Chave API excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a chave API",
        variant: "destructive",
      });
    },
  });

  return {
    apiKeys,
    isLoading,
    createApiKey: createApiKey.mutate,
    updateApiKey: updateApiKey.mutate,
    deleteApiKey: deleteApiKey.mutate,
  };
};

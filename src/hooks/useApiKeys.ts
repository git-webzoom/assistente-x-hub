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
      // Gerar chave de API no cliente e salvar apenas o hash no banco
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const apiKey =
        "sk_live_" +
        Array.from(randomBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      const encoder = new TextEncoder();
      const dataToHash = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataToHash);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const keyPrefix = apiKey.substring(0, 15) + "...";

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          is_active: true,
          rate_limit_per_minute: rateLimit || 60,
        })
        .select("*")
        .single();

      if (error) throw error;
      return { ...data, api_key: apiKey };
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  card_id: string;
  assigned_to: string | null;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  notes: string | null;
  created_at: string;
  cards?: {
    title: string;
    contacts?: {
      name: string;
    } | null;
  };
  users?: {
    email: string;
  } | null;
}

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          cards (
            title,
            contacts (
              name
            )
          ),
          users (
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: Omit<Task, "id" | "created_at" | "cards" | "users">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};

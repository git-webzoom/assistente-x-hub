import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface Appointment {
  id: string;
  tenant_id: string;
  card_id?: string;
  contact_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: string;
  created_at: string;
  contact?: {
    name: string;
  };
}

export interface CreateAppointmentInput {
  card_id?: string;
  contact_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  status?: string;
}

export const useAppointments = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Role check removed — RLS already enforces access by tenant.
      // This avoids throwing when user has no explicit entry in user_roles.

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          contact:contacts(name)
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get tenant via security-definer function (bypasses RLS safely)
      const { data: tenantUuid, error: tenantErr } = await supabase.rpc(
        "get_user_tenant",
        { _user_id: user.id }
      );

      if (tenantErr) throw tenantErr;
      if (!tenantUuid) throw new Error("Tenant not found");

      const { data, error } = await supabase
        .from("appointments")
        .insert([{ ...input, tenant_id: tenantUuid }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};

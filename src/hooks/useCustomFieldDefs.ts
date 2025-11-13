import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'textarea' 
  | 'url';

export interface CustomFieldDef {
  id: string;
  tenant_id: string;
  entity_name: string;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  field_options?: string[]; // Para select/multiselect
  default_value?: string | null;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomFieldDefs = (entityName: string = 'contacts') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar definições de campos do tenant
  const { data: fieldDefs, isLoading, error } = useQuery({
    queryKey: ['custom-field-defs', user?.id, entityName],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) throw new Error('Tenant not found');

      const { data, error } = await supabase
        .from('custom_field_defs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('entity_name', entityName)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CustomFieldDef[];
    },
    enabled: !!user?.id,
  });

  // Criar nova definição de campo
  const createFieldDef = useMutation({
    mutationFn: async (
      newFieldDef: Omit<CustomFieldDef, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>
    ) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) throw new Error('Tenant not found');

      const { data, error } = await supabase
        .from('custom_field_defs')
        .insert([{ ...newFieldDef, tenant_id: userData.tenant_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-defs'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] }); // Recarrega contatos
      toast({
        title: 'Sucesso!',
        description: 'Campo personalizado criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar campo personalizado.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar definição de campo
  const updateFieldDef = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CustomFieldDef> 
    }) => {
      const { data, error } = await supabase
        .from('custom_field_defs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-defs'] });
      toast({
        title: 'Sucesso!',
        description: 'Campo personalizado atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar campo personalizado.',
        variant: 'destructive',
      });
    },
  });

  // Deletar definição de campo
  const deleteFieldDef = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_field_defs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-defs'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Sucesso!',
        description: 'Campo personalizado excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir campo personalizado.',
        variant: 'destructive',
      });
    },
  });

  return {
    fieldDefs: fieldDefs || [],
    isLoading,
    error,
    createFieldDef,
    updateFieldDef,
    deleteFieldDef,
  };
};

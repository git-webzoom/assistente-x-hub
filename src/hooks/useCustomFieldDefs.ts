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
        .maybeSingle();

      if (!userData?.tenant_id) throw new Error('Tenant not found');

      const { data, error } = await supabase
        .from('custom_field_defs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('entity_name', entityName)
        // Avoid relying on columns that may not exist across environments
        .order('created_at', { ascending: true });

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
        .maybeSingle();

      if (!userData?.tenant_id) throw new Error('Tenant not found');

      // Only send known-safe columns to avoid 400 errors for missing columns
      const payload = {
        entity_name: newFieldDef.entity_name,
        field_name: newFieldDef.field_name,
        field_label: newFieldDef.field_label,
        field_type: newFieldDef.field_type,
        field_options: newFieldDef.field_options ?? [],
        default_value: newFieldDef.default_value ?? null,
        is_required: !!newFieldDef.is_required,
        tenant_id: userData.tenant_id,
      };

      const { data, error } = await supabase
        .from('custom_field_defs')
        .insert([payload])
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
      // Filter to only columns that are guaranteed to exist
      const {
        field_label,
        field_type,
        field_options,
        default_value,
        is_required,
        field_name,
        entity_name,
      } = updates;

      const safeUpdates: Record<string, any> = {};
      if (typeof field_label !== 'undefined') safeUpdates.field_label = field_label;
      if (typeof field_type !== 'undefined') safeUpdates.field_type = field_type;
      if (typeof field_options !== 'undefined') safeUpdates.field_options = field_options;
      if (typeof default_value !== 'undefined') safeUpdates.default_value = default_value;
      if (typeof is_required !== 'undefined') safeUpdates.is_required = is_required;
      if (typeof field_name !== 'undefined') safeUpdates.field_name = field_name;
      if (typeof entity_name !== 'undefined') safeUpdates.entity_name = entity_name;

      const { data, error } = await supabase
        .from('custom_field_defs')
        .update(safeUpdates)
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

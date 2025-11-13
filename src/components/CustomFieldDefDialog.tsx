import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomFieldDef, CustomFieldType } from '@/hooks/useCustomFieldDefs';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const customFieldDefSchema = z.object({
  field_name: z.string()
    .min(1, 'Nome do campo é obrigatório')
    .regex(/^[a-z_]+$/, 'Use apenas letras minúsculas e underscore')
    .max(50, 'Nome muito longo'),
  field_label: z.string().min(1, 'Label é obrigatório').max(100, 'Label muito longo'),
  field_type: z.enum(['text', 'number', 'email', 'phone', 'date', 'select', 'multiselect', 'checkbox', 'textarea', 'url']),
  field_options: z.string().optional(),
  default_value: z.string().optional(),
  is_required: z.boolean(),
  display_order: z.number(),
});

type CustomFieldDefFormData = z.infer<typeof customFieldDefSchema>;

interface CustomFieldDefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldDef?: CustomFieldDef | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export const CustomFieldDefDialog = ({
  open,
  onOpenChange,
  fieldDef,
  onSubmit,
  isSubmitting,
}: CustomFieldDefDialogProps) => {
  const [formData, setFormData] = useState<CustomFieldDefFormData>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    field_options: '',
    default_value: '',
    is_required: false,
    display_order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fieldDef) {
      setFormData({
        field_name: fieldDef.field_name || '',
        field_label: fieldDef.field_label || '',
        field_type: fieldDef.field_type || 'text',
        field_options: Array.isArray(fieldDef.field_options) ? fieldDef.field_options.join('\n') : '',
        default_value: fieldDef.default_value ?? '',
        is_required: fieldDef.is_required ?? false,
        display_order: fieldDef.display_order ?? 0,
      });
    } else {
      setFormData({
        field_name: '',
        field_label: '',
        field_type: 'text',
        field_options: '',
        default_value: '',
        is_required: false,
        display_order: 0,
      });
    }
    setErrors({});
  }, [fieldDef, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = customFieldDefSchema.parse(formData);
      
      const submitData = {
        entity_name: 'contacts',
        field_name: validatedData.field_name,
        field_label: validatedData.field_label,
        field_type: validatedData.field_type,
        field_options: (validatedData.field_type === 'select' || validatedData.field_type === 'multiselect') && validatedData.field_options
          ? validatedData.field_options.split('\n').map(opt => opt.trim()).filter(Boolean)
          : [],
        default_value: validatedData.default_value || null,
        is_required: validatedData.is_required,
        display_order: validatedData.display_order,
        is_active: true,
      };

      await onSubmit(submitData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const needsOptions = formData.field_type === 'select' || formData.field_type === 'multiselect';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fieldDef ? 'Editar Campo Personalizado' : 'Novo Campo Personalizado'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field_name">Nome do Campo (slug) *</Label>
            <Input
              id="field_name"
              value={formData.field_name}
              onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
              placeholder="ex: cargo, cidade"
              disabled={!!fieldDef}
            />
            {errors.field_name && (
              <p className="text-sm text-destructive">{errors.field_name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas e underscore. Não pode ser alterado depois.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_label">Label (exibição) *</Label>
            <Input
              id="field_label"
              value={formData.field_label}
              onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
              placeholder="ex: Cargo, Cidade"
            />
            {errors.field_label && (
              <p className="text-sm text-destructive">{errors.field_label}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_type">Tipo de Campo *</Label>
            <Select
              value={formData.field_type}
              onValueChange={(value: CustomFieldType) => setFormData({ ...formData, field_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="select">Seleção</SelectItem>
                <SelectItem value="multiselect">Seleção Múltipla</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="textarea">Texto Longo</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label htmlFor="field_options">Opções (uma por linha) *</Label>
              <Textarea
                id="field_options"
                value={formData.field_options}
                onChange={(e) => setFormData({ ...formData, field_options: e.target.value })}
                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                rows={4}
              />
              {errors.field_options && (
                <p className="text-sm text-destructive">{errors.field_options}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="default_value">Valor Padrão</Label>
            <Input
              id="default_value"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked as boolean })}
            />
            <Label htmlFor="is_required" className="cursor-pointer">
              Campo obrigatório
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fieldDef ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

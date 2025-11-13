import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Contact } from '@/hooks/useContacts';
import { useCustomFieldDefs } from '@/hooks/useCustomFieldDefs';
import { CustomFieldInput } from '@/components/CustomFieldInput';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  company: z.string().trim().max(100, 'Nome da empresa muito longo').optional().or(z.literal('')),
  position: z.string().trim().max(100, 'Cargo muito longo').optional().or(z.literal('')),
  tags: z.string().optional(),
  notes: z.string().trim().max(1000, 'Notas muito longas').optional().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export const ContactFormDialog = ({
  open,
  onOpenChange,
  contact,
  onSubmit,
  isSubmitting,
}: ContactFormDialogProps) => {
  const { fieldDefs } = useCustomFieldDefs('contacts');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    tags: '',
    notes: '',
  });
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        position: contact.position || '',
        tags: contact.tags?.join(', ') || '',
        notes: contact.notes || '',
      });
      setCustomFieldsData(contact.custom_fields || {});
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        tags: '',
        notes: '',
      });
      // Initialize custom fields with default values
      const initialCustomFields: Record<string, any> = {};
      fieldDefs.forEach(def => {
        initialCustomFields[def.field_name] = def.default_value || '';
      });
      setCustomFieldsData(initialCustomFields);
    }
    setErrors({});
  }, [contact, open, fieldDefs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate standard fields
      const validatedData = contactSchema.parse(formData);
      
      // Validate required custom fields
      const customFieldErrors: Record<string, string> = {};
      fieldDefs.forEach(def => {
        if (def.is_required && !customFieldsData[def.field_name]) {
          customFieldErrors[`custom_${def.field_name}`] = `${def.field_label} é obrigatório`;
        }
      });

      if (Object.keys(customFieldErrors).length > 0) {
        setErrors(customFieldErrors);
        return;
      }
      
      const submitData = {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        position: validatedData.position || null,
        tags: validatedData.tags 
          ? validatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : null,
        notes: validatedData.notes || null,
        custom_fields: customFieldsData,
      };

      await onSubmit(submitData);
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
                disabled={isSubmitting}
              />
              {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Cargo ou função"
                disabled={isSubmitting}
              />
              {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="cliente, lead, vip (separadas por vírgula)"
              disabled={isSubmitting}
            />
            {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o contato..."
              rows={3}
              disabled={isSubmitting}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
          </div>

          {/* Custom Fields Section */}
          {fieldDefs && fieldDefs.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Campos Personalizados</h3>
                {fieldDefs.map((fieldDef) => (
                  <div key={fieldDef.id} className="space-y-2">
                    <Label htmlFor={fieldDef.field_name}>
                      {fieldDef.field_label}
                      {fieldDef.is_required && ' *'}
                    </Label>
                    <CustomFieldInput
                      fieldDef={fieldDef}
                      value={customFieldsData[fieldDef.field_name]}
                      onChange={(value) => 
                        setCustomFieldsData(prev => ({
                          ...prev,
                          [fieldDef.field_name]: value
                        }))
                      }
                      error={errors[`custom_${fieldDef.field_name}`]}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

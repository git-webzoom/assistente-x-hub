import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Contact } from '@/hooks/useContacts';
import { useCustomFieldDefs } from '@/hooks/useCustomFieldDefs';
import { Mail, Phone, Building2, Briefcase, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export const ContactCard = ({ contact, onEdit, onDelete }: ContactCardProps) => {
  const { fieldDefs } = useCustomFieldDefs('contacts');
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCustomFieldValue = (value: any, type: string) => {
    if (!value) return null;
    
    switch (type) {
      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy');
        } catch {
          return value;
        }
      case 'checkbox':
        return value === true || value === 'true' ? 'Sim' : 'Não';
      default:
        return value.toString();
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">{getInitials(contact.name)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            {contact.position && contact.company && (
              <p className="text-sm text-muted-foreground">
                {contact.position} • {contact.company}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem onClick={() => onEdit(contact)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(contact)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 mb-3">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.company && !contact.position && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{contact.company}</span>
          </div>
        )}
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {contact.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {contact.notes && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {contact.notes}
        </p>
      )}

      {/* Custom Fields */}
      {contact.custom_fields && fieldDefs.length > 0 && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Campos Personalizados
          </h4>
          {fieldDefs.map((fieldDef) => {
            const value = contact.custom_fields?.[fieldDef.field_name];
            const formattedValue = formatCustomFieldValue(value, fieldDef.field_type);
            
            if (!formattedValue) return null;
            
            return (
              <div key={fieldDef.id} className="text-sm">
                <span className="font-medium text-foreground">{fieldDef.field_label}:</span>{' '}
                <span className="text-muted-foreground">{formattedValue}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { CustomFieldDef } from '@/hooks/useCustomFieldDefs';
import { cn } from '@/lib/utils';

interface CustomFieldInputProps {
  fieldDef: CustomFieldDef;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const CustomFieldInput = ({ 
  fieldDef, 
  value, 
  onChange, 
  error 
}: CustomFieldInputProps) => {
  
  const renderInput = () => {
    switch (fieldDef.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={fieldDef.field_type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${fieldDef.field_label.toLowerCase()}`}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${fieldDef.field_label.toLowerCase()}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${fieldDef.field_label.toLowerCase()}`}
            rows={4}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted-foreground">
              {fieldDef.field_label}
            </span>
          </div>
        );
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'PPP') : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${fieldDef.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldDef.field_options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${fieldDef.field_label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

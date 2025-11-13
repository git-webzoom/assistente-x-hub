import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useCustomFieldDefs, CustomFieldDef } from '@/hooks/useCustomFieldDefs';
import { CustomFieldDefDialog } from '@/components/CustomFieldDefDialog';
import { Plus, MoreVertical, Edit, Trash2, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CustomFieldsSettings = () => {
  const { fieldDefs, isLoading, createFieldDef, updateFieldDef, deleteFieldDef } = useCustomFieldDefs('contacts');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFieldDef, setSelectedFieldDef] = useState<CustomFieldDef | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldDefToDelete, setFieldDefToDelete] = useState<CustomFieldDef | null>(null);

  const handleCreate = () => {
    setSelectedFieldDef(null);
    setDialogOpen(true);
  };

  const handleEdit = (fieldDef: CustomFieldDef) => {
    setSelectedFieldDef(fieldDef);
    setDialogOpen(true);
  };

  const handleDeleteClick = (fieldDef: CustomFieldDef) => {
    setFieldDefToDelete(fieldDef);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (fieldDefToDelete) {
      await deleteFieldDef.mutateAsync(fieldDefToDelete.id);
      setDeleteDialogOpen(false);
      setFieldDefToDelete(null);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedFieldDef) {
        await updateFieldDef.mutateAsync({ id: selectedFieldDef.id, updates: data });
      } else {
        await createFieldDef.mutateAsync(data);
      }
      setDialogOpen(false);
      setSelectedFieldDef(null);
    } catch (error) {
      // Error já é tratado pelo mutation
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Texto',
      number: 'Número',
      email: 'Email',
      phone: 'Telefone',
      date: 'Data',
      select: 'Seleção',
      multiselect: 'Seleção Múltipla',
      checkbox: 'Checkbox',
      textarea: 'Texto Longo',
      url: 'URL',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Campos Personalizados</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie os campos customizados dos contatos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Campo
        </Button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : fieldDefs.length === 0 ? (
          <div className="p-12 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum campo personalizado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro campo personalizado para contatos
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Campo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Campo</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldDefs.map((fieldDef) => (
                <TableRow key={fieldDef.id}>
                  <TableCell className="font-mono text-sm">{fieldDef.field_name}</TableCell>
                  <TableCell>{fieldDef.field_label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getFieldTypeLabel(fieldDef.field_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {fieldDef.is_required ? (
                      <Badge>Sim</Badge>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>{fieldDef.display_order}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(fieldDef)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(fieldDef)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog for Create/Edit */}
      <CustomFieldDefDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fieldDef={selectedFieldDef}
        onSubmit={handleSubmit}
        isSubmitting={createFieldDef.isPending || updateFieldDef.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O campo "{fieldDefToDelete?.field_label}" 
              será removido de todos os contatos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomFieldsSettings;

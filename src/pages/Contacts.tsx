import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ContactFormDialog } from '@/components/ContactFormDialog';
import { useContacts, Contact } from '@/hooks/useContacts';
import { Plus, Search, Users, Edit } from 'lucide-react';

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const { contacts, isLoading, createContact, updateContact, deleteContact } = useContacts(searchQuery);

  const handleCreateContact = async (data: any) => {
    await createContact.mutateAsync(data);
  };

  const handleUpdateContact = async (data: any) => {
    if (selectedContact) {
      await updateContact.mutateAsync({
        id: selectedContact.id,
        updates: data,
      });
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
  };

  const confirmDelete = async () => {
    if (contactToDelete) {
      await deleteContact.mutateAsync(contactToDelete.id);
      setContactToDelete(null);
    }
  };

  const handleNewContact = () => {
    setSelectedContact(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contatos e relacionamentos
          </p>
        </div>
        <Button onClick={handleNewContact}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando contatos...
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Tente ajustar sua busca ou limpar os filtros'
                : 'Comece adicionando seu primeiro contato para gerenciar seus relacionamentos'}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewContact}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Contato
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleEdit(contact)}
                >
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.position || '-'}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(contact);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Form Dialog */}
      <ContactFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contact={selectedContact}
        onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
        isSubmitting={createContact.isPending || updateContact.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{contactToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;

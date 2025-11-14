import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import TaskDialog from "@/components/TaskDialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Tasks = () => {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const handleCreate = (taskData: Partial<Task>) => {
    createTask.mutate(taskData as any);
  };

  const handleEdit = (taskData: Partial<Task>) => {
    if (taskData.id) {
      updateTask.mutate(taskData as any);
    }
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
      in_progress: { label: "Em Progresso", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
      completed: { label: "Concluída", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
    };
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tarefas</h1>
        </div>
        <Card className="p-8 text-center text-muted-foreground">
          Carregando tarefas...
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <Button onClick={handleNewTask}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        {!tasks || tasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma tarefa encontrada</p>
            <Button onClick={handleNewTask}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira tarefa
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleEditClick(task)}
                >
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.cards?.title || "-"}
                    {task.cards?.contacts?.name && (
                      <span className="text-xs text-muted-foreground block">
                        {task.cards.contacts.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{formatDueDate(task.due_date)}</TableCell>
                  <TableCell>
                    {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(task);
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editingTask ? handleEdit : handleCreate}
        initial={editingTask}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Tasks;

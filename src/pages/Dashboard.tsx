import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, List, LayoutGrid, Plus, Search } from "lucide-react";
import { TaskStatsCards } from "@/components/tasks/TaskStatsCards";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Task, CreateTaskData, UpdateTaskData } from "@/types/api";
import { useTasks } from "@/hooks/useTasks";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { useTaskManager } from "@/hooks/useTaskManager";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDateDialog } from "@/components/dialogs/TaskDateDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, addHours } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
export default function Dashboard() {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
  const [activeTab, setActiveTab] = useState("list");
  const [taskHistorics, setTaskHistorics] = useState<any[]>([]);

  // Estado para o diálogo de data
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [pendingTaskUpdate, setPendingTaskUpdate] = useState<{
    taskId: string;
    completed: boolean;
    taskTitle: string;
  } | null>(null);
  const {
    tasks,
    tasksByStatus,
    getTaskHistorics,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    assigneeFilter,
    setAssigneeFilter,
    updateTaskStatus,
    reopenTask,
    updateTaskMutation
  } = useTasks();

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskData) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"]
      });
      toast({
        title: "Tarefa criada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setModalMode("view");

    // Load task historics
    try {
      const historics = await getTaskHistorics(task.id);
      setTaskHistorics(historics.data || []);
    } catch (error) {
      console.error("Error loading task historics:", error);
      setTaskHistorics([]);
    }
    setIsModalOpen(true);
  };
  const handleEditTask = async (task: Task) => {
    setSelectedTask(task);
    setModalMode("edit");

    // Load task historics
    try {
      const historics = await getTaskHistorics(task.id);
      setTaskHistorics(historics.data || []);
    } catch (error) {
      console.error("Error loading task historics:", error);
      setTaskHistorics([]);
    }
    setIsModalOpen(true);
  };
  const handleNewTask = () => {
    setSelectedTask(null);
    setModalMode("create");
    setTaskHistorics([]);
    setIsModalOpen(true);
  };
  const handleTaskSave = async (data: CreateTaskData | UpdateTaskData) => {
    if (modalMode === "create") {
      await createTaskMutation.mutateAsync(data as CreateTaskData);
    } else if (selectedTask) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: data as UpdateTaskData
      });
    }
    setIsModalOpen(false);
  };
  const handleTaskMove = async (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);

    // Se estiver movendo para pendente (não completed), perguntar sobre nova data
    if (!completed && task) {
      setPendingTaskUpdate({
        taskId,
        completed,
        taskTitle: task.attributes.title
      });
      setIsDateDialogOpen(true);
    } else {
      // Se for marcar como completed, fazer diretamente
      await updateTaskStatus(taskId, completed);
    }
  };
  const handleDateDialogConfirm = async (newDueDate: string) => {
    if (pendingTaskUpdate) {
      await updateTaskStatus(pendingTaskUpdate.taskId, pendingTaskUpdate.completed, newDueDate);
      setPendingTaskUpdate(null);
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header - removido daqui pois botão foi movido para dentro dos tabs */}

      {/* Statistics Cards */}
      <TaskStatsCards tasks={tasks} />

      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1">
            <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => setActiveTab("list")} className="rounded-button">
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button variant={activeTab === "kanban" ? "default" : "outline"} onClick={() => setActiveTab("kanban")} className="rounded-button">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button variant={activeTab === "calendar" ? "default" : "outline"} onClick={() => setActiveTab("calendar")} className="rounded-button">
              <Calendar className="h-4 w-4 mr-2" />
              Calendário
            </Button>
          </div>
          
          <Button onClick={handleNewTask} className="rounded-button">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        <TaskFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} assigneeFilter={assigneeFilter} setAssigneeFilter={setAssigneeFilter} />

        {/* Content based on active tab */}
        {activeTab === "list" && <TaskTable tasks={tasks} onUpdateTask={async (taskId, data) => {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          data
        });
      }} isLoading={isLoading} />}
        
        {activeTab === "kanban" && <TaskKanban tasksByStatus={tasksByStatus} onTaskClick={handleTaskClick} onTaskMove={handleTaskMove} onTaskReopen={reopenTask} />}
        
        {activeTab === "calendar" && <TaskCalendar tasks={tasks} onTaskClick={handleTaskClick} />}
      </div>

      <NewTaskModal 
        task={selectedTask} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleTaskSave}
        mode={modalMode}
        taskHistorics={taskHistorics}
      />

      <TaskDateDialog isOpen={isDateDialogOpen} onClose={() => {
      setIsDateDialogOpen(false);
      setPendingTaskUpdate(null);
    }} onConfirm={handleDateDialogConfirm} taskTitle={pendingTaskUpdate?.taskTitle || ""} />
    </div>;
}
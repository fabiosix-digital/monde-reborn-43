
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task, CreateTaskData, UpdateTaskData } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format, addHours, isPast } from "date-fns";
import { getTaskStatus } from "@/utils/taskStatus";

export function useTasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("mine"); // Default to user's tasks
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  console.log("useTasks: Initializing hook with filters:", { searchTerm: debouncedSearchTerm, statusFilter });

  // Query para buscar todas as tarefas
  const { 
    data: tasksResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["tasks", debouncedSearchTerm, statusFilter, categoryFilter, assigneeFilter],
    queryFn: async () => {
      console.log("useTasks: Fetching tasks from API...");
      
      // Verificar se está autenticado antes de fazer a requisição
      if (!api.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }

      try {
        const params: {
          filter?: Record<string, string>;
          sort?: string;
          size?: number;
          include?: string;
        } = {};
        
        // Build filter object based on API docs
        const filters: Record<string, string> = {};
        
        // Use filter[search] for search functionality
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
          filters.search = debouncedSearchTerm;
        }
        
        // Server-side "My Tasks" per docs: filter[assigned]=user_tasks
        if (statusFilter === "mine") {
          filters.assigned = "user_tasks";
        }
        
        if (Object.keys(filters).length > 0) {
          params.filter = filters;
        }
        
        // Page size within API limit and default sorting
        params.size = 50;
        params.sort = "-registered-at";
        
        // Ensure relationships for reliable filtering/display
        params.include = "assignee,person,category,task-historics";

        const response = await api.getTasks(params);
        console.log("useTasks: API response:", response);
        return response;
      } catch (error) {
        console.error("useTasks: Error fetching tasks:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Increased to 5 minutes for better caching
    retry: (failureCount, error) => {
      // Handle rate limiting
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return failureCount < 2; // Reduce retries for rate limiting
      }
      // Não retry se o usuário não estiver autenticado
      if (error.message.includes('não autenticado') || error.message.includes('Token expirado')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled: api.isAuthenticated() // Só executar se autenticado
  });

  // Carregar historicos recentes (uma única chamada) para detectar exclusões/cancelamentos de forma robusta
  const { data: recentHistoricsResponse } = useQuery({
    queryKey: ["task-historics", "recent"],
    queryFn: async () => {
      return api.getTaskHistorics({ sort: "-date-time", size: 500 });
    },
    staleTime: 60 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
    enabled: api.isAuthenticated()
  });

  // Processar dados das tarefas com detecção de atraso e filtragem local
  const tasks: Task[] = useMemo(() => {
    let taskList = tasksResponse?.data || [];
    console.log("useTasks: Processing tasks from API:", taskList.length, "tasks received");
    
    // Apply frontend filtering for "mine" - show only tasks where user is assignee
    if (statusFilter === "mine") {
      const currentUserId = api.getCurrentUserIdFromToken();
      console.log("useTasks: Current user ID:", currentUserId);
      
      if (currentUserId) {
        const originalCount = taskList.length;
        taskList = taskList.filter(task => {
          const assigneeId = task.relationships?.assignee?.data?.id;
          console.log("useTasks: Task", task.id, "- assignee:", assigneeId, "- matches user:", assigneeId === currentUserId);
          return assigneeId === currentUserId;
        });
        console.log(`useTasks: Filtered "My Tasks" for user ${currentUserId}: ${taskList.length} tasks (from ${originalCount} total)`);
      }
    }
    
    // Apply category filter on frontend
    if (categoryFilter && categoryFilter !== "all") {
      taskList = taskList.filter(task => 
        task.relationships?.category?.data?.id === categoryFilter
      );
    }
    
    // Apply assignee filter on frontend
    if (assigneeFilter && assigneeFilter !== "all") {
      taskList = taskList.filter(task => 
        task.relationships?.assignee?.data?.id === assigneeFilter
      );
    }
    
    console.log(`useTasks: Final processed tasks: ${taskList.length} tasks (statusFilter: ${statusFilter})`);
    return taskList;
  }, [tasksResponse?.data, statusFilter, categoryFilter, assigneeFilter]);

  // Agrupar tarefas por status incluindo atrasadas
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      pending: [],
      overdue: [],
      completed: [],
      deleted: [],
    };

    // Construir um mapa de tarefas excluídas com base no histórico recente (texto/status de exclusão/cancelamento)
    const deletedIds = new Set<string>();
    const historics = (recentHistoricsResponse as any)?.data || [];
    const normalize = (s: string) => s
      .normalize("NFD").replace(/[^\p{L}\p{N}\s]/gu, "").toLowerCase();
    const looksDeleted = (text?: string) => {
      if (!text) return false;
      const n = normalize(text);
      return n.includes("exclu") || n.includes("cancel") || n.includes("delet") || n.includes("remov") || n.includes("apag");
    };

    for (const h of historics) {
      const txt = h?.attributes?.text || h?.attributes?.description || h?.attributes?.historic;
      const newStatus = h?.attributes?.["new-status"] || (h as any)?.attributes?.["new_status"] || "";
      if (!looksDeleted(txt) && !looksDeleted(String(newStatus))) continue;

      // Extrair taskId do relacionamento ou do link related
      let taskId: string | null = null;
      const rel = h?.relationships?.task;
      if (rel && 'data' in rel && rel.data && typeof rel.data === 'object') {
        taskId = (rel.data as any).id || null;
      }
      if (!taskId) {
        const relUrl: string | undefined = rel?.links?.related;
        if (relUrl) {
          const match = String(relUrl).match(/\/tasks\/([0-9a-fA-F-]+)/);
          if (match?.[1]) taskId = match[1];
        }
      }
      if (!taskId) {
        taskId = h?.attributes?.["task-id"] || h?.attributes?.["task_id"] || null;
      }
      if (taskId) deletedIds.add(taskId);
    }

    for (const task of tasks) {
      const status = deletedIds.has(task.id) ? "deleted" : getTaskStatus(task);

      // DEBUG: tarefa #10
      const n = (task.attributes as any).number;
      if (n === 10 || String(n) === "10") {
        console.log("DEBUG tarefa #10:", { status, attrs: task.attributes, id: task.id });
      }

      if (grouped[status]) {
        grouped[status].push(task);
      }

      // Diagnóstico: tarefa classificada como atrasada mas com sinais de exclusão/cancelamento
      if (status === "overdue") {
        const a: any = task.attributes as any;
        const hasDeletionSignals = !!(a.deleted || a.excluded || a["is-deleted"] || a["is_deleted"] || a["is-excluded"] || a["is_excluded"] || a["deleted-at"] || a["deleted_at"] || a["deletedAt"] || a["excluded-at"] || a["excluded_at"] || a["excludedAt"] || a["cancelled-at"] || a["canceled-at"] || a["cancelled_at"] || a["cancelledAt"] || a["canceled_at"] || a["canceledAt"]);
        if (hasDeletionSignals) {
          // Ajuda a rastrear inconsistência de status
          console.warn("useTasks: Tarefa parece excluída/cancelada mas caiu em 'Atrasada'", {
            id: task.id,
            number: (task.attributes as any).number,
            attrs: task.attributes
          });
        }
      }
    }

    console.log("useTasks: Tasks by status:", {
      pending: grouped.pending.length,
      overdue: grouped.overdue.length,
      completed: grouped.completed.length,
      deleted: grouped.deleted.length
    });

    return grouped as { pending: Task[]; overdue: Task[]; completed: Task[]; deleted: Task[] };
  }, [tasks, recentHistoricsResponse]);

  // Mutation para atualizar tarefa
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) => {
      console.log("useTasks: Updating task:", id, data);
      return api.updateTask(id, data);
    },
    onSuccess: (data, variables) => {
      console.log("useTasks: Task updated successfully:", variables.id);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ 
        title: "Tarefa atualizada com sucesso!",
        description: "As alterações foram salvas." 
      });
    },
    onError: (error: any, variables) => {
      console.error("useTasks: Error updating task:", variables.id, error);
      toast({ 
        title: "Erro ao atualizar tarefa", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation para deletar tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => {
      console.log("useTasks: Deleting task:", id);
      return api.deleteTask(id);
    },
    onSuccess: (data, variables) => {
      console.log("useTasks: Task deleted successfully:", variables);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa removida com sucesso!" });
    },
    onError: (error: any, variables) => {
      console.error("useTasks: Error deleting task:", variables, error);
      toast({ 
        title: "Erro ao remover tarefa", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Função para atualizar status da tarefa
  const updateTaskStatus = async (taskId: string, completed: boolean, newDueDate?: string) => {
    try {
      console.log("useTasks: Updating task status:", { taskId, completed, newDueDate });
      
      const updateData: UpdateTaskData = {
        type: "tasks",
        id: taskId,
        attributes: {
          completed
        }
      };
      
      if (newDueDate) {
        updateData.attributes.due = newDueDate;
      }

      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: updateData
      });
    } catch (error) {
      console.error("useTasks: Error in updateTaskStatus:", error);
      throw error;
    }
  };

  // Função para reabrir tarefa
  const reopenTask = async (taskId: string) => {
    console.log("useTasks: Reopening task:", taskId);
    await updateTaskStatus(taskId, false, format(addHours(new Date(), 24), 'yyyy-MM-dd'));
  };

  // Função para buscar histórico da tarefa - Fixed to remove unsupported filter
  const getTaskHistorics = async (taskId: string) => {
    console.log("useTasks: Getting task historics for:", taskId);
    try {
      // REMOVED: filter by task-id as it's not supported by API
      // Fetch all historics and filter on frontend
      const response = await api.getTaskHistorics({ 
        sort: "-date-time",
        size: 30 // Reduced size to avoid rate limiting
      });
      
      // Filter on frontend - more reliable approach
      const filteredData = response.data?.filter(historic => {
        // Multiple ways to verify relationship
        if (historic.relationships?.task?.links?.related?.includes(taskId)) return true;
        if (historic.relationships?.task && 'data' in historic.relationships.task && 
            historic.relationships.task.data && 
            typeof historic.relationships.task.data === 'object' && 
            'id' in historic.relationships.task.data && 
            historic.relationships.task.data.id === taskId) return true;
        if (historic.attributes && 'task-id' in historic.attributes && historic.attributes['task-id'] === taskId) return true;
        return false;
      }) || [];
      
      console.log("useTasks: Successfully fetched historics for task:", taskId, {
        total: response.data?.length || 0,
        filtered: filteredData.length
      });
      
      return { ...response, data: filteredData };
    } catch (error) {
      console.error("useTasks: Error getting task historics:", error);
      return { data: [] };
    }
  };

  console.log("useTasks: Returning hook data:", {
    tasksCount: tasks.length,
    isLoading,
    error: error?.message
  });

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
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
    updateTaskMutation,
    deleteTaskMutation,
    getTaskHistorics,
    refetch
  };
}

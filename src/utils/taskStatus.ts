
import { Task } from "@/types/api";
import { isPast } from "date-fns";

export type TaskStatus = "pending" | "overdue" | "completed" | "deleted";

export function getTaskStatus(task: Task): TaskStatus {
  // Primeiro verificar se a tarefa foi deletada/excluída (inclui cancelada)
  // A API pode marcar exclusão/cancelamento de diversas formas (português/inglês, com/sem acento, boolean/date flags)
  const attrs: any = task.attributes as any;

  // Normaliza strings removendo acentos e deixando minúsculas
  const rawStatus = typeof attrs.status === "string" ? attrs.status
    : typeof attrs.situation === "string" ? attrs.situation
    : typeof attrs.situacao === "string" ? attrs.situacao
    : typeof attrs["status-name"] === "string" ? attrs["status-name"]
    : typeof attrs.statusName === "string" ? attrs.statusName
    : undefined;
  const normalizedStatus = rawStatus
    ? rawStatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : undefined;

  // Sinalizadores comuns para exclusão/cancelamento
  const deletedFlag = attrs.deleted ?? attrs.excluded ?? attrs["is-deleted"] ?? attrs["is_deleted"] ?? attrs["is-excluded"] ?? attrs["is_excluded"]; 
  const deletedAt = attrs["deleted-at"] || attrs["deleted_at"] || attrs["deletedAt"]; 
  const excludedAt = attrs["excluded-at"] || attrs["excluded_at"] || attrs["excludedAt"]; 
  const canceledAt = attrs["cancelled-at"] || attrs["cancelled_at"] || attrs["cancelledAt"] || attrs["canceled-at"] || attrs["canceled_at"] || attrs["canceledAt"]; 

  const truthyish = (v: any) => {
    if (v == null) return false;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      return ["1","true","yes","y","on","sim","s","verdadeiro"].includes(s);
    }
    return v === true || v === 1;
  };

  // Heurística extra: alguns ambientes não expõem flag de exclusão, mas o título pode conter "excluida"
  const rawTitle = typeof attrs.title === "string" ? attrs.title : undefined;
  const normalizedTitle = rawTitle
    ? rawTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : undefined;

  const statusIndicatesDeleted = !!normalizedStatus && (
    normalizedStatus === "deleted" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus.startsWith("cancel") ||
    normalizedStatus.startsWith("exclui") || // "excluida", "excluída", "excluido"
    normalizedStatus === "excluida" ||
    normalizedStatus === "excluido" ||
    normalizedStatus.startsWith("apag") || // apagada/apagado
    normalizedStatus.startsWith("remov") || // removida/removido
    normalizedStatus.startsWith("delet") // deletada/deletado
  );

  const titleIndicatesDeleted = !!normalizedTitle && (
    normalizedTitle.includes("excluida") ||
    normalizedTitle.includes("excluida") ||
    normalizedTitle.includes("excluido") ||
    normalizedTitle.includes("cancelada") ||
    normalizedTitle.includes("cancelado") ||
    normalizedTitle.includes("apagada") ||
    normalizedTitle.includes("apagado") ||
    normalizedTitle.includes("removida") ||
    normalizedTitle.includes("removido") ||
    normalizedTitle.includes("deletada") ||
    normalizedTitle.includes("deletado")
  );

  const isDeleted = truthyish(deletedFlag) || statusIndicatesDeleted || titleIndicatesDeleted || !!deletedAt || !!excludedAt || !!canceledAt;

  if (isDeleted) {
    return "deleted";
  }
  
  // Verificar se foi concluída
  const completedFlag = attrs.completed ?? attrs["is-completed"] ?? attrs["is_completed"];
  const completedAt = attrs["completed-at"] || attrs["completed_at"] || attrs["completedAt"];
  const statusIndicatesCompleted = !!normalizedStatus && (
    normalizedStatus === "completed" ||
    normalizedStatus === "done" ||
    normalizedStatus.startsWith("conclu") || // "concluida", "concluído"
    normalizedStatus.startsWith("finaliz")   // "finalizada"
  );
  if (truthyish(completedFlag) || statusIndicatesCompleted || !!completedAt) {
    return "completed";
  }
  
  // Se a tarefa tem data de vencimento no passado, está atrasada
  if (task.attributes.due && isPast(new Date(task.attributes.due))) {
    return "overdue";
  }
  
  return "pending";
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "pending":
      return "bg-orange-100 border-orange-300 text-orange-800";
    case "overdue":
      return "bg-red-100 border-red-300 text-red-800";
    case "completed":
      return "bg-green-100 border-green-300 text-green-800";
    case "deleted":
      return "bg-gray-100 border-gray-300 text-gray-700";
    default:
      return "bg-gray-100 border-gray-300 text-gray-700";
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "overdue":
      return "Atrasada";
    case "completed":
      return "Concluída";
    case "deleted":
      return "Excluída";
    default:
      return "Pendente";
  }
}

export const TASK_COLUMNS = [
  { id: "pending", label: "Pendente", status: "pending" as TaskStatus },
  { id: "overdue", label: "Atrasada", status: "overdue" as TaskStatus },
  { id: "completed", label: "Concluída", status: "completed" as TaskStatus },
  { id: "deleted", label: "Excluída", status: "deleted" as TaskStatus },
] as const;

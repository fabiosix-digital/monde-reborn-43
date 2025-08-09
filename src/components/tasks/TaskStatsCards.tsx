import { Task } from "@/types/api";
import { getTaskStatus } from "@/utils/taskStatus";
import { TaskIcon, CheckIcon, RemixIcon } from "../icons/RemixIcon";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    return status === "pending";
  }).length;
  const completedTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    return status === "completed";
  }).length;
  const overdueTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    return status === "overdue";
  }).length;

  const stats = [
    {
      title: "Total de Tarefas",
      value: totalTasks.toString(),
      gradient: "bg-gradient-to-br from-primary to-primary-glow",
      icon: "task-line",
      trend: "+15% este mês",
      trendUp: true
    },
    {
      title: "Tarefas Pendentes", 
      value: pendingTasks.toString(),
      gradient: "bg-gradient-to-br from-warning to-orange-500",
      icon: "time-line",
      trend: "-8% este mês",
      trendUp: false
    },
    {
      title: "Tarefas Concluídas",
      value: completedTasks.toString(),
      gradient: "bg-gradient-to-br from-success to-green-600",
      icon: "checkbox-circle-line",
      trend: "+23% este mês",
      trendUp: true
    },
    {
      title: "Tarefas Atrasadas",
      value: overdueTasks.toString(),
      gradient: "bg-gradient-to-br from-destructive to-red-600",
      icon: "alarm-warning-line",
      trend: "+12% este mês",
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.gradient} rounded-xl p-6 text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">{stat.title}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <RemixIcon name={stat.icon} className="text-white text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <RemixIcon 
              name={stat.trendUp ? "arrow-up-line" : "arrow-down-line"}
              className="text-white/80 text-sm"
            />
            <span className="text-white/80 text-sm ml-1">{stat.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
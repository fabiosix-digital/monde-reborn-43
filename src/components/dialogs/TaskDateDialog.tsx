import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, X } from "lucide-react";
import { format, addHours } from "date-fns";

interface TaskDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string) => void;
  taskTitle: string;
}

export function TaskDateDialog({ isOpen, onClose, onConfirm, taskTitle }: TaskDateDialogProps) {
  // Valor padrão: data atual + 1 hora
  const defaultDate = format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm");
  const [newDate, setNewDate] = useState(defaultDate);

  const handleConfirm = () => {
    onConfirm(newDate);
    onClose();
  };

  const handleUseDefault = () => {
    onConfirm(defaultDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Atualizar Data de Vencimento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A tarefa "<span className="font-medium">{taskTitle}</span>" será movida para pendente. 
            Deseja atualizar a data de vencimento?
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="newDate">Nova Data e Hora de Vencimento</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newDate"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se não alterar, será usado: {format(addHours(new Date(), 1), "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleUseDefault}>
            Usar Padrão (+1h)
          </Button>
          <Button onClick={handleConfirm}>
            <Calendar className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
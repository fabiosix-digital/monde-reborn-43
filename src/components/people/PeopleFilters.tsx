import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

interface PeopleFiltersProps {
  searchTerm: string;
  kindFilter: string;
  onSearchChange: (value: string) => void;
  onKindFilterChange: (value: string) => void;
  isFetching?: boolean;
}

export function PeopleFilters({ 
  searchTerm, 
  kindFilter, 
  onSearchChange, 
  onKindFilterChange,
  isFetching
}: PeopleFiltersProps) {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Campo de busca */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 shadow-sm border-border/50 focus:border-primary/50"
            />
            {isFetching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>

        {/* Tipo de Cliente */}
        <div>
          <Select value={kindFilter} onValueChange={onKindFilterChange}>
            <SelectTrigger className="shadow-sm border-border/50">
              <SelectValue placeholder="Tipo de Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="individual">Pessoa Física</SelectItem>
              <SelectItem value="company">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Marcador */}
        <div>
          <Select>
            <SelectTrigger className="shadow-sm border-border/50">
              <SelectValue placeholder="Marcador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cidade */}
        <div>
          <Select>
            <SelectTrigger className="shadow-sm border-border/50">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="sao-paulo">São Paulo</SelectItem>
              <SelectItem value="rio-janeiro">Rio de Janeiro</SelectItem>
              <SelectItem value="belo-horizonte">Belo Horizonte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div>
          <Select>
            <SelectTrigger className="shadow-sm border-border/50">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="SP">SP</SelectItem>
              <SelectItem value="RJ">RJ</SelectItem>
              <SelectItem value="MG">MG</SelectItem>
              <SelectItem value="ES">ES</SelectItem>
              <SelectItem value="SC">SC</SelectItem>
              <SelectItem value="RS">RS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Checkbox Somente pagante - alinhado à esquerda na linha de baixo */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center space-x-2">
          <Checkbox id="paying-only" />
          <label
            htmlFor="paying-only"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Somente pagante
          </label>
        </div>
      </div>
    </div>
  );
}
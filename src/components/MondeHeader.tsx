import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell, ChevronDown } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
export function MondeHeader() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const {
    theme,
    setTheme
  } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const handleLogout = () => {
    localStorage.removeItem("monde_token");
    navigate("/login");
  };
  return <header className="header flex items-center justify-between h-16 px-10 bg-card border-b border-border transition-all duration-300">
      <div className="flex items-center gap-2">
        
        
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-button">
          <div className="w-5 h-5 flex items-center justify-center">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button variant="outline" size="sm" className="rounded-button relative">
            <div className="w-5 h-5 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              5
            </span>
          </Button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <Button onClick={() => setUserDropdownOpen(!userDropdownOpen)} variant="outline" className="flex items-center space-x-3 p-1 rounded-button">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-medium text-sm">
              AM
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground">Ana Marques</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <div className="w-4 h-4 flex items-center justify-center">
              <ChevronDown className="w-3 h-3" />
            </div>
          </Button>
          
          {userDropdownOpen && <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
              <button onClick={() => navigate("/profile")} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                Meu Perfil
              </button>
              <div className="border-t border-border my-1"></div>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted">
                Sair
              </button>
            </div>}
        </div>
      </div>
    </header>;
}
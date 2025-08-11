import { Search, User, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { useState } from "react";
import { syncFilesWithAI } from "@/services/indexApi";
import TaskDropdown from "@/components/tasks/TaskDropdown";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleSyncWithAI = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      toast.loading("Syncing files with AI...", { id: "sync-ai" });

      const response = await syncFilesWithAI();

      if (response.success) {
        toast.success(
          `Successfully synced ${response.totalFiles || 0} files with AI!`,
          { id: "sync-ai" }
        );
      } else {
        throw new Error(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(
        error instanceof Error ? error.message : "Failed to sync files with AI",
        { id: "sync-ai" }
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <nav className="h-16 bg-gradient-card border-b border-border flex items-center px-6 shadow-soft justify-between w-full">

  {/* LEFT: Logo and Beta badge */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <Brain className="h-8 w-8 text-primary" />
      <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        StudySmart Pro
      </h1>
    </div>
    <Badge variant="secondary" className="text-xs">
      Beta
    </Badge>
  </div>

  {/* RIGHT: Sync, Theme, Tasks and Profile buttons */}
  <div className="flex items-center gap-3">
    <Button
      variant="outline"
      size="sm"
      className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
      onClick={handleSyncWithAI}
      disabled={isSyncing}
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">
        {isSyncing ? 'Syncing...' : 'Sync AI'}
      </span>
    </Button>

    <ThemeToggle />

    <TaskDropdown />

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>User ID: Krishna</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

</nav>

  );
};

export default Navbar;
import React, { useState } from 'react';
import { CheckSquare, Plus, Filter, BarChart3, Calendar, Clock, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTask } from '@/contexts/TaskContext';
import TaskDialog from './TaskDialog';
import TaskList from './TaskList';
import TaskStats from './TaskStats';

const TaskDropdown: React.FC = () => {
  const { state } = useTask();
  const [isOpen, setIsOpen] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const pendingTasks = state.tasks.filter(task => !task.completed);
  const overdueTasks = state.tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  });

  const handleCreateTask = () => {
    setShowTaskDialog(true);
    setIsOpen(false);
  };

  const handleViewTasks = () => {
    setShowTaskList(true);
    setIsOpen(false);
  };

  const handleViewStats = () => {
    setShowStats(true);
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 relative">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
            {pendingTasks.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
              >
                {pendingTasks.length}
              </Badge>
            )}
            {overdueTasks.length > 0 && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Task Management</span>
            {state.loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Quick Stats */}
          <div className="px-2 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <CheckSquare className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{pendingTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <div className="font-medium">{overdueTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Quick Actions */}
          <DropdownMenuItem onClick={handleCreateTask} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleViewTasks} className="cursor-pointer">
            <Filter className="h-4 w-4 mr-2" />
            View All Tasks
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleViewStats} className="cursor-pointer">
            <BarChart3 className="h-4 w-4 mr-2" />
            Task Statistics
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Recent Tasks Preview */}
          <DropdownMenuLabel>Recent Tasks</DropdownMenuLabel>
          <div className="max-h-48 overflow-y-auto">
            {pendingTasks.slice(0, 3).map((task) => (
              <div key={task._id || task.id} className="px-2 py-1">
                <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingTasks.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No pending tasks
              </div>
            )}
            
            {pendingTasks.length > 3 && (
              <div className="px-2 py-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleViewTasks}
                >
                  View {pendingTasks.length - 3} more tasks
                </Button>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Task Creation Dialog */}
      <TaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        mode="create"
      />

      {/* Task List Dialog */}
      <TaskList
        open={showTaskList}
        onOpenChange={setShowTaskList}
      />

      {/* Task Stats Dialog */}
      <TaskStats
        open={showStats}
        onOpenChange={setShowStats}
      />
    </>
  );
};

export default TaskDropdown;

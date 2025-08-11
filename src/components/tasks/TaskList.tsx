import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, SortAsc, SortDesc, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTask } from '@/contexts/TaskContext';
import { TaskFilters } from '@/types';
import TaskItem from './TaskItem';
import TaskDialog from './TaskDialog';

interface TaskListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskList: React.FC<TaskListProps> = ({ open, onOpenChange }) => {
  const { state, actions } = useTask();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<TaskFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Apply filters when they change
  useEffect(() => {
    if (open) {
      const filters: TaskFilters = {
        ...localFilters,
        search: searchTerm || undefined
      };
      actions.loadTasks(filters);
    }
  }, [localFilters, searchTerm, open]);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSortToggle = () => {
    setLocalFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefresh = () => {
    actions.refreshTasks();
  };

  const completedTasks = state.tasks.filter(task => task.completed);
  const pendingTasks = state.tasks.filter(task => !task.completed);
  const allTasks = state.tasks;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Task Management</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={state.loading}
                >
                  <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Manage your tasks, set priorities, and track progress.
            </DialogDescription>
          </DialogHeader>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={localFilters.priority || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('priority', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortBy || 'createdAt'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortToggle}
              >
                {localFilters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Task Tabs */}
          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All Tasks
                <Badge variant="secondary" className="text-xs">
                  {allTasks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                <Badge variant="secondary" className="text-xs">
                  {pendingTasks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                Completed
                <Badge variant="secondary" className="text-xs">
                  {completedTasks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 overflow-hidden">
              <TaskListContent tasks={allTasks} />
            </TabsContent>

            <TabsContent value="pending" className="flex-1 overflow-hidden">
              <TaskListContent tasks={pendingTasks} />
            </TabsContent>

            <TabsContent value="completed" className="flex-1 overflow-hidden">
              <TaskListContent tasks={completedTasks} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <TaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
      />
    </>
  );
};

// Task List Content Component
interface TaskListContentProps {
  tasks: any[];
}

const TaskListContent: React.FC<TaskListContentProps> = ({ tasks }) => {
  const { state } = useTask();

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="text-muted-foreground mb-2">No tasks found</div>
        <div className="text-sm text-muted-foreground">
          Create a new task or adjust your filters
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-96 pr-2">
      {tasks.map((task) => (
        <TaskItem
          key={task._id || task.id}
          task={task}
        />
      ))}
    </div>
  );
};

export default TaskList;

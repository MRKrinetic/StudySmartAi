import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, MoreHorizontal, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ITask } from '@/types';
import { useTask } from '@/contexts/TaskContext';
import TaskDialog from './TaskDialog';
import { format, isToday, isPast, isTomorrow } from 'date-fns';

interface TaskItemProps {
  task: ITask;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { actions } = useTask();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const taskId = task._id || task.id;
  const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  const handleToggleComplete = async () => {
    if (taskId) {
      await actions.toggleTaskCompletion(taskId, !task.completed);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (taskId) {
      await actions.deleteTask(taskId);
    }
    setShowDeleteDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isPast(dueDate)) return `Overdue (${format(dueDate, 'MMM d')})`;
    return format(dueDate, 'MMM d, yyyy');
  };

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg border transition-colors",
          task.completed 
            ? "bg-muted/50 border-muted" 
            : "bg-background hover:bg-muted/50",
          isOverdue && !task.completed && "border-destructive/50 bg-destructive/5"
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="mt-1"
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-sm",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              
              {task.description && (
                <p className={cn(
                  "text-sm text-muted-foreground mt-1",
                  task.completed && "line-through"
                )}>
                  {task.description}
                </p>
              )}

              {/* Task Meta */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge 
                  variant={getPriorityColor(task.priority) as any}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>

                {task.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue && !task.completed 
                      ? "text-destructive font-medium" 
                      : isDueToday && !task.completed
                      ? "text-orange-600 font-medium"
                      : "text-muted-foreground"
                  )}>
                    {isOverdue && !task.completed ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    {formatDueDate(new Date(task.dueDate))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.createdAt), 'MMM d')}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <TaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        task={task}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskItem;

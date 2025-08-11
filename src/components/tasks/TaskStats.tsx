import React, { useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTask } from '@/contexts/TaskContext';

interface TaskStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskStats: React.FC<TaskStatsProps> = ({ open, onOpenChange }) => {
  const { state, actions } = useTask();

  useEffect(() => {
    if (open) {
      actions.loadStats();
    }
  }, [open, actions]);

  if (!state.stats) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Statistics</DialogTitle>
            <DialogDescription>Loading task statistics...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { stats } = state;
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Statistics
          </DialogTitle>
          <DialogDescription>
            Overview of your task management and productivity metrics.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Total Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All time tasks created
              </p>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Tasks remaining
              </p>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Need immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              Your overall task completion progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion</span>
                <span>{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>
              Distribution of pending tasks by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* High Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">High</Badge>
                  <span className="text-sm">High Priority Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.byPriority.high}</span>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: stats.pending > 0 
                          ? `${(stats.byPriority.high / stats.pending) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Medium Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">Medium</Badge>
                  <span className="text-sm">Medium Priority Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.byPriority.medium}</span>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: stats.pending > 0 
                          ? `${(stats.byPriority.medium / stats.pending) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Low Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Low</Badge>
                  <span className="text-sm">Low Priority Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.byPriority.low}</span>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-gray-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: stats.pending > 0 
                          ? `${(stats.byPriority.low / stats.pending) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {stats.pending === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                🎉 All tasks completed! Great job!
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default TaskStats;

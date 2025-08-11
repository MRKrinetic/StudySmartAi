import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ITask, TaskFilters, TaskStats } from '@/types';
import * as taskApi from '@/services/taskApi';
import { toast } from 'sonner';

// Task Context State
interface TaskState {
  tasks: ITask[];
  stats: TaskStats | null;
  filters: TaskFilters;
  loading: boolean;
  error: string | null;
  selectedTask: ITask | null;
}

// Task Actions
type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: ITask[] }
  | { type: 'SET_STATS'; payload: TaskStats }
  | { type: 'SET_FILTERS'; payload: TaskFilters }
  | { type: 'SET_SELECTED_TASK'; payload: ITask | null }
  | { type: 'ADD_TASK'; payload: ITask }
  | { type: 'UPDATE_TASK'; payload: ITask }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: { id: string; completed: boolean } };

// Initial state
const initialState: TaskState = {
  tasks: [],
  stats: null,
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  loading: false,
  error: null,
  selectedTask: null
};

// Task reducer
const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_SELECTED_TASK':
      return { ...state, selectedTask: action.payload };
    
    case 'ADD_TASK':
      return { 
        ...state, 
        tasks: [action.payload, ...state.tasks],
        error: null 
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task._id === action.payload._id || task.id === action.payload.id 
            ? action.payload 
            : task
        ),
        selectedTask: state.selectedTask?.id === action.payload.id 
          ? action.payload 
          : state.selectedTask,
        error: null
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => 
          task._id !== action.payload && task.id !== action.payload
        ),
        selectedTask: state.selectedTask?.id === action.payload 
          ? null 
          : state.selectedTask,
        error: null
      };
    
    case 'TOGGLE_TASK_COMPLETION':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          const taskId = task._id || task.id;
          return taskId === action.payload.id
            ? { ...task, completed: action.payload.completed }
            : task;
        }),
        error: null
      };
    
    default:
      return state;
  }
};

// Task Context
interface TaskContextType {
  state: TaskState;
  actions: {
    loadTasks: (filters?: TaskFilters) => Promise<void>;
    loadStats: () => Promise<void>;
    createTask: (taskData: any) => Promise<void>;
    updateTask: (taskId: string, updates: any) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    toggleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
    setFilters: (filters: TaskFilters) => void;
    setSelectedTask: (task: ITask | null) => void;
    refreshTasks: () => Promise<void>;
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Task Provider Component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load tasks with filters
  const loadTasks = useCallback(async (filters?: TaskFilters) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const finalFilters = filters || state.filters;
      const tasks = await taskApi.getTasks(finalFilters);
      dispatch({ type: 'SET_TASKS', payload: tasks });
      if (filters) {
        dispatch({ type: 'SET_FILTERS', payload: finalFilters });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  }, [state.filters]);

  // Load task statistics
  const loadStats = useCallback(async () => {
    try {
      const stats = await taskApi.getTaskStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to load task stats:', error);
    }
  }, []);

  // Create a new task
  const createTask = useCallback(async (taskData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newTask = await taskApi.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      toast.success('Task created successfully');
      // Refresh stats
      loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadStats]);

  // Update an existing task
  const updateTask = useCallback(async (taskId: string, updates: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTask = await taskApi.updateTask(taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      toast.success('Task updated successfully');
      // Refresh stats
      loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadStats]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await taskApi.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      toast.success('Task deleted successfully');
      // Refresh stats
      loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadStats]);

  // Toggle task completion
  const toggleTaskCompletion = useCallback(async (taskId: string, completed: boolean) => {
    try {
      // Optimistic update
      dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { id: taskId, completed } });
      
      const updatedTask = await taskApi.toggleTaskCompletion(taskId, completed);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      
      toast.success(completed ? 'Task completed!' : 'Task marked as pending');
      // Refresh stats
      loadStats();
    } catch (error) {
      // Revert optimistic update
      dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { id: taskId, completed: !completed } });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  }, [loadStats]);

  // Set filters
  const setFilters = useCallback((filters: TaskFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  // Set selected task
  const setSelectedTask = useCallback((task: ITask | null) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: task });
  }, []);

  // Refresh tasks (reload with current filters)
  const refreshTasks = useCallback(async () => {
    await loadTasks(state.filters);
  }, [loadTasks, state.filters]);

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  const contextValue: TaskContextType = {
    state,
    actions: {
      loadTasks,
      loadStats,
      createTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      setFilters,
      setSelectedTask,
      refreshTasks
    }
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use task context
export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

import { ITask, TaskFormData, TaskFilters, TaskStats, TaskApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Default user ID for now - in a real app this would come from authentication
const DEFAULT_USER_ID = 'default-user';

/**
 * Get all tasks for the current user with optional filtering and sorting
 */
export const getTasks = async (filters: TaskFilters = {}): Promise<ITask[]> => {
  try {
    const params = new URLSearchParams({
      userId: DEFAULT_USER_ID,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await fetch(`${API_BASE_URL}/tasks?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch tasks');
    }

    return (result.data as ITask[]) || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

/**
 * Get a specific task by ID
 */
export const getTask = async (taskId: string): Promise<ITask> => {
  try {
    const params = new URLSearchParams({ userId: DEFAULT_USER_ID });
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch task');
    }

    return result.data as ITask;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

/**
 * Create a new task
 */
export const createTask = async (taskData: TaskFormData): Promise<ITask> => {
  try {
    const payload = {
      ...taskData,
      userId: DEFAULT_USER_ID,
      // Convert date string to ISO string if provided
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined
    };

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create task');
    }

    return result.data as ITask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (taskId: string, updates: Partial<TaskFormData & { completed: boolean }>): Promise<ITask> => {
  try {
    const payload = {
      ...updates,
      userId: DEFAULT_USER_ID,
      // Convert date string to ISO string if provided
      dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined
    };

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update task');
    }

    return result.data as ITask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const params = new URLSearchParams({ userId: DEFAULT_USER_ID });
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}?${params}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Toggle task completion status
 */
export const toggleTaskCompletion = async (taskId: string, completed: boolean): Promise<ITask> => {
  return updateTask(taskId, { completed });
};

/**
 * Get task statistics for the current user
 */
export const getTaskStats = async (): Promise<TaskStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/stats/${DEFAULT_USER_ID}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TaskApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch task statistics');
    }

    return result.data as TaskStats;
  } catch (error) {
    console.error('Error fetching task stats:', error);
    throw error;
  }
};

/**
 * Search tasks by text
 */
export const searchTasks = async (searchTerm: string, filters: Omit<TaskFilters, 'search'> = {}): Promise<ITask[]> => {
  return getTasks({ ...filters, search: searchTerm });
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = async (): Promise<ITask[]> => {
  const allTasks = await getTasks({ completed: false });
  const now = new Date();
  
  return allTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < now
  );
};

/**
 * Get tasks due today
 */
export const getTasksDueToday = async (): Promise<ITask[]> => {
  const allTasks = await getTasks({ completed: false });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return allTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });
};

/**
 * Get tasks by priority
 */
export const getTasksByPriority = async (priority: 'low' | 'medium' | 'high'): Promise<ITask[]> => {
  return getTasks({ priority, completed: false });
};

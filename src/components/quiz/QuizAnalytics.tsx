import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Brain,
  Calendar,
  BarChart3
} from 'lucide-react';
import { QuizStatistics, QuizSession } from '@/types';
import { cn } from '@/lib/utils';

interface QuizAnalyticsProps {
  statistics: QuizStatistics;
  recentSessions: QuizSession[];
  className?: string;
}

const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({
  statistics,
  recentSessions,
  className
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');

  // Prepare chart data
  const performanceData = statistics.recentActivity.map(activity => ({
    date: new Date(activity.date).toLocaleDateString(),
    score: activity.score,
    quizzes: activity.quizzes,
    timeSpent: Math.round(activity.timeSpent / 60) // Convert to minutes
  }));

  const categoryData = statistics.categoryStats.map(cat => ({
    name: cat.category,
    score: cat.averageScore,
    quizzes: cat.quizzes
  }));

  const difficultyData = statistics.difficultyStats.map(diff => ({
    name: diff.difficulty,
    score: diff.averageScore,
    time: Math.round(diff.averageTime / 60),
    quizzes: diff.quizzes
  }));

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPerformanceTrend = () => {
    if (performanceData.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = performanceData.slice(-3);
    const previous = performanceData.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) return { trend: 'stable', change: 0 };
    
    const recentAvg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.score, 0) / previous.length;
    
    const change = recentAvg - previousAvg;
    
    if (change > 5) return { trend: 'up', change };
    if (change < -5) return { trend: 'down', change };
    return { trend: 'stable', change };
  };

  const performanceTrend = getPerformanceTrend();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                <p className="text-2xl font-bold">{statistics.totalQuizzes}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{statistics.currentStreak}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Days</p>
                <p className="text-2xl font-bold">{statistics.studyDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trend
            <div className="ml-auto flex items-center gap-2">
              {performanceTrend.trend === 'up' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{performanceTrend.change.toFixed(1)}%
                </Badge>
              )}
              {performanceTrend.trend === 'down' && (
                <Badge variant="destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {performanceTrend.change.toFixed(1)}%
                </Badge>
              )}
              {performanceTrend.trend === 'stable' && (
                <Badge variant="secondary">
                  Stable
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Score (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Score by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={difficultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#82ca9d" name="Average Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quizzes"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Goal Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Goal</span>
                <span className="text-sm text-muted-foreground">
                  {statistics.weeklyProgress} / {statistics.weeklyGoal} quizzes
                </span>
              </div>
              <Progress 
                value={(statistics.weeklyProgress / statistics.weeklyGoal) * 100} 
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {statistics.weeklyGoal - statistics.weeklyProgress > 0 
                  ? `${statistics.weeklyGoal - statistics.weeklyProgress} more quizzes to reach your weekly goal!`
                  : 'Congratulations! You\'ve reached your weekly goal!'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.slice(0, 5).map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        session.status === 'completed' ? 'bg-green-500' : 
                        session.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <div>
                        <p className="text-sm font-medium">Quiz Session</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(session.timeSpent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizAnalytics;

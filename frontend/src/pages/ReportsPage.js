import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ReportsPage() {
  const [topAssignees, setTopAssignees] = useState([]);
  const [resolutionStats, setResolutionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [assigneesRes, resolutionRes] = await Promise.all([
        api.get('/reports/top-assignees'),
        api.get('/reports/resolution-time'),
      ]);
      setTopAssignees(assigneesRes.data);
      setResolutionStats(resolutionRes.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#f97316', '#16a34a', '#64748b'];

  const getStatusData = (byStatus) => {
    return [
      { name: 'Open', value: byStatus.open || 0, color: '#2563eb' },
      { name: 'In Progress', value: byStatus.in_progress || 0, color: '#f97316' },
      { name: 'Resolved', value: byStatus.resolved || 0, color: '#16a34a' },
      { name: 'Closed', value: byStatus.closed || 0, color: '#64748b' },
    ].filter(item => item.value > 0);
  };

  const getPriorityChartData = () => {
    if (!resolutionStats?.by_priority) return [];
    return Object.entries(resolutionStats.by_priority)
      .filter(([_, hours]) => hours > 0)
      .map(([priority, hours]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        hours: parseFloat(hours.toFixed(1)),
      }));
  };

  if (loading) {
    return (
      <div className="p-8" data-testid="reports-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="reports-page">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
          Reports & Analytics
        </h1>
        <p className="text-slate-600 mt-2">Insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200" data-testid="total-resolved-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Resolved</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{resolutionStats?.total_resolved || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Issues completed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="avg-resolution-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Resolution Time</CardTitle>
            <Clock className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {resolutionStats?.average_resolution_hours?.toFixed(1) || 0}h
            </div>
            <p className="text-xs text-slate-500 mt-1">Average hours to resolve</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="top-assignees-count-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Assignees</CardTitle>
            <Award className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{topAssignees.length}</div>
            <p className="text-xs text-slate-500 mt-1">Team members with assignments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200" data-testid="top-assignees-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Top Assignees</CardTitle>
            <CardDescription>Team members by issue count</CardDescription>
          </CardHeader>
          <CardContent>
            {topAssignees.length > 0 ? (
              <div className="space-y-6">
                {topAssignees.map((item, index) => (
                  <div key={item.assignee?.id || index} className="space-y-3" data-testid={`assignee-${index}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                            {item.assignee?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{item.assignee?.username || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{item.assignee?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{item.issue_count}</p>
                        <p className="text-xs text-slate-500">issues</p>
                      </div>
                    </div>
                    <div className="pl-13">
                      <ResponsiveContainer width="100%" height={60}>
                        <PieChart>
                          <Pie
                            data={getStatusData(item.by_status)}
                            cx="50%"
                            cy="50%"
                            innerRadius={15}
                            outerRadius={25}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {getStatusData(item.by_status).map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center space-x-4 text-xs mt-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                          Open: {item.by_status.open || 0}
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-orange-600 rounded-full mr-1"></span>
                          Progress: {item.by_status.in_progress || 0}
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                          Resolved: {item.by_status.resolved || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="resolution-time-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Resolution Time by Priority</CardTitle>
            <CardDescription>Average hours to resolve by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {getPriorityChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getPriorityChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="priority" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="hours" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No resolved issues yet</p>
            )}
            {resolutionStats && getPriorityChartData().length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {Object.entries(resolutionStats.by_priority).map(([priority, hours]) => (
                  hours > 0 && (
                    <div key={priority} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 capitalize">{priority}</p>
                      <p className="text-lg font-semibold text-slate-900">{hours.toFixed(1)}h</p>
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

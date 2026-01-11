import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/App';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS COLORS ---------------- */
  const getStatusColor = (status) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50 border-blue-200',
      in_progress: 'text-orange-600 bg-orange-50 border-orange-200',
      resolved: 'text-green-600 bg-green-50 border-green-200',
      closed: 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return colors[status] || 'text-slate-600 bg-slate-50';
  };

  /* ---------------- PRIORITY COLORS (FIXED) ---------------- */
  const priorityColors = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-blue-600',
    low: 'bg-slate-600',
  };

  if (loading) {
    return (
      <div className="p-8" data-testid="dashboard-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="dashboard-page">
      {/* ---------- HEADER ---------- */}
      <div>
        <h1
          className="text-4xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2">
          Overview of your issue tracking system
        </p>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Issues
            </CardTitle>
            <FileText className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.total_issues || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Open
            </CardTitle>
            <AlertCircle className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.by_status?.open || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
            <Clock className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.by_status?.in_progress || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Resolved
            </CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.by_status?.resolved || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- LOWER SECTION ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRIORITY BREAKDOWN */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle
              className="text-xl font-semibold"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Priority Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.by_priority || {}).map(
                ([priority, count]) => {
                  const p = priority.toLowerCase();
                  return (
                    <div
                      key={priority}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            priorityColors[p] || 'bg-slate-600'
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {priority}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {count}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* RECENT ISSUES */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle
              className="text-xl font-semibold"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recent_issues?.length > 0 ? (
                stats.recent_issues.map((issue) => (
                  <Link
                    key={issue.id}
                    to={`/issues/${issue.id}`}
                    className="block p-4 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {issue.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {issue.creator?.username} •{' '}
                          {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={`ml-2 ${getStatusColor(issue.status)}`}
                        variant="outline"
                      >
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No issues yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

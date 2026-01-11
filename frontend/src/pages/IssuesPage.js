import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/App';
import { Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const response = await api.get('/issues', { params });
      let data = response.data;
      if (filters.search) {
        data = data.filter((issue) =>
          issue.title.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      setIssues(data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50 border-blue-200',
      in_progress: 'text-orange-600 bg-orange-50 border-orange-200',
      resolved: 'text-green-600 bg-green-50 border-green-200',
      closed: 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return colors[status] || 'text-slate-600 bg-slate-50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return colors[priority] || 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="p-8 space-y-6" data-testid="issues-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
            Issues
          </h1>
          <p className="text-slate-600 mt-2">Manage and track all issues</p>
        </div>
        <Link to="/issues/new">
          <Button className="bg-slate-900 hover:bg-slate-800" data-testid="create-issue-button">
            <Plus className="w-4 h-4 mr-2" />
            Create Issue
          </Button>
        </Link>
      </div>

      <Card className="p-6 border-slate-200" data-testid="filters-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search issues..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 bg-white border-slate-200"
              data-testid="search-input"
            />
          </div>
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="bg-white border-slate-200" data-testid="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
            <SelectTrigger className="bg-white border-slate-200" data-testid="priority-filter">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFilters({ status: '', priority: '', search: '' })}
            className="border-slate-200"
            data-testid="clear-filters-button"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        ) : issues.length > 0 ? (
          issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              data-testid={`issue-card-${issue.id}`}
            >
              <Card className="p-6 border-slate-200 card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{issue.title}</h3>
                      <Badge className={getStatusColor(issue.status)} variant="outline">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(issue.priority)} variant="outline">
                        {issue.priority}
                      </Badge>
                    </div>
                    {issue.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{issue.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>Created by {issue.creator?.username || 'Unknown'}</span>
                      {issue.assignee && <span>Assigned to {issue.assignee.username}</span>}
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 border-slate-200 text-center" data-testid="no-issues-message">
            <p className="text-slate-500">No issues found. Create your first issue to get started!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

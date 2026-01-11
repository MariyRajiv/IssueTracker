import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/App';
import { toast } from 'sonner';
import { GitBranch, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BulkOperationsPage() {
  const [issues, setIssues] = useState([]);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [newStatus, setNewStatus] = useState('open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues', { params: { limit: 100 } });
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const toggleIssue = (issueId) => {
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(selectedIssues.filter((id) => id !== issueId));
    } else {
      setSelectedIssues([...selectedIssues, issueId]);
    }
  };

  const toggleAll = () => {
    if (selectedIssues.length === issues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(issues.map((issue) => issue.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIssues.length === 0) {
      toast.error('Please select at least one issue');
      return;
    }

    setLoading(true);
    try {
      await api.post('/issues/bulk-status', {
        issue_ids: selectedIssues,
        status: newStatus,
      });
      toast.success(`Updated ${selectedIssues.length} issue(s)`);
      setSelectedIssues([]);
      fetchIssues();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Bulk update failed');
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

  return (
    <div className="p-8 space-y-6" data-testid="bulk-operations-page">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
          Bulk Operations
        </h1>
        <p className="text-slate-600 mt-2">Update multiple issues at once</p>
      </div>

      <Card className="border-slate-200" data-testid="bulk-update-card">
        <CardHeader>
          <CardTitle>Bulk Status Update</CardTitle>
          <CardDescription>Select issues and update their status in a single transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-white border-slate-200" data-testid="bulk-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <Button
                onClick={handleBulkUpdate}
                disabled={loading || selectedIssues.length === 0}
                className="bg-slate-900 hover:bg-slate-800"
                data-testid="bulk-update-button"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <GitBranch className="w-4 h-4 mr-2" />
                )}
                Update {selectedIssues.length} Issue(s)
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedIssues.length === issues.length && issues.length > 0}
                  onCheckedChange={toggleAll}
                  data-testid="select-all-checkbox"
                />
                <span className="text-sm font-medium text-slate-700">Select All ({issues.length})</span>
              </label>
              <p className="text-sm text-slate-500">{selectedIssues.length} selected</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="issues-list">
              {issues.map((issue) => (
                <label
                  key={issue.id}
                  className="flex items-center space-x-3 p-4 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                  data-testid={`issue-item-${issue.id}`}
                >
                  <Checkbox
                    checked={selectedIssues.includes(issue.id)}
                    onCheckedChange={() => toggleIssue(issue.id)}
                    data-testid={`issue-checkbox-${issue.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{issue.title}</p>
                      <Badge className={getStatusColor(issue.status)} variant="outline">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">#{issue.id} • {issue.priority}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

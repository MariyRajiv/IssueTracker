import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/App';
import { toast } from 'sonner';
import { ArrowLeft, Edit, MessageSquare, Tag, Clock, User, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [labels, setLabels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignee_id: null,
  });

  useEffect(() => {
    fetchIssue();
    fetchTimeline();
    fetchLabels();
    fetchUsers();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await api.get(`/issues/${id}`);
      setIssue(response.data);
      setEditData({
        title: response.data.title,
        description: response.data.description || '',
        status: response.data.status,
        priority: response.data.priority,
        assignee_id: response.data.assignee?.id || null,
      });
      setSelectedLabels(response.data.labels.map(l => l.id));
    } catch (error) {
      toast.error('Failed to fetch issue');
      navigate('/issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/issues/${id}/timeline`);
      setTimeline(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await api.get('/labels');
      setLabels(response.data);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    try {
      await api.post(`/issues/${id}/comments`, { body: commentBody });
      toast.success('Comment added');
      setCommentBody('');
      fetchIssue();
      fetchTimeline();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add comment');
    }
  };

  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/issues/${id}`, { ...editData, version: issue.version });
      toast.success('Issue updated');
      setEditDialogOpen(false);
      fetchIssue();
      fetchTimeline();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update issue');
    }
  };

  const handleUpdateLabels = async () => {
    try {
      await api.put(`/issues/${id}/labels`, selectedLabels);
      toast.success('Labels updated');
      setLabelsDialogOpen(false);
      fetchIssue();
      fetchTimeline();
    } catch (error) {
      toast.error('Failed to update labels');
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

  const getChangeIcon = (changeType) => {
    if (changeType === 'created') return <Calendar className="w-4 h-4" />;
    if (changeType === 'comment_added') return <MessageSquare className="w-4 h-4" />;
    if (changeType === 'labels_updated') return <Tag className="w-4 h-4" />;
    return <Edit className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="p-8" data-testid="loading">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6" data-testid="issue-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/issues">
            <Button variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
              {issue.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Issue #{issue.id}</p>
          </div>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800" data-testid="edit-issue-button">
              <Edit className="w-4 h-4 mr-2" />
              Edit Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Issue</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateIssue} className="space-y-4" data-testid="edit-issue-form">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  required
                  data-testid="edit-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  data-testid="edit-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                    <SelectTrigger data-testid="edit-status-select">
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
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value })}>
                    <SelectTrigger data-testid="edit-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={editData.assignee_id?.toString() || 'none'} onValueChange={(value) => setEditData({ ...editData, assignee_id: value === 'none' ? null : parseInt(value) })}>
                  <SelectTrigger data-testid="edit-assignee-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="cancel-edit-button">
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-issue-button">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200" data-testid="issue-details-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(issue.status)} variant="outline">
                  {issue.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(issue.priority)} variant="outline">
                  {issue.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {issue.description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{issue.description}</p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Created by</p>
                  <p className="font-medium text-slate-900">{issue.creator?.username || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Assigned to</p>
                  <p className="font-medium text-slate-900">{issue.assignee?.username || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Created</p>
                  <p className="font-medium text-slate-900">{new Date(issue.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Last updated</p>
                  <p className="font-medium text-slate-900">{new Date(issue.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200" data-testid="comments-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {issue.comments?.length > 0 ? (
                issue.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-slate-50 rounded-lg" data-testid={`comment-${comment.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">{comment.author?.username || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
              )}
              <form onSubmit={handleAddComment} className="space-y-3" data-testid="add-comment-form">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                  data-testid="comment-textarea"
                />
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="add-comment-button">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200" data-testid="labels-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Labels</CardTitle>
              <Dialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="edit-labels-button">
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Labels</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3" data-testid="labels-dialog">
                    {labels.map((label) => (
                      <label key={label.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLabels.includes(label.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLabels([...selectedLabels, label.id]);
                            } else {
                              setSelectedLabels(selectedLabels.filter((id) => id !== label.id));
                            }
                          }}
                          className="rounded"
                        />
                        <Badge style={{ backgroundColor: label.color }} className="text-white">
                          {label.name}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setLabelsDialogOpen(false)} data-testid="cancel-labels-button">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateLabels} className="bg-slate-900 hover:bg-slate-800" data-testid="save-labels-button">
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {issue.labels?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label) => (
                    <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white">
                      {label.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No labels</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200" data-testid="timeline-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.length > 0 ? (
                  timeline.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3" data-testid={`timeline-item-${item.id}`}>
                      <div className="mt-1 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {getChangeIcon(item.change_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{item.changed_by?.username || 'System'}</span>
                          {' '}
                          {item.change_type === 'created' && 'created this issue'}
                          {item.change_type === 'updated' && `updated ${item.field_name}`}
                          {item.change_type === 'comment_added' && 'added a comment'}
                          {item.change_type === 'labels_updated' && 'updated labels'}
                          {item.change_type === 'bulk_status_update' && 'updated status (bulk)'}
                        </p>
                        {item.field_name && item.old_value && item.new_value && (
                          <p className="text-xs text-slate-500 mt-1">
                            {item.old_value} → {item.new_value}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No history</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

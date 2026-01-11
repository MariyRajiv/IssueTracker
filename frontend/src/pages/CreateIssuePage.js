import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import useLabels from "../hooks/useLabels";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/App';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6b7280');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    assignee_id: null,
    label_ids: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchLabels();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      const response = await api.post('/labels', { name: newLabelName, color: newLabelColor });
      toast.success('Label created');
      setLabels([...labels, response.data]);
      setNewLabelName('');
      setNewLabelColor('#6b7280');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create label');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/issues', formData);
      toast.success('Issue created successfully');
      navigate(`/issues/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId) => {
    if (formData.label_ids.includes(labelId)) {
      setFormData({ ...formData, label_ids: formData.label_ids.filter((id) => id !== labelId) });
    } else {
      setFormData({ ...formData, label_ids: [...formData.label_ids, labelId] });
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="create-issue-page">
      <div className="flex items-center space-x-4">
        <Link to="/issues">
          <Button variant="ghost" size="sm" data-testid="back-to-issues-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
            Create Issue
          </h1>
          <p className="text-slate-600 mt-2">Add a new issue to track</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200" data-testid="create-issue-form-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-issue-form">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    required
                    data-testid="title-input"
                    className="bg-white border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the issue"
                    rows={6}
                    data-testid="description-textarea"
                    className="bg-white border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger id="status" data-testid="status-select" className="bg-white border-slate-200">
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger id="priority" data-testid="priority-select" className="bg-white border-slate-200">
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
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={formData.assignee_id?.toString() || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, assignee_id: value === 'none' ? null : parseInt(value) })}
                  >
                    <SelectTrigger id="assignee" data-testid="assignee-select" className="bg-white border-slate-200">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => navigate('/issues')} data-testid="cancel-button">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={loading} data-testid="create-issue-submit-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Issue
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200" data-testid="labels-section-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold" style={{fontFamily: 'Manrope, sans-serif'}}>Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {labels.length > 0 ? (
                <div className="space-y-2">
                  {labels.map((label) => (
                    <label key={label.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.label_ids.includes(label.id)}
                        onChange={() => toggleLabel(label.id)}
                        className="rounded"
                        data-testid={`label-checkbox-${label.id}`}
                      />
                      <Badge style={{ backgroundColor: label.color }} className="text-white">
                        {label.name}
                      </Badge>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No labels available</p>
              )}

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Create New Label</p>
                <form onSubmit={handleCreateLabel} className="space-y-3" data-testid="create-label-form">
                  <Input
                    placeholder="Label name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    data-testid="new-label-name-input"
                    className="bg-white border-slate-200"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                      data-testid="new-label-color-input"
                    />
                    <Button type="submit" size="sm" variant="outline" className="flex-1" data-testid="create-label-button">
                      Add Label
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

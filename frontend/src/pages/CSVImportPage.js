import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/App';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CSVImportPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/issues/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
      if (response.data.failed === 0) {
        toast.success(`Successfully imported ${response.data.successful} issue(s)`);
      } else {
        toast.warning(`Imported ${response.data.successful} issue(s), ${response.data.failed} failed`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'title,description,status,priority,assignee_email\n' +
      'Sample Issue,This is a sample issue description,open,medium,user@example.com\n' +
      'Bug Report,Critical bug needs fixing,open,high,admin@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'issues_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6" data-testid="csv-import-page">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>
          CSV Import
        </h1>
        <p className="text-slate-600 mt-2">Bulk import issues from CSV file</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200" data-testid="upload-card">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Import multiple issues at once with validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center" data-testid="file-upload-area">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file"
                data-testid="csv-file-input"
              />
              <label
                htmlFor="csv-file"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose CSV File
              </label>
              {file && (
                <p className="text-sm text-slate-600 mt-3" data-testid="selected-file-name">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-slate-900 hover:bg-slate-800"
              data-testid="upload-button"
            >
              {loading ? 'Importing...' : 'Upload and Import'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="instructions-card">
          <CardHeader>
            <CardTitle>CSV Format Instructions</CardTitle>
            <CardDescription>Required columns and data format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Required Columns:</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">title</span>
                  <span>Issue title (required)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">description</span>
                  <span>Detailed description (optional)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">status</span>
                  <span>open, in_progress, resolved, or closed</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">priority</span>
                  <span>low, medium, high, or critical</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">assignee_email</span>
                  <span>Email of assignee (optional)</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
              data-testid="download-template-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className="border-slate-200" data-testid="import-result-card">
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Total Rows</p>
                </div>
                <p className="text-2xl font-bold text-blue-600" data-testid="total-rows">{result.total_rows}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Successful</p>
                </div>
                <p className="text-2xl font-bold text-green-600" data-testid="successful-imports">{result.successful}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-medium text-red-900">Failed</p>
                </div>
                <p className="text-2xl font-bold text-red-600" data-testid="failed-imports">{result.failed}</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Errors</h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="error-list">
                  {result.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md" data-testid={`error-${index}`}>
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                          Row {error.row}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-900 font-medium">{error.error}</p>
                      {error.data && (
                        <p className="text-xs text-red-700 mt-1">
                          Data: {JSON.stringify(error.data)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

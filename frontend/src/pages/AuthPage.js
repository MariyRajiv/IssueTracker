import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/App';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', loginData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', registerData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" data-testid="auth-page">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>IssueTracker</CardTitle>
          <CardDescription className="text-base">Manage your issues efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 font-medium"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="johndoe"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                    data-testid="register-username-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Full Name</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    data-testid="register-fullname-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="register-password-input"
                    className="bg-white border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 font-medium"
                  disabled={loading}
                  data-testid="register-submit-button"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

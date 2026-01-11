import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, BarChart3, GitBranch, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/issues', icon: FileText, label: 'Issues' },
    { path: '/bulk-operations', icon: GitBranch, label: 'Bulk Operations' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/import', icon: Upload, label: 'CSV Import' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{fontFamily: 'Manrope, sans-serif'}}>IssueTracker</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1" data-testid="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-3 mb-2">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

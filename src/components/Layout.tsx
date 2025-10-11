import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, Activity } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  role: string;
}

export function Layout({ children, title, role }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentRole');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">HealthStream</h1>
                <p className="text-sm text-muted-foreground capitalize">{role} Portal</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">{title}</h2>
        {children}
      </main>
    </div>
  );
}

import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Activity, ArrowLeft, LayoutDashboard, Stethoscope, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const nav = [
  { to: '/healthtrends', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/healthtrends/pe-encoding', label: 'PE Encoding', icon: Stethoscope },
];

export function HealthTrendsLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            <div>
              <p className="font-semibold text-sm leading-tight">HealthTrends</p>
              <p className="text-xs text-muted-foreground">Mobile Clinic APE</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active =
              to === '/healthtrends'
                ? location.pathname === '/healthtrends'
                : location.pathname.startsWith('/healthtrends/pe-encoding') ||
                  location.pathname.startsWith('/healthtrends/pe/');
            return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/?tab=registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              APE workspace
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border bg-background/80 backdrop-blur flex items-center px-4 shrink-0">
          <h1 className="text-sm font-medium text-muted-foreground">Encoder workspace</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

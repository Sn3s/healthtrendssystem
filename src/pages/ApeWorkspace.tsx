import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { HealthTrendsMark } from '@/components/HealthTrendsMark';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import HealthTrendsDashboard from '@/pages/healthtrends/Dashboard';
import PEEncoding from '@/pages/healthtrends/PEEncoding';
import Admin from '@/pages/Admin';

export type ApeTabId = 'registry' | 'pe-encoding' | 'admin';

const TAB_CONFIG: { id: ApeTabId; label: string; roles: string[] }[] = [
  { id: 'registry', label: 'Registry', roles: ['encoder', 'admin'] },
  { id: 'pe-encoding', label: 'PE encoding', roles: ['encoder', 'admin'] },
  { id: 'admin', label: 'Admin', roles: ['admin'] },
];

function visibleTabsForRoles(userRoles: string[]) {
  return TAB_CONFIG.filter((t) => t.roles.some((r) => userRoles.includes(r)));
}

export default function ApeWorkspace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, userRoles, signOut } = useAuth();

  const visible = useMemo(() => visibleTabsForRoles(userRoles), [userRoles]);
  const tabParam = searchParams.get('tab') as ApeTabId | null;

  const activeTab = useMemo(() => {
    if (tabParam && visible.some((t) => t.id === tabParam)) return tabParam;
    return visible[0]?.id ?? 'registry';
  }, [tabParam, visible]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading || !user || visible.length === 0) return;
    if (!tabParam || !visible.some((t) => t.id === tabParam)) {
      setSearchParams({ tab: visible[0].id }, { replace: true });
    }
  }, [authLoading, user, tabParam, visible, setSearchParams]);

  /** Doctor/patient portals are separate routes — not APE tabs. */
  useEffect(() => {
    if (authLoading || !user || visible.length > 0) return;
    if (userRoles.includes('doctor')) {
      navigate('/doctor', { replace: true });
      return;
    }
    if (userRoles.includes('patient')) {
      navigate('/patient', { replace: true });
    }
  }, [authLoading, user, visible.length, userRoles, navigate]);

  const onTabChange = (v: string) => {
    setSearchParams({ tab: v }, { replace: true });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Your account has no workspace access yet. Ask an administrator to assign a role.
        </p>
        <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate('/auth'))}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <HealthTrendsMark className="h-8 w-8" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight truncate">APE workspace</h1>
              <p className="text-xs text-muted-foreground">Mobile clinic · HealthTrends</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b border-border bg-background px-2 md:px-4 overflow-x-auto">
          <TabsList className="h-auto w-full min-w-max justify-start gap-0.5 bg-transparent p-1 rounded-none flex-wrap">
            {visible.map(({ id, label }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {activeTab === 'registry' && <HealthTrendsDashboard embedded />}
          {activeTab === 'pe-encoding' && <PEEncoding embedded />}
          {activeTab === 'admin' && <Admin embedded />}
        </div>
      </Tabs>
    </div>
  );
}

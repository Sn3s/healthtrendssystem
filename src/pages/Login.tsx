import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/hospital';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Stethoscope, User, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const roles: Array<{ role: UserRole; label: string; icon: any; description: string }> = [
  { role: 'encoder', label: 'Encoder', icon: Users, description: 'Patient registration & service assignment' },
  { role: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'Provider console & charting' },
  { role: 'patient', label: 'Patient', icon: User, description: 'View results & visit history' },
  { role: 'admin', label: 'Admin', icon: BarChart3, description: 'Analytics & system management' },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, userRoles } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    navigate(`/${role}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">HealthStream</h1>
          <p className="text-muted-foreground text-lg">Multi-Role Hospital Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(({ role, label, icon: Icon, description }) => {
            const hasRole = userRoles.includes(role);
            
            return (
              <Card
                key={role}
                className={`p-6 transition-all duration-300 ${
                  hasRole 
                    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasRole && handleRoleSelect(role)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{label}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  {hasRole ? (
                    <Button className="w-full">
                      Continue as {label}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Access Not Granted
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

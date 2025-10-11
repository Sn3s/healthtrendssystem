import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/hospital';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Stethoscope, User, BarChart3, Activity } from 'lucide-react';

const roles: Array<{ role: UserRole; label: string; icon: any; description: string }> = [
  { role: 'encoder', label: 'Encoder', icon: Users, description: 'Patient registration & service assignment' },
  { role: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'Provider console & charting' },
  { role: 'patient', label: 'Patient', icon: User, description: 'View results & visit history' },
  { role: 'admin', label: 'Admin', icon: BarChart3, description: 'Analytics & system management' },
];

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setTimeout(() => {
      localStorage.setItem('currentRole', role);
      navigate(`/${role}`);
    }, 300);
  };

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
          {roles.map(({ role, label, icon: Icon, description }) => (
            <Card
              key={role}
              className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                selectedRole === role ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={() => handleRoleSelect(role)}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button className="w-full" variant={selectedRole === role ? 'default' : 'outline'}>
                  Continue as {label}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

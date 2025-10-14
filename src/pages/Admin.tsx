import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from '@/components/Modal';
import { Users, Calendar, CheckCircle, Clock, Trash2, TrendingUp, UserCog, Settings, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserManagement } from '@/components/admin/UserManagement';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userRoles.includes('admin')) {
        navigate('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, userRoles, navigate]);

  const loadData = async () => {
    try {
      const [patientsRes, visitsRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('visits').select('*')
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (visitsRes.error) throw visitsRes.error;

      setPatients(patientsRes.data || []);
      setVisits(visitsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await supabase.from('departmental_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('visits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setPatients([]);
      setVisits([]);
      setShowResetModal(false);
      
      toast({
        title: "Data Reset Complete",
        description: "All data has been cleared",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const completedVisits = visits.filter(v => v.status === 'completed');
  const pendingVisits = visits.filter(v => v.status !== 'completed');

  const diagnosisCount = completedVisits.reduce((acc, visit) => {
    if (visit.final_diagnosis) {
      acc[visit.final_diagnosis] = (acc[visit.final_diagnosis] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topDiagnoses = Object.entries(diagnosisCount)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  const departmentStats = visits.reduce((acc, visit) => {
    acc[visit.department] = (acc[visit.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartments = Object.entries(departmentStats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout title="Admin Dashboard" role="admin">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{patients.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 text-secondary" />
                <span className="text-3xl font-bold">{visits.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 text-accent" />
                <span className="text-3xl font-bold">{completedVisits.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Completed Visits</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
                <span className="text-3xl font-bold">{pendingVisits.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Pending Visits</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Top 10 Diagnoses
            </h3>
            
            {topDiagnoses.length > 0 ? (
              <div className="space-y-3">
                {topDiagnoses.map(([diagnosis, count], index) => (
                  <div key={diagnosis} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium">{diagnosis}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count as number} case{(count as number) > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No completed diagnoses yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Top Departments by Visit Volume
            </h3>
            
            <div className="space-y-3">
              {topDepartments.map(([department, count]) => (
                <div key={department} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{department}</span>
                    <span className="text-muted-foreground">{count as number} visits</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((count as number) / visits.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">System Management</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Reset all data in the database. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowResetModal(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm Data Reset"
        onConfirm={handleReset}
        confirmText="Reset All Data"
        variant="danger"
      >
        <p>Are you sure you want to clear all data? This will permanently delete:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>{patients.length} patients</li>
          <li>{visits.length} visits</li>
          <li>All departmental logs and diagnoses</li>
        </ul>
        <p className="mt-3 font-semibold text-destructive">This action cannot be undone!</p>
      </Modal>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, CreditCard, Trash2, CheckCircle, XCircle, Search, Crown, ArrowLeft, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  activity_level: string | null;
  location: string | null;
  medical_conditions: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  amount: number | null;
  payment_method: string | null;
  transaction_id: string | null;
  contact_number: string | null;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  billing_cycle: string | null;
}

interface FamilyMember {
  id: string;
  owner_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  medical_conditions: string | null;
  relationship: string;
  avatar_emoji: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'family'>('users');
  const [assignPlanDialog, setAssignPlanDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [selectedBilling, setSelectedBilling] = useState<string>('monthly');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (data) {
      setIsAdmin(true);
      fetchData();
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const fetchData = async () => {
    const [profilesRes, subsRes, familyRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('family_members').select('*').order('created_at', { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (subsRes.data) setSubscriptions(subsRes.data as Subscription[]);
    if (familyRes.data) setFamilyMembers(familyRes.data as FamilyMember[]);
  };

  const notifyUser = async (userId: string, title: string, message: string, type = 'info') => {
    await supabase.from('notifications').insert({ user_id: userId, title, message, type } as any);
  };

  const assignPlan = async (userId: string, planType: string) => {
    await supabase
      .from('subscriptions')
      .update({ status: 'inactive' } as any)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (planType === 'free') {
      await notifyUser(userId, '📋 Plan Updated', 'Your subscription has been set to the Free plan by admin.');
      toast.success('User set to free plan');
      setAssignPlanDialog({ open: false, userId: '', userName: '' });
      fetchData();
      return;
    }

    const now = new Date();
    const expires = new Date(now);
    if (selectedBilling === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    const monthlyPrice = planType === 'pro' ? 199 : 399;
    const amount = selectedBilling === 'yearly' ? monthlyPrice * 10 : monthlyPrice; // 2 months free on yearly

    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_type: planType,
      status: 'active',
      amount,
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_method: 'admin',
      billing_cycle: selectedBilling,
    } as any);

    const planLabel = planType === 'pro' ? 'Niramoy Pro' : 'Niramoy AI+';
    const cycleLabel = selectedBilling === 'yearly' ? ' (Yearly)' : ' (Monthly)';
    await notifyUser(userId, '🎉 Plan Activated!', `You have been upgraded to ${planLabel}${cycleLabel}! Enjoy your premium features.`, 'success');
    toast.success(`Plan assigned: ${planType} (${selectedBilling})`);
    setAssignPlanDialog({ open: false, userId: '', userName: '' });
    fetchData();
  };

  const approvePayment = async (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    const now = new Date();
    const expires = new Date(now);
    if (sub.billing_cycle === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expires.toISOString(),
      } as any)
      .eq('id', subId);

    const planLabel = sub.plan_type === 'pro' ? 'Niramoy Pro' : 'Niramoy AI+';
    await notifyUser(sub.user_id, '✅ Payment Approved!', `Your payment for ${planLabel} has been approved. Your subscription is now active!`, 'success');
    toast.success('Payment approved');
    fetchData();
  };

  const rejectPayment = async (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    await supabase
      .from('subscriptions')
      .update({ status: 'rejected' } as any)
      .eq('id', subId);

    if (sub) {
      await notifyUser(sub.user_id, '❌ Payment Rejected', 'Your payment could not be verified. Please try again or contact support.', 'error');
    }
    toast.success('Payment rejected');
    fetchData();
  };

  const removeFromPlan = async (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    await supabase
      .from('subscriptions')
      .update({ status: 'inactive' } as any)
      .eq('id', subId);

    if (sub) {
      await notifyUser(sub.user_id, '📋 Plan Removed', 'Your subscription plan has been deactivated by admin.', 'warning');
    }
    toast.success('Subscription deactivated');
    fetchData();
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (res.error) throw res.error;
      toast.success('User account deleted');
      setDeleteDialog({ open: false, userId: '', userName: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const getUserSub = (userId: string) => {
    return subscriptions.find(s => s.user_id === userId && s.status === 'active');
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  const pendingPayments = subscriptions.filter(s => s.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You do not have admin privileges.</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" /> {profiles.length} Users
            </Badge>
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <CreditCard className="h-3 w-3" /> {pendingPayments.length} Pending
            </Badge>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="gap-2"
          >
            <Users className="h-4 w-4" /> All Users
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('payments')}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" /> Payment Requests
            {pendingPayments.length > 0 && (
              <Badge className="bg-amber-500 text-white ml-1">{pendingPayments.length}</Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'family' ? 'default' : 'outline'}
            onClick={() => setActiveTab('family')}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" /> Family Members
            <Badge variant="secondary" className="ml-1">{familyMembers.length}</Badge>
          </Button>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map(profile => {
                      const activeSub = getUserSub(profile.user_id);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell className="text-xs">{profile.email}</TableCell>
                          <TableCell className="text-xs">{profile.phone || '—'}</TableCell>
                          <TableCell className="text-xs">
                            {profile.age || '—'} / {profile.gender || '—'}
                          </TableCell>
                          <TableCell className="text-xs">{profile.location || '—'}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <Badge variant={activeSub ? 'default' : 'secondary'} className="text-xs">
                                {activeSub ? activeSub.plan_type : 'free'}
                              </Badge>
                              {activeSub?.billing_cycle && (
                                <p className="text-[10px] text-muted-foreground">{activeSub.billing_cycle}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                                onClick={() => setAssignPlanDialog({ open: true, userId: profile.user_id, userName: profile.name })}
                              >
                                <Crown className="h-3 w-3" /> Plan
                              </Button>
                              {activeSub && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1 text-amber-600"
                                  onClick={() => removeFromPlan(activeSub.id)}
                                >
                                  <XCircle className="h-3 w-3" /> Remove
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-7 gap-1"
                                onClick={() => setDeleteDialog({ open: true, userId: profile.user_id, userName: profile.name })}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredProfiles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Payment Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>TxID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map(sub => {
                    const profile = profiles.find(p => p.user_id === sub.user_id);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{profile?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge>{sub.plan_type}</Badge>
                        </TableCell>
                        <TableCell>৳{sub.amount}</TableCell>
                        <TableCell className="text-xs capitalize">{sub.billing_cycle || 'monthly'}</TableCell>
                        <TableCell className="capitalize">{sub.payment_method || '—'}</TableCell>
                        <TableCell className="text-xs font-mono">{sub.transaction_id || '—'}</TableCell>
                        <TableCell className="text-xs">{sub.contact_number || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700"
                              onClick={() => approvePayment(sub.id)}
                            >
                              <CheckCircle className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7 gap-1"
                              onClick={() => rejectPayment(sub.id)}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pendingPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No pending payments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'family' && (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search family members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Weight/Height</TableHead>
                      <TableHead>Medical Conditions</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers
                      .filter(fm => {
                        const owner = profiles.find(p => p.user_id === fm.owner_id);
                        const q = search.toLowerCase();
                        return fm.name.toLowerCase().includes(q) ||
                          (owner?.name || '').toLowerCase().includes(q) ||
                          (owner?.email || '').toLowerCase().includes(q);
                      })
                      .map(fm => {
                        const owner = profiles.find(p => p.user_id === fm.owner_id);
                        return (
                          <TableRow key={fm.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{fm.avatar_emoji}</span>
                                {fm.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div>{owner?.name || 'Unknown'}</div>
                              <div className="text-muted-foreground">{owner?.email || ''}</div>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{fm.relationship}</TableCell>
                            <TableCell className="text-xs">
                              {fm.age || '—'} / {fm.gender || '—'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fm.weight ? `${fm.weight}kg` : '—'} / {fm.height ? `${fm.height}cm` : '—'}
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px]">
                              {fm.medical_conditions || '—'}
                            </TableCell>
                            <TableCell className="text-xs capitalize">{fm.activity_level || '—'}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(fm.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {familyMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No family members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Assign Plan Dialog */}
      <Dialog open={assignPlanDialog.open} onOpenChange={open => setAssignPlanDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan to {assignPlanDialog.userName}</DialogTitle>
            <DialogDescription>Select a plan and billing cycle to assign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Plan</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Basic Care (Free)</SelectItem>
                  <SelectItem value="pro">Niramoy Pro</SelectItem>
                  <SelectItem value="premium">Niramoy AI+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPlan !== 'free' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Billing Cycle</label>
                <Select value={selectedBilling} onValueChange={setSelectedBilling}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly (2 months free)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPlan === 'pro' 
                    ? selectedBilling === 'yearly' ? '৳1,990/year (save ৳398)' : '৳199/month'
                    : selectedBilling === 'yearly' ? '৳3,990/year (save ৳798)' : '৳399/month'
                  }
                </p>
              </div>
            )}
            <Button className="w-full" onClick={() => assignPlan(assignPlanDialog.userId, selectedPlan)}>
              Assign Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deleteDialog.userName}</strong>'s account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, userId: '', userName: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteUser(deleteDialog.userId)}>
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

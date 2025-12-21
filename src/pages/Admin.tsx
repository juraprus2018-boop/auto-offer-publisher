import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  TrendingUp,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAwinSettings, useSyncLogs, useTriggerSync, useProductStats } from '@/hooks/useAdmin';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useAwinSettings();
  const { data: syncLogs, isLoading: logsLoading } = useSyncLogs(5);
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const triggerSync = useTriggerSync();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSync = async () => {
    try {
      await triggerSync.mutateAsync();
      toast({
        title: 'Sync gestart',
        description: 'De producten worden nu gesynchroniseerd.',
      });
    } catch (error) {
      toast({
        title: 'Sync mislukt',
        description: 'Er is een fout opgetreden. Controleer de Awin API instellingen.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Uitgelogd',
      description: 'Je bent succesvol uitgelogd.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'started':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Voltooid</Badge>;
      case 'failed':
        return <Badge variant="destructive">Mislukt</Badge>;
      case 'started':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Bezig...</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-sm">
                  Ingelogd als {user.email}
                </p>
                {isAdmin && (
                  <Badge className="bg-primary/10 text-primary text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSync}
              disabled={triggerSync.isPending || !isAdmin}
              className="gap-2"
            >
              {triggerSync.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Nu
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Uitloggen
            </Button>
          </div>
        </div>

        {!isAdmin && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">
                Je hebt geen admin rechten. Neem contact op met de beheerder om toegang te krijgen.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Producten</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.totalProducts.toLocaleString('nl-NL')}
              </div>
              <p className="text-xs text-muted-foreground">Actieve deals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uitgelichte Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.featuredProducts}
              </div>
              <p className="text-xs text-muted-foreground">Top deals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adverteerders</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.advertisersCount}
              </div>
              <p className="text-xs text-muted-foreground">Actieve webshops</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Laatste Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {settingsLoading
                  ? '...'
                  : settings?.last_sync_at
                  ? formatDate(settings.last_sync_at)
                  : 'Nooit'}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings?.sync_enabled ? 'Auto-sync aan' : 'Auto-sync uit'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Awin Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Awin Instellingen
              </CardTitle>
              <CardDescription>
                Configureer de Awin API koppeling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">API Status</span>
                {settings?.api_key_configured ? (
                  <Badge className="bg-success/10 text-success">Geconfigureerd</Badge>
                ) : (
                  <Badge variant="destructive">Niet geconfigureerd</Badge>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Publisher ID</span>
                <span className="text-sm font-medium">
                  {settings?.publisher_id || 'Niet ingesteld'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Sync Interval</span>
                <span className="text-sm font-medium">
                  Elke {settings?.sync_interval_hours || 24} uur
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">SEO Titel Template</span>
                <span className="text-sm font-medium text-right max-w-[200px] truncate">
                  {settings?.seo_title_template || 'Standaard'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sync History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Geschiedenis
              </CardTitle>
              <CardDescription>
                Recente synchronisaties
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <p className="text-sm text-muted-foreground">Laden...</p>
              ) : syncLogs && syncLogs.length > 0 ? (
                <div className="space-y-4">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                              {log.sync_type} sync
                            </span>
                            {getStatusBadge(log.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(log.started_at)}
                          </p>
                          {log.status === 'completed' && (
                            <p className="text-xs text-muted-foreground">
                              +{log.products_added} nieuw, {log.products_updated} bijgewerkt
                            </p>
                          )}
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nog geen synchronisaties uitgevoerd.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;

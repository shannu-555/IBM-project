import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Link as LinkIcon, Unlink, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { QuickMessageGenerator } from "@/components/QuickMessageGenerator";
import { MetricsDisplay } from "@/components/MetricsDisplay";
import { MessageHistory } from "@/components/MessageHistory";
import { EmailTemplates } from "@/components/EmailTemplates";
import { supabase } from "@/integrations/supabase/client";

interface IntegrationStatus {
  credentials: 'valid' | 'invalid' | 'checking';
  authentication: 'success' | 'failed' | 'checking';
  fetching: 'working' | 'failed' | 'idle';
  replyGeneration: 'active' | 'inactive' | 'checking';
}

const Email = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState<IntegrationStatus>({
    credentials: 'checking',
    authentication: 'checking',
    fetching: 'idle',
    replyGeneration: 'inactive'
  });

  useEffect(() => {
    checkConnection();
  }, []);

  // Real-time polling for new emails when connected
  useEffect(() => {
    if (!isConnected) return;

    const pollEmails = async () => {
      try {
        await supabase.functions.invoke('gmail-webhook');
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll every 5 minutes
    const intervalId = setInterval(pollEmails, 300000);

    return () => clearInterval(intervalId);
  }, [isConnected]);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const savedState = localStorage.getItem('gmail_connected');
        setIsConnected(savedState === 'true');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus(prev => ({ ...prev, credentials: 'checking', authentication: 'checking' }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in first");
        setStatus(prev => ({ ...prev, credentials: 'invalid', authentication: 'failed' }));
        return;
      }

      // Test Gmail connection by fetching emails
      setStatus(prev => ({ ...prev, credentials: 'valid', authentication: 'success', fetching: 'working' }));
      
      const { data, error } = await supabase.functions.invoke('gmail-webhook');
      
      if (error) {
        throw error;
      }

      // Store connection state
      localStorage.setItem('gmail_connected', 'true');
      setIsConnected(true);
      setStatus(prev => ({ ...prev, replyGeneration: 'active', fetching: 'working' }));
      toast.success(`Gmail connected successfully! Fetched ${data.processed || 0} emails.`);
      
    } catch (error: any) {
      console.error('Connection error:', error);
      setStatus(prev => ({ 
        ...prev, 
        credentials: 'invalid', 
        authentication: 'failed',
        fetching: 'failed'
      }));
      toast.error(`Failed to connect Gmail: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
      setStatus(prev => ({ ...prev, fetching: 'idle' }));
    }
  };

  const fetchEmails = async () => {
    setIsFetching(true);
    setStatus(prev => ({ ...prev, fetching: 'working' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('gmail-webhook');
      
      if (error) throw error;
      
      setStatus(prev => ({ ...prev, replyGeneration: 'active' }));
      toast.success(`Fetched ${data.processed || 0} new emails successfully`);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setStatus(prev => ({ ...prev, fetching: 'failed' }));
      toast.error(`Failed to fetch emails: ${error.message || 'Unknown error'}`);
    } finally {
      setIsFetching(false);
      setStatus(prev => ({ ...prev, fetching: 'idle' }));
    }
  };

  const handleDisconnect = () => {
    localStorage.setItem('gmail_connected', 'false');
    setIsConnected(false);
    setStatus({
      credentials: 'checking',
      authentication: 'checking',
      fetching: 'idle',
      replyGeneration: 'inactive'
    });
    toast.info("Gmail disconnected");
  };

  const StatusIcon = ({ status }: { status: 'valid' | 'success' | 'working' | 'active' | 'invalid' | 'failed' | 'checking' | 'inactive' | 'idle' }) => {
    if (status === 'checking') return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
    if (['valid', 'success', 'working', 'active'].includes(status)) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (['invalid', 'failed'].includes(status)) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Integration</h2>
          <p className="text-muted-foreground">
            Connect Gmail to auto-reply with AI-generated responses
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="h-6">
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Manage your Gmail connection via OAuth2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Gmail</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to authorize Gmail access. You'll need:
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto mb-6 space-y-2">
                  <li>• Gmail Client ID</li>
                  <li>• Gmail Client Secret</li>
                  <li>• OAuth2 Redirect URI</li>
                  <li>• Refresh Token</li>
                </ul>
                <Button onClick={handleConnect} size="lg" className="gap-2" disabled={isConnecting}>
                  <LinkIcon className="h-4 w-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Gmail'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Gmail Connected</h3>
                      <p className="text-sm text-muted-foreground">Monitoring for new emails</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchEmails} disabled={isFetching} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                      {isFetching ? 'Fetching...' : 'Fetch Emails'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
                      <Unlink className="h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Gmail Integration Status Panel */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status.credentials} />
                    <div className="text-xs">
                      <p className="font-medium">Credentials</p>
                      <p className="text-muted-foreground capitalize">{status.credentials}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status.authentication} />
                    <div className="text-xs">
                      <p className="font-medium">Authentication</p>
                      <p className="text-muted-foreground capitalize">{status.authentication}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status.fetching} />
                    <div className="text-xs">
                      <p className="font-medium">Fetching Emails</p>
                      <p className="text-muted-foreground capitalize">{status.fetching}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status.replyGeneration} />
                    <div className="text-xs">
                      <p className="font-medium">Reply Generation</p>
                      <p className="text-muted-foreground capitalize">{status.replyGeneration}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <QuickMessageGenerator platform="email" />
                <MetricsDisplay platform="email" />
              </div>

              <EmailTemplates />

              <MessageHistory platform="email" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Email;

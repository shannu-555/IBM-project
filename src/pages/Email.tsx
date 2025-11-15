import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Link as LinkIcon, Unlink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { QuickMessageGenerator } from "@/components/QuickMessageGenerator";
import { MetricsDisplay } from "@/components/MetricsDisplay";
import { MessageHistory } from "@/components/MessageHistory";
import { supabase } from "@/integrations/supabase/client";

const Email = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      // Store connection state
      localStorage.setItem('gmail_connected', 'true');
      setIsConnected(true);
      toast.success("Gmail connected successfully");
      
      // Fetch initial emails
      await fetchEmails();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error("Failed to connect Gmail");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchEmails = async () => {
    setIsFetching(true);
    try {
      const { error } = await supabase.functions.invoke('gmail-webhook');
      
      if (error) throw error;
      
      toast.success("Emails fetched successfully");
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error("Failed to fetch emails");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.setItem('gmail_connected', 'false');
    setIsConnected(false);
    toast.info("Gmail disconnected");
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
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <QuickMessageGenerator platform="email" />
                <MetricsDisplay platform="email" />
              </div>

              <MessageHistory platform="email" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Email;

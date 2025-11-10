import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Link as LinkIcon, Unlink } from "lucide-react";
import { toast } from "sonner";

const Email = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    // This will be implemented with actual Gmail API integration
    toast.success("Gmail connection will be set up with Gmail API");
    setIsConnected(true);
  };

  const handleDisconnect = () => {
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
                <Button onClick={handleConnect} size="lg" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Connect Gmail
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
                  <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inbox Messages</CardTitle>
                  <CardDescription>
                    New emails will appear here with AI-generated reply options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">No emails yet. Send an email to your connected account to test!</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Email;

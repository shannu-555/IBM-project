import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Link as LinkIcon, Unlink } from "lucide-react";
import { toast } from "sonner";

const WhatsApp = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    // This will be implemented with actual Twilio integration
    toast.success("WhatsApp connection will be set up with Twilio API");
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast.info("WhatsApp disconnected");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h2>
          <p className="text-muted-foreground">
            Connect your WhatsApp via Twilio to receive and reply to messages
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="h-6">
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Manage your WhatsApp connection powered by Twilio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to connect your Twilio WhatsApp account. You'll need:
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto mb-6 space-y-2">
                  <li>• Twilio Account SID</li>
                  <li>• Twilio Auth Token</li>
                  <li>• WhatsApp-enabled Twilio number</li>
                </ul>
                <Button onClick={handleConnect} size="lg" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Connect WhatsApp
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">WhatsApp Connected</h3>
                      <p className="text-sm text-muted-foreground">Ready to receive messages</p>
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
                  <CardTitle className="text-lg">Real-Time Messages</CardTitle>
                  <CardDescription>
                    Messages will appear here automatically with AI-generated replies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">No messages yet. Send a message to your Twilio number to test!</p>
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

export default WhatsApp;

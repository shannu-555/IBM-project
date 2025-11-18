import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Check, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Reply {
  id: string;
  tone: string;
  content: string;
  confidence: number;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  created_at: string;
  replies: Reply[];
}

interface MessageHistoryProps {
  platform: 'whatsapp' | 'email';
}

export const MessageHistory = ({ platform }: MessageHistoryProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingForMessage, setGeneratingForMessage] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${platform}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `platform=eq.${platform}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [platform]);

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          replies (*)
        `)
        .eq('platform', platform)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success("Message deleted successfully");
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error("Failed to delete message");
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleGenerate = async (messageId: string, messageContent: string) => {
    setGeneratingForMessage(messageId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-replies', {
        body: { 
          message: messageContent,
          messageId: messageId,
          platform: platform
        }
      });

      if (error) throw error;

      toast.success("AI replies generated!");
      fetchMessages(); // Refresh to show new replies
    } catch (error) {
      console.error('Error generating replies:', error);
      toast.error("Failed to generate replies");
    } finally {
      setGeneratingForMessage(null);
    }
  };

  const handleSendReply = async (replyContent: string, replyId: string, messageSender: string) => {
    if (platform !== 'whatsapp') {
      toast.error("Send feature only available for WhatsApp");
      return;
    }

    setSendingReply(replyId);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reply', {
        body: { 
          to: messageSender,
          body: replyContent 
        }
      });

      if (error) throw error;

      // Update reply as sent in database
      await supabase
        .from('replies')
        .update({ is_sent: true })
        .eq('id', replyId);

      toast.success("Reply sent via WhatsApp!");
      fetchMessages(); // Refresh to show updated status
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            Messages and AI-generated replies will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm">No messages yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message History</CardTitle>
        <CardDescription>
          Recent messages with AI-generated replies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{message.sender}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium">{message.content}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(message.id, message.content)}
                  disabled={generatingForMessage === message.id}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {generatingForMessage === message.id ? 'Generating...' : 'Generate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {message.replies.length > 0 && (
              <div className="space-y-2 mt-3 pl-4 border-l-2">
                <p className="text-xs font-semibold text-muted-foreground">AI Replies:</p>
                {message.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50">
                    <div className="flex-1 space-y-1">
                      <Badge variant="secondary" className="text-xs">{reply.tone}</Badge>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                    <div className="flex gap-2">
                      {platform === 'whatsapp' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendReply(reply.content, reply.id, message.sender)}
                          disabled={sendingReply === reply.id}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {sendingReply === reply.id ? 'Sending...' : 'Send Reply'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(reply.content, reply.id)}
                      >
                        {copiedId === reply.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
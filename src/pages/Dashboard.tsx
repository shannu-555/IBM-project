import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivityItem {
  id: string;
  sender: string;
  content: string;
  platform: string;
  created_at: string;
}

const Dashboard = () => {
  const [whatsappCount, setWhatsappCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [aiResponsesCount, setAiResponsesCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time listeners
    const messagesChannel = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessageCounts();
          fetchRecentActivity();
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel('dashboard-replies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'replies' },
        () => {
          fetchRepliesCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchMessageCounts(),
      fetchRepliesCounts(),
      fetchRecentActivity()
    ]);
  };

  const fetchMessageCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Count WhatsApp messages
    const { count: waCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('platform', 'whatsapp');
    
    setWhatsappCount(waCount || 0);

    // Count Email messages
    const { count: emCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('platform', 'email');
    
    setEmailCount(emCount || 0);
  };

  const fetchRepliesCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's message IDs first
    const { data: userMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', user.id);

    if (!userMessages || userMessages.length === 0) {
      setAiResponsesCount(0);
      setSuccessRate(0);
      return;
    }

    const messageIds = userMessages.map(m => m.id);

    // Count total AI responses
    const { count: totalReplies } = await supabase
      .from('replies')
      .select('*', { count: 'exact', head: true })
      .in('message_id', messageIds);

    setAiResponsesCount(totalReplies || 0);

    // Count sent replies for success rate
    const { count: sentReplies } = await supabase
      .from('replies')
      .select('*', { count: 'exact', head: true })
      .in('message_id', messageIds)
      .eq('is_sent', true);

    const rate = totalReplies && totalReplies > 0 
      ? Math.round((sentReplies || 0) / totalReplies * 100) 
      : 0;
    setSuccessRate(rate);
  };

  const fetchRecentActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('id, sender, content, platform, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentActivity(data || []);
  };

  const stats = [
    {
      title: "WhatsApp Messages",
      value: whatsappCount.toString(),
      description: whatsappCount > 0 ? "Total messages received" : "Connect WhatsApp to start",
      icon: MessageSquare,
      gradient: "from-primary to-blue-500",
    },
    {
      title: "Email Replies",
      value: emailCount.toString(),
      description: emailCount > 0 ? "Total emails received" : "Connect Gmail to start",
      icon: Mail,
      gradient: "from-accent to-green-500",
    },
    {
      title: "AI Responses",
      value: aiResponsesCount.toString(),
      description: "Generated this month",
      icon: Zap,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: "Replies sent successfully",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your smart auto-reply system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with SmartReply in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Connect WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Link your Twilio account to receive messages
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Connect Email</p>
                <p className="text-sm text-muted-foreground">
                  Authorize Gmail to process emails
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Start Replying</p>
                <p className="text-sm text-muted-foreground">
                  AI will generate smart replies automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">No activity yet. Connect your accounts to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      item.platform === 'whatsapp' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {item.platform === 'whatsapp' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.sender}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

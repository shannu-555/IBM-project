import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Zap, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "WhatsApp Messages",
      value: "0",
      description: "Connect WhatsApp to start",
      icon: MessageSquare,
      gradient: "from-primary to-blue-500",
    },
    {
      title: "Email Replies",
      value: "0",
      description: "Connect Gmail to start",
      icon: Mail,
      gradient: "from-accent to-green-500",
    },
    {
      title: "AI Responses",
      value: "0",
      description: "Generated this month",
      icon: Zap,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Success Rate",
      value: "0%",
      description: "Avg. response quality",
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
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p className="text-sm">No activity yet. Connect your accounts to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

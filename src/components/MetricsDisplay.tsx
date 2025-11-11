import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
}

interface MetricsDisplayProps {
  platform: 'whatsapp' | 'email';
}

export const MetricsDisplay = ({ platform }: MetricsDisplayProps) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestMetrics();

    const channel = supabase
      .channel(`metrics-${platform}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'metrics',
          filter: `platform=eq.${platform}`
        },
        (payload) => {
          setMetrics(payload.new as Metrics);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [platform]);

  const fetchLatestMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('platform', platform)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching metrics:', error);
        return;
      }

      if (data) {
        setMetrics(data as Metrics);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate some replies to see performance metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  const metricItems = [
    { label: "Accuracy", value: metrics.accuracy, color: "bg-primary" },
    { label: "Precision", value: metrics.precision_score, color: "bg-blue-500" },
    { label: "Recall", value: metrics.recall_score, color: "bg-green-500" },
    { label: "F1-Score", value: metrics.f1_score, color: "bg-purple-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          AI reply generation quality indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metricItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.value.toFixed(1)}%</span>
            </div>
            <Progress value={item.value} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
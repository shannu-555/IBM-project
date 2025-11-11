import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Reply {
  tone: string;
  text: string;
  confidence: number;
}

interface QuickMessageGeneratorProps {
  platform: 'whatsapp' | 'email';
  language?: string;
}

export const QuickMessageGenerator = ({ platform, language = 'auto' }: QuickMessageGeneratorProps) => {
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-replies', {
        body: { message: message.trim(), platform, language }
      });

      if (error) throw error;

      setReplies(data.replies);
      toast.success("AI replies generated successfully!");
    } catch (error) {
      console.error('Error generating replies:', error);
      toast.error("Failed to generate replies");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Reply copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy reply");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Message Generator
        </CardTitle>
        <CardDescription>
          Paste any message to generate AI-powered replies instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !message.trim()}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Replies"}
          </Button>
        </div>

        {replies.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-sm">Generated Replies:</h4>
            {replies.map((reply, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{reply.tone}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(reply.text, index)}
                    className="gap-2"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Reply
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm">{reply.text}</p>
                <div className="text-xs text-muted-foreground">
                  Confidence: {Math.round(reply.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
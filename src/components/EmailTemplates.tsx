import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  type: "formal" | "casual" | "thank-you" | "follow-up";
  content: string;
}

const defaultTemplates: Template[] = [
  {
    id: "formal",
    name: "Formal Reply",
    type: "formal",
    content: "Dear [Name],\n\nThank you for your email. I have reviewed your message and would like to respond as follows:\n\n[Your response here]\n\nPlease let me know if you need any further information.\n\nBest regards,\n[Your name]"
  },
  {
    id: "casual",
    name: "Casual Reply",
    type: "casual",
    content: "Hey [Name],\n\nThanks for reaching out! Here's what I think:\n\n[Your response here]\n\nLet me know if you have any questions!\n\nCheers,\n[Your name]"
  },
  {
    id: "thank-you",
    name: "Thank You",
    type: "thank-you",
    content: "Hi [Name],\n\nThank you so much for [what they did]. I really appreciate it!\n\n[Additional message if needed]\n\nBest,\n[Your name]"
  },
  {
    id: "follow-up",
    name: "Follow-up",
    type: "follow-up",
    content: "Hi [Name],\n\nI wanted to follow up on my previous email regarding [topic]. Have you had a chance to review it?\n\n[Additional context]\n\nLooking forward to your response.\n\nBest regards,\n[Your name]"
  }
];

export const EmailTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customContent, setCustomContent] = useState("");

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCustomContent(template.content);
  };

  const handleCopyTemplate = () => {
    if (customContent) {
      navigator.clipboard.writeText(customContent);
      toast.success("Template copied to clipboard!");
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "formal": return "default";
      case "casual": return "secondary";
      case "thank-you": return "outline";
      case "follow-up": return "default";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Email Templates
        </CardTitle>
        <CardDescription>
          Select and customize common reply templates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {defaultTemplates.map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate?.id === template.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectTemplate(template)}
              className="flex-col h-auto py-3 gap-1"
            >
              <Badge variant={getBadgeVariant(template.type)} className="mb-1">
                {template.type}
              </Badge>
              <span className="text-xs">{template.name}</span>
            </Button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Customize Template</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTemplate}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder="Customize your template here..."
            />
            <p className="text-xs text-muted-foreground">
              Tip: Replace [Name], [Your response here], etc. with actual content
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

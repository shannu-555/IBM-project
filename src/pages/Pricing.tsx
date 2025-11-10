import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Perfect for trying out SmartReply",
      features: [
        "10 AI replies per month",
        "WhatsApp integration",
        "Email integration",
        "Basic support",
        "Multi-language support",
      ],
      cta: "Current Plan",
      popular: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "For professionals and small businesses",
      features: [
        "Unlimited AI replies",
        "WhatsApp integration",
        "Email integration",
        "Priority support",
        "Multi-language support",
        "Advanced AI models",
        "Custom response templates",
        "Analytics dashboard",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantee",
        "Team collaboration",
        "API access",
        "White-label option",
        "Training & onboarding",
      ],
      cta: "Contact Us",
      popular: false,
    },
  ];

  const handleUpgrade = (planName: string) => {
    if (planName === "Enterprise") {
      toast.info("Please contact us for Enterprise pricing");
    } else {
      toast.success(`Payment integration will be set up for ${planName} plan`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Select the perfect plan for your needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative ${
              plan.popular ? "border-primary shadow-lg scale-105" : ""
            } transition-all hover:shadow-xl`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <div className="rounded-full bg-accent/20 p-1">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleUpgrade(plan.name)}
                disabled={plan.name === "Free"}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pricing;

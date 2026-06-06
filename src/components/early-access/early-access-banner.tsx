import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function EarlyAccessBanner() {
  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          Помогите улучшить FinPilot
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Какая рекомендация оказалась самой полезной?
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5">
        <Link href="/feedback">
          <Button variant="secondary" size="sm">
            Оставить отзыв
          </Button>
        </Link>
      </div>
    </Card>
  );
}

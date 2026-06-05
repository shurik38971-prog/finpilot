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
          Ранний доступ
        </CardTitle>
        <CardDescription className="leading-relaxed">
          FinPilot развивается вместе с первыми пользователями. Если рекомендация
          показалась неточной или что-то непонятно — расскажите нам.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        <Link href="/feedback?type=idea">
          <Button variant="secondary" size="sm">
            Оставить отзыв
          </Button>
        </Link>
        <Link href="/feedback?type=bug">
          <Button variant="ghost" size="sm">
            Сообщить о проблеме
          </Button>
        </Link>
      </div>
    </Card>
  );
}

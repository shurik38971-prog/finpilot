import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface MainProblemCardProps {
  problem: string | null;
}

export function MainProblemCard({ problem }: MainProblemCardProps) {
  if (!problem?.trim()) return null;

  return (
    <Card className="border-orange-500/30 bg-orange-500/5 !p-4">
      <CardHeader className="!p-0 space-y-2">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Главная проблема
        </CardTitle>
        <p className="text-sm font-medium leading-snug">{problem}</p>
      </CardHeader>
    </Card>
  );
}

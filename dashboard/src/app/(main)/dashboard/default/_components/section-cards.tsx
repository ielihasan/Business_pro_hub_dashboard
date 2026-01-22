import { TrendingUp, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

      {/* Total Activity */}
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">
            Total Activity
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Activity className="h-3 w-3" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
            <Activity className="h-3 w-3" /> Operations running smoothly
          </div>
          <div>Across all business processes</div>
        </CardFooter>
      </Card>

      {/* New Customers */}
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">
            New Customers
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
            <Users className="h-3 w-3" /> Customer base increasing steadily
          </div>
          <div>Across all business locations</div>
        </CardFooter>
      </Card>

      {/* Active Orders */}
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">
            Active Orders
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
            <TrendingUp className="h-3 w-3" /> Smooth order processing
          </div>
          <div>Real-time tracking of customer orders</div>
        </CardFooter>
      </Card>

    </div>
  );
}

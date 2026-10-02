import {
  CalendarClock,
  CircleCheck,
  Clock3,
  MessageSquareText,
  Pencil,
  Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
  id: string;

  trackingActionId: string;

  activityType:
    | "created"
    | "due_date_changed"
    | "note_added"
    | "executed"
    | "updated";

  description: string;

  metadata: Record<string, unknown> | null;

  createdAt: Date;

  userId: string | null;

  userName: string | null;

  sku: string;

  productDescription: string;

  recommendationAction: "maintain" | "redistribute" | "offer" | "liquidate";
};

type Props = {
  activities: Activity[];
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function ActivityIcon({ type }: { type: Activity["activityType"] }) {
  switch (type) {
    case "created":
      return <Plus className="size-4 text-blue-600" />;

    case "executed":
      return <CircleCheck className="size-4 text-emerald-600" />;

    case "due_date_changed":
      return <CalendarClock className="size-4 text-amber-600" />;

    case "note_added":
      return <MessageSquareText className="size-4 text-violet-600" />;

    default:
      return <Pencil className="size-4 text-slate-500" />;
  }
}

export function TrackingRecentActivities({ activities }: Props) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-5 text-[#12365A]" />
          Actividades recientes
        </CardTitle>

        <p className="text-sm text-slate-500">
          Últimos movimientos realizados en Seguimiento.
        </p>
      </CardHeader>

      <CardContent>
        {!activities.length ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Todavía no existen actividades registradas.
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 border-b border-slate-100 py-4 last:border-0"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50">
                  <ActivityIcon type={activity.activityType} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-slate-800">
                      {activity.sku}
                      {" — "}
                      <span className="font-normal text-slate-600">
                        {activity.productDescription}
                      </span>
                    </p>

                    <span className="whitespace-nowrap text-[11px] text-slate-400">
                      {dateFormatter.format(activity.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {activity.description}
                  </p>

                  {activity.userName ? (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Por {activity.userName}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

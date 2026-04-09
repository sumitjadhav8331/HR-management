"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import {
  employeeCheckInAction,
  employeeCheckOutAction,
} from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";

export function EmployeeAttendanceActions({
  canCheckIn,
  canCheckOut,
  todayDate,
}: {
  canCheckIn: boolean;
  canCheckOut: boolean;
  todayDate: string;
}) {
  const router = useRouter();
  const [locationPending, setLocationPending] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setLocationPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("attendance_date", todayDate);
          formData.set("latitude", position.coords.latitude.toFixed(7));
          formData.set("longitude", position.coords.longitude.toFixed(7));
          const result = await employeeCheckInAction(formData);

          if (!result.success) {
            toast.error(result.message);
            setLocationPending(false);
            return;
          }

          toast.success(result.message);
          setLocationPending(false);
          router.refresh();
        });
      },
      () => {
        toast.error("Unable to capture location. Allow location permission and retry.");
        setLocationPending(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function submitCheckOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("attendance_date", todayDate);
      const result = await employeeCheckOutAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={submitCheckIn}>
        <p className="text-sm text-muted-foreground">
          Check in captures your current location and login time.
        </p>
        <Button disabled={!canCheckIn || pending || locationPending} type="submit">
          <LocateFixed className="h-4 w-4" />
          {locationPending ? "Capturing location..." : "Check in"}
        </Button>
      </form>
      <form className="space-y-3" onSubmit={submitCheckOut}>
        <Button disabled={!canCheckOut || pending || locationPending} type="submit" variant="secondary">
          Check out
        </Button>
      </form>
    </div>
  );
}

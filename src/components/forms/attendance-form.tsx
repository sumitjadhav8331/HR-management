"use client";

import { format } from "date-fns";
import { LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";

function toLocalDateTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

export function AttendanceForm({
  employees,
  initialData,
  selectedDate,
}: {
  employees: Array<Pick<Tables<"employees">, "id" | "name" | "role" | "status">>;
  initialData?: Tables<"attendance"> | null;
  selectedDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locationPending, setLocationPending] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveAttendanceAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(`/attendance?date=${formData.get("attendance_date")}`);
      router.refresh();
      form.reset();
    });
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setLocationPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latInput = document.getElementById("latitude") as HTMLInputElement | null;
        const lngInput = document.getElementById("longitude") as HTMLInputElement | null;

        if (latInput) latInput.value = position.coords.latitude.toFixed(7);
        if (lngInput) lngInput.value = position.coords.longitude.toFixed(7);

        toast.success("Location captured.");
        setLocationPending(false);
      },
      () => {
        toast.error("Unable to fetch your location. Please allow permission.");
        setLocationPending(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit attendance entry" : "Mark attendance"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input name="id" type="hidden" defaultValue={initialData?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="attendance-employee">Employee</Label>
            <Select
              id="attendance-employee"
              name="employee_id"
              defaultValue={initialData?.employee_id ?? ""}
              required
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {employee.role}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-date">Attendance date</Label>
            <Input
              id="attendance-date"
              name="attendance_date"
              type="date"
              defaultValue={initialData?.attendance_date ?? selectedDate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-time">Login time</Label>
            <Input
              id="login-time"
              name="login_time"
              type="datetime-local"
              defaultValue={toLocalDateTimeValue(initialData?.login_time)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logout-time">Logout time</Label>
            <Input
              id="logout-time"
              name="logout_time"
              type="datetime-local"
              defaultValue={toLocalDateTimeValue(initialData?.logout_time)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" name="latitude" type="number" step="0.0000001" defaultValue={initialData?.latitude ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" name="longitude" type="number" step="0.0000001" defaultValue={initialData?.longitude ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input id="address" name="address" defaultValue={initialData?.address ?? ""} />
          </div>
          <Button
            disabled={pending || locationPending}
            type="button"
            variant="outline"
            onClick={captureLocation}
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {locationPending ? "Capturing location..." : "Use current location"}
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : initialData ? "Update attendance" : "Save attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

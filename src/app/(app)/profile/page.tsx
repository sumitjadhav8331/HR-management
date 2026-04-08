import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { changePasswordAction, updateProfileAction } from "@/app/actions/profile";

export default async function ProfilePage() {
  const { user, profile } = await requireProfile();
  const supabase = await createServerSupabaseClient();
  const { data: employee } = await supabase.from("employees").select("phone").eq("user_id", user.id).maybeSingle();

  return (
    <>
      <PageHeader eyebrow="Profile" title="Profile and security" description="Update your account details and password." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server";
              await updateProfileAction(formData);
            }} className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={user.email ?? profile?.email ?? ""} disabled /></div>
              <div className="space-y-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={employee?.phone ?? ""} /></div>
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server";
              await changePasswordAction(formData);
            }} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
              <Button type="submit" variant="secondary">Update password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

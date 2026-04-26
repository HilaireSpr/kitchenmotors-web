import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHealth } from "@/lib/api";
import DashboardTabs from "@/components/DashboardTabs";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let apiStatus = "onbekend";

  try {
    const health = await getHealth();
    apiStatus = health.status ?? "ok";
  } catch {
    apiStatus = "API niet bereikbaar";
  }

  return (
    <main className="app-page">
      <DashboardTabs
        userEmail={user.email ?? "onbekend"}
        apiStatus={apiStatus}
      />
    </main>
  );
}
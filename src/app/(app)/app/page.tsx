import { CreateHouseholdForm } from "@/features/household/ui/create-household-form";
import { getActiveHousehold } from "@/shared/lib/household";
import { loadDashboard } from "@/widgets/dashboard/api/load-dashboard";
import { DashboardView } from "@/widgets/dashboard/ui/dashboard-view";

export const metadata = {
  title: "Dashboard",
};

export default async function AppHomePage() {
  const household = await getActiveHousehold();

  if (!household) {
    return (
      <main className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Создайте свой дом
          </h1>
          <p className="text-muted">
            Это корень всего: комнаты, места, коробки и вещи будут внутри него.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <CreateHouseholdForm />
        </div>
      </main>
    );
  }

  const data = await loadDashboard(household);

  return <DashboardView data={data} />;
}

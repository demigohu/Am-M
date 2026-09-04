import { AppShell } from "../../components/layout/AppShell";
import { AccountHub } from "../../components/account/AccountHub";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const hireNext = next && next.startsWith("/") ? next : "/market";

  return (
    <AppShell>
      <AccountHub next={hireNext} />
    </AppShell>
  );
}

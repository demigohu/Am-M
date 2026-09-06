import { AppLayout } from "../../components/layout/AppLayout";
import { AccountHub } from "../../components/account/AccountHub";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const hireNext = next && next.startsWith("/") ? next : "/market";

  return (
    <AppLayout>
      <AccountHub next={hireNext} />
    </AppLayout>
  );
}

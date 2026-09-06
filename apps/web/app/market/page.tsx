import { Suspense } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { MarketFloor, MarketFloorFallback } from "../../components/market/MarketFloor";

export default function MarketPage() {
  return (
    <AppLayout>
      <Suspense fallback={<MarketFloorFallback />}>
        <MarketFloor />
      </Suspense>
    </AppLayout>
  );
}

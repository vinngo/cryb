import ChoresPage from "./Chores";
import { Suspense } from "react";
import SuspenseFallback from "@/components/suspense-fallback";

export default function Page() {
  return (
    <Suspense fallback={<SuspenseFallback page="Chores" />}>
      <ChoresPage />
    </Suspense>
  );
}

import ExpensesPage from "./expenses";
import { Suspense } from "react";
import SuspenseFallback from "@/components/suspense-fallback";

export default function Page() {
  return (
    <Suspense fallback={<SuspenseFallback page="Expenses" />}>
      <ExpensesPage />
    </Suspense>
  );
}

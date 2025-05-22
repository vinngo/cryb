import ExpensesPage from "./expenses";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpensesPage />
    </Suspense>
  );
}

import HouseRulesPage from "./houserules";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HouseRulesPage />
    </Suspense>
  );
}

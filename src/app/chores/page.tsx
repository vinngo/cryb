import ChoresPage from "./Chores";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ChoresPage />
    </Suspense>
  );
}

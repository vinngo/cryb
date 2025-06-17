import { LoginPage } from "./login";
import { Suspense } from "react";
import SuspenseFallback from "@/components/suspense-fallback";

export default function Page() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <LoginPage />
    </Suspense>
  );
}

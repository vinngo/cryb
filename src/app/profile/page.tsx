import ProfilePage from "./Profile";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProfilePage />
    </Suspense>
  );
}

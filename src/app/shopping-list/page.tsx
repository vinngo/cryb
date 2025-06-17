import { Suspense } from "react";
import ShoppingList from "./shoppinglist";
import SuspenseFallback from "@/components/suspense-fallback";

export default function Page() {
  return (
    <Suspense fallback={<SuspenseFallback page="Shopping List" />}>
      <ShoppingList />
    </Suspense>
  );
}

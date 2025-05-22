import { Suspense } from "react";
import ShoppingList from "./shoppinglist";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShoppingList />
    </Suspense>
  );
}

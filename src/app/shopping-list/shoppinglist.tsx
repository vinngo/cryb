"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useShoppingListStore } from "@/lib/stores/useShoppingListStore";
import { useUserStore } from "@/lib/stores/usersStore";
import { addShoppingListItem, updateItemStatus } from "./actions";

const categories = [
  "Dairy",
  "Bakery",
  "Produce",
  "Meat",
  "Frozen",
  "Pantry",
  "Household",
  "Other",
];

export default function ShoppingList() {
  const { items: shoppingListItems } = useShoppingListStore();
  const { user } = useUserStore();

  const [items, setItems] = useState(shoppingListItems);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    category: "Other",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    setItems(shoppingListItems);
  }, [shoppingListItems]);

  const addItem = async (e: React.FormEvent<HTMLFormElement>) => {
    if (newItem.name.trim() === "") return;
    if (!user) return;
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const item = await addShoppingListItem(formData, user.house_id, user.id);

    setItems([...items, item]);
    setNewItem({ name: "", quantity: "", category: "Other" });
    setIsAddDialogOpen(false);
  };

  const toggleItemCompletion = async (id: string, currentStatus: boolean) => {
    //optimistically update
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, is_checked: !item.is_checked } : item,
      ),
    );

    const { error } = await updateItemStatus(id, currentStatus);

    if (error) {
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, is_checked: currentStatus } : item,
        ),
      );
      console.error(error);
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "pending") return !item.is_checked;
    if (filter === "completed") return item.is_checked;
    return true;
  });

  const pendingCount = items.filter((item) => !item.is_checked).length;
  const completedCount = items.filter((item) => item.is_checked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">
            Track and manage household shopping needs
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={addItem}>
              <DialogHeader>
                <DialogTitle>Add Shopping Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your shopping list
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) =>
                      setNewItem({ ...newItem, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name="category"
                    value={newItem.category}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add to List</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shopping Status</CardTitle>
            <CardDescription>Current shopping list progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Pending Items</span>
                <span className="font-medium">{pendingCount}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Completed Items</span>
                <span className="font-medium">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{items.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Filters</CardTitle>
            <CardDescription>Filter your shopping list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All Items
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                onClick={() => setFilter("completed")}
              >
                Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopping Items</CardTitle>
          <CardDescription>All household shopping items</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No items in your list"
              description="Add some items to your shopping list"
              action={
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add First Item
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={() =>
                          toggleItemCompletion(item.id, item.is_checked)
                        }
                        className="h-5 w-5"
                      />
                      <div>
                        <p
                          className={`font-medium ${item.is_checked ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {item.quantity} • {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {user?.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

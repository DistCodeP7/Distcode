"use server";

import { revalidatePath } from "next/cache";
import { deleteProblem } from "@/app/authorized/editor/problem/[id]/problemActions";

export async function deleteProblemFromList(id: number) {
  const res = await deleteProblem(id);
  if (!res.success) {
    throw new Error(res.error);
  }
  // Revalidate the list page after deletion
  revalidatePath("/authorized/editor/problem");
}

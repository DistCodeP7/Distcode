"use server";

import { revalidatePath } from "next/cache";
import { deleteProblem } from "@/app/authorized/[id]/problemActions";

export async function deleteProblemFromList(id: number) {
  const res = await deleteProblem(id);
  if (!res.success) {
    throw new Error(res.error);
  }
  revalidatePath("/authorized");
}

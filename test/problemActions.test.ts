import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Hoisted test doubles so they’re available inside vi.mock factories.
 */
const hoisted = vi.hoisted(() => {
  const findFirst = vi.fn();
  const deleteWhere = vi.fn();
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  return { findFirst, deleteWhere, deleteFn };
});

/**
 * Mocks – all declared BEFORE importing the System under test (SUT).
 */
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

vi.mock("@/lib/user", () => ({
  getUserIdByEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      problems: {
        findFirst: hoisted.findFirst,
      },
    },
    delete: hoisted.deleteFn,
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (..._args: unknown[]) => true,
}));

vi.mock("@/drizzle/schema", () => ({
  problems: {},
}));

describe("deleteProblem", () => {
  let deleteProblem: (
    id: number,
  ) => Promise<
    | { success: true; message: string; status: number }
    | { success: false; error: string; status: number }
  >;
  let getServerSession: any;
  let getUserIdByEmail: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import SUT AFTER mocks are set up
    ({ deleteProblem } = await import("@/app/authorized/[id]/problemActions"));

    ({ getServerSession } = await import("next-auth/next"));
    ({ getUserIdByEmail } = await import("@/lib/user"));
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await deleteProblem(1);
    expect(res).toEqual({
      success: false,
      error: "Not authenticated",
      status: 401,
    });
  });

  it("returns 404 when user not found", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(null);

    const res = await deleteProblem(1);
    expect(res).toEqual({
      success: false,
      error: "User not found",
      status: 404,
    });
  });

  it("returns 400 for invalid id", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(123);

    const res = await deleteProblem(NaN);
    expect(res).toEqual({
      success: false,
      error: "Problem ID is required",
      status: 400,
    });
  });

  it("returns 404 if problem does not exist", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(123);
    hoisted.findFirst.mockResolvedValue(null);

    const res = await deleteProblem(42);
    expect(res).toEqual({
      success: false,
      error: "Problem not found",
      status: 404,
    });
  });

  it("returns 403 if user does not own the problem", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(123);
    hoisted.findFirst.mockResolvedValue({ id: 42, userId: 999 });

    const res = await deleteProblem(42);
    expect(res).toEqual({
      success: false,
      error: "Forbidden",
      status: 403,
    });
  });

  it("deletes and returns success", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(123);
    hoisted.findFirst.mockResolvedValue({ id: 42, userId: 123 });

    const res = await deleteProblem(42);

    expect(hoisted.deleteFn).toHaveBeenCalled();
    expect(hoisted.deleteWhere).toHaveBeenCalled();
    expect(res).toEqual({
      success: true,
      message: "Problem deleted successfully.",
      status: 200,
    });
  });

  it("handles db errors", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    getUserIdByEmail.mockResolvedValue(123);
    hoisted.findFirst.mockResolvedValue({ id: 42, userId: 123 });

    // Make db.delete throw
    hoisted.deleteFn.mockImplementationOnce(() => {
      throw new Error("Error: Something went wrong");
    });

    const res = await deleteProblem(42);
    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    if (!res.success) {
      expect(String(res.error)).toContain("Error: Something went wrong");
    }
  });
});

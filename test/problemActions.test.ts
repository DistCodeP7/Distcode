// --- Shared mocks ---------------------------------------------------------

const getServerSessionMock = jest.fn();
const getUserByIdMock = jest.fn();

const findFirstMock = jest.fn();

const updateWhereMock = jest.fn();
const updateSetMock = jest.fn(() => ({ where: updateWhereMock }));
const updateMock = jest.fn(() => ({ set: updateSetMock }));

const insertReturningMock = jest.fn();
const insertValuesMock = jest.fn(() => ({ returning: insertReturningMock }));
const insertMock = jest.fn(() => ({ values: insertValuesMock }));

const deleteWhereMock = jest.fn();
const deleteMock = jest.fn(() => ({ where: deleteWhereMock }));

// --- Module mocks ---------------------------------------------------------

jest.mock("next-auth/next", () => ({
  getServerSession: getServerSessionMock,
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

jest.mock("@/lib/user", () => ({
  getUserById: getUserByIdMock,
}));

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      problems: {
        findFirst: findFirstMock,
      },
    },
    update: updateMock,
    insert: insertMock,
    delete: deleteMock,
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: (..._args: any[]) => true,
}));

jest.mock("@/drizzle/schema", () => ({
  problems: {},
}));

let saveProblem: any;
let updateChallengeForm: any;
let deleteProblem: any;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.resetModules();

  const mod = await import("@/app/authorized/[id]/problemActions");
  saveProblem = mod.saveProblem;
  updateChallengeForm = mod.updateChallengeForm;
  deleteProblem = mod.deleteProblem;
});

describe("saveProblem", () => {
  const baseSaveData: any = {
    problemMarkdown: "Some markdown",
    studentCode: { "student/main.go": "// main" },
    solutionCode: "// solution",
    testCode: { "test/main_test.go": "// test" },
    protocolCode: { "protocol.go": "// protocol" },
    isPublished: false,
  };

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await saveProblem(baseSaveData);
    expect(res).toEqual({
      success: false,
      error: "Not authenticated",
      status: 401,
    });
  });

  it("returns 404 when updating a non-existent problem", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue(null);

    const res = await saveProblem({ ...baseSaveData, id: 123 });
    expect(findFirstMock).toHaveBeenCalled();
    expect(res).toEqual({
      success: false,
      error: "Problem not found",
      status: 404,
    });
  });

  it("returns 403 when updating a problem owned by another user", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 123, userId: "other-user" });

    const res = await saveProblem({ ...baseSaveData, id: 123 });
    expect(res).toEqual({
      success: false,
      error: "Forbidden",
      status: 403,
    });
  });

  it("validates missing fields (problem markdown missing)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await saveProblem({
      ...baseSaveData,
      problemMarkdown: undefined as any,
    });

    expect(res).toEqual({
      success: false,
      error: "Problem markdown is required (missing).",
      status: 400,
    });
  });

  it("validates map fields (studentCode empty)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await saveProblem({
      ...baseSaveData,
      studentCode: {},
    });

    expect(res).toEqual({
      success: false,
      error: "Student code is required (empty).",
      status: 400,
    });
  });

  it("validates string fields (solutionCode empty)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await saveProblem({
      ...baseSaveData,
      solutionCode: "   ",
    });

    expect(res).toEqual({
      success: false,
      error: "Solution code is required (empty).",
      status: 400,
    });
  });

  it("updates an existing problem successfully (draft)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({
      id: 123,
      userId: "user-1",
      problemMarkdown: "old",
      studentCode: { "student/main.go": "// old" },
      solutionCode: "// old",
      testCode: { "test/main_test.go": "// old" },
    });

    const res = await saveProblem({ ...baseSaveData, id: 123 });

    expect(findFirstMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenCalled();
    expect(updateWhereMock).toHaveBeenCalled();

    expect(res).toEqual({
      success: true,
      message: "Draft saved successfully.",
      status: 200,
      id: 123,
    });
  });

  it("creates a new problem successfully (draft)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    insertReturningMock.mockResolvedValue([{ id: 777 }]);

    const res = await saveProblem({ ...baseSaveData, id: undefined });

    expect(insertMock).toHaveBeenCalled();
    expect(insertValuesMock).toHaveBeenCalled();
    expect(insertReturningMock).toHaveBeenCalled();

    expect(res).toEqual({
      success: true,
      message: "Draft saved successfully.",
      status: 200,
      id: 777,
    });
  });

  it("returns publish message when isPublished is true", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    insertReturningMock.mockResolvedValue([{ id: 888 }]);

    const res = await saveProblem({
      ...baseSaveData,
      isPublished: true,
      id: undefined,
    });

    expect(res).toEqual({
      success: true,
      message: "Problem published successfully!",
      status: 200,
      id: 888,
    });
  });

  it("handles DB errors in update branch", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({
      id: 123,
      userId: "user-1",
      problemMarkdown: "old",
      studentCode: { "student/main.go": "// old" },
      solutionCode: "// old",
      testCode: { "test/main_test.go": "// old" },
    });

    updateMock.mockImplementationOnce(() => {
      throw new Error("Update failed");
    });

    const res = await saveProblem({ ...baseSaveData, id: 123 });

    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    if (!res.success) {
      expect(res.error).toContain("Update failed");
    }
  });

  it("handles DB errors in insert branch", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    insertMock.mockImplementationOnce(() => {
      throw new Error("Insert failed");
    });

    const res = await saveProblem({ ...baseSaveData, id: undefined });

    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    if (!res.success) {
      expect(res.error).toContain("Insert failed");
    }
  });
});

describe("updateChallengeForm", () => {
  const baseChallengeForm: any = {
    details: {
      title: "My Challenge",
      description: "Solve this",
      difficulty: "Easy",
    },
    testContainer: {
      alias: "test-container",
      testFiles: {
        "test/main_test.go": "// test",
      },
      buildCommand: "go test -c -o ./test_binary ./test/",
      entryCommand: "./test_binary",
      envs: [{ key: "TEST_ENV", value: "1" }],
    },
    submission: {
      buildCommand: "go build -o ./stud ./student/main.go",
      entryCommand: "./stud",
      globalEnvs: [{ key: "GLOBAL_ENV", value: "1" }],
      replicaConfigs: {
        "replica-1": { alias: "replica-1", envs: [] },
      },
    },
  };

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await updateChallengeForm(1, baseChallengeForm);

    expect(res).toEqual({
      success: false,
      error: "Not authenticated",
      status: 401,
    });
  });

  it("returns 404 when problem does not exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue(null);

    const res = await updateChallengeForm(1, baseChallengeForm);

    expect(res).toEqual({
      success: false,
      error: "Problem not found",
      status: 404,
    });
  });

  it("returns 403 when user does not own the problem", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "other-user" });

    const res = await updateChallengeForm(1, baseChallengeForm);

    expect(res).toEqual({
      success: false,
      error: "Forbidden",
      status: 403,
    });
  });

  it("validates missing title", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "user-1" });

    const form = {
      ...baseChallengeForm,
      details: {
        ...baseChallengeForm.details,
        title: "   ",
      },
    };

    const res = await updateChallengeForm(1, form);

    expect(res).toEqual({
      success: false,
      error: "Title in challenge form is required.",
      status: 400,
    });
  });

  it("validates missing description", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "user-1" });

    const form = {
      ...baseChallengeForm,
      details: {
        ...baseChallengeForm.details,
        description: "",
      },
    };

    const res = await updateChallengeForm(1, form);

    expect(res).toEqual({
      success: false,
      error: "Description in challenge form is required.",
      status: 400,
    });
  });

  it("validates invalid difficulty", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "user-1" });

    const form = {
      ...baseChallengeForm,
      details: {
        ...baseChallengeForm.details,
        difficulty: "Insane",
      },
    };

    const res = await updateChallengeForm(1, form);

    expect(res).toEqual({
      success: false,
      error: "Difficulty in challenge form is invalid.",
      status: 400,
    });
  });

  it("updates challenge form successfully", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "user-1" });

    const res = await updateChallengeForm(1, baseChallengeForm);

    expect(updateMock).toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenCalled();
    expect(updateWhereMock).toHaveBeenCalled();

    expect(res).toEqual({
      success: true,
      message: "Challenge form updated successfully.",
      status: 200,
    });
  });

  it("handles DB errors when updating challenge form", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: 1, userId: "user-1" });

    updateMock.mockImplementationOnce(() => {
      throw new Error("Challenge update failed");
    });

    const res = await updateChallengeForm(1, baseChallengeForm);

    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    if (!res.success) {
      expect(res.error).toContain("Challenge update failed");
    }
  });
});

describe("deleteProblem", () => {
  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await deleteProblem(1);
    expect(res).toEqual({
      success: false,
      error: "Not authenticated",
      status: 401,
    });
  });

  it("returns 404 when user is not found", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue(null);

    const res = await deleteProblem(1);
    expect(res).toEqual({
      success: false,
      error: "User not found",
      status: 404,
    });
  });

  it("returns 400 for invalid id", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue({ id: "user-1" });

    const res = await deleteProblem(NaN);
    expect(res).toEqual({
      success: false,
      error: "Problem ID is required",
      status: 400,
    });
  });

  it("returns 404 if problem does not exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue({ id: "user-1" });
    findFirstMock.mockResolvedValue(null);

    const res = await deleteProblem(42);
    expect(res).toEqual({
      success: false,
      error: "Problem not found",
      status: 404,
    });
  });

  it("returns 403 if user does not own the problem", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue({ id: "user-1" });
    findFirstMock.mockResolvedValue({ id: 42, userId: "other-user" });

    const res = await deleteProblem(42);
    expect(res).toEqual({
      success: false,
      error: "Forbidden",
      status: 403,
    });
  });

  it("deletes and returns success", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue({ id: "user-1" });
    findFirstMock.mockResolvedValue({ id: 42, userId: "user-1" });

    const res = await deleteProblem(42);

    expect(deleteMock).toHaveBeenCalled();
    expect(deleteWhereMock).toHaveBeenCalled();
    expect(res).toEqual({
      success: true,
      message: "Problem deleted successfully.",
      status: 200,
    });
  });

  it("handles db errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    getUserByIdMock.mockResolvedValue({ id: "user-1" });
    findFirstMock.mockResolvedValue({ id: 42, userId: "user-1" });

    deleteMock.mockImplementationOnce(() => {
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

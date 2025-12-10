import type { Filemap } from "@/app/exercises/[id]/actions";

// --- Shared mocks ---------------------------------------------------------

const getServerSessionMock = jest.fn();
const getUserByIdMock = jest.fn();

// Drizzle "builder" style mocks
const findFirstMock = jest.fn();

const selectMock = jest.fn();

const insertMock = jest.fn();
const insertValuesMock = jest.fn();

const updateMock = jest.fn();
const updateSetMock = jest.fn();
const updateWhereMock = jest.fn();

const deleteMock = jest.fn();
const deleteWhereMock = jest.fn();

const MQJobsSenderSendMessageMock = jest.fn();
const MQJobsCancellerSendMessageMock = jest.fn();

const readyMock = Promise.resolve();

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

jest.mock("@/lib/mq", () => ({
  MQJobsSender: {
    sendMessage: MQJobsSenderSendMessageMock,
  },
  MQJobsCanceller: {
    sendMessage: MQJobsCancellerSendMessageMock,
  },
  ready: readyMock,
}));

jest.mock("uuid", () => ({
  v4: () => "test-uuid",
}));

jest.mock("@/lib/db", () => {
  return {
    db: {
      query: {
        problems: {
          findFirst: findFirstMock,
        },
      },
      select: selectMock,
      insert: insertMock,
      update: updateMock,
      delete: deleteMock,
    },
  };
});

// The concrete table objects are not important for the tests, they are just
// passed through to the mocked query builder functions.
jest.mock("@/drizzle/schema", () => ({
  job_results: { table: "job_results" },
  problems: { table: "problems" },
  ratings: { table: "ratings" },
  userCode: { table: "userCode" },
}));

let cancelJobRequest: any;
let getExercise: any;
let hasUserSubmitted: any;
let loadSavedCode: any;
let loadUserRating: any;
let rateExercise: any;
let resetCode: any;
let saveCode: any;
let submitCode: any;

let db: any;

import { job_results, ratings, userCode } from "@/drizzle/schema";

// --- Helper utilities -----------------------------------------------------

const createSelectBuilder = <T>(rows: T[]) => {
  const rowsPromise = Promise.resolve(rows);

  const builder: any = rowsPromise;

  const localFrom = jest.fn(() => builder);
  const localWhere = jest.fn(() => builder);
  const localOrderBy = jest.fn(() => builder);
  const localLimit = jest.fn(() => rowsPromise);

  builder.from = localFrom;
  builder.where = localWhere;
  builder.orderBy = localOrderBy;
  builder.limit = localLimit;

  return { builder, localFrom, localWhere, localOrderBy, localLimit };
};

const mockSelectChainOnce = <T>(rows: T[]) => {
  const { builder, localFrom, localWhere, localOrderBy, localLimit } =
    createSelectBuilder(rows);
  selectMock.mockImplementationOnce(() => builder);
  return { localFrom, localWhere, localOrderBy, localLimit };
};

beforeEach(async () => {
  jest.clearAllMocks();
  jest.resetModules();

  const actions = await import("@/app/exercises/[id]/actions");
  cancelJobRequest = actions.cancelJobRequest;
  getExercise = actions.getExercise;
  hasUserSubmitted = actions.hasUserSubmitted;
  loadSavedCode = actions.loadSavedCode;
  loadUserRating = actions.loadUserRating;
  rateExercise = actions.rateExercise;
  resetCode = actions.resetCode;
  saveCode = actions.saveCode;
  submitCode = actions.submitCode;

  const dbModule = await import("@/lib/db");
  db = dbModule.db;

  (db.select as unknown as jest.Mock) = selectMock;
  (db.insert as unknown as jest.Mock) = insertMock.mockReturnValue({
    values: insertValuesMock,
  });
  (db.update as unknown as jest.Mock) = updateMock.mockReturnValue({
    set: updateSetMock,
  });
  updateSetMock.mockReturnValue({ where: updateWhereMock });

  (db.delete as unknown as jest.Mock) = deleteMock.mockReturnValue({
    where: deleteWhereMock,
  });

  (db.query.problems.findFirst as jest.Mock) = findFirstMock;
});
describe("getExercise", () => {
  it("returns 400 for invalid id", async () => {
    const result = await getExercise({ params: { id: Number("NaN") as any } });
    expect(result).toEqual({ error: "Invalid exercise id", status: 400 });
  });

  it("returns 404 if exercise not found", async () => {
    findFirstMock.mockResolvedValueOnce(undefined);

    const result = await getExercise({ params: { id: 1 } });

    expect(findFirstMock).toHaveBeenCalled();
    expect(result).toEqual({ error: "Exercise not found", status: 404 });
  });

  it("returns exercise directly if published", async () => {
    const exercise = { id: 1, isPublished: true };
    findFirstMock.mockResolvedValueOnce(exercise);

    const result = await getExercise({ params: { id: 1 } });

    expect(result).toBe(exercise);
    expect(getServerSessionMock).not.toHaveBeenCalled();
  });

  it("returns 404 if unpublished and user not owner", async () => {
    const exercise = { id: 1, isPublished: false, userId: "owner-id" };
    findFirstMock.mockResolvedValueOnce(exercise);

    getServerSessionMock.mockResolvedValueOnce({ user: { id: "other-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "other-id" });

    const result = await getExercise({ params: { id: 1 } });

    expect(result).toEqual({ error: "User not found", status: 404 });
  });

  it("returns exercise if unpublished and user is owner", async () => {
    const exercise = { id: 1, isPublished: false, userId: "owner-id" };
    findFirstMock.mockResolvedValueOnce(exercise);

    getServerSessionMock.mockResolvedValueOnce({ user: { id: "owner-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "owner-id" });

    const result = await getExercise({ params: { id: 1 } });

    expect(result).toBe(exercise);
  });
});

describe("submitCode", () => {
  const baseExercise = {
    id: 42,
    testCode: { "test/main_test.go": "test code" } as Filemap,
    selectedTestPath: ["test/main_test.go"],
    protocolCode: { "protocol.go": "protocol code" } as Filemap,
    submissionBuildCommand: "go build ./...",
    submissionEntryCommand: "./app",
    globalEnvs: [],
    replicaConfigs: [],
    testAlias: "test",
    testEnvs: [],
    testBuildCommand: "go test ./...",
    testEntryCommand: "./test",
  };

  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await submitCode({}, { params: { id: 1 } });

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 404 if user not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce(null);

    const res = await submitCode({}, { params: { id: 1 } });

    expect(res).toEqual({ error: "User not found.", status: 404 });
  });

  it("returns 400 for invalid problem id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "user-id" });

    const res = await submitCode({}, { params: { id: Number("NaN") as any } });

    expect(res).toEqual({ error: "Invalid exercise id", status: 400 });
  });

  it("returns 404 if exercise not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "user-id" });
    findFirstMock.mockResolvedValueOnce(undefined);

    const res = await submitCode({}, { params: { id: 1 } });

    expect(res).toEqual({ error: "Exercise not found.", status: 404 });
  });

  it("inserts job_results when no existing row and sends MQ message", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-user-id" });

    findFirstMock.mockResolvedValueOnce(baseExercise);

    mockSelectChainOnce<any>([]);

    const submissionCode: Filemap = {
      "main.go": "package main\nfunc main() {}",
    };

    const res = await submitCode(submissionCode, {
      params: { id: baseExercise.id },
    });

    expect(deleteMock).toHaveBeenCalledWith(job_results);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);

    expect(insertMock).toHaveBeenCalledWith(job_results);
    expect(insertValuesMock).toHaveBeenCalledWith({
      jobUid: "test-uuid",
      userId: "db-user-id",
      problemId: baseExercise.id,
    });

    expect(MQJobsSenderSendMessageMock).toHaveBeenCalledTimes(1);
    const sentPayload = MQJobsSenderSendMessageMock.mock.calls[0][0];

    expect(sentPayload.jobUid).toBe("test-uuid");
    expect(sentPayload.userId).toBe("db-user-id");
    expect(sentPayload.timeout).toBe(60);
    expect(sentPayload.nodes.submission.submissionCode["protocol.go"]).toBe(
      "protocol code"
    );
    expect(sentPayload.nodes.testContainer.testFiles["test/main_test.go"]).toBe(
      "test code"
    );

    expect(res).toEqual({
      success: true,
      message: "Code submitted successfully",
      jobUid: "test-uuid",
    });
  });

  it("updates job_results when an existing row is found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-user-id" });

    findFirstMock.mockResolvedValueOnce(baseExercise);

    mockSelectChainOnce([{ id: 1 }]);

    const res = await submitCode({}, { params: { id: baseExercise.id } });

    expect(updateMock).toHaveBeenCalledWith(job_results);
    expect(updateSetMock).toHaveBeenCalledWith({ jobUid: "test-uuid" });
    expect(updateWhereMock).toHaveBeenCalledTimes(1);

    expect(res.success).toBe(true);
  });
});

describe("saveCode", () => {
  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await saveCode({}, { params: { id: 1 } });

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 404 if user not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce(null);

    const res = await saveCode({}, { params: { id: 1 } });

    expect(res).toEqual({ error: "User not found.", status: 404 });
  });

  it("returns 400 for invalid problem id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    const res = await saveCode({}, { params: { id: Number("NaN") as any } });

    expect(res).toEqual({ error: "Invalid problems id", status: 400 });
  });

  it("returns 404 if problem not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    mockSelectChainOnce<any>([]);

    const res = await saveCode({ "/main.go": "code" }, { params: { id: 1 } });

    expect(res).toEqual({ error: "Problem not found.", status: 404 });
  });

  it("inserts userCode and returns success", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    mockSelectChainOnce([{ id: 1 }]);

    const content: Filemap = { "/main.go": "code" };

    const res = await saveCode(content, { params: { id: 1 } });

    expect(insertMock).toHaveBeenCalledWith(userCode);
    expect(insertValuesMock).toHaveBeenCalledWith({
      userId: "db-u1",
      problemId: 1,
      codeSubmitted: content,
    });

    expect(res).toEqual({ success: true, message: "Code saved successfully." });
  });
});

describe("loadSavedCode", () => {
  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await loadSavedCode({ params: { id: 1 } });

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 400 for invalid id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await loadSavedCode({ params: { id: Number("NaN") as any } });

    expect(res).toEqual({ error: "Invalid problem id", status: 400 });
  });

  it("returns latest user code if present", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([
      {
        id: 1,
        codeSubmitted: { "/main.go": "saved code" },
      },
    ]);

    const res = await loadSavedCode({ params: { id: 1 } });

    expect(res).toEqual({
      success: true,
      code: { "/main.go": "saved code" },
    });
  });

  it("falls back to problem.studentCode if no saved code", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce<any>([]);

    mockSelectChainOnce([
      {
        id: 1,
        studentCode: { "/main.go": "default code" },
      },
    ]);

    const res = await loadSavedCode({ params: { id: 1 } });

    expect(res).toEqual({
      success: true,
      code: { "/main.go": "default code" },
    });
  });

  it("returns 404 if neither userCode nor problem exists", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce<any>([]);

    mockSelectChainOnce<any>([]);

    const res = await loadSavedCode({ params: { id: 1 } });

    expect(res).toEqual({ error: "Submission not found.", status: 404 });
  });
});

describe("cancelJobRequest", () => {
  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await cancelJobRequest("job-uid");

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
    expect(MQJobsCancellerSendMessageMock).not.toHaveBeenCalled();
  });

  it("sends cancel message when authorised", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await cancelJobRequest("job-uid");

    expect(MQJobsCancellerSendMessageMock).toHaveBeenCalledWith({
      jobUid: "job-uid",
      action: "cancel",
    });
    expect(res).toBeUndefined();
  });
});

describe("loadUserRating", () => {
  it("returns null if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await loadUserRating({ params: { id: 1 } });

    expect(res).toBeNull();
  });

  it("returns null if problem not owned by user", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    // problems select -> []
    mockSelectChainOnce<any>([]);

    const res = await loadUserRating({ params: { id: 1 } });

    expect(res).toBeNull();
  });

  it("returns null if rating not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1, userId: "u1" }]);

    mockSelectChainOnce<any>([]);

    const res = await loadUserRating({ params: { id: 1 } });

    expect(res).toBeNull();
  });

  it("returns 'up' or 'down' depending on rating", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1, userId: "u1" }]);

    mockSelectChainOnce([{ id: 10, liked: true }]);

    const resUp = await loadUserRating({ params: { id: 1 } });
    expect(resUp).toBe("up");
  });
});

describe("resetCode", () => {
  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await resetCode({ params: { id: 1 } });

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 400 for invalid problem id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await resetCode({ params: { id: Number("NaN") as any } });

    expect(res).toEqual({ error: "Invalid problem id", status: 400 });
  });

  it("deletes userCode and returns success", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await resetCode({ params: { id: 1 } });

    expect(deleteMock).toHaveBeenCalledWith(userCode);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ success: true, message: "Code reset successfully." });
  });
});

describe("rateExercise", () => {
  it("returns 401 if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await rateExercise({ params: { id: 1 } }, true);

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 400 for invalid id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await rateExercise(
      { params: { id: Number("NaN") as any } },
      true
    );

    expect(res).toEqual({ error: "Invalid exercise id", status: 400 });
  });

  it("returns 403 if exercise does not exist", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce<any>([]);

    const res = await rateExercise({ params: { id: 1 } }, true);

    expect(res).toEqual({
      error: "Then exercise doesnt exist",
      status: 403,
    });
  });

  it("updates existing rating", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1 }]);

    mockSelectChainOnce([{ id: 10, liked: false }]);

    const res = await rateExercise({ params: { id: 1 } }, true);

    expect(updateMock).toHaveBeenCalledWith(ratings);
    expect(updateSetMock).toHaveBeenCalledWith({ liked: true });
    expect(updateWhereMock).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ success: true });
  });

  it("inserts new rating when none exists", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1 }]);

    mockSelectChainOnce<any>([]);

    const res = await rateExercise({ params: { id: 1 } }, false);

    expect(insertMock).toHaveBeenCalledWith(ratings);
    expect(insertValuesMock).toHaveBeenCalledWith({
      userId: "u1",
      problemId: 1,
      liked: false,
    });
    expect(res).toEqual({ success: true });
  });
});

describe("hasUserSubmitted", () => {
  it("returns false if unauthorised", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await hasUserSubmitted({ params: { id: 1 } });

    expect(res).toBe(false);
  });

  it("returns false if problem not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce<any>([]);

    const res = await hasUserSubmitted({ params: { id: 1 } });

    expect(res).toBe(false);
  });

  it("returns false if userCode not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1 }]);

    mockSelectChainOnce<any>([]);

    const res = await hasUserSubmitted({ params: { id: 1 } });

    expect(res).toBe(false);
  });

  it("returns true if userCode exists", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    mockSelectChainOnce([{ id: 1 }]);

    mockSelectChainOnce([{ id: 99 }]);

    const res = await hasUserSubmitted({ params: { id: 1 } });

    expect(res).toBe(true);
  });
});

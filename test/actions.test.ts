/** biome-ignore-all lint/suspicious/noExplicitAny: <Mock files have any type> */

// --- Shared mocks ---------------------------------------------------------

const getServerSessionMock = jest.fn();
const getUserByIdMock = jest.fn();

// validateCode mock
const checkUserCodeMock = jest.fn();

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

jest.mock("@/utils/validateCode", () => ({
  checkUserCode: (...args: any[]) => checkUserCodeMock(...args),
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
  userCode: { table: "userCode" },
  user_ratings: { table: "user_ratings" },
}));

let cancelJobRequest: any;
let getExercise: any;
let loadSavedCode: any;
let resetCode: any;
let saveCode: any;
let submitCode: any;
let rateExercise: any;

let db: any;

import { job_results, user_ratings, userCode } from "@/drizzle/schema";
import type { Filemap } from "@/types/actionTypes";

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
  loadSavedCode = actions.loadSavedCode;
  resetCode = actions.resetCode;
  saveCode = actions.saveCode;
  submitCode = actions.submitCode;
  rateExercise = actions.rateExercise;

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

  // default: code passes validation unless overridden per test
  checkUserCodeMock.mockResolvedValue(null);
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
    timeout: 60,
    testCode: { "test.go": "package test func test()" } as Filemap,
    selectedTestPath: ["test.go"],
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

    const res = await submitCode(
      {},
      { params: { id: Number("NaN") as number } }
    );

    expect(res).toEqual({ error: "Invalid exercise id", status: 400 });
  });

  it("returns 404 if exercise not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "user-id" });
    findFirstMock.mockResolvedValueOnce(undefined);

    const res = await submitCode(
      { "main.go": "package main \n func main() {}" },
      { params: { id: 1 } }
    );

    expect(res).toEqual({ error: "Exercise not found.", status: 404 });
  });

  it("returns 400 if validateCode reports issues (unused imports gate)", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-user-id" });

    findFirstMock.mockResolvedValueOnce(baseExercise);

    checkUserCodeMock.mockResolvedValueOnce([
      "Unused import:fmt",
      "Unused import:strings",
    ]);

    const res = await submitCode(
      { "main.go": `package main\nimport "fmt"\nfunc main(){}` },
      { params: { id: baseExercise.id } }
    );

    expect(res).toEqual({
      error:
        "All imports must be used. Unused import(s): Unused import:fmt, Unused import:strings",
      status: 400,
    });

    // should fail fast: no DB writes, no MQ
    expect(deleteMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(MQJobsSenderSendMessageMock).not.toHaveBeenCalled();
  });

  it("inserts job_results when no existing row and sends MQ message", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-id" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-user-id" });

    findFirstMock.mockResolvedValueOnce(baseExercise);

    mockSelectChainOnce<any>([]);

    const submissionCode: Filemap = {
      "main.go": "package main \n func main() {}",
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
    expect(sentPayload.nodes.submission.submissionCode["protocol.go"]).toBe(
      "protocol code"
    );
    expect(sentPayload.nodes.testContainer.testFiles["test.go"]).toBe(
      "package test func test()"
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

    const res = await submitCode(
      { "student/main.go": "package main func main(){}" },
      { params: { id: baseExercise.id } }
    );

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

    expect(res).toEqual({ error: "Invalid exercise id", status: 400 });
  });

  it("returns 404 if problem not found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    mockSelectChainOnce<any>([]);

    const res = await saveCode(
      { "main.go": "package main func main()" },
      { params: { id: 1 } }
    );

    expect(res).toEqual({ error: "Exercise not found.", status: 404 });
  });

  it("inserts userCode and returns success", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    mockSelectChainOnce([{ id: 1 }]); // foundProblem
    mockSelectChainOnce([] as any); // existing userCode empty

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

  it("updates userCode when an existing row is found", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserByIdMock.mockResolvedValueOnce({ userid: "db-u1" });

    mockSelectChainOnce([{ id: 1 }]);

    mockSelectChainOnce([
      {
        id: 99,
        userId: "db-u1",
        problemId: 1,
        codeSubmitted: { "/main.go": "old" },
      },
    ]);

    const content: Filemap = { "/main.go": "new code" };

    const res = await saveCode(content, { params: { id: 1 } });

    expect(updateMock).toHaveBeenCalledWith(userCode);
    expect(updateSetMock).toHaveBeenCalledWith({ codeSubmitted: content });
    expect(updateWhereMock).toHaveBeenCalledTimes(1);

    expect(insertMock).not.toHaveBeenCalled();

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

    mockSelectChainOnce<any>([]); // no user code
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

    mockSelectChainOnce<any>([]); // no user code
    mockSelectChainOnce<any>([]); // no problem

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

    const res = await rateExercise(true, { params: { id: 1 } });

    expect(res).toEqual({ error: "Unauthorized", status: 401 });
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid problem id", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const res = await rateExercise(true, {
      params: { id: Number("NaN") as any },
    });

    expect(res).toEqual({ error: "Invalid problem id", status: 400 });
  });

  it("inserts rating when none exists", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    // first select: check if rating exists -> []
    mockSelectChainOnce<any>([]);

    const res = await rateExercise(true, { params: { id: 42 } });

    expect(insertMock).toHaveBeenCalledWith(user_ratings);
    expect(insertValuesMock).toHaveBeenCalledWith({
      userId: "u1",
      problemId: 42,
      rating: 1,
    });

    expect(res).toEqual({
      success: true,
      message: "Exercise rated successfully.",
    });
  });

  it("updates rating when one already exists", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "u1" } });

    // first select: check if rating exists -> non-empty
    mockSelectChainOnce<any>([{ id: 1 }]);

    const res = await rateExercise(false, { params: { id: 42 } });

    expect(updateMock).toHaveBeenCalledWith(user_ratings);
    expect(updateSetMock).toHaveBeenCalledWith({ rating: -1 });
    expect(updateWhereMock).toHaveBeenCalledTimes(1);

    expect(res).toEqual({
      success: true,
      message: "Exercise rated successfully.",
    });
  });
});

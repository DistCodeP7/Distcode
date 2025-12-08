import { renderHook, act } from "@testing-library/react";
import type { Paths } from "@/drizzle/schema";

import { toast } from "sonner";
import { resetCode, saveCode } from "@/app/exercises/[id]/actions";
import { useExerciseFiles } from "@/app/exercises/[id]/components/useExerciseFiles";

// --- Mock server actions ---
jest.mock("@/app/exercises/[id]/actions", () => ({
  saveCode: jest.fn(),
  resetCode: jest.fn(),
}));

// --- Mock sonner toast ---
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

type SaveCodeResult = Awaited<ReturnType<typeof saveCode>>;
type ResetCodeResult = Awaited<ReturnType<typeof resetCode>>;

describe("useExerciseFiles", () => {
  const baseInitialContents: Paths = {
    "student/main.go": "// main template",
    "student/helper.go": "// helper",
  };

  const baseStudentCode: Paths = {
    "student/main.go": "// student main",
    "student/extra.go": "// extra",
  };

  const defaultArgs = {
    exerciseId: 1,
    initialContents: baseInitialContents,
    studentCode: baseStudentCode,
  };

  const saveCodeMock = () => saveCode as jest.MockedFunction<typeof saveCode>;
  const resetCodeMock = () =>
    resetCode as jest.MockedFunction<typeof resetCode>;
  const toastSuccess = () =>
    toast.success as jest.MockedFunction<typeof toast.success>;
  const toastError = () =>
    toast.error as jest.MockedFunction<typeof toast.error>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initialises with given contents and order", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    expect(result.current.fileContents).toEqual(baseInitialContents);
    expect(result.current.fileOrder).toEqual(Object.keys(baseInitialContents));
    expect(result.current.activeFile).toBe("student/main.go");
  });

  it("creates a new .go file and sets it active", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    act(() => {
      result.current.onCreateFile("foo"); // no extension
    });

    expect(result.current.fileContents["student/foo.go"]).toBe(
      "// New file: foo.go",
    );
    expect(result.current.fileOrder).toContain("student/foo.go");
    expect(result.current.activeFile).toBe("student/foo.go");
  });

  it("prevents creating main.go and shows an error toast", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));
    const initialLength = result.current.fileOrder.length;

    act(() => {
      result.current.onCreateFile("main.go");
    });

    expect(toastError()).toHaveBeenCalledWith(
      "Cannot create a file named main.go",
    );
    expect(result.current.fileOrder.length).toBe(initialLength);
  });

  it("deletes a non-main file and updates activeFile correctly", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    act(() => {
      result.current.setActiveFile("student/helper.go");
    });

    act(() => {
      result.current.onDeleteFile("student/helper.go");
    });

    expect(result.current.fileOrder).not.toContain("student/helper.go");
    expect(result.current.activeFile).toBe("student/main.go");
  });

  it("prevents deleting student/main.go and shows error toast", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));
    const initialOrder = result.current.fileOrder.slice();

    act(() => {
      result.current.onDeleteFile("student/main.go");
    });

    expect(toastError()).toHaveBeenCalledWith(
      "Cannot delete the main.go file.",
    );
    expect(result.current.fileOrder).toEqual(initialOrder);
  });

  it("calls onBeforeSave before saving and shows success toast on success", async () => {
    const successResponse: SaveCodeResult = {
      success: true,
      message: "ok",
    };
    saveCodeMock().mockResolvedValue(successResponse);

    const onBeforeSave = jest.fn();

    const { result } = renderHook(() =>
      useExerciseFiles({
        ...defaultArgs,
        onBeforeSave,
      }),
    );

    await act(async () => {
      await result.current.onSave();
    });

    expect(onBeforeSave).toHaveBeenCalledTimes(1);
    expect(saveCodeMock()).toHaveBeenCalledTimes(1);

    const [saveMap, options] = saveCodeMock().mock.calls[0];

    expect(saveMap).toEqual(result.current.fileContents);
    expect(options).toEqual({ params: { id: defaultArgs.exerciseId } });

    expect(toastSuccess()).toHaveBeenCalledWith("Code saved successfully!");
  });

  it("shows error toast when save fails", async () => {
    const errorResponse: SaveCodeResult = {
      error: "nope",
      status: 400,
    };
    saveCodeMock().mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    await act(async () => {
      await result.current.onSave();
    });

    expect(toastError()).toHaveBeenCalledWith("Error saving code: nope");
  });

  it("confirmReset resets files to studentCode and shows success toast", async () => {
    const resetOk: ResetCodeResult = {
      success: true,
      message: "reset ok",
    } as ResetCodeResult;

    resetCodeMock().mockResolvedValue(resetOk);

    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    expect(result.current.fileContents).toEqual(baseInitialContents);

    await act(async () => {
      await result.current.confirmReset();
    });

    expect(resetCodeMock()).toHaveBeenCalledWith({
      params: { id: defaultArgs.exerciseId },
    });

    expect(result.current.fileContents).toEqual(baseStudentCode);
    expect(result.current.fileOrder).toEqual(Object.keys(baseStudentCode));

    expect(toastSuccess()).toHaveBeenCalledWith("Code reset successfully!", {
      description: "Template restored and saved code cleared.",
    });
  });

  it("confirmReset shows error toast on failure", async () => {
    const resetFailed: ResetCodeResult = {
      error: "backend broke",
      status: 500,
    } as ResetCodeResult;

    resetCodeMock().mockResolvedValue(resetFailed);

    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    await act(async () => {
      await result.current.confirmReset();
    });

    expect(toastError()).toHaveBeenCalledWith("Failed to reset code", {
      description: "backend broke",
    });
  });

  it("setEditorContent updates the active file when not resetting", () => {
    const { result } = renderHook(() => useExerciseFiles(defaultArgs));

    act(() => {
      result.current.setEditorContent("// updated content");
    });

    expect(result.current.fileContents["student/main.go"]).toBe(
      "// updated content",
    );
  });
});

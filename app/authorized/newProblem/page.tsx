import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { defaultMain } from "@/default_files/defaultMain";
import { defaultProblem } from "@/default_files/defaultProblem";
import { defaultProtocol } from "@/default_files/defaultProtocol";
import { defaultSolution } from "@/default_files/defaultSolution";
import { defaultTest } from "@/default_files/defaultTest";
import type { Paths } from "@/drizzle/schema";

export default function NewProblemPage() {
  const files: Paths = {
    "problem.md": defaultProblem,
    "student/main.go": defaultMain,
    "solution.md": defaultSolution,
    "test/main_test.go": defaultTest,
    "shared/protocol.go": defaultProtocol,
  };

  return <ProblemEditorClient files={files} initialFilesContent={{}} />;
}

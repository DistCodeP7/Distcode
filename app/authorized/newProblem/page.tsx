import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { defaultMain } from "@/default_files/defaultMain";
import { defaultProtocol } from "@/default_files/defaultProtocol";
import { defaultTest } from "@/default_files/defaultTest";
import type { Paths } from "@/drizzle/schema";

export default function NewProblemPage() {
  const files: Paths = {
    "problem.md": "# Problem Description\n\nDescribe the problem here.\n",
    "student/main.go": defaultMain,
    "solution.md": "# Solution Explanation\n\nDescribe the solution here.\n",
    "test/main_test.go": defaultTest,
    "shared/protocol.go": defaultProtocol,
  };

  return <ProblemEditorClient files={files} initialFilesContent={{}} />;
}

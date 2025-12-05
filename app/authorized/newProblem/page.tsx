import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { defaultTest } from "@/default_files/defaultTest";
import type { Paths } from "@/drizzle/schema";

export default function NewProblemPage() {
  const files: Paths = {
    "problem.md": "# Problem Description\n\nDescribe the problem here.\n",
    "student/main.go": "// student main.go\n",
    "solution.md": "# Solution Explanation\n\nDescribe the solution here.\n",
    "test/main_test.go": defaultTest,
    "shared/protocol.go": "// protocol definitions\n",
  };

  return <ProblemEditorClient files={files} initialFilesContent={{}} />;
}

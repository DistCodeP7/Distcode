import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { Paths } from "@/drizzle/schema";

export default function NewProblemPage() {
  // Only create a problem when the user saves or publishes
  // No submissionId is passed, so ProblemEditorClient will use submitProblem
  // Provide a `Paths` map: keys are paths and values are initial file contents
  const files: Paths = {
    "problem.md": "# Problem Description\n\nDescribe the problem here.\n",
    "/student/main.go": "// student main.go\n",
    "solution.md": "# Solution Explanation\n\nDescribe the solution here.\n",
    "/test/test.go": "// test cases go here\n",
    "protocol.go": "// protocol definitions\n",
  };

  return (
    <ProblemEditorClient
      files={files}
      initialFilesContent={{}}
      initialTitle=""
      initialDescription=""
      initialDifficulty=""
    />
  );
}

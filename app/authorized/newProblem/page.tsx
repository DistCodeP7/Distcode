import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { nodeSpec } from "@/drizzle/schema";

export default function NewProblemPage() {
  // Only create a problem when the user saves or publishes
  // No submissionId is passed, so ProblemEditorClient will use submitProblem

  const files: nodeSpec = {
    name: "New Problem",
    files: new Map<string, string>([
      ["/problem.md", ""],
      ["/template/main.go", ""],
      ["/solution/main.go", ""],
      ["/test/main.go", ""],
      ["/proto/protocol.go", ""],
    ]),
    envs: [],
  };

  return (
    <ProblemEditorClient
      files={files.files}
      initialFilesContent={files.files}
      initialTitle=""
      initialDescription=""
      initialDifficulty=""
    />
  );
}

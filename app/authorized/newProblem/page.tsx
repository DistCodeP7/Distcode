import ProblemEditorClient from "@/components/custom/problemEditorClient";
import type { nodeSpec } from "@/drizzle/schema";

export default function NewProblemPage() {
  // Only create a problem when the user saves or publishes
  // No submissionId is passed, so ProblemEditorClient will use submitProblem

  const files: nodeSpec = {
    Files: {
      "/problem.md": "# New Problem\n\nDescribe the problem here.",
      "/template/main.go": "// Write your template code here\n",
      "/solution/solution.md": "# Write your Solution here\n\nExplain the solution in detail.",
      "/test/main.go": "// Write your test cases here\n",
      "/proto/protocol.go": " // Define your protocol here\n",
    },
    Envs: [],
    BuildCommand: "",
    EntryCommand: "",
  };

  return (
    <ProblemEditorClient
      files={files.Files}
      initialFilesContent={files.Files}
      initialTitle=""
      initialDescription=""
      initialDifficulty=""
    />
  );
}

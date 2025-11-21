import ProblemEditorClient from "@/components/custom/problemEditorClient";
import type { nodeSpec } from "@/drizzle/schema";

export default function NewProblemPage() {
  // Only create a problem when the user saves or publishes
  // No submissionId is passed, so ProblemEditorClient will use submitProblem

  const files: nodeSpec = {
    files: {
      "/problem.md": "",
      "/template/main.go": "",
      "/solution/main.go": "",
      "/test/main.go": "",
      "/proto/protocol.go": "",
    },
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

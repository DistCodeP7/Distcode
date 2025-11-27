import ProblemEditorClient from "@/components/custom/problemEditorClient";
import type { nodeSpec } from "@/drizzle/schema";

export default function NewProblemPage() {
  const files: nodeSpec = {
    Files: {
      "/problem.md": "# New Problem\n\nDescribe the problem here.",
      "/solution.md":
        "# Write your Solution here\n\nExplain the solution in detail.",
      "/protocol.go": "// Define your protocols here\n",
      "/template/main.go": "// Write your template code here\n",
      "/test/main.go": "// Write your test cases here\n",
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

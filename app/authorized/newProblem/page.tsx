import ProblemEditorClient from "@/components/custom/problemEditorClient";
import type { nodeSpec } from "@/drizzle/schema";

export default function NewProblemPage() {
  const files: nodeSpec[] = [
    {
      Alias: "Root",
      Files: {
        "problem.md": "# New Problem\n\nDescribe the problem here.",
        "solution.md":
          "# Write your Solution here\n\nExplain the solution in detail.",
        "protocol.go": "// Define your protocols here\n",
      },
      Envs: [],
      BuildCommand: "",
      EntryCommand: "",
    },
    {
      Alias: "Student",
      Files: {
        "/student/main.go": "// Write your Student code here\n",
      },
      Envs: [],
      BuildCommand: "",
      EntryCommand: "",
    },
    {
      Alias: "Test",
      Files: {
        "/test/test.go": "// Write your solution code here\n",
      },
      Envs: [],
      BuildCommand: "",
      EntryCommand: "",
    },
  ];

  return (
    <ProblemEditorClient
      files={files}
      initialFilesContent={files}
      initialTitle=""
      initialDescription=""
      initialDifficulty=""
    />
  );
}

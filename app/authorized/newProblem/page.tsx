import ProblemEditorClient from "@/components/custom/problemEditorClient";

export default function NewProblemPage() {
  // Only create a problem when the user saves or publishes
  // No submissionId is passed, so ProblemEditorClient will use submitProblem
  const files = [
    { name: "problem.md", fileType: "markdown" as const },
    { name: "/student/main.go", fileType: "go" as const },
    { name: "solution.md", fileType: "markdown" as const },
    { name: "/test/test.go", fileType: "go" as const },
    { name: "protocol.go", fileType: "go" as const },
  ];

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

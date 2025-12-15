import type { Filemap } from "@/types/actionTypes";
import {checkUserCode} from "@/utils/validateCode";

describe("checkUserCode", () => {
    it("returns error when submission is empty", async () => {
        const res = await checkUserCode({});
        expect(res).toEqual(["No submission code provided."]);
    });

    it("returns errors for empty file contents", async () => {
        const code: Filemap = { "main.go": "   " };
        const res = await checkUserCode(code);
        expect(res).toContain("Submission code cannot be empty.");
        expect(res).toContain("Submission code must declare a package.");
        expect(res).toContain("Submission code must declare at least one function.");
    });

    it("returns error if package is missing", async () => {
        const code: Filemap = { "main.go": "func main() {}" };
        const res = await checkUserCode(code);
        expect(res).toContain("Submission code must declare a package.");
    });

    it("returns error if func is missing", async () => {
        const code: Filemap = { "main.go": "package main\n" };
        const res = await checkUserCode(code);
        expect(res).toContain("Submission code must declare at least one function.");
    });

    it("returns null when code is valid and has no unused imports", async () => {
        const code: Filemap = {
            "main.go": `package main
import (
  "fmt"
)
func main() {
  fmt.Println("hi")
}
`,
        };
        const res = await checkUserCode(code);
        expect(res).toBeNull();
    });

    it("detects unused imports inside an import block", async () => {
        const code: Filemap = {
            "main.go": `package main
import (
  "fmt"
  "strings"
)
func main() {
  fmt.Println("hi")
}
`,
        };
        const res = await checkUserCode(code);
        expect(res).toContain("Unused import:strings");
        expect(res).not.toContain("Unused import:fmt");
    });

    it("ignores blank identifier imports", async () => {
        const code: Filemap = {
            "main.go": `package main
import (
  _ "net/http/pprof"
  "fmt"
)
func main() {
  fmt.Println("hi")
}
`,
        };
        const res = await checkUserCode(code);
        expect(res).toBeNull();
    });

    it("handles aliased imports and requires alias usage", async () => {
        const code: Filemap = {
            "main.go": `package main
import (
  f "fmt"
)
func main() {
  f.Println("hi")
}
`,
        };
        const res = await checkUserCode(code);
        expect(res).toBeNull();
    });

    it("flags aliased imports when alias is not used", async () => {
        const code: Filemap = {
            "main.go": `package main
import (
  "fmt"
)
func main() {
  // fmt is not referenced as f.
}
`,
        };
        const res = await checkUserCode(code);
        expect(res).toContain('Unused import:fmt');
    });

    it("accumulates errors across multiple files", async () => {
        const code: Filemap = {
            "a.go": "package main\nfunc a(){}",
            "b.go": "package main\n", // missing func
        };
        const res = await checkUserCode(code);
        expect(res).toContain("Submission code must declare at least one function.");
    });
});

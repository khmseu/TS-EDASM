import { describe, it, expect } from "vitest";
import { assemble } from "../src/index";
describe("Debug Tests", () => {
  it("should handle * in expressions", () => {
    const source = `
      ORG $1000
      BCC *
    `;
    const result = assemble(source, { origin: 0x1000 });
    console.log("ok:", result.ok);
    if (!result.ok) {
      console.log("errors:", result.errors);
    }
    expect(result.ok).toBe(true);
    expect(result.artifacts?.objectBytes?.length).toBe(2);
    expect(result.artifacts?.objectBytes?.[0]).toBe(0x90); // BCC
    expect(result.artifacts?.objectBytes?.[1]).toBe(0xfe); // -2 (branch to current PC)
  });
  it("should handle EQU", () => {
    const source = `
      MYCONST EQU $42
      
      ORG $8000
      LDA #MYCONST
    `;
    const result = assemble(source, { origin: 0x8000 });
    console.log("EQU ok:", result.ok);
    if (!result.ok) {
      console.log("EQU errors:", result.errors);
    }
    expect(result.ok).toBe(true);
    expect(result.artifacts?.symbols.get("MYCONST")).toBe(0x42);
  });
});
//# sourceMappingURL=debug.test.js.map

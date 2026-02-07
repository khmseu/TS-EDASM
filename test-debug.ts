import { assemble } from "./src/index";

// Test * (current PC) - the simplest test
const star_source = `
  ORG $1000
  BCC *
`;

console.log("=== Testing * (current PC) ===");
const star_result = assemble(star_source, { origin: 0x1000 });
console.log("ok:", star_result.ok);
if (!star_result.ok) {
  console.log("errors:", star_result.errors);
} else {
  if (star_result.artifacts?.objectBytes) {
    const bytes = Array.from(star_result.artifacts.objectBytes)
      .map((b) => "0x" + b.toString(16).padStart(2, "0"))
      .join(" ");
    console.log("bytes:", bytes);
  }
}

// Test EQU
const equ_source = `
  MYCONST EQU $42
  
  ORG $8000
  LDA #MYCONST
`;

console.log("\n=== Testing EQU ===");
const equ_result = assemble(equ_source, { origin: 0x8000 });
console.log("ok:", equ_result.ok);
if (!equ_result.ok) {
  console.log("errors:", equ_result.errors);
} else {
  console.log("MYCONST value:", equ_result.artifacts?.symbols.get("MYCONST"));
}

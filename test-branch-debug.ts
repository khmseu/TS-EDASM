// Debug test to check if branch instruction detection works
import { AssemblyOptions, assemble } from './src/assembler';

const source = `
      ORG $8000
START NOP
      DS 200
      BNE START
    `;

console.log('Running branch instruction test...');
const result = assemble(source, { origin: 0x8000 });

console.log('Assembly result:', {
  ok: result.ok,
  errors: result.errors,
  errorCount: result.errors.length
});

if (result.errors.length > 0) {
  console.log('First error:', result.errors[0]);
  const hasRangeOrBranch = /range|branch/i.test(result.errors[0]);
  console.log('Contains "range" or "branch"?', hasRangeOrBranch);
}

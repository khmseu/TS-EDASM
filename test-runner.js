#!/usr/bin/env node
// Test runner that writes detailed output to log files

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Create logs directory
const logsDir = './test_logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const logFile = path.join(logsDir, `test-runner_${timestamp}.log`);
const summaryFile = path.join(logsDir, `test-summary_${timestamp}.txt`);

const logStream = fs.createWriteStream(logFile, { flags: 'w' });
const summaryStream = fs.createWriteStream(summaryFile, { flags: 'w' });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

function summary(msg) {
  console.log(msg);
  summaryStream.write(msg + '\n');
}

log('═══════════════════════════════════════════');
log('TS-EDASM Test Runner');
log('═══════════════════════════════════════════');
log(`Log file: ${logFile}`);
log(`Summary file: ${summaryFile}`);
log('');

async function runTests() {
  try {
    // Check if dist exists
    const fs = require('fs');
    if (!fs.existsSync('./dist/assembler/index.js')) {
      log('✗ ERROR: dist/assembler/index.js not found');
      log('Please build the project first: npm run build');
      summary('ERROR: Project not built. Run: npm run build');
      process.exit(1);
    }
    
    log('Importing modules...');
    const { assemble } = require('./dist/assembler/index.js');
    log('✓ Modules imported successfully');
    log('');

    // Test counter
    let passCount = 0;
    let failCount = 0;

    // Test 1: Branch instruction
    log('=== Test 1: Branch instruction detection ===');
    const test1 = assemble(`
      ORG $8000
START NOP
      DS 200
      BNE START
    `);
    const test1Pass = !test1.ok && test1.errors.some(e => /range|branch/i.test(e));
    if (test1Pass) {
      log('✓ PASS: Branch instruction correctly detected as out of range');
      passCount++;
    } else {
      log('✗ FAIL: Expected branch out of range error');
      log(`  Got: ok=${test1.ok}, errors=${JSON.stringify(test1.errors)}`);
      failCount++;
    }
    log('');

    // Test 2: Symbol value
    log('=== Test 2: Symbol value return type ===');
    const test2 = assemble(`
      VALUE EQU $42
      ORG $8000
      LDA #VALUE
    `);
    const valueResult = test2.artifacts?.symbols.get('VALUE');
    const test2Pass = test2.ok && valueResult === 0x42 && typeof valueResult === 'number';
    if (test2Pass) {
      log('✓ PASS: Symbol.get() returns number value');
      log(`  VALUE = 0x${valueResult.toString(16).toUpperCase()}`);
      passCount++;
    } else {
      log('✗ FAIL: Symbol.get() error');
      log(`  Got: ${valueResult} (type: ${typeof valueResult})`);
      log(`  Expected: 66 (type: number)`);
      failCount++;
    }
    log('');

    // Test 3: * symbol
    log('=== Test 3: Special * symbol for PC ===');
    const test3 = assemble(`
      ORG $8000
      NOP
      ORG $9000
      NOP
    `);
    const starSymbol = test3.artifacts?.symbols.get('*');
    const test3Pass = test3.ok && starSymbol === 0x9001;
    if (test3Pass) {
      log('✓ PASS: * symbol tracks final PC');
      log(`  * = 0x${starSymbol.toString(16).toUpperCase()}`);
      passCount++;
    } else {
      log('✗ FAIL: * symbol error');
      log(`  Got: 0x${starSymbol?.toString(16) || 'undefined'}`);
      log(`  Expected: 0x9001`);
      failCount++;
    }
    log('');

    // Test 4: EQU directive
    log('=== Test 4: EQU directive with expressions ===');
    const test4 = assemble(`
      MYCONST EQU $42
      ANOTHER EQU MYCONST + 10
      ORG $8000
      LDA #MYCONST
      LDX #ANOTHER
    `);
    const const1 = test4.artifacts?.symbols.get('MYCONST');
    const const2 = test4.artifacts?.symbols.get('ANOTHER');
    const code = test4.artifacts?.objectBytes;
    const test4Pass = test4.ok && const1 === 0x42 && const2 === 0x4C && 
                      code && code[0] === 0xA9 && code[1] === 0x42;
    if (test4Pass) {
      log('✓ PASS: EQU directive works correctly');
      log(`  MYCONST = 0x${const1.toString(16).toUpperCase()}`);
      log(`  ANOTHER = 0x${const2.toString(16).toUpperCase()}`);
      passCount++;
    } else {
      log('✗ FAIL: EQU directive error');
      log(`  MYCONST: ${const1} (expected 0x42)`);
      log(`  ANOTHER: ${const2} (expected 0x4C)`);
      if (code) {
        log(`  Code[0]: 0x${code[0].toString(16)} (expected 0xa9)`);
        log(`  Code[1]: 0x${code[1].toString(16)} (expected 0x42)`);
      }
      failCount++;
    }
    log('');

    // Test 5: All branch instructions
    log('=== Test 5: All branch instructions ===');
    const mnemonics = ['BEQ', 'BNE', 'BCC', 'BCS', 'BMI', 'BPL', 'BVC', 'BVS'];
    let branchesPass = 0;
    for (const mnem of mnemonics) {
      const result = assemble(`
        ORG $8000
START NOP
        DS 200
        ${mnem} START
      `);
      if (!result.ok && result.errors.some(e => /range|branch/i.test(e))) {
        branchesPass++;
      } else {
        log(`✗ ${mnem}: Got ${result.errors[0] || 'no error'}`);
      }
    }
    if (branchesPass === mnemonics.length) {
      log(`✓ PASS: All ${mnemonics.length} branch instructions detected correctly`);
      passCount++;
    } else {
      log(`✗ FAIL: Only ${branchesPass}/${mnemonics.length} branch instructions passed`);
      failCount++;
    }
    log('');

    // Summary
    log('═══════════════════════════════════════════');
    log('TEST SUMMARY');
    log('═══════════════════════════════════════════');
    log(`Passed: ${passCount}`);
    log(`Failed: ${failCount}`);
    log(`Total:  ${passCount + failCount}`);
    log('');

    summary('TEST RESULTS');
    summary('═'.repeat(50));
    summary(`Passed: ${passCount}/${passCount + failCount}`);
    summary(`Failed: ${failCount}/${passCount + failCount}`);
    if (failCount === 0) {
      summary('✓ ALL TESTS PASSED!');
    } else {
      summary('✗ Some tests failed. Review full log for details.');
    }
    summary('');
    summary(`Full log: ${logFile}`);

  } catch (err) {
    log(`✗ ERROR: ${err.message}`);
    log(err.stack);
    summary(`ERROR: ${err.message}`);
    process.exit(1);
  } finally {
    log('');
    log(`Test run completed at ${new Date().toISOString()}`);
    logStream.end();
    summaryStream.end();
    
    setTimeout(() => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('✓ Logs written to test_logs/ directory');
      console.log(`  Full log:     ${logFile}`);
      console.log(`  Summary:      ${summaryFile}`);
      console.log('═══════════════════════════════════════════');
      process.exit(failCount > 0 ? 1 : 0);
    }, 500);
  }
}

runTests();


# CLI Usage Examples

## Basic Assembly

### Simple Program

```bash
# Create a simple program
cat > hello.s << 'EOF'
        ORG $2000

START   LDX #0
.LOOP   LDA MSG,X
        BEQ .DONE
        JSR $FDED
        INX
        BNE .LOOP
.DONE   RTS

MSG     ASC "HELLO, WORLD!"
        DB $00
EOF

# Assemble it
edasm asm hello.s

# Result: hello.s.obj created
```

### With Listing

```bash
# Generate assembly listing
edasm asm hello.s -l

# View the listing
cat hello.s.obj.lst
```

Output:

```
2000  A2 00         START   LDX #0
2002  BD 0D 20      .LOOP   LDA MSG,X
2005  F0 06                 BEQ .DONE
2007  20 ED FD              JSR $FDED
200A  E8                    INX
200B  D0 F5                 BNE .LOOP
200D  60            .DONE   RTS
200E  48 45 4C 4C   MSG     ASC "HELLO, WORLD!"
2012  4F 2C 20 57
2016  4F 52 4C 44
201A  21
201B  00                    DB $00
```

## Advanced Assembly

### 65C02 Code

```bash
cat > 65c02demo.s << 'EOF'
        ORG $C000

; Use 65C02 instructions
START   STZ $00         ; Store zero
        BRA NEXT        ; Branch always

NEXT    PHX             ; Push X
        PHY             ; Push Y

        ; Do something

        PLY             ; Pull Y
        PLX             ; Pull X
        RTS
EOF

# Assemble with 65C02 support
edasm asm 65c02demo.s --cpu 65C02 -o 65c02demo.obj
```

### Custom Origin Address

```bash
cat > hiload.s << 'EOF'
; Program loaded at $8000
        ORG $8000

ENTRY   LDA #$00
        STA $C000
        RTS
EOF

# Assemble at specific address
edasm asm hiload.s --origin 0x8000 -v
```

Output:

```
Assembling: hiload.s
  Origin: $8000
Object file written: hiload.s.obj (6 bytes)
Assembly successful: hiload.s.obj
```

## Multi-Module Projects

### Creating Modules

**main.s:**

```assembly
        REL                 ; Relocatable
        EXT PRINT,GETKEY    ; External references
        ENT MAIN            ; Entry point

        ORG $8000

MAIN    LDA #<GREETING
        STA $80
        LDA #>GREETING
        STA $81
        JSR PRINT

        JSR GETKEY
        RTS

GREETING
        ASC "HELLO!"
        DB $00
```

**io.s:**

```assembly
        REL
        ENT PRINT,GETKEY

        ORG $8000

; Print null-terminated string at ($80)
PRINT   LDY #0
.LOOP   LDA ($80),Y
        BEQ .DONE
        JSR $FDED
        INY
        BNE .LOOP
.DONE   RTS

; Get a key
GETKEY  LDA $C000
        BPL GETKEY
        STA $C010
        RTS
```

### Building Multi-Module Project

```bash
# Assemble modules
edasm asm main.s -r -o main.obj -v
edasm asm io.s -r -o io.obj -v

# Link them together
edasm link main.obj io.obj -o program --origin 0x8000 -v
```

Output:

```
Assembling: main.s
  Mode: Relocatable
Object file written: main.obj (32 bytes)

Assembling: io.s
  Mode: Relocatable
Object file written: io.obj (28 bytes)

Linking 2 object file(s):
  - main.obj
  - io.obj
  Origin: $8000
Executable written: program (60 bytes)
Link successful: program
```

## Batch Processing

### Assemble Multiple Files

```bash
# Assemble all .s files in directory
for file in *.s; do
    echo "Assembling $file..."
    edasm asm "$file" -o "${file%.s}.obj" -l
done
```

### Build Script

```bash
#!/bin/bash
# build.sh - Build multi-module project

set -e

echo "Building project..."

# Clean old objects
rm -f *.obj

# Assemble modules
edasm asm main.s -r -o main.obj
edasm asm lib1.s -r -o lib1.obj
edasm asm lib2.s -r -o lib2.obj

# Link
edasm link main.obj lib1.obj lib2.obj -o program --origin 0x2000

echo "Build complete: program"
```

## Working with Different Address Formats

```bash
# Hexadecimal (0x prefix)
edasm asm program.s --origin 0x8000

# Hexadecimal ($ prefix)
edasm asm program.s --origin '$8000'

# Hexadecimal (h suffix)
edasm asm program.s --origin 8000h

# Decimal
edasm asm program.s --origin 32768
```

## Error Handling

### Catching Errors in Scripts

```bash
#!/bin/bash

if edasm asm program.s -o program.obj; then
    echo "Assembly successful"
    edasm link program.obj -o program
else
    echo "Assembly failed!"
    exit 1
fi
```

### Verbose Error Information

```bash
# Get detailed error output
edasm asm bad_program.s -v 2>&1 | tee build.log
```

## Testing

### Quick Syntax Check

```bash
# Assemble without saving (check for errors)
edasm asm test.s -o /dev/null
```

### Compare Outputs

```bash
# Assemble twice and compare
edasm asm program.s -o version1.obj
edasm asm program.s -o version2.obj
diff version1.obj version2.obj && echo "Deterministic output ✓"
```

## Integration with Tools

### Disassembler Integration

```bash
# Assemble and disassemble
edasm asm program.s -l
cat program.s.obj.lst  # View assembly listing
```

### Hex Dump

```bash
# View object file in hex
edasm asm program.s
hexdump -C program.s.obj
```

### Size Check

```bash
# Check object file size
edasm asm program.s -v 2>&1 | grep "bytes"
```

## Makefile Integration

```makefile
# Makefile for 6502 project

AS = edasm asm
LINK = edasm link
ASFLAGS = -r -l
LINKFLAGS = --origin 0x8000

OBJS = main.obj lib.obj utils.obj

all: program

program: $(OBJS)
 $(LINK) $(OBJS) -o $@ $(LINKFLAGS)

%.obj: %.s
 $(AS) $< -o $@ $(ASFLAGS)

clean:
 rm -f *.obj *.obj.lst program

.PHONY: all clean
```

Build with:

```bash
make
```

## Common Workflows

### ProDOS Development

```bash
# Create ProDOS system program
edasm asm program.s --origin 0x2000 -o program.sys
```

### ROM Development

```bash
# Assemble for ROM at $C000-$CFFF
edasm asm rom.s --origin 0xC000 -o rom.bin
```

### Library Creation

```bash
# Create reusable library module
edasm asm mylib.s -r -o mylib.obj

# Use in other projects
edasm link main.obj mylib.obj -o program
```

---

For more information, see [QUICKREF.md](QUICKREF.md) or run:

```bash
edasm help
```

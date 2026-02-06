; Multi-module test - Module 2 (multiply routine)
        REL
        EXT ARG1,ARG2
        ENT MULTIPLY

        ORG $8000

; Multiply ARG1 * ARG2, return result in A
; Uses simple addition loop
MULTIPLY
        LDA #0        ; Clear accumulator
        LDY ARG2      ; Load multiplier
        BEQ .DONE     ; If zero, done
.LOOP   CLC
        ADC ARG1      ; Add multiplicand
        DEY
        BNE .LOOP
.DONE   RTS

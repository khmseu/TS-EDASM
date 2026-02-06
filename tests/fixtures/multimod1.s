; Multi-module test - Module 1 (main program)
        REL
        EXT MULTIPLY
        ENT MAIN

        ORG $8000

; Main entry point
MAIN    LDA #10
        STA ARG1
        LDA #20
        STA ARG2
        JSR MULTIPLY
        STA RESULT
        RTS

; Variables
ARG1    DS 1
ARG2    DS 1
RESULT  DS 1

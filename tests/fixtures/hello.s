; Simple "Hello World" program for Apple II
; Demonstrates basic assembly and ProDOS calls

        ORG $2000
        
; ProDOS MLI call addresses
PRODOS  EQU $BF00
COUT    EQU $FDED

; Entry point
MAIN    LDX #0
.LOOP   LDA MESSAGE,X
        BEQ .DONE
        JSR COUT
        INX
        BNE .LOOP
.DONE   RTS

; Data
MESSAGE ASC "HELLO, WORLD!"
        DB $00

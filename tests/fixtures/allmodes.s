; Test all 6502 addressing modes
        ORG $6000

; Immediate
        LDA #$12
        LDX #$34
        LDY #$56
        ADC #$78
        AND #$9A
        CMP #$BC
        CPX #$DE
        CPY #$F0
        EOR #$11
        ORA #$22
        SBC #$33

; Zero Page
        LDA $10
        LDX $20
        LDY $30
        STA $40
        STX $50
        STY $60
        ADC $70
        AND $80
        ASL $90
        BIT $A0
        CMP $B0
        CPX $C0
        CPY $D0
        DEC $E0
        EOR $F0
        INC $00
        LSR $10
        ORA $20
        ROL $30
        ROR $40
        SBC $50

; Zero Page,X
        LDA $10,X
        LDY $20,X
        STA $30,X
        STY $40,X
        ADC $50,X
        AND $60,X
        ASL $70,X
        CMP $80,X
        DEC $90,X
        EOR $A0,X
        INC $B0,X
        LSR $C0,X
        ORA $D0,X
        ROL $E0,X
        ROR $F0,X
        SBC $00,X

; Zero Page,Y
        LDX $10,Y
        STX $20,Y

; Absolute
        LDA $1234
        LDX $2345
        LDY $3456
        STA $4567
        STX $5678
        STY $6789
        ADC $789A
        AND $89AB
        ASL $9ABC
        BIT $ABCD
        CMP $BCDE
        CPX $CDEF
        CPY $DEF0
        DEC $EF01
        EOR $F012
        INC $0123
        JMP $1234
        JSR $2345
        LSR $3456
        ORA $4567
        ROL $5678
        ROR $6789
        SBC $789A

; Absolute,X
        LDA $1000,X
        LDY $2000,X
        STA $3000,X
        ADC $4000,X
        AND $5000,X
        ASL $6000,X
        CMP $7000,X
        DEC $8000,X
        EOR $9000,X
        INC $A000,X
        LSR $B000,X
        ORA $C000,X
        ROL $D000,X
        ROR $E000,X
        SBC $F000,X

; Absolute,Y
        LDA $1000,Y
        STA $2000,Y
        ADC $3000,Y
        AND $4000,Y
        CMP $5000,Y
        EOR $6000,Y
        ORA $7000,Y
        SBC $8000,Y

; (Indirect,X)
        LDA ($10,X)
        STA ($20,X)
        ADC ($30,X)
        AND ($40,X)
        CMP ($50,X)
        EOR ($60,X)
        ORA ($70,X)
        SBC ($80,X)

; (Indirect),Y
        LDA ($10),Y
        STA ($20),Y
        ADC ($30),Y
        AND ($40),Y
        CMP ($50),Y
        EOR ($60),Y
        ORA ($70),Y
        SBC ($80),Y

; Indirect (JMP only)
        JMP ($1234)

; Implied
        BRK
        CLC
        CLD
        CLI
        CLV
        DEX
        DEY
        INX
        INY
        NOP
        PHA
        PHP
        PLA
        PLP
        RTI
        RTS
        SEC
        SED
        SEI
        TAX
        TAY
        TSX
        TXA
        TXS
        TYA

; Accumulator
        ASL A
        LSR A
        ROL A
        ROR A

; Relative (all branch instructions)
        BCC *+2
        BCS *+2
        BEQ *+2
        BMI *+2
        BNE *+2
        BPL *+2
        BVC *+2
        BVS *+2

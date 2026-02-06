; Test 65C02 extended instructions
        ORG $7000

; New 65C02 opcodes
        BRA *+2       ; Branch always
        PHX           ; Push X
        PHY           ; Push Y  
        PLX           ; Pull X
        PLY           ; Pull Y

; Store Zero
        STZ $10       ; Zero page
        STZ $10,X     ; Zero page,X
        STZ $1000     ; Absolute
        STZ $1000,X   ; Absolute,X

; Test and Reset/Set Bits
        TRB $10       ; Zero page
        TRB $1000     ; Absolute
        TSB $10       ; Zero page
        TSB $1000     ; Absolute

; (Indirect) addressing
        LDA ($10)
        STA ($20)
        CMP ($30)
        EOR ($40)
        AND ($50)
        ORA ($60)
        ADC ($70)
        SBC ($80)

; JMP (Indirect,X)
        JMP ($1000,X)

; Bit Immediate (65C02)
        BIT #$FF

; BIT Zero page,X and Absolute,X (65C02)
        BIT $10,X
        BIT $1000,X

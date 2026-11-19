export const config = {
  fields: {
    evidence: "evidence",
    phoneme: "phonemes",
    lexeme: "lexemes",
    rule: "rules",
    derivation: "derivations",
    example: "examples",
    note: "notes",
  },
  defaults: {
    brief: "",
    evidence: [],
    phonemes: [],
    lexemes: [],
    rules: [],
    derivations: [],
    examples: [],
    notes: [],
  },
  tabs: ["词典阅读", "音位与词根", "规则与派生", "例句与复核", "语言交付"],
} as const;

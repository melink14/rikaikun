export enum KANA {
  HIRAGANA_START = 0x3041,
  HIRAGANA_END = 0x309f,
  KATAKANA_START = 0x30a0,
  KATAKANA_END = 0x30ff,
  HW_KATAKANA_START = 0xff66,
  HW_KATAKANA_END = 0xff9d,
}

export enum PUNCTUATION {
  VOICED_MARK = 0xff9e,
  SEMI_VOICED_MARK = 0xff9f,
  NON_JOINER = 0x200c,
  // These two are only used in full-width and may not be needed
  DAKUTEN = 0x3099,
  HAN_DAKUTEN = 0x309a,
}

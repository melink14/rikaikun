export type DictData = {
  entry: string;
  reason?: string;
};

export type DictEntryData = {
  kanji: string;
  onkun: string;
  nanori: string;
  bushumei: string;
  misc: Record<string, string>;
  eigo: string;
  hasNames: boolean;
  data: DictData[];
  hasMore: boolean;
  title: string;
  index: number;
  matchLen: number;
};

export interface Deinflection {
  word: string;
  type: number;
  reason: string;
}

export interface DeinflectionRule {
  /** The conjugated ending which we are deinflecting from. */
  from: string;
  /** The original form we are deinflecting to. */
  to: string;
  /** An int mask representing the types of words this rule applies to. */
  typeMask: number;
  /** An index into the difReason array that describes this inflection. */
  reasonIndex: number;
}

/**
 * Deinflection rules grouped by their from length. This allows trying all rules
 * of a given length before trying shorter lengths.
 */
export interface DeinflectionRuleGroup {
  fromLength: number;
  rules: DeinflectionRule[];
}

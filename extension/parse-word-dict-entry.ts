const WORD_DICT_ENTRY_REGEX = /^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//;

type WordDictEntry = {
  word: string;
  pronunciation: string;
  definitions: string[];
};

export const parseWordDictEntry = (line: string): WordDictEntry | null => {
  const [, word, pronunciation, definitions] =
    line.match(WORD_DICT_ENTRY_REGEX) || [];
  if (!word || !definitions) {
    console.log('Improperly formatted word dict line', line);
    return null;
  }
  return {
    word,
    pronunciation: pronunciation || '',
    definitions: definitions.split('/'),
  };
};

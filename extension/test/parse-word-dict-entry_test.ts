import { expect } from '@esm-bundle/chai';
import { parseWordDictEntry } from '../parse-word-dict-entry';

describe('parseWordDictEntry', function () {
  describe('with a valid word dict line', function () {
    describe('when word dict line has pronunciation', function () {
      const wordDictLine =
        '<word> [<pronunciation>] /<definition-1>/<definition-2>/<definition-3>/';

      it('parses the word part of the entry and returns in word property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.contain({ word: '<word>' });
      });

      it('parses the pronunciation part of the entry and returns in pronunciation property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.contain({
          pronunciation: '<pronunciation>',
        });
      });

      it('parses the definitions part of the entry and returns in definitions property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.deep.contain({
          definitions: ['<definition-1>', '<definition-2>', '<definition-3>'],
        });
      });
    });

    describe('when word dict line does not have pronunciation', function () {
      const wordDictLine = '<word> /<definition-1>/<definition-2>/';

      it('parses the word part of the entry and returns in word property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.contain({ word: '<word>' });
      });

      it('parses the pronunciation part of the entry as an empty string and returns in pronunciation property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.contain({ pronunciation: '' });
      });

      it('parses the definitions part of the entry and returns in definitions property', function () {
        const wordDictEntry = parseWordDictEntry(wordDictLine);

        expect(wordDictEntry).to.deep.contain({
          definitions: ['<definition-1>', '<definition-2>'],
        });
      });
    });
  });

  describe('with an invalid word dict line', function () {
    it('returns null when you pass in an empty word dict line', function () {
      const emptyWordDictLine = '';

      const wordDictEntry = parseWordDictEntry(emptyWordDictLine);

      expect(wordDictEntry).to.equal(null);
    });

    it('returns null when you pass in a word dict line where definitions has no closing slash', function () {
      const wordDictLineWithNoClosingSlash = '<word> [<pronunciation>] /';

      const wordDictEntry = parseWordDictEntry(wordDictLineWithNoClosingSlash);

      expect(wordDictEntry).to.equal(null);
    });

    it('returns null when you pass in a word dict line with no definitions', function () {
      const wordDictLineWithNoDefinitions = '<word> [<pronunciation>] //';

      const wordDictEntry = parseWordDictEntry(wordDictLineWithNoDefinitions);

      expect(wordDictEntry).to.equal(null);
    });
  });
});

import { Config } from '../configuration';
import { RcxDict } from '../data';
import { expect, use } from '@esm-bundle/chai';
import chaiLike from 'chai-like';
import chaiThings from 'chai-things';
import sinonChrome from 'sinon-chrome';

// Extend chai-like to allow using regex for fuzzy string matching inside
// objects.
chaiLike.extend({
  match: function (object, expected) {
    return typeof object === 'string' && expected instanceof RegExp;
  },
  assert: function (object, expected) {
    return expected instanceof RegExp && expected.test(object);
  },
});

use(chaiLike);
use(chaiThings);

let rcxDict: RcxDict;

const DEFAULT_DICT_ENTRY = {
  kanji: '',
  onkun: '',
  nanori: '',
  bushumei: '',
  misc: {},
  eigo: '',
  hasNames: false,
  data: [],
  hasMore: false,
  title: '',
  index: 0,
  matchLen: 0,
};

describe('data.ts', function () {
  // Increase timeout from 2000ms since data tests can take longer.
  // Make it relative to current timeout so config level changes are taken
  // into account. (ie browserstack)
  this.timeout(this.timeout() * 3);

  before(async function () {
    // stub sinon chrome getURL method to return the path it's given
    // Required to load dictionary files.
    sinonChrome.extension.getURL.returnsArg(0);
    rcxDict = await RcxDict.create({} as Config);
  });

  describe('deinflect', function () {
    it('should include deinflections of length one or more', function () {
      expect(rcxDict.deinflect('です')).to.include.something.like({
        word: 'だ',
      });
    });

    it('should not include empty deinflections', function () {
      expect(rcxDict.deinflect('な')).to.not.include.something.like({
        word: '',
      });
    });
  });

  describe('wordSearch', function () {
    it('should return results for deinflected copula', function () {
      expect(
        rcxDict.wordSearch('です', /* doNames= */ false)?.data
      ).to.include.something.like({
        entry: /^だ .*/,
        reason: '&lt; polite',
      });
    });

    it('should not include copula deinflections for non-copula words', function () {
      expect(
        rcxDict.wordSearch('ぼんです', /* doNames= */ false)?.data
      ).to.not.include.something.like({ entry: /^凡打 .*/ });
    });

    it('should return results for words with punctuation', function () {
      expect(
        rcxDict.wordSearch('ＤＶＤ-ＲＯＭ', /* doNames= */ false)?.data
      ).to.include.something.like({ entry: /^ＤＶＤ-ＲＯＭ .*/ });
    });
  });

  describe('makeText', function () {
    it('returns an empty string if null dict entry is passed in', function () {
      const text = rcxDict.makeText(null, /* max= */ 1);

      expect(text).to.equal('');
    });

    describe('with a dict entry consisting of empty kanji but present data properties', function () {
      const nonKanjiDictEntry = {
        ...DEFAULT_DICT_ENTRY,
        data: [
          {
            entry:
              '<word-1> [<pronunciation-1>] /<definition-1>/<definition-2>/<definition-3>/',
            reason: undefined,
          },
          {
            entry: '<word-2> /<definition-1>/<definition-2>/',
            reason: undefined,
          },
        ],
      };

      it('returns 1 data entry as text with tabs separating word, pronunciation, and definitions; with semicolons separating each definition; ending in a newline', function () {
        const text = rcxDict.makeText(nonKanjiDictEntry, /* max= */ 1);

        expect(text).to.equal(
          '<word-1>\t<pronunciation-1>\t<definition-1>; <definition-2>; <definition-3>\n'
        );
      });

      it('returns 2 data entries as text with newlines separating each data entry text; ending in a newline', function () {
        const text = rcxDict.makeText(nonKanjiDictEntry, /* max= */ 2);

        expect(text).to.equal(
          '<word-1>\t<pronunciation-1>\t<definition-1>; <definition-2>; <definition-3>\n<word-2>\t<definition-1>; <definition-2>\n'
        );
      });

      it('when max is greater than the number of data entries, it returns all data entries as text with each data entry text separated by newlines; ending in a newline', function () {
        const text = rcxDict.makeText(nonKanjiDictEntry, /* max= */ 1000);

        expect(text).to.equal(
          '<word-1>\t<pronunciation-1>\t<definition-1>; <definition-2>; <definition-3>\n<word-2>\t<definition-1>; <definition-2>\n'
        );
      });

      describe('when data entry is an invalid format', function () {
        it('returns an empty string when all the data entries are an invalid format', function () {
          const nonKanjiDictEntryWithInvalidEntries = {
            ...DEFAULT_DICT_ENTRY,
            data: [
              { entry: '<invalid-format-entry>', reason: undefined },
              { entry: '<invalid-format-entry-2>', reason: undefined },
            ],
          };

          const text = rcxDict.makeText(
            nonKanjiDictEntryWithInvalidEntries,
            /* max= */ 1
          );

          expect(text).to.equal('');
        });

        it('returns a valid format data entry as text when there is an invalid format data entry and a valid format data entry', function () {
          const nonKanjiDictEntryWithInvalidEntryAndValidEntry = {
            ...DEFAULT_DICT_ENTRY,
            data: [
              { entry: '<invalid-format-entry>', reason: undefined },
              {
                entry:
                  '<valid-word> [<valid-pronunciation>] /<valid-definition>/',
                reason: undefined,
              },
            ],
          };

          const text = rcxDict.makeText(
            nonKanjiDictEntryWithInvalidEntryAndValidEntry,
            /* max= */ 2
          );

          expect(text).to.equal(
            '<valid-word>\t<valid-pronunciation>\t<valid-definition>\n'
          );
        });
      });
    });

    describe('with a kanji dict entry', function () {
      const kanjiDictEntry = {
        ...DEFAULT_DICT_ENTRY,
        kanji: '<kanji-entry>',
        onkun: '<onkun-entry-1>、 <onkun-entry-2>、 <onkun-entry-3>',
        nanori: '<nanori-entry>',
        bushumei: '<bushumei-entry>',
        misc: {
          U: '<U-misc-entry>',
          B: '<B-misc-entry>',
          G: '<G-misc-entry>',
          S: '<S-misc-entry>',
          F: '<F-misc-entry>',
          N: '<N-misc-entry>',
          V: '<V-misc-entry>',
          H: '<H-misc-entry>',
          DK: '<DK-misc-entry>',
          DL: '<DL-misc-entry>',
          L: '<L-misc-entry>',
          DN: '<DN-misc-entry>',
          E: '<E-misc-entry>',
          IN: '<IN-misc-entry>',
          P: '<P-misc-entry>',
          I: '<I-misc-entry>',
          Y: '<Y-misc-entry>',
        },
        eigo: '<eigo-entry-1>; <eigo-entry-2>; <eigo-entry-3>',
      };

      it('returns 1 kanji entry formatted as text with newlines separating kanji, eigo, onkun, nanori, bushumei, and misc lines; misc name and entry separated by a tab; ending in newline', function () {
        const text = rcxDict.makeText(kanjiDictEntry, /* max= */ 1);

        expect(text).to.equal(
          '<kanji-entry>\n<eigo-entry-1>; <eigo-entry-2>; <eigo-entry-3>\n<onkun-entry-1>、 <onkun-entry-2>、 <onkun-entry-3>\n名乗り\t<nanori-entry>\n部首名\t<bushumei-entry>\nHalpern\t<H-misc-entry>\nHeisig 5th Edition\t<L-misc-entry>\nHeisig 6th Edition\t<DN-misc-entry>\nHenshall\t<E-misc-entry>\nKanji Learners Dictionary\t<DK-misc-entry>\nKanji Learners Dictionary 2nd Edition\t<DL-misc-entry>\nNelson\t<N-misc-entry>\nNew Nelson\t<V-misc-entry>\nPinYin\t<Y-misc-entry>\nSkip Pattern\t<P-misc-entry>\nTuttle Kanji & Kana\t<IN-misc-entry>\nTuttle Kanji Dictionary\t<I-misc-entry>\nUnicode\t<U-misc-entry>\n'
        );
      });

      it('even with large max, returns a single kanji data entry as text', function () {
        const text = rcxDict.makeText(kanjiDictEntry, /* max= */ 1000);

        expect(text).to.equal(
          '<kanji-entry>\n<eigo-entry-1>; <eigo-entry-2>; <eigo-entry-3>\n<onkun-entry-1>、 <onkun-entry-2>、 <onkun-entry-3>\n名乗り\t<nanori-entry>\n部首名\t<bushumei-entry>\nHalpern\t<H-misc-entry>\nHeisig 5th Edition\t<L-misc-entry>\nHeisig 6th Edition\t<DN-misc-entry>\nHenshall\t<E-misc-entry>\nKanji Learners Dictionary\t<DK-misc-entry>\nKanji Learners Dictionary 2nd Edition\t<DL-misc-entry>\nNelson\t<N-misc-entry>\nNew Nelson\t<V-misc-entry>\nPinYin\t<Y-misc-entry>\nSkip Pattern\t<P-misc-entry>\nTuttle Kanji & Kana\t<IN-misc-entry>\nTuttle Kanji Dictionary\t<I-misc-entry>\nUnicode\t<U-misc-entry>\n'
        );
      });

      describe('with empty fields', function () {
        it('uses a hyphen in the place of the eigo field after kanji field when the eigo field is empty', function () {
          const emptyEigoKanjiDictEntry = { ...kanjiDictEntry, eigo: '' };

          const text = rcxDict.makeText(emptyEigoKanjiDictEntry, /* max= */ 1);

          expect(text).to.contain('<kanji-entry>\n-\n');
        });

        it('omits the nanori (名乗り) field when nanori field is empty', function () {
          const emptyNanoriKanjiDictEntry = { ...kanjiDictEntry, nanori: '' };

          const text = rcxDict.makeText(
            emptyNanoriKanjiDictEntry,
            /* max= */ 1
          );

          expect(text).to.not.contain('名乗り');
        });

        it('omits the bushumei (部首名) field when bushumei field is empty', function () {
          const emptyBushumeiKanjiDictEntry = {
            ...kanjiDictEntry,
            bushumei: '',
          };

          const text = rcxDict.makeText(
            emptyBushumeiKanjiDictEntry,
            /* max= */ 1
          );

          expect(text).to.not.contain('部首名');
        });

        describe('with empty misc fields', function () {
          it('uses a hyphen for unicode field when misc U property is empty', function () {
            const emptyUMiscKanjiDictEntry = {
              ...kanjiDictEntry,
              misc: { ...kanjiDictEntry.misc, U: '' },
            };

            const text = rcxDict.makeText(
              emptyUMiscKanjiDictEntry,
              /* max= */ 1
            );

            expect(text).to.contain('Unicode\t-\n');
          });

          it('uses a hyphen for all misc fields when all misc properties are empty', function () {
            const emptyMiscKanjiDictEntry = {
              ...kanjiDictEntry,
              misc: {},
            };

            const text = rcxDict.makeText(
              emptyMiscKanjiDictEntry,
              /* max= */ 1
            );

            expect(text).to.contain(
              'Halpern\t-\nHeisig 5th Edition\t-\nHeisig 6th Edition\t-\nHenshall\t-\nKanji Learners Dictionary\t-\nKanji Learners Dictionary 2nd Edition\t-\nNelson\t-\nNew Nelson\t-\nPinYin\t-\nSkip Pattern\t-\nTuttle Kanji & Kana\t-\nTuttle Kanji Dictionary\t-\nUnicode\t-\n'
            );
          });
        });
      });
    });
  });
});

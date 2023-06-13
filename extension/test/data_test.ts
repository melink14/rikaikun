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
    describe('with a word dict entry', function () {
      const unimportantProperties = {
        kanji: '',
        onkun: '',
        nanori: '',
        bushumei: '',
        misc: {},
        eigo: '',
        hasMore: false,
        title: '',
        index: 0,
        matchLen: 1,
      };

      const wordDictEntry = {
        ...unimportantProperties,
        hasNames: false,
        data: [
          { entry: 'あ /(int) (1) ah/oh/(int) (2) hey!/', reason: undefined },
          { entry: 'ア /(int) (1) ah/oh/(int) (2) hey!/', reason: undefined },
        ],
      };

      it('when max is 1, returns 1 data entry as text', function () {
        const singleDataEntryAsText = rcxDict.makeText(
          wordDictEntry,
          /* max= */ 1
        );

        expect(singleDataEntryAsText).to.equal(
          'あ\t(int) (1) ah; oh; (int) (2) hey!\n'
        );
      });

      it('when max is 2, returns 2 data entries as text', function () {
        const twoDataEntriesAsText = rcxDict.makeText(
          wordDictEntry,
          /* max= */ 2
        );

        expect(twoDataEntriesAsText).to.equal(
          'あ\t(int) (1) ah; oh; (int) (2) hey!\nア\t(int) (1) ah; oh; (int) (2) hey!\n'
        );
      });

      it('when max is greater than the number of data entries, returns all data entries as text', function () {
        const allDataEntriesAsText = rcxDict.makeText(
          wordDictEntry,
          /* max= */ 1000
        );

        expect(allDataEntriesAsText).to.equal(
          'あ\t(int) (1) ah; oh; (int) (2) hey!\nア\t(int) (1) ah; oh; (int) (2) hey!\n'
        );
      });
    });

    describe('with a name dict entry', function () {
      const unimportantProperties = {
        kanji: '',
        onkun: '',
        nanori: '',
        bushumei: '',
        misc: {},
        eigo: '',
        hasMore: false,
        title: '',
        index: 0,
        matchLen: 1,
      };

      const nameDictEntry = {
        ...unimportantProperties,
        hasNames: true,
        data: [
          { entry: '亜 [あ] /(f) A/', reason: undefined },
          { entry: '阿 [あ] /(s) A/', reason: undefined },
        ],
      };

      it('when max is 1, returns 1 data entry as text', function () {
        const singleDataEntryAsText = rcxDict.makeText(
          nameDictEntry,
          /* max= */ 1
        );

        expect(singleDataEntryAsText).to.equal('亜\tあ\t(f) A\n');
      });

      it('when max is 2, returns 2 data entries as text', function () {
        const twoDataEntriesAsText = rcxDict.makeText(
          nameDictEntry,
          /* max= */ 2
        );

        expect(twoDataEntriesAsText).to.equal('亜\tあ\t(f) A\n阿\tあ\t(s) A\n');
      });

      it('when max is greater than the number of data entries, returns all data entries as text', function () {
        const allDataEntriesAsText = rcxDict.makeText(
          nameDictEntry,
          /* max= */ 1000
        );

        expect(allDataEntriesAsText).to.equal('亜\tあ\t(f) A\n阿\tあ\t(s) A\n');
      });
    });

    describe('with a kanji dict entry', function () {
      const unimportantProperties = {
        hasNames: false,
        data: [],
        hasMore: false,
        title: '',
        index: 0,
        matchLen: 0,
      };

      const kanjiDictEntry = {
        ...unimportantProperties,
        kanji: '両',
        onkun: 'リョウ、 てる、 ふたつ',
        nanori: 'もろ',
        bushumei: '',
        misc: {
          U: '4E21',
          B: '1',
          G: '3',
          S: '6',
          F: '247',
          N: '34',
          V: '23',
          H: '3518',
          DK: '2191',
          DL: '2949',
          L: '1168 both',
          DN: '1252 both',
          E: '411',
          IN: '200',
          P: '4-6-1',
          I: '0a6.11',
          Y: 'liang3',
        },
        eigo: 'both; old Japanese coin; counter for carriages (e.g., in a train); two',
      };

      it('when max is 1, returns a single kanji data entry as text', function () {
        const singleKanjiDataEntryAsText = rcxDict.makeText(
          kanjiDictEntry,
          /* max= */ 1
        );

        expect(singleKanjiDataEntryAsText).to.equal(
          '両\nboth; old Japanese coin; counter for carriages (e.g., in a train); two\nリョウ、 てる、 ふたつ\n名乗り\tもろ\nHalpern\t3518\nHeisig 5th Edition\t1168 both\nHeisig 6th Edition\t1252 both\nHenshall\t411\nKanji Learners Dictionary\t2191\nKanji Learners Dictionary 2nd Edition\t2949\nNelson\t34\nNew Nelson\t23\nPinYin\tliang3\nSkip Pattern\t4-6-1\nTuttle Kanji & Kana\t200\nTuttle Kanji Dictionary\t0a6.11\nUnicode\t4E21\n'
        );
      });

      it('when max is 1000, returns a single kanji data entry as text', function () {
        const singleKanjiDataEntryAsText = rcxDict.makeText(
          kanjiDictEntry,
          /* max= */ 1000
        );

        expect(singleKanjiDataEntryAsText).to.equal(
          '両\nboth; old Japanese coin; counter for carriages (e.g., in a train); two\nリョウ、 てる、 ふたつ\n名乗り\tもろ\nHalpern\t3518\nHeisig 5th Edition\t1168 both\nHeisig 6th Edition\t1252 both\nHenshall\t411\nKanji Learners Dictionary\t2191\nKanji Learners Dictionary 2nd Edition\t2949\nNelson\t34\nNew Nelson\t23\nPinYin\tliang3\nSkip Pattern\t4-6-1\nTuttle Kanji & Kana\t200\nTuttle Kanji Dictionary\t0a6.11\nUnicode\t4E21\n'
        );
      });
    });
  });
});

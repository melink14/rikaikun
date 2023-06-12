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
    it('should return the text for a word dictionary entry', function () {
      const entry = rcxDict.wordSearch('あ', /* doNames= */ false);
      if (!entry) {
        throw new Error(
          `rcxDict.wordSearch('あ', /* doNames= */ false) returns null`
        );
      }
      expect(rcxDict.makeText(entry, /* max= */ 1)).to.equal(
        'あ\t(int) (1) ah; oh; (int) (2) hey!\n',
        `word: 'あ', doNames: false, max: 1`
      );
      expect(rcxDict.makeText(entry, /* max= */ 2)).to.equal(
        'あ\t(int) (1) ah; oh; (int) (2) hey!\nア\t(int) (1) ah; oh; (int) (2) hey!\n',
        `word: 'あ', doNames: false, max: 2`
      );
    });

    it('should return the text for a name dictionary entry', function () {
      const entry = rcxDict.wordSearch('あ', /* doNames= */ true);
      if (!entry) {
        throw new Error(
          `rcxDict.wordSearch('あ', /* doNames= */ true) returns null`
        );
      }
      expect(rcxDict.makeText(entry, /* max= */ 1)).to.equal(
        '亜\tあ\t(f) A\n',
        `word: 'あ', doNames: true, max: 1`
      );
      expect(rcxDict.makeText(entry, /* max= */ 2)).to.equal(
        '亜\tあ\t(f) A\n阿\tあ\t(s) A\n',
        `word: 'あ', doNames: true, max: 2`
      );
    });

    it('should return the text for a kanji dictionary entry', function () {
      const entry = rcxDict.kanjiSearch('両');
      if (!entry) {
        throw new Error(`rcxDict.kanjiSearch('両') returns null`);
      }
      if (!entry.kanji) {
        throw new Error(
          `rcxDict.kanjiSearch('両') returns entry with empty kanji property`
        );
      }
      expect(rcxDict.makeText(entry, /* max= */ 1)).to.equal(
        '両\nboth; old Japanese coin; counter for carriages (e.g., in a train); two\nリョウ、 てる、 ふたつ\n名乗り\tもろ\nHalpern\t3518\nHeisig 5th Edition\t1168 both\nHeisig 6th Edition\t1252 both\nHenshall\t411\nKanji Learners Dictionary\t2191\nKanji Learners Dictionary 2nd Edition\t2949\nNelson\t34\nNew Nelson\t23\nPinYin\tliang3\nSkip Pattern\t4-6-1\nTuttle Kanji & Kana\t200\nTuttle Kanji Dictionary\t0a6.11\nUnicode\t4E21\n',
        `kanji: '両', max: 1`
      );
      expect(rcxDict.makeText(entry, /* max= */ 2)).to.equal(
        '両\nboth; old Japanese coin; counter for carriages (e.g., in a train); two\nリョウ、 てる、 ふたつ\n名乗り\tもろ\nHalpern\t3518\nHeisig 5th Edition\t1168 both\nHeisig 6th Edition\t1252 both\nHenshall\t411\nKanji Learners Dictionary\t2191\nKanji Learners Dictionary 2nd Edition\t2949\nNelson\t34\nNew Nelson\t23\nPinYin\tliang3\nSkip Pattern\t4-6-1\nTuttle Kanji & Kana\t200\nTuttle Kanji Dictionary\t0a6.11\nUnicode\t4E21\n',
        `kanji: '両', max: 2`
      );
    });
  });
});

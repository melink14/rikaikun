import { Config } from '../configuration';
import { DictEntryData, RcxDict } from '../data';
import { expect, use } from '@esm-bundle/chai';
import Sinon from 'sinon';
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
        reason: 'polite',
        type: 32,
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
  });

  describe('kanjiSearch', function () {
    it('should return null for kanji with char code < 0x3000', function () {
      const result = rcxDict.kanjiSearch('A');

      expect(result).to.be.null;
    });

    it('should return null if kanjiData entry is not properly formatted', function () {
      const result = rcxDict.kanjiSearch('子9');

      expect(result).to.be.null;
    });

    it('should return a DictEntryData object for valid kanji', function () {
      const result: DictEntryData | null = rcxDict.kanjiSearch('日');

      expect(result).to.deep.include({
        kanji: '日',
        eigo: 'day, sun, Japan, counter for days',
      });
    });

    it('should set kanji property of DictEntryData object', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.kanji).to.equal('日');
    });

    it('should set misc -> U to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        U: '65E5',
      });
    });
    it('should set misc -> B to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        B: '72',
      });
    });
    it('should set misc -> G to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        G: '1',
      });
    });
    it('should set misc -> S to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        S: '4',
      });
    });
    it('should set misc -> F to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        F: '1',
      });
    });
    it('should set misc -> N to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        N: '2097',
      });
    });
    it('should set misc -> V to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        V: '2410',
      });
    });
    it('should set misc -> H to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        H: '3027',
      });
    });
    it('should set misc -> DK to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        DK: '1915',
      });
    });
    it('should set misc -> L to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        L: '12 day',
      });
    });
    it('should set misc -> DN to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        DN: '12 day',
      });
    });
    it('should set misc -> E to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        E: '62',
      });
    });
    it('should set misc -> IN to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        IN: '5',
      });
    });
    it('should set misc -> P to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        P: '3-3-1',
      });
    });
    it('should set misc -> I to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        I: '4c0.1',
      });
    });
    it('should set misc -> Y to correct value', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.misc).to.deep.include({
        Y: 'ri4',
      });
    });

    it('should set onkun property of DictEntryData object', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.onkun).to.contain('ニチ、 ジツ、 ひ、 -び、 -か');
    });

    it('should set nanori property of DictEntryData object', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.nanori).to.contain(
        'あ、 あき、 いる、 く、 くさ、 こう、 す、 たち、 に、 にっ、 につ、 へ'
      );
    });

    it('should set bushumei property of DictEntryData object to empty string if null', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.bushumei).to.equal('');
    });

    it('should set eigo property of DictEntryData object', function () {
      const result = rcxDict.kanjiSearch('日');

      expect(result?.eigo).to.contain('day, sun, Japan');
    });
  });

  describe('(fileRead)', function () {
    it('should take a valid file url and return a response', function () {
      const url = 'data/dict.dat';

      const result = rcxDict.fileRead(url);

      expect(result).to.be.a('string');
    });
  });

  describe('(fileReadArray)', function () {
    it('should call fileRead and return an array of data', function () {
      const fileName = 'data/dict.dat';

      const result = rcxDict.fileReadArray(fileName);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf.at.least(1);
    });
    it('should remove any whitespace or newlines from end of array', function () {
      const stub = Sinon.stub(rcxDict, 'fileReadArray').returns([
        'testing',
        'is',
        'fun  \n',
      ]);

      const results: string[] = rcxDict.fileReadArray('someFile/here');

      expect(results).to.be.an('array');
      expect(results[results.length - 1].endsWith(' ')).to.be.false;
      Sinon.assert.calledOnce(stub);
    });
  });

  describe('(loadNames)', function () {
    it('should load name dictionary information if not loaded already', function () {
      rcxDict.loadNames();
      expect(rcxDict.nameDict).to.exist;
      expect(rcxDict.nameIndex).to.exist;
    });
  });

  describe('isKana', function () {
    it('should return true if charCode is a kana character', function () {
      const kanaCode = 'て'.charCodeAt(0);
      expect(rcxDict.isKana(kanaCode)).to.be.true;
    });
    it('should return false if non kana character is searched', function () {
      const nonKanaCode = 'Test'.charCodeAt(0);
      expect(rcxDict.isKana(nonKanaCode)).to.be.false;
    });
  });

  describe('convertToHiragana', function () {
    it('should return hiragana character when passed half-width katakana', function () {
      const kanaCode = 'ﾃｽﾄ'.charCodeAt(0);
      expect(rcxDict.isKana(kanaCode)).to.be.true;
    });
    it('should return hiragana character when passed full-width katakana', function () {
      const nonKanaCode = 'Test'.charCodeAt(0);
      expect(rcxDict.isKana(nonKanaCode)).to.be.false;
    });
    it('should do correct hiragana lookup when parsing voiced and semi-voiced half-width katakana', function () {
      // const expected = 'ﾃﾞｯｽｸﾄｯﾌﾟ'
      const hwInput = 'ﾎﾟｼﾞﾃｨﾌﾞ';
      expect(rcxDict.convertToHiragana(hwInput)).to.equal('ぽじてぃぶ');
    });
  });
  describe('normalize', function () {
    it('should strip any spaces, tabs, new lines or zero-width-joiner', function () {
      const expected = 'てすと';

      const result = rcxDict.normalize('てす‌‌と'); // also contains ZWJ

      expect(result).to.equal(expected);
    });
  });
});

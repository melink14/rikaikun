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
    // it('should return break out of loop if charCode is <= 0x3000', function () {
    //   const nonAsianCharacter = '➾';
    //   const result = rcxDict.wordSearch(nonAsianCharacter, false);
    //   expect(result).to.be.null;
    // });
    // it('should skip conversion of zero-width non-joiner character', function () {
    //   const wordWithNonJoiner = 'テ‌ス‌ト';
    //   const result = rcxDict.wordSearch(wordWithNonJoiner, false);
    //   // expect(result?.data[0].entry).does.not.contain('‌');
    //   expect(result?.data[0].entry).does.not.contain(String.fromCharCode(8204));
    //   console.log(result?.data[0].entry);
    // });
  });
});

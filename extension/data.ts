/*

  Rikaikun
  Copyright (C) 2010 Erek Speed
  http://code.google.com/p/rikaikun/

  ---

  Originally based on Rikaichan 1.07
  by Jonathan Zarate
  http://www.polarcloud.com/

  ---

  Originally based on RikaiXUL 0.4 by Todd Rudick
  http://www.rikai.com/
  http://rikaixul.mozdev.org/

  ---

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

  ---

  Please do not change or remove any of the copyrights or links to web pages
  when modifying any of the files. - Jon

*/

/** Exposes abstraction over dictionary files allowing searches and lookups. */

import { Config } from './configuration';
import {
  DeinflectionRule,
  DeinflectionRuleGroup,
  DictEntryData,
} from './types/data-types';
import { KANA, PUNCTUATION } from './types/unicode-constants';

// Be careful of using directly due to object keys.
const defaultDictEntryData: DictEntryData = {
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

interface Deinflection {
  word: string;
  type: number;
  reason: string;
}

class RcxDict {
  private static instance: RcxDict;

  nameDict?: string;
  nameIndex?: string;
  wordDict = '';
  wordIndex = '';
  kanjiData = '';
  radData: string[] = [];
  difReasons: string[] = [];
  difRules: DeinflectionRuleGroup[] = [];
  config: Config;

  private constructor(config: Config) {
    this.config = config;
  }

  static async create(config: Config) {
    if (!RcxDict.instance) {
      RcxDict.instance = new RcxDict(config);
      await RcxDict.instance.init();
    }
    return RcxDict.instance;
  }

  static createDefaultDictEntry(): DictEntryData {
    // Use JSON parse round trip for deep copy of default data.
    return JSON.parse(JSON.stringify(defaultDictEntryData)) as DictEntryData;
  }

  async init() {
    const started = +new Date();

    // TODO(melink14): This waits on name data eagerly which slows down init, consider
    // making it lazy since people often don't use the name dictionary.
    [, , this.nameDict, this.nameIndex] = await Promise.all([
      this.loadDictionaries(),
      this.loadDeinflectionData(),
      this.fileReadAsync(chrome.extension.getURL('data/names.dat')),
      this.fileReadAsync(chrome.extension.getURL('data/names.idx')),
    ]);

    const ended = +new Date();
    console.log('rcxDict main then in ' + (ended - started));
  }

  async fileReadAsync(url: string): Promise<string> {
    const response = await fetch(url);
    if (response.ok) {
      return response.text();
    }
    console.error(`Failed to load ${url} due to status ${response.statusText}`);
    return '';
  }

  async fileReadAsyncAsArray(url: string): Promise<string[]> {
    const file = await this.fileReadAsync(url);
    return file.split('\n').filter((line) => {
      return line && line.length > 0;
    });
  }

  fileRead(url: string) {
    const req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send(null);
    return req.responseText;
  }

  fileReadArray(name: string) {
    const fileLines = this.fileRead(name).split('\n');
    // Is this just in case there is blank shit in the file.  It was written
    // by Jon though.
    // I suppose this is more robust
    while (
      fileLines.length > 0 &&
      fileLines[fileLines.length - 1].length === 0
    ) {
      fileLines.pop();
    }
    return fileLines;
  }

  loadNames() {
    if (this.nameDict && this.nameIndex) {
      return;
    }

    this.nameDict = this.fileRead(chrome.extension.getURL('data/names.dat'));
    this.nameIndex = this.fileRead(chrome.extension.getURL('data/names.idx'));
  }

  //  Note: These are mostly flat text files; loaded as one continuous string to
  //  reduce memory use
  async loadDictionaries(): Promise<void> {
    [this.wordDict, this.wordIndex, this.kanjiData, this.radData] =
      await Promise.all([
        this.fileReadAsync(chrome.extension.getURL('data/dict.dat')),
        this.fileReadAsync(chrome.extension.getURL('data/dict.idx')),
        this.fileReadAsync(chrome.extension.getURL('data/kanji.dat')),
        this.fileReadAsyncAsArray(chrome.extension.getURL('data/radicals.dat')),
      ]);
  }

  async loadDeinflectionData() {
    const buffer = await this.fileReadAsyncAsArray(
      chrome.extension.getURL('data/deinflect.dat')
    );
    let currentLength = -1;
    let group: DeinflectionRuleGroup = {
      fromLength: currentLength,
      rules: [],
    };
    // i = 1: skip header
    for (let i = 1; i < buffer.length; ++i) {
      const ruleOrReason = buffer[i].split('\t');
      if (ruleOrReason.length === 1) {
        this.difReasons.push(ruleOrReason[0]);
      } else if (ruleOrReason.length === 4) {
        const deinflectionRule: DeinflectionRule = {
          from: ruleOrReason[0],
          to: ruleOrReason[1],
          typeMask: parseInt(ruleOrReason[2]),
          reasonIndex: parseInt(ruleOrReason[3]),
        };
        if (currentLength !== deinflectionRule.from.length) {
          currentLength = deinflectionRule.from.length;
          group = { fromLength: currentLength, rules: [] };
          this.difRules.push(group);
        }
        group.rules.push(deinflectionRule);
      }
    }
  }

  find(data: string, text: string): string | null {
    const textLength = text.length;
    let beginning = 0;
    let end = data.length - 1;
    while (beginning < end) {
      const middle = (beginning + end) / 2;
      const i = data.lastIndexOf('\n', middle) + 1;
      const mis = data.substr(i, textLength);
      if (text < mis) {
        end = i - 1;
      } else if (text > mis) {
        beginning = data.indexOf('\n', middle + 1) + 1;
      } else {
        return data.substring(i, data.indexOf('\n', middle + 1));
      }
    }
    return null;
  }

  deinflect(word: string): Deinflection[] {
    const possibleDeinflections: Deinflection[] = [
      { word, type: 0xff, reason: '' },
    ];
    const have: Record<string, number> = {};
    have[word] = 0;

    for (let i = 0; i < possibleDeinflections.length; i++) {
      const currentDeinflection = possibleDeinflections[i].word;
      const wordLen = currentDeinflection.length;
      const type = possibleDeinflections[i].type;

      for (let j = 0; j < this.difRules.length; j++) {
        const g = this.difRules[j];
        if (g.fromLength <= wordLen) {
          const end = currentDeinflection.substr(-g.fromLength);
          for (let k = 0; k < g.rules.length; k++) {
            const rule = g.rules[k];
            if (type & rule.typeMask && end === rule.from) {
              const newWord =
                currentDeinflection.substr(
                  0,
                  currentDeinflection.length - rule.from.length
                ) + rule.to;
              if (newWord.length <= 0) {
                continue;
              }
              let o = {
                word: currentDeinflection,
                type: 0xff,
                reason: '',
              } as Deinflection;
              if (have[newWord] !== undefined) {
                o = possibleDeinflections[have[newWord]];
                o.type |= rule.typeMask >> 8;
                continue;
              }
              have[newWord] = possibleDeinflections.length;
              if (possibleDeinflections[i].reason?.length) {
                o.reason =
                  this.difReasons[rule.reasonIndex] +
                  ' &lt; ' +
                  possibleDeinflections[i].reason;
              } else {
                o.reason = this.difReasons[rule.reasonIndex];
              }
              o.type = rule.typeMask >> 8;
              o.word = newWord;
              possibleDeinflections.push(o);
            }
          }
        }
      }
    }
    return possibleDeinflections;
  }

  kanaToHiraganaNormalizationMap: Record<string, string> = {
    ぁ: 'ぁ',
    あ: 'あ',
    ぃ: 'ぃ',
    い: 'い',
    ぅ: 'ぅ',
    う: 'う',
    ぇ: 'ぇ',
    え: 'え',
    ぉ: 'ぉ',
    お: 'お',
    か: 'か',
    が: 'が',
    き: 'き',
    ぎ: 'ぎ',
    く: 'く',
    ぐ: 'ぐ',
    け: 'け',
    げ: 'げ',
    こ: 'こ',
    ご: 'ご',
    さ: 'さ',
    ざ: 'ざ',
    し: 'し',
    じ: 'じ',
    す: 'す',
    ず: 'ず',
    せ: 'せ',
    ぜ: 'ぜ',
    そ: 'そ',
    ぞ: 'ぞ',
    た: 'た',
    だ: 'だ',
    ち: 'ち',
    ぢ: 'ぢ',
    っ: 'っ',
    つ: 'つ',
    づ: 'づ',
    て: 'て',
    で: 'で',
    と: 'と',
    ど: 'ど',
    な: 'な',
    に: 'に',
    ぬ: 'ぬ',
    ね: 'ね',
    の: 'の',
    は: 'は',
    ば: 'ば',
    ぱ: 'ぱ',
    ひ: 'ひ',
    び: 'び',
    ぴ: 'ぴ',
    ふ: 'ふ',
    ぶ: 'ぶ',
    ぷ: 'ぷ',
    へ: 'へ',
    べ: 'べ',
    ぺ: 'ぺ',
    ほ: 'ほ',
    ぼ: 'ぼ',
    ぽ: 'ぽ',
    ま: 'ま',
    み: 'み',
    む: 'む',
    め: 'め',
    も: 'も',
    ゃ: 'ゃ',
    や: 'や',
    ゅ: 'ゅ',
    ゆ: 'ゆ',
    ょ: 'ょ',
    よ: 'よ',
    ら: 'ら',
    り: 'り',
    る: 'る',
    れ: 'れ',
    ろ: 'ろ',
    ゎ: 'ゎ',
    わ: 'わ',
    を: 'を',
    ん: 'ん',
    ゔ: 'ゔ',
    ァ: 'ぁ',
    ア: 'あ',
    ィ: 'ぃ',
    イ: 'い',
    ゥ: 'ぅ',
    ウ: 'う',
    ェ: 'ぇ',
    エ: 'え',
    ォ: 'ぉ',
    オ: 'お',
    カ: 'か',
    ガ: 'が',
    キ: 'き',
    ギ: 'ぎ',
    ク: 'く',
    グ: 'ぐ',
    ケ: 'け',
    ゲ: 'げ',
    コ: 'こ',
    ゴ: 'ご',
    サ: 'さ',
    ザ: 'ざ',
    シ: 'し',
    ジ: 'じ',
    ス: 'す',
    ズ: 'ず',
    セ: 'せ',
    ゼ: 'ぜ',
    ソ: 'そ',
    ゾ: 'ぞ',
    タ: 'た',
    ダ: 'だ',
    チ: 'ち',
    ヂ: 'ぢ',
    ッ: 'っ',
    ツ: 'つ',
    ヅ: 'づ',
    テ: 'て',
    デ: 'で',
    ト: 'と',
    ド: 'ど',
    ナ: 'な',
    ニ: 'に',
    ヌ: 'ぬ',
    ネ: 'ね',
    ノ: 'の',
    ハ: 'は',
    バ: 'ば',
    パ: 'ぱ',
    ヒ: 'ひ',
    ビ: 'び',
    ピ: 'ぴ',
    フ: 'ふ',
    ブ: 'ぶ',
    プ: 'ぷ',
    ヘ: 'へ',
    ベ: 'べ',
    ペ: 'ぺ',
    ホ: 'ほ',
    ボ: 'ぼ',
    ポ: 'ぽ',
    マ: 'ま',
    ミ: 'み',
    ム: 'む',
    メ: 'め',
    モ: 'も',
    ャ: 'ゃ',
    ヤ: 'や',
    ュ: 'ゅ',
    ユ: 'ゆ',
    ョ: 'ょ',
    ヨ: 'よ',
    ラ: 'ら',
    リ: 'り',
    ル: 'る',
    レ: 'れ',
    ロ: 'ろ',
    ヮ: 'ゎ',
    ワ: 'わ',
    ヲ: 'を',
    ン: 'ん',
    ヴ: 'ゔ',
    ｧ: 'ぁ',
    ｱ: 'あ',
    ｨ: 'ぃ',
    ｲ: 'い',
    ｩ: 'ぅ',
    ｳ: 'う',
    ｪ: 'ぇ',
    ｴ: 'え',
    ｫ: 'ぉ',
    ｵ: 'お',
    ｶ: 'か',
    ｶﾞ: 'が',
    ｷ: 'き',
    ｷﾞ: 'ぎ',
    ｸ: 'く',
    ｸﾞ: 'ぐ',
    ｹ: 'け',
    ｹﾞ: 'げ',
    ｺ: 'こ',
    ｺﾞ: 'ご',
    ｻ: 'さ',
    ｻﾞ: 'ざ',
    ｼ: 'し',
    ｼﾞ: 'じ',
    ｽ: 'す',
    ｽﾞ: 'ず',
    ｾ: 'せ',
    ｾﾞ: 'ぜ',
    ｿ: 'そ',
    ｿﾞ: 'ぞ',
    ﾀ: 'た',
    ﾀﾞ: 'だ',
    ﾁ: 'ち',
    ﾁﾞ: 'ぢ',
    ｯ: 'っ',
    ﾂ: 'つ',
    ﾂﾞ: 'づ',
    ﾃ: 'て',
    ﾃﾞ: 'で',
    ﾄ: 'と',
    ﾄﾞ: 'ど',
    ﾅ: 'な',
    ﾆ: 'に',
    ﾇ: 'ぬ',
    ﾈ: 'ね',
    ﾉ: 'の',
    ﾊ: 'は',
    ﾊﾞ: 'ば',
    ﾊﾟ: 'ぱ',
    ﾋ: 'ひ',
    ﾋﾞ: 'び',
    ﾋﾟ: 'ぴ',
    ﾌ: 'ふ',
    ﾌﾞ: 'ぶ',
    ﾌﾟ: 'ぷ',
    ﾍ: 'へ',
    ﾍﾞ: 'べ',
    ﾍﾟ: 'ぺ',
    ﾎ: 'ほ',
    ﾎﾞ: 'ぼ',
    ﾎﾟ: 'ぽ',
    ﾏ: 'ま',
    ﾐ: 'み',
    ﾑ: 'む',
    ﾒ: 'め',
    ﾓ: 'も',
    ｬ: 'ゃ',
    ﾔ: 'や',
    ｭ: 'ゅ',
    ﾕ: 'ゆ',
    ｮ: 'ょ',
    ﾖ: 'よ',
    ﾗ: 'ら',
    ﾘ: 'り',
    ﾙ: 'る',
    ﾚ: 'れ',
    ﾛ: 'ろ',
    ﾜ: 'わ',
    ｦ: 'を',
    ﾝ: 'ん',
    // ｳﾞ: 'ゔ',
    '‌': '‌', // the non-joiner used in google docs
    voicedSoundMark: 'ﾟ',
    semiVoicedSoundMark: 'ﾞ',
  };

  isKana(charCode: number): boolean {
    return (
      (charCode >= KANA.HIRAGANA_START && charCode <= KANA.HIRAGANA_END) ||
      (charCode >= KANA.KATAKANA_START && charCode <= KANA.KATAKANA_END) ||
      (charCode >= KANA.HW_KATAKANA_START && charCode <= KANA.HW_KATAKANA_END)
    );
  }

  convertToHiragana(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      const nextChar = i + 1 <= str.length - 1 ? str.charAt(i + 1) : null;
      const nextCharCode = nextChar?.charCodeAt(0);
      const isSemiVoiced = nextCharCode === PUNCTUATION.SEMI_VOICED_MARK;
      const isVoiced = nextCharCode === PUNCTUATION.VOICED_MARK;

      const key = isSemiVoiced
        ? char + nextChar
        : isVoiced
        ? char + nextChar
        : char;
      const hiragana = this.kanaToHiraganaNormalizationMap[key];
      result += hiragana !== undefined ? hiragana : char;

      if (isSemiVoiced || isVoiced) {
        i++;
      }
    }
    return result;
  }

  wordSearch(
    word: string,
    doNames: boolean,
    max?: number
  ): DictEntryData | null {
    const trueLen = [0];
    const entry = RcxDict.createDefaultDictEntry();
    let newConvertedWord = '';
    let isKana = false;
    isKana = Array.from(word).every((char) => this.isKana(char.charCodeAt(0)));
    for (let i = 0; i < word.length; i++) {
      isKana = this.isKana(word[i].charCodeAt(0));
      if (isKana) {
        newConvertedWord += this.convertToHiragana(word[i]);
      } else {
        newConvertedWord += word[i];
      }
    }
    word = newConvertedWord;

    let dict: string;
    let index;
    let maxTrim;
    const cache: { [key: string]: number[] } = {};
    const have = [];
    let count = 0;
    let maxLen = 0;

    if (doNames) {
      // check: split this

      this.loadNames();
      // After loadNames these are guaranteed to not be null so
      // cast them as strings manually.
      dict = this.nameDict as string;
      index = this.nameIndex as string;
      maxTrim = 20; // this.config.namax;
      entry.hasNames = true;
    } else {
      dict = this.wordDict;
      index = this.wordIndex;
      maxTrim = this.config.maxDictEntries;
    }

    if (max) {
      maxTrim = max;
    }

    entry.data = [];

    while (word.length > 0) {
      const showInf = count !== 0;
      let possibleDeinflections: Deinflection[];

      if (doNames) {
        possibleDeinflections = [{ word: word, type: 0xff, reason: '' }];
      } else {
        possibleDeinflections = this.deinflect(word);
      }

      for (let i = 0; i < possibleDeinflections.length; i++) {
        const currentDeinflection = possibleDeinflections[i];

        let ix = cache[currentDeinflection.word];
        if (!ix) {
          const result = this.find(index, currentDeinflection.word + ',');
          if (!result) {
            cache[currentDeinflection.word] = [];
            continue;
          }
          // The first value in result is the word itself so skip it
          // and parse the remaining values at integers.
          ix = result
            .split(',')
            .slice(1)
            .map((offset) => parseInt(offset));
          cache[currentDeinflection.word] = ix;
        }

        for (let j = 0; j < ix.length; ++j) {
          const ofs = ix[j];
          if (have[ofs]) {
            continue;
          }

          const dentry = dict.substring(ofs, dict.indexOf('\n', ofs));
          console.log(dentry);
          let ok = true;
          if (i > 0) {
            // > 0 a de-inflected word

            // ex:
            // /(io) (v5r) to finish/to close/
            // /(v5r) to finish/to close/(P)/
            // /(aux-v,v1) to begin to/(P)/
            // /(adj-na,exp,int) thank you/many thanks/
            // /(adj-i) shrill/

            let w;
            const x = dentry.split(/[,()]/);
            console.log(x);
            const y = currentDeinflection.type;
            let z = x.length - 1;
            if (z > 10) {
              z = 10;
            }
            for (; z >= 0; --z) {
              w = x[z];
              if (y & 1 && w === 'v1') {
                break;
              }
              if (y & 4 && w === 'adj-i') {
                break;
              }
              if (y & 2 && w.substr(0, 2) === 'v5') {
                break;
              }
              if (y & 16 && w.substr(0, 3) === 'vs-') {
                break;
              }
              if (y & 8 && w === 'vk') {
                break;
              }
              if (y & 32 && w === 'cop') {
                break;
              }
            }
            ok = z !== -1;
          }
          if (ok) {
            if (count >= maxTrim) {
              entry.hasMore = true;
            }

            have[ofs] = 1;
            ++count;
            if (maxLen === 0) {
              maxLen = trueLen[word.length];
            }

            let reason: string | undefined;
            if (possibleDeinflections[i].reason) {
              if (showInf) {
                reason =
                  '&lt; ' + possibleDeinflections[i].reason + ' &lt; ' + word;
              } else {
                reason = '&lt; ' + possibleDeinflections[i].reason;
              }
            }

            entry.data.push({ entry: dentry, reason });
          }
        } // for j < ix.length
        if (count >= maxTrim) {
          break;
        }
      } // for i < trys.length
      if (count >= maxTrim) {
        break;
      }
      word = word.substr(0, word.length - 1);
    } // while word.length > 0

    if (entry.data.length === 0) {
      return null;
    }
    entry.matchLen = maxLen;
    console.log(entry);
    return entry;
  }

  // wordSearch(
  //   word: string,
  //   doNames: boolean,
  //   max?: number
  // ): DictEntryData | null {
  //   let i;
  //   let u;
  //   let v;
  //   let reason: string;
  //   let p;
  //   const trueLen = [0];
  //   const entry = RcxDict.createDefaultDictEntry();

  //   // half & full-width katakana to hiragana conversion
  //   // note: katakana vu is never converted to hiragana

  //   p = 0;
  //   reason = '';
  //   for (i = 0; i < word.length; ++i) {
  //     u = v = word.charCodeAt(i);

  //     // Skip Zero-width non-joiner used in Google Docs between every
  //     // character.
  //     if (u === 8204) {
  //       p = 0;
  //       continue;
  //     }

  //     if (u <= 0x3000) {
  //       break;
  //     }

  //     // full-width katakana to hiragana
  //     if (u >= 0x30a1 && u <= 0x30f3) {
  //       u -= 0x60;
  //     } else if (u >= 0xff66 && u <= 0xff9d) {
  //       // half-width katakana to hiragana
  //       u = this.ch[u - 0xff66];
  //     } else if (u === 0xff9e) {
  //       // voiced (used in half-width katakana) to hiragana
  //       if (p >= 0xff73 && p <= 0xff8e) {
  //         reason = reason.substr(0, reason.length - 1);
  //         u = this.cv[p - 0xff73];
  //       }
  //     } else if (u === 0xff9f) {
  //       // semi-voiced (used in half-width katakana) to hiragana
  //       if (p >= 0xff8a && p <= 0xff8e) {
  //         reason = reason.substr(0, reason.length - 1);
  //         u = this.cs[p - 0xff8a];
  //       }
  //     } else if (u === 0xff5e) {
  //       // ignore J~
  //       p = 0;
  //       continue;
  //     }

  //     reason += String.fromCharCode(u);
  //     // need to keep real length because of the half-width semi/voiced
  //     // conversion
  //     trueLen[reason.length] = i + 1;
  //     p = v;
  //   }
  //   word = reason;

  //   let dict: string;
  //   let index;
  //   let maxTrim;
  //   const cache: { [key: string]: number[] } = {};
  //   const have = [];
  //   let count = 0;
  //   let maxLen = 0;

  //   if (doNames) {
  //     // check: split this

  //     this.loadNames();
  //     // After loadNames these are guaranteed to not be null so
  //     // cast them as strings manually.
  //     dict = this.nameDict as string;
  //     index = this.nameIndex as string;
  //     maxTrim = 20; // this.config.namax;
  //     entry.hasNames = true;
  //     console.log('doNames');
  //   } else {
  //     dict = this.wordDict;
  //     index = this.wordIndex;
  //     maxTrim = this.config.maxDictEntries;
  //   }

  //   if (max) {
  //     maxTrim = max;
  //   }

  //   entry.data = [];

  //   while (word.length > 0) {
  //     const showInf = count !== 0;
  //     let trys;

  //     if (doNames) {
  //       trys = [{ word: word, type: 0xff, reason: null }];
  //     } else {
  //       trys = this.deinflect(word);
  //     }

  //     for (i = 0; i < trys.length; i++) {
  //       u = trys[i];

  //       let ix = cache[u.word];
  //       if (!ix) {
  //         const result = this.find(index, u.word + ',');
  //         if (!result) {
  //           cache[u.word] = [];
  //           continue;
  //         }
  //         // The first value in result is the word itself so skip it
  //         // and parse the remaining values at integers.
  //         ix = result
  //           .split(',')
  //           .slice(1)
  //           .map((offset) => parseInt(offset));
  //         cache[u.word] = ix;
  //       }

  //       for (let j = 0; j < ix.length; ++j) {
  //         const ofs = ix[j];
  //         if (have[ofs]) {
  //           continue;
  //         }

  //         const dentry = dict.substring(ofs, dict.indexOf('\n', ofs));

  //         let ok = true;
  //         if (i > 0) {
  //           // > 0 a de-inflected word

  //           // ex:
  //           // /(io) (v5r) to finish/to close/
  //           // /(v5r) to finish/to close/(P)/
  //           // /(aux-v,v1) to begin to/(P)/
  //           // /(adj-na,exp,int) thank you/many thanks/
  //           // /(adj-i) shrill/

  //           let w;
  //           const x = dentry.split(/[,()]/);
  //           const y = u.type;
  //           let z = x.length - 1;
  //           if (z > 10) {
  //             z = 10;
  //           }
  //           for (; z >= 0; --z) {
  //             w = x[z];
  //             if (y & 1 && w === 'v1') {
  //               break;
  //             }
  //             if (y & 4 && w === 'adj-i') {
  //               break;
  //             }
  //             if (y & 2 && w.substr(0, 2) === 'v5') {
  //               break;
  //             }
  //             if (y & 16 && w.substr(0, 3) === 'vs-') {
  //               break;
  //             }
  //             if (y & 8 && w === 'vk') {
  //               break;
  //             }
  //             if (y & 32 && w === 'cop') {
  //               break;
  //             }
  //           }
  //           ok = z !== -1;
  //         }
  //         if (ok) {
  //           if (count >= maxTrim) {
  //             entry.hasMore = true;
  //           }

  //           have[ofs] = 1;
  //           ++count;
  //           if (maxLen === 0) {
  //             maxLen = trueLen[word.length];
  //           }

  //           let reason: string | undefined;
  //           if (trys[i].reason) {
  //             if (showInf) {
  //               reason = '&lt; ' + trys[i].reason + ' &lt; ' + word;
  //             } else {
  //               reason = '&lt; ' + trys[i].reason;
  //             }
  //           }

  //           entry.data.push({ entry: dentry, reason });
  //         }
  //       } // for j < ix.length
  //       if (count >= maxTrim) {
  //         break;
  //       }
  //     } // for i < trys.length
  //     if (count >= maxTrim) {
  //       break;
  //     }
  //     word = word.substr(0, word.length - 1);
  //   } // while word.length > 0

  //   if (entry.data.length === 0) {
  //     return null;
  //   }

  //   entry.matchLen = maxLen;
  //   console.log(entry);
  //   return entry;
  // }

  translate(text: string): (DictEntryData & { textLen: number }) | null {
    let e: DictEntryData | null;
    const o: DictEntryData & {
      textLen: number;
    } = { textLen: text.length, ...RcxDict.createDefaultDictEntry() };
    let skip;

    while (text.length > 0) {
      e = this.wordSearch(text, false, 1);
      if (e !== null) {
        if (o.data.length >= this.config.maxDictEntries) {
          o.hasMore = true;
          break;
        }
        o.data.push(e.data[0]);
        skip = e.matchLen;
      } else {
        skip = 1;
      }
      text = text.substr(skip, text.length - skip);
    }

    if (o.data.length === 0) {
      return null;
    }

    o.textLen -= text.length;
    return o;
  }

  kanjiSearch(kanji: string): DictEntryData | null {
    const hex = '0123456789ABCDEF';

    let kanjiCharCode = kanji.charCodeAt(0);
    if (kanjiCharCode < 0x3000) {
      return null;
    }

    const kde = this.find(this.kanjiData, kanji);
    if (!kde) {
      return null;
    }

    const a = kde.split('|');
    if (a.length !== 6) {
      return null;
    }

    const entry = RcxDict.createDefaultDictEntry();
    entry.kanji = a[0];

    entry.misc = {};
    entry.misc.U =
      hex[(kanjiCharCode >>> 12) & 15] +
      hex[(kanjiCharCode >>> 8) & 15] +
      hex[(kanjiCharCode >>> 4) & 15] +
      hex[kanjiCharCode & 15];

    const b = a[1].split(' ');
    for (kanjiCharCode = 0; kanjiCharCode < b.length; ++kanjiCharCode) {
      if (b[kanjiCharCode].match(/^([A-Z]+)(.*)/)) {
        if (!entry.misc[RegExp.$1]) {
          entry.misc[RegExp.$1] = RegExp.$2;
        } else {
          entry.misc[RegExp.$1] += ' ' + RegExp.$2;
        }
        // Replace ':' delimiter with proper spaces for Heisig keywords.
        if (RegExp.$1.startsWith('L') || RegExp.$1.startsWith('DN')) {
          entry.misc[RegExp.$1] = entry.misc[RegExp.$1].replace(/[:]/g, ' ');
        }
      }
    }

    entry.onkun = a[2].replace(/\s+/g, '\u3001 ');
    entry.nanori = a[3].replace(/\s+/g, '\u3001 ');
    entry.bushumei = a[4].replace(/\s+/g, '\u3001 ');
    entry.eigo = a[5];

    return entry;
  }

  kanjiInfoLabelList: string[] = [
    /*
        'C',   'Classical Radical',
        'DR',  'Father Joseph De Roo Index',
        'DO',  'P.G. O\'Neill Index',
        'O',   'P.G. O\'Neill Japanese Names Index',
        'Q',   'Four Corner Code',
        'MN',  'Morohashi Daikanwajiten Index',
        'MP',  'Morohashi Daikanwajiten Volume/Page',
        'K',  'Gakken Kanji Dictionary Index',
        'W',  'Korean Reading',
    */
    'H',
    'Halpern',
    'L',
    'Heisig 5th Edition',
    'DN',
    'Heisig 6th Edition',
    'E',
    'Henshall',
    'DK',
    'Kanji Learners Dictionary',
    'N',
    'Nelson',
    'V',
    'New Nelson',
    'Y',
    'PinYin',
    'P',
    'Skip Pattern',
    'IN',
    'Tuttle Kanji &amp; Kana',
    'I',
    'Tuttle Kanji Dictionary',
    'U',
    'Unicode',
  ];

  // TODO: Entry should be extracted as separate type.
  makeHtml(entry: DictEntryData | null) {
    let e;
    let c;
    let s;
    let t;
    let i;
    let j;
    let n;

    if (entry === null) {
      return '';
    }

    const b = [];

    if (entry.kanji) {
      let yomi;
      let box;
      let k;
      let nums;

      yomi = entry.onkun.replace(
        /\.([^\u3001]+)/g,
        '<span class="k-yomi-hi">$1</span>'
      );
      if (entry.nanori.length) {
        yomi +=
          '<br/><span class="k-yomi-ti">\u540D\u4E57\u308A</span> ' +
          entry.nanori;
      }
      if (entry.bushumei.length) {
        yomi +=
          '<br/><span class="k-yomi-ti">\u90E8\u9996\u540D</span> ' +
          entry.bushumei;
      }

      const bn = parseInt(entry.misc.B) - 1;
      k = parseInt(entry.misc.G);
      switch (k) {
        case 8:
          k = 'general<br/>use';
          break;
        case 9:
          k = 'name<br/>use';
          break;
        default:
          k = isNaN(k) ? '-' : 'grade<br/>' + k;
          break;
      }
      box =
        '<table class="k-abox-tb"><tr>' +
        '<td class="k-abox-r">radical<br/>' +
        this.radData[bn].charAt(0) +
        ' ' +
        (bn + 1) +
        '</td>' +
        '<td class="k-abox-g">' +
        k +
        '</td>' +
        '</tr><tr>' +
        '<td class="k-abox-f">freq<br/>' +
        (entry.misc.F ? entry.misc.F : '-') +
        '</td>' +
        '<td class="k-abox-s">strokes<br/>' +
        entry.misc.S +
        '</td>' +
        '</tr></table>';
      if (this.config.kanjicomponents) {
        k = this.radData[bn].split('\t');
        box +=
          '<table class="k-bbox-tb">' +
          '<tr><td class="k-bbox-1a">' +
          k[0] +
          '</td>' +
          '<td class="k-bbox-1b">' +
          k[2] +
          '</td>' +
          '<td class="k-bbox-1b">' +
          k[3] +
          '</td></tr>';
        j = 1;
        for (i = 0; i < this.radData.length; ++i) {
          s = this.radData[i];
          if (bn !== i && s.indexOf(entry.kanji) !== -1) {
            k = s.split('\t');
            c = ' class="k-bbox-' + (j ^= 1);
            box +=
              '<tr><td' +
              c +
              'a">' +
              k[0] +
              '</td>' +
              '<td' +
              c +
              'b">' +
              k[2] +
              '</td>' +
              '<td' +
              c +
              'b">' +
              k[3] +
              '</td></tr>';
          }
        }
        box += '</table>';
      }

      nums = '';
      j = 0;

      const kanjiInfo = this.config.kanjiInfo;
      for (const info of kanjiInfo) {
        if (!info.shouldDisplay) {
          continue;
        }
        c = info.code;
        s = entry.misc[c];
        c = ' class="k-mix-td' + (j ^= 1) + '"';
        nums +=
          '<tr><td' +
          c +
          '>' +
          info.name +
          '</td><td' +
          c +
          '>' +
          (s || '-') +
          '</td></tr>';
      }
      if (nums.length) {
        nums = '<table class="k-mix-tb">' + nums + '</table>';
      }

      b.push('<table class="k-main-tb"><tr><td valign="top">');
      b.push(box);
      b.push('<span class="k-kanji">' + entry.kanji + '</span><br/>');
      b.push('<div class="k-eigo">' + entry.eigo + '</div>');
      b.push('<div class="k-yomi">' + yomi + '</div>');
      b.push('</td></tr><tr><td>' + nums + '</td></tr></table>');
      return b.join('');
    }

    s = t = '';

    if (entry.hasNames) {
      c = [];

      b.push(
        '<div class="w-title">Names Dictionary</div><table class="w-na-tb"><tr><td>'
      );
      for (i = 0; i < entry.data.length; ++i) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }

        // the next two lines re-process the entries that contain separate
        // search key and spelling due to mixed hiragana/katakana spelling
        const e3 = e[3].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (e3) {
          e = e3;
        }

        if (s !== e[3]) {
          c.push(t);
          t = '';
        }

        if (e[2]) {
          c.push(
            '<span class="w-kanji">' +
              e[1] +
              '</span> &#32; <span class="w-kana">' +
              e[2] +
              '</span><br/> '
          );
        } else {
          c.push('<span class="w-kana">' + e[1] + '</span><br/> ');
        }

        s = e[3];
        console.log('e[1]: ' + e[1]);
        console.log('e[2]: ' + e[2]);
        console.log('e[3]: ' + e[3]);
        t = '<span class="w-def">' + s.replace(/\//g, '; ') + '</span><br/>';
      }
      c.push(t);
      if (c.length > 4) {
        n = (c.length >> 1) + 1;
        b.push(c.slice(0, n + 1).join(''));

        t = c[n];
        c = c.slice(n, c.length);
        for (i = 0; i < c.length; ++i) {
          if (c[i].indexOf('w-def') !== -1) {
            if (t !== c[i]) {
              b.push(c[i]);
            }
            if (i === 0) {
              c.shift();
            }
            break;
          }
        }

        b.push('</td><td>');
        b.push(c.join(''));
      } else {
        b.push(c.join(''));
      }
      if (entry.hasMore) {
        b.push('...<br/>');
      }
      b.push('</td></tr></table>');
    } else {
      if (entry.title) {
        b.push('<div class="w-title">' + entry.title + '</div>');
      }

      let pK = '';
      let k = undefined;

      if (!entry.index) {
        entry.index = 0;
      }

      if (entry.index !== 0) {
        b.push('<span class="small-info">... (\'j\' for more)</span><br/>');
      }

      for (
        i = entry.index;
        i <
        Math.min(this.config.maxDictEntries + entry.index, entry.data.length);
        ++i
      ) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }

        /*
          e[1] = kanji/kana
          e[2] = kana
          e[3] = definition
        */

        if (s !== e[3]) {
          b.push(t);
          pK = k = '';
        } else {
          k = t.length ? '<br/>' : '';
        }

        if (e[2]) {
          if (pK === e[1]) {
            k = '\u3001 <span class="w-kana">' + e[2] + '</span>';
          } else {
            k +=
              '<span class="w-kanji">' +
              e[1] +
              '</span> &#32; <span class="w-kana">' +
              e[2] +
              '</span>';
          }
          pK = e[1];
        } else {
          k += '<span class="w-kana">' + e[1] + '</span>';
          pK = '';
        }
        b.push(k);

        if (entry.data[i].reason) {
          b.push(' <span class="w-conj">(' + entry.data[i].reason + ')</span>');
        }

        s = e[3];
        t = s.replace(/\//g, '; ');

        if (!this.config.onlyreading) {
          t = '<br/><span class="w-def">' + t + '</span><br/>';
        } else {
          t = '<br/>';
        }
      }
      b.push(t);
      if (
        entry.hasMore &&
        entry.index < entry.data.length - this.config.maxDictEntries
      ) {
        b.push('<span class="small-info">... (\'k\' for more)</span><br/>');
      }
    }

    return b.join('');
  }

  makeHtmlForRuby(entry: DictEntryData | null) {
    let e;
    let s;
    let t;
    let i;

    if (entry === null) {
      return '';
    }

    const b = [];

    s = t = '';

    if (entry.title) {
      b.push('<div class="w-title">' + entry.title + '</div>');
    }

    for (i = 0; i < entry.data.length; ++i) {
      e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
      if (!e) {
        continue;
      }

      s = e[3];
      t = s.replace(/\//g, '; ');
      t = '<span class="w-def">' + t + '</span><br/>\n';
    }
    b.push(t);

    return b.join('');
  }

  makeText(entry: DictEntryData | null, max: number): string {
    let e;
    let i;
    let j;
    let t;

    if (entry === null) {
      return '';
    }

    const b = [];

    if (entry.kanji) {
      b.push(entry.kanji + '\n');
      b.push((entry.eigo.length ? entry.eigo : '-') + '\n');

      b.push(entry.onkun.replace(/\.([^\u3001]+)/g, '\uFF08$1\uFF09') + '\n');
      if (entry.nanori.length) {
        b.push('\u540D\u4E57\u308A\t' + entry.nanori + '\n');
      }
      if (entry.bushumei.length) {
        b.push('\u90E8\u9996\u540D\t' + entry.bushumei + '\n');
      }

      for (i = 0; i < this.kanjiInfoLabelList.length; i += 2) {
        e = this.kanjiInfoLabelList[i];
        j = entry.misc[e];
        b.push(
          this.kanjiInfoLabelList[i + 1].replace('&amp;', '&') +
            '\t' +
            (j || '-') +
            '\n'
        );
      }
    } else {
      if (max > entry.data.length) {
        max = entry.data.length;
      }
      for (i = 0; i < max; ++i) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }

        if (e[2]) {
          b.push(e[1] + '\t' + e[2]);
        } else {
          b.push(e[1]);
        }

        t = e[3].replace(/\//g, '; ');
        b.push('\t' + t + '\n');
      }
    }
    return b.join('');
  }
}

export { RcxDict };
export type { DictEntryData };

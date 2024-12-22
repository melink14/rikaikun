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

import {
  KANA,
  KANA_TO_HIRAGANA_NORMALIZATION_MAP,
  PUNCTUATION,
  SKIPPABLE,
} from './character_info';
import { Config } from './configuration';
import { parseWordDictEntry } from './parse-word-dict-entry';

interface Deinflection {
  word: string;
  type: number;
  reason: string;
}
type DictData = {
  entry: string;
  reason?: string;
};

type DictEntryData = {
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

interface DeinflectionRule {
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
interface DeinflectionRuleGroup {
  fromLength: number;
  rules: DeinflectionRule[];
}

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

  public static async create(config: Config) {
    if (!RcxDict.instance) {
      RcxDict.instance = new RcxDict(config);
      await RcxDict.instance.init();
    }
    return RcxDict.instance;
  }

  private static createDefaultDictEntry(): DictEntryData {
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
      this.fileReadAsync(chrome.runtime.getURL('data/names.dat')),
      this.fileReadAsync(chrome.runtime.getURL('data/names.idx')),
    ]);

    const ended = +new Date();
    console.log('rcxDict main then in ' + (ended - started));
  }

  private async fileReadAsync(url: string): Promise<string> {
    const response = await fetch(url);
    if (response.ok) {
      return response.text();
    }
    console.error(`Failed to load ${url} due to status ${response.statusText}`);
    return '';
  }

  private async fileReadAsyncAsArray(url: string): Promise<string[]> {
    const file = await this.fileReadAsync(url);
    return file.split('\n').filter((line) => {
      return line && line.length > 0;
    });
  }

  private fileRead(url: string) {
    const req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send(null);
    return req.responseText;
  }

  private loadNames() {
    if (this.nameDict && this.nameIndex) {
      return;
    }

    this.nameDict = this.fileRead(chrome.runtime.getURL('data/names.dat'));
    this.nameIndex = this.fileRead(chrome.runtime.getURL('data/names.idx'));
  }

  //  Note: These are mostly flat text files; loaded as one continuous string to
  //  reduce memory use
  private async loadDictionaries(): Promise<void> {
    [this.wordDict, this.wordIndex, this.kanjiData, this.radData] =
      await Promise.all([
        this.fileReadAsync(chrome.runtime.getURL('data/dict.dat')),
        this.fileReadAsync(chrome.runtime.getURL('data/dict.idx')),
        this.fileReadAsync(chrome.runtime.getURL('data/kanji.dat')),
        this.fileReadAsyncAsArray(chrome.runtime.getURL('data/radicals.dat')),
      ]);
  }

  private async loadDeinflectionData() {
    const buffer = await this.fileReadAsyncAsArray(
      chrome.runtime.getURL('data/deinflect.dat')
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

  private find(data: string, text: string): string | null {
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

  // Make this private later.
  deinflect(word: string): Deinflection[] {
    const possibleDeinflections: Deinflection[] = [
      { word, type: 0xff, reason: '' },
    ];
    const have: Record<string, number> = {};
    have[word] = 0;

    let i;
    let j;
    let k;
    let o;

    i = 0;
    do {
      word = possibleDeinflections[i].word;
      const wordLen = word.length;
      const type = possibleDeinflections[i].type;

      for (j = 0; j < this.difRules.length; ++j) {
        const g = this.difRules[j];
        if (g.fromLength <= wordLen) {
          const end = word.substr(-g.fromLength);
          for (k = 0; k < g.rules.length; ++k) {
            const rule = g.rules[k];
            if (type & rule.typeMask && end === rule.from) {
              const newWord =
                word.substr(0, word.length - rule.from.length) + rule.to;
              if (newWord.length <= 0) {
                continue;
              }
              o = { word: word, type: 0xff, reason: '' } as Deinflection;
              if (have[newWord] !== undefined) {
                o = possibleDeinflections[have[newWord]];
                o.type |= rule.typeMask >> 8;

                continue;
              }
              have[newWord] = possibleDeinflections.length;
              if (possibleDeinflections[i].reason.length) {
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
    } while (++i < possibleDeinflections.length);

    return possibleDeinflections;
  }

  /**
   * Returns the given `inputText` with katakana and half width characters
   * converted to full-width hiragana and certain characters omitted ensuring
   * maximal compatibility with the dictionary.
   *
   * ヴ is not converted (for historical reasons). Because some characters are
   * skipped and some double byte characters are converted to single byte
   * characters, the `trueLengths` array is returned to map the true length of
   * the input text to the converted text. This is required so that highlighting
   * the text on the page works correctly. It is also used by the `translate`
   * method to properly divide up blocks of text.
   */
  private normalizeInputForLookup(inputText: string): {
    normalizedInput: string;
    trueLengths: number[];
  } {
    let result = '';
    const trueLengths: number[] = [];

    for (let i = 0; i < inputText.length; i++) {
      const currentChar = inputText.charAt(i);
      const currentCharCode = currentChar.charCodeAt(0);
      let isSemiVoiced = false;
      let isVoiced = false;
      const isHalfWidthKatakana =
        currentCharCode >= KANA.HW_KATAKANA_START &&
        currentCharCode <= KANA.HW_KATAKANA_END;

      let key = currentChar;
      if (Object.values(SKIPPABLE).includes(currentCharCode)) {
        continue;
      } else if (isHalfWidthKatakana) {
        const nextChar = inputText.charAt(i + 1);
        const nextCharCode = nextChar.charCodeAt(0);
        isSemiVoiced = nextCharCode === PUNCTUATION.SEMI_VOICED_MARK;
        isVoiced = nextCharCode === PUNCTUATION.VOICED_MARK;
        if (isSemiVoiced || isVoiced) {
          // In half-width katakana, voiced and semi-voiced characters are
          // represented as two characters. By combining them into one, we can
          // convert the double character into a single hiragana.
          key += nextChar;
          i++;
        }
      }

      const hiragana = KANA_TO_HIRAGANA_NORMALIZATION_MAP[key];
      result += hiragana !== undefined ? hiragana : currentChar;

      trueLengths[result.length] = i + 1;
    }
    return { normalizedInput: result, trueLengths };
  }

  public wordSearch(
    word: string,
    doNames: boolean,
    max?: number
  ): DictEntryData | null {
    const entry = RcxDict.createDefaultDictEntry();
    const normalizationResult = this.normalizeInputForLookup(word);
    word = normalizationResult.normalizedInput;

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
      console.log('doNames');
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
              maxLen = normalizationResult.trueLengths[word.length];
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
    return entry;
  }

  public translate(text: string): (DictEntryData & { textLen: number }) | null {
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

  public kanjiSearch(kanji: string): DictEntryData | null {
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

  private static readonly KANJI_INFO_LABELS: {
    code: string;
    kanjiInfoLabel: string;
  }[] = [
    /*
      This is a small list of kanji info labels we currently don't include:
        'C',   'Classical Radical',
        'DR',  'Father Joseph De Roo Index',
        'DO',  'P.G. O\'Neill Index',
        'O',   'P.G. O\'Neill Japanese Names Index',
        'Q',   'Four Corner Code',
        'MN',  'Morohashi Daikanwajiten Index',
        'MP',  'Morohashi Daikanwajiten Volume/Page',
        'K',  'Gakken Kanji Dictionary Index',
        'W',  'Korean Reading',
      Here is a comprehensive up-to-date list of all the kanji info labels:
        http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
    */
    { code: 'H', kanjiInfoLabel: 'Halpern' },
    { code: 'L', kanjiInfoLabel: 'Heisig 5th Edition' },
    { code: 'DN', kanjiInfoLabel: 'Heisig 6th Edition' },
    { code: 'E', kanjiInfoLabel: 'Henshall' },
    { code: 'DK', kanjiInfoLabel: 'Kanji Learners Dictionary' },
    { code: 'DL', kanjiInfoLabel: 'Kanji Learners Dictionary 2nd Edition' },
    { code: 'N', kanjiInfoLabel: 'Nelson' },
    { code: 'V', kanjiInfoLabel: 'New Nelson' },
    { code: 'Y', kanjiInfoLabel: 'PinYin' },
    { code: 'P', kanjiInfoLabel: 'Skip Pattern' },
    { code: 'IN', kanjiInfoLabel: 'Tuttle Kanji & Kana' },
    { code: 'I', kanjiInfoLabel: 'Tuttle Kanji Dictionary' },
    { code: 'U', kanjiInfoLabel: 'Unicode' },
  ];

  // TODO: Entry should be extracted as separate type.
  public makeHtml(entry: DictEntryData | null) {
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
        `<span class="k-yomi${
          this.config.outlineOkurigana ? '-hi' : '-no-hi'
        }">$1</span>`
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

  public makeText(entry: DictEntryData | null, max: number): string {
    if (entry === null) {
      return '';
    }

    const result = [];

    if (entry.kanji) {
      result.push(entry.kanji + '\n');
      result.push((entry.eigo.length ? entry.eigo : '-') + '\n');

      result.push(
        entry.onkun.replace(/\.([^\u3001]+)/g, '\uFF08$1\uFF09') + '\n'
      );
      if (entry.nanori.length) {
        result.push('\u540D\u4E57\u308A\t' + entry.nanori + '\n');
      }
      if (entry.bushumei.length) {
        result.push('\u90E8\u9996\u540D\t' + entry.bushumei + '\n');
      }

      for (const { code, kanjiInfoLabel } of RcxDict.KANJI_INFO_LABELS) {
        const kanjiInfo = entry.misc[code] || '-';
        result.push(kanjiInfoLabel + '\t' + kanjiInfo + '\n');
      }
    } else {
      if (max > entry.data.length) {
        max = entry.data.length;
      }
      for (let i = 0; i < max; ++i) {
        const wordDictEntry = parseWordDictEntry(entry.data[i].entry);
        if (!wordDictEntry) {
          continue;
        }
        const { word, pronunciation, definitions } = wordDictEntry;

        if (pronunciation) {
          result.push(word + '\t' + pronunciation);
        } else {
          result.push(word);
        }

        result.push('\t' + definitions.join('; ') + '\n');
      }
    }
    return result.join('');
  }
}

export { RcxDict };
export type { DictEntryData };

﻿/*

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
window.rcxMain = {
  haveNames: true,
  //  canDoNames: false,
  dictCount: 3,
  altView: 0,
  enabled: 0,

  /*
    onLoad: function() { rcxMain._onLoad(); },
  _onLoad: function() {
    try {
      //this.loadPrefs();
      //this.haveNames = this.canDoNames = (typeof(rcxNamesDict) != 'undefined');
    }
    catch (ex) {
      alert('Exception in onLoad: ' + ex);
    }
  },
*/
  /*
  //Switch this over to local storage method for chrome.  Have to make a UI.
  loadPrefs: function() {
    try {
        var pb = this.getPrefBranch();
      var xm = ['cm', 'tm'];
      var i;
      var a, b, c;

      this.cfg = {};
      for (i = 0; i < rcxCfgList.length; ++i) {
        b = rcxCfgList[i];
        switch (b[0]) {
        case 0:
          this.cfg[b[1]] = pb.getIntPref(b[1]);
          break;
        case 1:
          this.cfg[b[1]] = pb.getCharPref(b[1]);
          break;
        case 2:
          this.cfg[b[1]] = pb.getBoolPref(b[1]);
          break;
        }
      }

      this.dictCount = 3;
      this.canDoNames = this.haveNames;
      if (!this.haveNames) this.cfg.dictorder = 0;
      switch (this.cfg.dictorder) {
      case 0:
        this.canDoNames = false;
        this.dictCount = 2;
      case 1:
        this.kanjiN = 1;
        this.namesN = 2;
        break;
      case 2:
        this.kanjiN = 2;
        this.namesN = 1;
        break;
      }

      for (i = 1; i >= 0; --i) {
        c = xm[i];
        try {
          a = !this.cfg[c + 'toggle'];
          b = !this.cfg[c + 'lbar'];
          document.getElementById('rikaichan-toggle-' + c).hidden = a;
          document.getElementById('rikaichan-lbar-' + c).hidden = b;
          document.getElementById('rikaichan-separator-' + xm[i]).hidden = a || b;
        }
        catch (ex) {
          //  alert('unable to set menu: c=' + c + ' ex=' + ex)
        }
      }

      switch (this.cfg.ssep) {
      case 'Tab':
        this.cfg.ssep = '\t';
        break;
      case 'Comma':
        this.cfg.ssep = ',';
        break;
      case 'Space':
        this.cfg.ssep = ' ';
        break;
      }

      this.cfg.css = (this.cfg.css.indexOf('/') == -1) ? ('chrome://rikaichan/skin/popup-' + this.cfg.css + '.css') : this.cfg.css;
      if (!this.isTB) {
        for (i = 0; i < gBrowser.browsers.length; ++i) {
          c = gBrowser.browsers[i].contentDocument.getElementById('rikaichan-css');
          if (c) c.setAttribute('href', this.cfg.css);
        }
      }

      c = { };
      c.kdisp = [];
      a = pb.getCharPref('kindex').split(',');
      for (i = 0; i < a.length; ++i) {
        c.kdisp[a[i]] = 1;
      }
      c.wmax = this.cfg.wmax;
      c.wpop = this.cfg.wpop;
      c.wpos = this.cfg.wpos;
      c.namax = this.cfg.namax;
      this.dconfig = c;
      if (this.dict) this.dict.setConfig(c);

      if (this.isTB) this.cfg.enmode = 0;

      b = document.getElementById('rikaichan-status');
      if (b) b.hidden = (this.cfg.sticon == 0);
    }
    catch (ex) {
      alert('Exception in LoadPrefs: ' + ex);
    }
  },
*/

  loadDictionary: function () {
    this.dict = new RcxDict();
    return this.dict.init(this.haveNames /* && !this.cfg.nadelay*/);
    // this.dict.setConfig(this.dconfig);
  },
  /*
  showDownload: function() {
    const url = 'http://rikaichan.mozdev.org/welcome.html';

    try {
      var u = '';

      if (this.version != null) {
        u += 'rv=' + this.version + '&';
      }
      if ((typeof(rcxWordDict) != 'undefined') && (rcxWordDict.version != null)) {
        u += 'wv=' + rcxWordDict.version + '&';
      }
      if ((typeof(rcxNamesDict) != 'undefined') && (rcxNamesDict.version != null)) {
        u += 'nv=' + rcxNamesDict.version + '&';
      }
      if (u.length) u = url + '?' + u;
        else u = url;

      if (this.isTB) {
        Components.classes['@mozilla.org/messenger;1'].createInstance()
          .QueryInterface(Components.interfaces.nsIMessenger)
          .launchExternalURL(u);
      }
      else {
        var w = window.open(u, 'rcxdict');
        if (w) w.focus();
      }
    }
    catch (ex) {
      if (typeof(rcxWordDict) == 'undefined') {
        alert('[rikaichan] Please install a dictionary file from ' + url);
      }
      else {
        alert('[rikaichan] There was an error while opening ' + url);
      }
    }
  },

*/

  // The callback for onSelectionChanged
  // Just sends a message to the tab to enable itself if it hasn't
  // already
  onTabSelect: function (tabId) {
    rcxMain._onTabSelect(tabId);
  },
  _onTabSelect: function (tabId) {
    if (this.enabled == 1)
      chrome.tabs.sendMessage(tabId, {
        type: 'enable',
        config: rcxMain.config,
      });
  },

  savePrep: function (clip, entry) {
    let me;
    let text;
    let i;
    let e;

    const f = entry;
    if (!f || f.length == 0) return null;

    if (clip) {
      // save to clipboard
      me = rcxMain.config.maxClipCopyEntries;
      // mk = this.cfg.smaxck; // something related to the number of kanji in the look-up bar
    }
    /* else { // save to file
      me = this.cfg.smaxfe;
      //mk = this.cfg.smaxfk;
    }*/

    text = '';
    for (i = 0; i < f.length; ++i) {
      e = f[i];
      if (e.kanji) {
        // if (mk-- <= 0) continue
        text += this.dict.makeText(e, 1);
      } else {
        if (me <= 0) continue;
        text += this.dict.makeText(e, me);
        me -= e.data.length;
      }
    }

    if (rcxMain.config.lineEnding == 'rn') text = text.replace(/\n/g, '\r\n');
    else if (rcxMain.config.lineEnding == 'r') text = text.replace(/\n/g, '\r');
    if (rcxMain.config.copySeparator != 'tab') {
      if (rcxMain.config.copySeparator == 'comma')
        return text.replace(/\t/g, ',');
      if (rcxMain.config.copySeparator == 'space')
        return text.replace(/\t/g, ' ');
    }

    return text;
  },

  // Needs entirely new implementation and dependent on savePrep
  copyToClip: function (tab, entry) {
    let text;

    if ((text = this.savePrep(1, entry)) != null) {
      document.oncopy = function (event) {
        event.clipboardData.setData('Text', text);
        event.preventDefault();
      };
      document.execCommand('Copy');
      document.oncopy = undefined;
      chrome.tabs.sendMessage(tab.id, {
        type: 'showPopup',
        text: 'Copied to clipboard.',
      });
    }
  },

  miniHelp:
    '<span style="font-weight:bold">Rikaikun enabled!</span><br><br>' +
    '<table cellspacing=5>' +
    '<tr><td>A</td><td>Alternate popup location</td></tr>' +
    '<tr><td>Y</td><td>Move popup location down</td></tr>' +
    '<tr><td>C</td><td>Copy to clipboard</td></tr>' +
    '<tr><td>D</td><td>Hide/show definitions</td></tr>' +
    '<tr><td>Shift/Enter&nbsp;&nbsp;</td><td>Switch dictionaries</td></tr>' +
    '<tr><td>B</td><td>Previous character</td></tr>' +
    '<tr><td>M</td><td>Next character</td></tr>' +
    '<tr><td>N</td><td>Next word</td></tr>' +
    '<tr><td>J</td><td>Scroll back definitions</td></tr>' +
    '<tr><td>K</td><td>Scroll forward definitions</td></tr>' +
    '</table>',

  /*       '<tr><td>C</td><td>Copy to clipboard</td></tr>' +
    '<tr><td>S</td><td>Save to file</td></tr>' + */

  // Function which enables the inline mode of rikaikun
  // Unlike rikaichan there is no lookup bar so this is the only enable.
  inlineEnable: function (tab, mode) {
    if (!this.dict) {
      //  var time = (new Date()).getTime();
      this.loadDictionary()
        .then(
          function () {
            // Send message to current tab to add listeners and create stuff
            chrome.tabs.sendMessage(tab.id, {
              type: 'enable',
              config: rcxMain.config,
            });
            this.enabled = 1;

            if (mode == 1) {
              if (rcxMain.config.minihelp)
                chrome.tabs.sendMessage(tab.id, {
                  type: 'showPopup',
                  text: rcxMain.miniHelp,
                });
              else
                chrome.tabs.sendMessage(tab.id, {
                  type: 'showPopup',
                  text: 'Rikaikun enabled!',
                });
            }
            chrome.browserAction.setBadgeBackgroundColor({
              color: [255, 0, 0, 255],
            });
            chrome.browserAction.setBadgeText({ text: 'On' });
          }.bind(this)
        )
        .catch(function (err) {
          alert('Error loading dictionary: ' + err);
        });

      //  time = (((new Date()).getTime() - time) / 1000).toFixed(2);
    }
  },

  // This function diables
  inlineDisable: function () {
    // Delete dictionary object after we implement it
    delete this.dict;

    this.enabled = 0;
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
    chrome.browserAction.setBadgeText({ text: '' });

    // Send a disable message to all browsers
    chrome.windows.getAll({ populate: true }, function (windows) {
      for (let i = 0; i < windows.length; ++i) {
        const tabs = windows[i].tabs;
        for (let j = 0; j < tabs.length; ++j) {
          chrome.tabs.sendMessage(tabs[j].id, { type: 'disable' });
        }
      }
    });
  },

  inlineToggle: function (tab) {
    if (rcxMain.enabled) rcxMain.inlineDisable(tab, 1);
    else rcxMain.inlineEnable(tab, 1);
  },

  kanjiN: 1,
  namesN: 2,

  showMode: 0,

  nextDict: function () {
    this.showMode = (this.showMode + 1) % this.dictCount;
  },

  resetDict: function () {
    this.showMode = 0;
  },

  sameDict: '0',
  forceKanji: '1',
  defaultDict: '2',
  nextDict: '3',

  search: function (text, dictOption) {
    switch (dictOption) {
      case this.forceKanji:
        const e = this.dict.kanjiSearch(text.charAt(0));
        return e;
        break;
      case this.defaultDict:
        this.showMode = 0;
        break;
      case this.nextDict:
        this.showMode = (this.showMode + 1) % this.dictCount;
        break;
    }

    const m = this.showMode;
    let e = null;

    do {
      switch (this.showMode) {
        case 0:
          e = this.dict.wordSearch(text, false);
          break;
        case this.kanjiN:
          e = this.dict.kanjiSearch(text.charAt(0));
          break;
        case this.namesN:
          e = this.dict.wordSearch(text, true);
          break;
      }
      if (e) break;
      this.showMode = (this.showMode + 1) % this.dictCount;
    } while (this.showMode != m);

    return e;
  },
};

/*
  2E80 - 2EFF  CJK Radicals Supplement
  2F00 - 2FDF  Kangxi Radicals
  2FF0 - 2FFF  Ideographic Description
p  3000 - 303F CJK Symbols and Punctuation
x  3040 - 309F Hiragana
x  30A0 - 30FF Katakana
  3190 - 319F  Kanbun
  31F0 - 31FF Katakana Phonetic Extensions
  3200 - 32FF Enclosed CJK Letters and Months
  3300 - 33FF CJK Compatibility
x  3400 - 4DBF  CJK Unified Ideographs Extension A
x  4E00 - 9FFF  CJK Unified Ideographs
x  F900 - FAFF  CJK Compatibility Ideographs
p  FF00 - FFEF Halfwidth and Fullwidth Forms
x  FF66 - FF9D  Katakana half-width

*/

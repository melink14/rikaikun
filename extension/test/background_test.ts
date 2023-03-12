import { Config } from '../configuration';
import { RcxMain } from '../rikaichan';
import { expect, use } from '@esm-bundle/chai';
import { tts } from '../texttospeech';
import chrome from 'sinon-chrome';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

use(sinonChai);
let rcxMain: RcxMain;

// used for stubbing data
const entry =
  '小さい [ちいさい] /(adj-i) (1) small/little/tiny\
        /(adj-i) (2) slight/below average (in degree, amount, etc.)\
        /minor/small/(adj-i) (3) low (e.g. sound)/soft (e.g. voice)\
        /(adj-i) (4) unimportant/petty/insignificant/trifling/trivial\
        /(adj-i) (5) young/juvenile/(P)/';
const entryStub = {
  kanji: '',
  onkun: '',
  nanori: '',
  bushumei: '',
  misc: {} as Record<string, string>,
  eigo: '',
  hasNames: false,
  data: [{ entry, reason: '' }],
  hasMore: false,
  title: '',
  index: 0,
  matchLen: 0,
};

describe('background.ts', function () {
  // Increase timeout from 2000ms since data tests can take longer.
  // Make it relative to current timeout so config level changes are taken
  // into account. (ie browserstack)
  this.timeout(this.timeout() * 2);
  before(async function () {
    // Resolve config fetch with minimal config object.
    chrome.storage.sync.get.yields({ kanjiInfo: [] });
    // Imports only run once so run in `before` to make it deterministic.
    rcxMain = await (await import('../background')).TestOnlyRxcMainPromise;
  });

  beforeEach(function () {
    // Only reset the spies we're using since we need to preserve
    // the state of `chrome.runtime.onMessage.addListener` for invoking
    // the core functionality of background.ts.
    chrome.tabs.sendMessage.reset();
  });

  describe('when sent enable? message', function () {
    it('should send "enable" message to tab', async function () {
      rcxMain.enabled = 1;

      await sendMessageToBackground({ type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        /* tabId= */ sinon.match.any,
        {
          type: 'enable',
        }
      );
    });

    it('should respond to the same tab it received a message from', async function () {
      rcxMain.enabled = 1;
      const tabId = 10;

      await sendMessageToBackground({ tabId: tabId, type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        tabId,
        /* message= */ sinon.match.any
      );
    });

    it('should send config in message to tab', async function () {
      rcxMain.enabled = 1;
      rcxMain.config = { copySeparator: 'testValue' } as Config;

      await sendMessageToBackground({ type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        /* tabId= */ sinon.match.any,
        { config: rcxMain.config }
      );
    });

    it('should throw typeError if tab is undefined', async function () {
      // }).to.throw(TypeError, 'sender.tab is always defined here.');
    });
  });

  describe('xsearch', function () {
    it('should return search results', async function () {
      const searchStub = sinon.stub().returns(['to eat', 'verb']);
      rcxMain.search = searchStub;
      const request = {
        type: 'xsearch',
        text: 'た',
        dictOption: '2',
      };
      const sender = { tab: { id: 0 } };
      const response = sinon.spy();

      // eslint-disable-next-line @typescript-eslint/await-thenable
      await chrome.runtime.onMessage.addListener.callArgWith(
        0,
        request,
        sender,
        response
      );

      expect(searchStub.calledWith(request.text, request.dictOption)).to.be
        .true;

      expect(response.called).to.be.true;
    });

    it('should not search if text is empty', async function () {
      const searchStub = sinon.stub().returns(['to eat', 'verb']);
      rcxMain.search = searchStub;
      const request = { type: 'xsearch', text: '', dictOption: '2' };
      const sender = { tab: { id: 0 } };
      const response = sinon.spy();

      // eslint-disable-next-line @typescript-eslint/await-thenable
      await chrome.runtime.onMessage.addListener.callArgWith(
        0,
        request,
        sender,
        response
      );

      expect(searchStub).to.not.be.called;
      expect(response.called).to.be.false;
    });
  });

  async function sendMessageToBackground({
    tabId = 0,
    type,
    responseCallback = () => {
      // Do nothing by default.
    },
  }: {
    tabId?: number;
    type: string;
    responseCallback?: (response: unknown) => void;
  }): Promise<void> {
    // In background.ts, a promise is passed to `addListener` so we can await it here.
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await chrome.runtime.onMessage.addListener.yield(
      { type: type },
      { tab: { id: tabId } },
      responseCallback
    );
    return;
  }
});

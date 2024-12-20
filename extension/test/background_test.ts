import { Config } from '../configuration';
import { RcxMain } from '../rikaichan';
import { expect, use } from 'chai';
import chrome from 'sinon-chrome';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

use(sinonChai);

let rcxMain: RcxMain;

describe('background.ts', function () {
  // Increase timeout from 2000ms since data tests can take longer.
  // Make it relative to current timeout so config level changes are taken
  // into account. (ie browserstack)
  this.timeout(this.timeout() * 2);

  before(async function () {
    // Resolve config fetch with minimal config object.
    chrome.storage.sync.get.yields({ kanjiInfo: [] });
    chrome.storage.local.get.returns(Promise.resolve({ enabled: false }));
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
      rcxMain.enabled = true;

      await sendMessageToBackground({ type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        /* tabId= */ sinon.match.any,
        {
          type: 'enable',
        }
      );
    });

    it('should respond to the same tab it received a message from', async function () {
      rcxMain.enabled = true;
      const tabId = 10;

      await sendMessageToBackground({ tabId: tabId, type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        tabId,
        /* message= */ sinon.match.any
      );
    });

    it('should send config in message to tab', async function () {
      rcxMain.enabled = true;
      rcxMain.config = { copySeparator: 'testValue' } as Config;

      await sendMessageToBackground({ type: 'enable?' });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        /* tabId= */ sinon.match.any,
        { config: rcxMain.config }
      );
    });
  });

  describe('when sent xsearch message', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('should call rcxMain.search with the value', async function () {
      const expectedText = 'theText';
      const searchStub = sinon.stub(rcxMain, 'search');

      await sendMessageToBackground({
        type: 'xsearch',
        text: expectedText,
      });

      expect(searchStub).to.have.been.calledOnceWith(
        expectedText,
        sinon.match.any
      );
    });

    it('should not call rcxMain.search if request.text is an empty string', async function () {
      const searchStub = sinon.stub(rcxMain, 'search');

      await sendMessageToBackground({
        type: 'xsearch',
        text: '',
      });

      expect(searchStub).to.not.have.been.called;
    });
  });
});

type Payload = {
  tabId?: number;
  text?: string;
  type: string;
  responseCallback?: (response: unknown) => void;
};

async function sendMessageToBackground({
  tabId = 0,
  type,
  text,
  responseCallback = () => {
    // Do nothing by default.
  },
}: Payload): Promise<void> {
  const request: { type: string; text?: string } = {
    type,
    text,
  };

  // In background.ts, a promise is passed to `addListener` so we can await it here.
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await chrome.runtime.onMessage.addListener.yield(
    request,
    { tab: { id: tabId } },
    responseCallback
  );
  return;
}

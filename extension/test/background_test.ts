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

  describe('xsearch', function () {
    it('should call response callback with search correct values', async function () {
      rcxMain.search = sinon
        .stub()
        .returns({ text: 'theText', dictOptions: '0' });
      const response = sinon.spy();

      await sendMessageToBackground({
        tabId: 0,
        type: 'xsearch',
        text: 'A non empty string',
        responseCallback: response,
      });

      expect(response).to.have.been.calledWithMatch({
        text: 'theText',
        dictOptions: sinon.match.any,
      });
      expect(response).to.have.been.calledOnce;
    });

    it('should not search if request.text is an empty string', async function () {
      const response = sinon.spy();

      await sendMessageToBackground({
        tabId: 0,
        type: 'xsearch',
        text: '',
        responseCallback: response,
      });

      expect(response.called).to.be.false;
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
  };
  const sender = {
    tab: { id: tabId },
  };
  if (text !== undefined) {
    request['text'] = text;
  }
  // In background.ts, a promise is passed to `addListener` so we can await it here.
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await chrome.runtime.onMessage.addListener.yield(
    request,
    sender,
    responseCallback
  );
  return;
}

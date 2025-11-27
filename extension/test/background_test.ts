import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Config } from '../configuration';
import { DictEntryData } from '../data';
import { RcxMain } from '../rikaichan';
import { stubbedChrome as chrome } from './chrome_stubs';

use(sinonChai);
use(chaiAsPromised);

let rcxMain: RcxMain;
let onMessagePromiseHolder: { onMessagePromise: Promise<void> };

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
    const { TestOnlyRxcMainPromise, testOnlyPromiseHolder } =
      await import('../background');
    onMessagePromiseHolder = testOnlyPromiseHolder;
    rcxMain = await TestOnlyRxcMainPromise;
  });

  beforeEach(function () {
    // Only reset the spies we're using since we need to preserve
    // the state of `chrome.runtime.onMessage.addListener` for invoking
    // the core functionality of background.ts.
    chrome.tabs.sendMessage.reset();
    chrome.runtime.sendMessage.reset();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('when sent enable? message', function () {
    it('should send "enable" message to tab', async function () {
      rcxMain.enabled = true;

      await sendMessageToBackground({ request: { type: 'enable?' } });

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

      await sendMessageToBackground({ tabId, request: { type: 'enable?' } });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        tabId,
        /* message= */ sinon.match.any
      );
    });

    it('should throw an error if sender.tab is undefined', async function () {
      await expect(
        sendMessageToBackground({
          tabId: null,
          request: { type: 'enable?' },
        })
      ).to.be.rejectedWith(TypeError, 'sender.tab is always defined here.');
    });

    it('should send config in message to tab', async function () {
      rcxMain.enabled = true;
      rcxMain.config = { copySeparator: 'testValue' } as Config;

      await sendMessageToBackground({ request: { type: 'enable?' } });

      expect(chrome.tabs.sendMessage).to.have.been.calledWithMatch(
        /* tabId= */ sinon.match.any,
        { config: rcxMain.config }
      );
    });
  });

  describe('when sent xsearch message', function () {
    it('should call response callback with the value returned by rcxMain.search', async function () {
      const request = {
        type: 'xsearch',
        text: 'testXsearch',
        dictOption: '-10',
      };
      sinon
        .stub(rcxMain, 'search')
        .withArgs(request.text, request.dictOption)
        .returns({ title: 'theText' } as DictEntryData);
      const response = sinon.spy();

      await sendMessageToBackground({
        request,
        responseCallback: response,
      });

      expect(response).to.have.been.calledWithMatch({ title: 'theText' });
    });

    it('should not call rcxMain.search if request.text is an empty string', async function () {
      const searchStub = sinon.stub(rcxMain, 'search');

      await sendMessageToBackground({
        request: { type: 'xsearch', text: '' },
      });

      expect(searchStub).to.not.have.been.called;
    });
  });

  describe('when sent resetDict message', function () {
    it('should call rcxMain.resetDict', async function () {
      const resetStub = sinon.stub(rcxMain, 'resetDict');

      await sendMessageToBackground({
        request: { type: 'resetDict' },
      });

      expect(resetStub).to.be.called;
    });
  });

  describe('when sent translate message', function () {
    it('should call response callback with result of rcxMain.data.translate', async function () {
      const request = {
        type: 'translate',
        title: 'た',
      };
      sinon
        .stub(rcxMain.dict, 'translate')
        .withArgs(request.title)
        .returns({
          title: 'translateTitle',
          textLen: 4,
        } as DictEntryData & { textLen: number });
      const response = sinon.spy();

      await sendMessageToBackground({ request, responseCallback: response });

      expect(response).to.be.calledWithMatch({
        title: 'translateTitle',
        textLen: 4,
      });
    });
  });

  describe('when sent makeHtml message', function () {
    it('should call response callback with the result of rcxMain.dict.makeHtml', async function () {
      const request = {
        type: 'makehtml',
        entry: { title: 'htmlTest' } as DictEntryData,
      };
      sinon
        .stub(rcxMain.dict, 'makeHtml')
        .withArgs(request.entry)
        .returns('myTestHtml');
      const response = sinon.spy();

      await sendMessageToBackground({
        request,
        responseCallback: response,
      });

      expect(response).to.be.calledWithMatch('myTestHtml');
    });
  });

  describe('when sent switchOnlyReading message', function () {
    it('should toggle the config value of onlyReading in chrome.storage.sync', async function () {
      const request = { type: 'switchOnlyReading' };
      rcxMain.config = { onlyreading: false } as Config;

      await sendMessageToBackground({ request });

      expect(chrome.storage.sync.set).to.be.calledWith({ onlyreading: true });
    });
  });

  describe('when sent copyToClip message', function () {
    it('should call copyToClip with given tab and entry', async function () {
      const copyStub = sinon.stub(rcxMain, 'copyToClip');
      const request = {
        type: 'copyToClip',
        entry: { title: 'copyTest' } as DictEntryData,
      };

      await sendMessageToBackground({ request, tabId: 12 });

      expect(copyStub).to.be.calledWith({ id: 12 }, request.entry);
    });
  });

  describe('when sent playTTS message', function () {
    it('should call setupOffscreenDocument', async function () {
      await sendMessageToBackground({ request: { type: 'playTTS', text: '' } });

      expect(chrome.offscreen.createDocument).to.be.called;
    });

    it('should send a message to the offscreen document to play TTS of text', async function () {
      const request = {
        type: 'playTTS',
        text: 'textToPlay',
      };

      await sendMessageToBackground({ request });

      expect(chrome.runtime.sendMessage).to.be.calledWith({
        target: 'offscreen',
        type: 'playTtsOffscreen',
        text: request.text,
      });
    });

    it('should rethrow any errors that happen while offscreen doc is playing TTS', async function () {
      const request = {
        type: 'playTTS',
      };
      const expectedError = new Error('testError');
      chrome.runtime.sendMessage.rejects(expectedError);

      await expect(sendMessageToBackground({ request }))
        .to.be.rejectedWith('Error while having offscreen doc play TTS')
        .and.eventually.have.property('cause')
        .that.deep.equals(expectedError);
    });
  });

  describe('when sent unhandled message', function () {
    it('should log informational message with request', async function () {
      const logger = sinon.stub(console, 'log');
      const request = {
        type: 'noMatch',
      };

      await sendMessageToBackground({ request });

      expect(logger).to.be.calledWithMatch(sinon.match('Unknown background'));
      expect(logger).to.be.calledWithMatch(sinon.match(request));
      logger.restore();
    });
  });
});

type Payload = {
  tabId?: number | null;
  request: object;
  responseCallback?: (response: unknown) => void;
};

async function sendMessageToBackground({
  tabId = 0,
  request = {},
  responseCallback = () => {
    // Do nothing by default.
  },
}: Payload): Promise<void> {
  // Allow a null tabId to denote it should be undefined (for testing error cases);
  const sender = { tab: tabId !== null ? { id: tabId } : undefined };

  // In background.ts, a promise is passed to `addListener` so we can await it here.
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await chrome.runtime.onMessage.addListener.yield(
    request,
    sender,
    responseCallback
  );
  await onMessagePromiseHolder.onMessagePromise;
  return;
}

import { Config } from '../configuration';
import { TestOnlyRcxContent } from '../rikaicontent';
import { executeServerCommand } from '@web/test-runner-commands';
import { expect, use } from '@esm-bundle/chai';
//import { visualDiff } from '@web/test-runner-visual-regression';
import chrome from 'sinon-chrome';
import simulant from 'simulant';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

use(sinonChai);

let rcxContent = new TestOnlyRcxContent();
let onMessageHandler: (
  request: {},
  sender: { tab: { id: number } },
  response: Function
) => Promise<void>;
let config: Config;

describe('RcxContent', () => {
  before(async () => {
    // When chrome.storage.sync.get is called set config to first arg
    chrome.storage.sync.get.callsFake((defaultConfig: Config, callback) => {
      config = defaultConfig;
      callback(defaultConfig);
    });
    // stub sinon chrome getURL method to return the path it's given
    chrome.extension.getURL.returnsArg(0);

    // Imports only run once so run in `before` to make it deterministic.
    await (
      await import('../background')
    ).TestOnlyRxcMainPromise;
    // Save a reference to the onMessage addListener callback
    onMessageHandler = chrome.runtime.onMessage.addListener.secondCall.args[0];
  });
  beforeEach(() => {
    chrome.reset();
    chrome.extension.getURL.returnsArg(0);
    rcxContent = new TestOnlyRcxContent();
    // Default enable rcxContent since no tests care about that now.
    rcxContent.enableTab(config);
    chrome.runtime.sendMessage.callsFake(async (request, response) => {
      await onMessageHandler(request, { tab: { id: 0 } }, response);
    });
  });
  afterEach(() => {
    rcxContent.disableTab();
  });
  describe('.show', () => {
    describe('when given Japanese word interrupted with text wrapped by `display: none`', () => {
      it('sends "xsearch" message with invisible text omitted', () => {
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>試<span style="display:none">test</span>す</span>'
        );

        executeShowForGivenNode(rcxContent, span);

        expect(chrome.runtime.sendMessage).to.have.been.calledWithMatch(
          { type: 'xsearch', text: '試す' },
          sinon.match.any
        );
      });
    });

    describe('when given Japanese word interrupted with text wrapped by `visibility: hidden`', function () {
      it('sends "xsearch" message with invisible text omitted', function () {
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>試<span style="visibility: hidden">test</span>す</span>'
        );

        executeShowForGivenNode(rcxContent, span);

        expect(chrome.runtime.sendMessage).to.have.been.calledWithMatch(
          { type: 'xsearch', text: '試す' },
          sinon.match.any
        );
      });
    });

    describe('when given Japanese word is interrupted with text wrapped by visible span', function () {
      it('sends "xsearch" message with all text included', function () {
        const rcxContent = new TestOnlyRcxContent();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>試<span>test</span>す</span>'
        );

        executeShowForGivenNode(rcxContent, span);

        expect(chrome.runtime.sendMessage).to.have.been.calledWithMatch(
          { type: 'xsearch', text: '試testす' },
          sinon.match.any
        );
      });
    });
  });

  describe('mousemove', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('handled without logging errors if `caretRangeFromPoint` returns null', function () {
      sinon
        .stub(document, 'caretRangeFromPoint')
        .returns(null as unknown as Range);
      sinon.spy(console, 'log');

      simulant.fire(document, 'mousemove');

      expect(console.log).to.not.have.been.called;
    });

    it('triggers xsearch message when above Japanese text', async function () {
      const clock = sinon.useFakeTimers();
      const span = insertHtmlIntoDomAndReturnFirstTextNode(
        '<span>先生test</span>'
      ) as HTMLSpanElement;
      chrome.extension.getURL.returnsArg(0);

      simulant.fire(span, 'mousemove', {
        clientX: span.offsetLeft,
        clientY: span.offsetTop,
      });
      // Tick the clock forward to account for the popup delay.
      clock.tick(150);
      const processHtml = rcxContent.processHtml;
      let promiseResolve: Function;
      const promise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      sinon.stub(rcxContent, 'processHtml').callsFake((html: string) => {
        const ret = processHtml.call(rcxContent, html);
        promiseResolve();
        return ret;
      });
      await promise;

      expect(chrome.runtime.sendMessage).to.have.been.calledWithMatch({
        type: 'xsearch',
        text: '先生test',
      });
      // await visualDiff(
      //   document.querySelector<HTMLDivElement>('#rikaichan-window')!,
      //   'rikaichan-window'
      // );
      await executeServerCommand('takePercySnapshot', {
        id: 'rikaichan-window',
      });
    });
  });

  describe('showPopup', function () {
    afterEach(function () {
      rcxContent.disableTab();
    });

    it('sets data-theme attribute of rikaikun window to config popupcolor value', function () {
      rcxContent.enableTab({ popupcolor: 'redtest' } as Config);

      rcxContent.showPopup('<span></span>');

      // expect rikaikun window to have data-theme attribute set to config popupcolor value
      expect(
        document.querySelector<HTMLDivElement>('#rikaichan-window')!.dataset
          .theme
      ).to.equal('redtest');
    });

    it('adds link tag pointing to "css/popup.css" to <head>', () => {
      chrome.extension.getURL.reset();
      chrome.extension.getURL.callsFake((path: string) => {
        return `http://fakebaseurl/${path}`;
      });

      rcxContent.showPopup('<span></span>');

      expect(
        document.querySelector<HTMLLinkElement>('head link')!.href
      ).to.equal('http://fakebaseurl/css/popup.css');
    });
  });
});

function insertHtmlIntoDomAndReturnFirstTextNode(htmlString: string): Node {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  return document.body.appendChild(template.content.firstChild!);
}

function executeShowForGivenNode(
  rcxContent: TestOnlyRcxContent,
  node: Node
): void {
  rcxContent.show(
    {
      prevRangeNode: rcxContent.getFirstTextChild(node) as Text,
      prevRangeOfs: 0,
      uofs: 0,
    },
    0
  );
}

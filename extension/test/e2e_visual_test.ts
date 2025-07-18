import { resetMouse, sendKeys, sendMouse } from '@web/test-runner-commands';
import { visualDiff } from '@web/test-runner-visual-regression';
import { use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Config } from '../configuration';
import { TestOnlyRcxContent } from '../rikaicontent';
import { stubbedChrome as sinonChrome } from './chrome_stubs';

use(sinonChai);

// Extract callback types from chrome listeners.
type StorageOnChangedHandler = Parameters<
  typeof chrome.storage.onChanged.addListener
>[0];
type OnMessageHandler = Parameters<
  typeof chrome.runtime.onMessage.addListener
>[0];
type BackgroundOnMessageHandler = (
  ...a: Parameters<OnMessageHandler>
) => Promise<void>;

// Initialize RcxContent and capture it's onMessage handler
new TestOnlyRcxContent();
const contentScriptOnMessageHandler: OnMessageHandler =
  sinonChrome.runtime.onMessage.addListener.firstCall.args[0];
// Reset chrome to clear that API call plus any others that happened during importing.
sinonChrome.reset();

// Properties which need to be set separately from where they're used.
let backgroundOnMessageHandler: BackgroundOnMessageHandler;
let onStorageChangedHandler: StorageOnChangedHandler;
let onActionClickedHandler: (tab: { id: number }) => Promise<void>;
let onActivatedHandler: (activeInfo: { tabId: number }) => Promise<void>;
let defaultConfig: Config;

// Define a root div for adding test DOM to that can be easily replaced
// in between tests.
let root = document.createElement('div');

describe('Visual Regression Tests', function () {
  // Increase timeout from 2000ms since e2e tests can take longer.
  // Make it relative to current timeout so config level changes are taken
  // into account. (ie browserstack)
  this.timeout(this.timeout() * 5);

  before(async function () {
    // When chrome.storage.sync.get is called save the full config for later use.
    sinonChrome.storage.sync.get.callsFake(
      (initialConfig: Config, callback: (config: Config) => void) => {
        defaultConfig = { ...initialConfig };
        callback(initialConfig);
      }
    );
    sinonChrome.storage.local.get.returns(Promise.resolve({ enabled: false }));

    // stub sinon chrome getURL method to return the path it's given
    sinonChrome.runtime.getURL.returnsArg(0);

    // Initializing backround page and saving it's onMessage handler allows
    // for simulating full content script -> background functionality.
    // Waiting on the RcxMain promise allows us to know exactly when setup is
    // finished.
    await (
      await import('../background')
    ).TestOnlyRxcMainPromise;

    // Handlers must be saved here since they are only captured at initial load
    // and stub will be reset after each test.
    // Save a reference to the onMessage addListener callback
    backgroundOnMessageHandler =
      sinonChrome.runtime.onMessage.addListener.firstCall.args[0];
    // Allows simulating changed configuration
    onStorageChangedHandler =
      sinonChrome.storage.onChanged.addListener.firstCall.args[0];

    // Allows simulating clicking the rikaikun button to turn rikaikun on and off.
    onActionClickedHandler =
      sinonChrome.action.onClicked.addListener.firstCall.args[0];

    // Calling this re-enables the content script with fresh config.
    // Simulates returning to a tab after modifying options.
    onActivatedHandler =
      sinonChrome.tabs.onActivated.addListener.firstCall.args[0];
  });

  beforeEach(async function () {
    // Return the identity URL when looking up popup CSS file.
    sinonChrome.runtime.getURL.returnsArg(0);
    root = createAndAppendRoot();

    configureMessagePassing();
    // Needed for toggling rikaikun off since it sends disable message to all tabs.
    sinonChrome.windows.getAll.returns([{ tabs: [{ id: 0 }] }]);

    // Enable and clear help popup.
    await toggleRikaikun();
    await waitForVisiblePopup();
    await sendKeys({ press: 'Escape' });
  });

  afterEach(async function () {
    await updateConfiguration(defaultConfig);
    await toggleRikaikun();
    await resetMouse();
    sinonChrome.reset();
    sinon.restore();
    root.remove();
  });

  describe('scrollable word entries', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        const clock = sinon.useFakeTimers();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>あいたくない</span>'
        ) as HTMLSpanElement;

        await triggerMousemoveAtElementStart(span);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();
        // Press 'k' to scroll down once to snapshot state where both
        // directions are scrollable.
        await sendKeys({ press: 'k' });

        await takeSnapshot(`word-entries-scrollable-${color}`);
      });
    });
  });

  describe('zoom', function () {
    for (const level of [1, 2, 3, 4]) {
      it(`should work at zoom level ${level}`, async function () {
        const clock = sinon.useFakeTimers();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>虫眼鏡</span>'
        ) as HTMLSpanElement;

        await triggerMousemoveAtElementStart(span);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();
        for (let i = 0; i < level; i++) {
          await sendKeys({ press: 'z' });
        }
        // Note that zoom level 4 should appear unzoomed.
        await visualDiff(document.body, `zoom-${level}`);
      });
    }
  });

  describe('kanji entries', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        const clock = sinon.useFakeTimers();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>立</span>'
        ) as HTMLSpanElement;

        await triggerMousemoveAtElementStart(span);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();

        await takeSnapshot(`kanji-entries-${color}`);
      });
    });

    describe('without okurigana highlighting', function () {
      // Disable ban on logic in describe in order to dynamically generate color tests
      // eslint-disable-next-line mocha/no-setup-in-describe
      ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
        it(`should render with ${color} theme`, async function () {
          await updateConfiguration({
            popupcolor: color,
            outlineOkurigana: false,
          });
          const clock = sinon.useFakeTimers();
          const span = insertHtmlIntoDomAndReturnFirstTextNode(
            '<span>立</span>'
          ) as HTMLSpanElement;

          await triggerMousemoveAtElementStart(span);
          // Tick the clock forward to account for the popup delay.
          clock.tick(150);
          await waitForVisiblePopup();

          await takeSnapshot(`kanji-entries-${color}-no-highlight`);
        });
      });
    });
  });

  describe('name entries', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        const clock = sinon.useFakeTimers();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>森</span>'
        ) as HTMLSpanElement;

        await triggerMousemoveAtElementStart(span);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();
        await sendKeys({ press: 'Shift' });
        await sendKeys({ press: 'Shift' });

        await takeSnapshot(`name-entries-${color}`);
      });
    });
  });

  describe('title translation', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        const clock = sinon.useFakeTimers();
        const img = insertHtmlIntoDomAndReturnFirstTextNode(
          '<img height="20px" width="20px" title="僕は小さい"></img>'
        ) as HTMLImageElement;

        await triggerMousemoveAtElementStart(img);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();

        await takeSnapshot(`title-translation-${color}`);
      });
    });
  });

  describe('enable mini help', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        // Turn rikaikun off.
        await toggleRikaikun();

        // Turn rikaikun on to see the help popup.
        await toggleRikaikun();
        await waitForVisiblePopup();

        await takeSnapshot(`enable-mini-help-${color}`);
      });
    });
  });

  describe('enable no help', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color, minihelp: false });
        // Turn rikaikun off.
        await toggleRikaikun();

        // Turn rikaikun on to see the help popup.
        await toggleRikaikun();
        await waitForVisiblePopup();

        await takeSnapshot(`enable-no-help-${color}`);
      });
    });
  });

  describe('copy to clipboard', function () {
    // Disable ban on logic in describe in order to dynamically generate color tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['blue', 'black', 'lightblue', 'yellow'].forEach((color) => {
      it(`should render correctly with ${color} theme`, async function () {
        await updateConfiguration({ popupcolor: color });
        const clock = sinon.useFakeTimers();
        const span = insertHtmlIntoDomAndReturnFirstTextNode(
          '<span>森</span>'
        ) as HTMLSpanElement;

        await triggerMousemoveAtElementStart(span);
        // Tick the clock forward to account for the popup delay.
        clock.tick(150);
        await waitForVisiblePopup();
        await sendKeys({ press: 'c' });

        await takeSnapshot(`enable-copy-to-clipboard-${color}`);
      });
    });
  });

  describe('with agressive host page styles', function () {
    afterEach(function () {
      document.querySelector('#test-id')?.remove();
    });

    it('should render correctly,ignoring external styles', async function () {
      const clock = sinon.useFakeTimers();
      const span = insertHtmlIntoDomAndReturnFirstTextNode(
        '<span>森</span>'
      ) as HTMLSpanElement;
      // Insert a tall div to make it obvious when popup is misplaced.
      insertHtmlIntoDomAndReturnFirstTextNode(
        '<div style="height:1000px"></div>'
      );
      const style = document.createElement('style');
      style.id = 'test-id';
      style.textContent =
        'body { text-align: center; } div { text-decoration: underline !important; position: relative;}';
      document.head.appendChild(style);

      await triggerMousemoveAtElementStart(span);
      // Tick the clock forward to account for the popup delay.
      clock.tick(150);
      await waitForVisiblePopup();

      // Take a screenshot of whole page to detect placement bugs.
      await visualDiff(document.body, 'ignoring-external-styles');
    });
  });
});

async function toggleRikaikun() {
  await onActionClickedHandler({ id: 0 });
}

// Simple chrome messaging stub to make content/background communication work.
function configureMessagePassing() {
  sinonChrome.runtime.sendMessage.callsFake(async (request, response) => {
    await backgroundOnMessageHandler(
      request,
      { tab: { id: 0 } as chrome.tabs.Tab },
      response
    );
  });
  // Also forward background messages to content script.
  sinonChrome.tabs.sendMessage.callsFake((tabId, request, responseCallback) => {
    contentScriptOnMessageHandler(
      request,
      {
        tab: { id: tabId } as chrome.tabs.Tab,
      },
      responseCallback
    );
  });
}

async function takeSnapshot(name: string) {
  await visualDiff(
    document
      .querySelector<HTMLDivElement>('#rikaichan-window')!
      .shadowRoot!.querySelector('#rikaikun-shadow')!,
    name
  );
}

function waitForVisiblePopup(): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkElement = () => {
      if (document.querySelector<HTMLDivElement>('#rikaichan-window')) {
        resolve();
        return;
      }
      // Timing out here gives a better error message than waiting for
      // the global test timeout.
      if (Date.now() - startTime > 2000) {
        reject(new Error("Rikaikun popup wasn't visible for 2000ms"));
        return;
      }

      requestAnimationFrame(checkElement);
    };
    checkElement();
  });
}

async function updateConfiguration(config: Partial<Config>) {
  onStorageChangedHandler(
    Object.fromEntries(
      Object.entries(config).map(([key, value]) => {
        return [key, { newValue: value }];
      })
    ),
    'sync'
  );
  // Send config to content script.
  await onActivatedHandler({ tabId: 0 });
}

async function triggerMousemoveAtElementStart(element: Element) {
  await sendMouse({
    type: 'move',
    position: [
      Math.ceil(element.getBoundingClientRect().left),
      Math.ceil(element.getBoundingClientRect().top),
    ],
  });
}

function insertHtmlIntoDomAndReturnFirstTextNode(htmlString: string): Node {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  return root.appendChild(template.content.firstChild!);
}

function createAndAppendRoot(): HTMLDivElement {
  const existingRoot = document.querySelector('#root');
  if (existingRoot) {
    existingRoot.remove();
  }
  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  root.style.position = 'relative';
  document.body.prepend(root);
  return root;
}

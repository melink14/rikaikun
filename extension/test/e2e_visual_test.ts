import { Config } from '../configuration';
import { TestOnlyRcxContent } from '../rikaicontent';
import { resetMouse, sendKeys, sendMouse } from '@web/test-runner-commands';
import { use } from '@esm-bundle/chai';
import { visualDiff } from '@web/test-runner-visual-regression';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sinonChrome from 'sinon-chrome';

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
let onBrowserActionClickedHandler: (tab: { id: number }) => Promise<void>;
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
        defaultConfig = initialConfig;
        callback(initialConfig);
      }
    );

    // stub sinon chrome getURL method to return the path it's given
    sinonChrome.extension.getURL.returnsArg(0);

    // Initializing backround page and saving it's onMessage handler allows
    // for simulating full content script -> background functionality.
    // Waiting on the RcxMain promise allows us to know exactly when setup is
    // finished.
    await (await import('../background')).TestOnlyRxcMainPromise;

    // Handlers must be saved here since they are only captured at initial load
    // and stub will be reset after each test.
    // Save a reference to the onMessage addListener callback
    backgroundOnMessageHandler =
      sinonChrome.runtime.onMessage.addListener.firstCall.args[0];
    // Allows simulating changed configuration
    onStorageChangedHandler =
      sinonChrome.storage.onChanged.addListener.firstCall.args[0];

    // Allows simulating clicking the rikaikun button to turn rikaikun on and off.
    onBrowserActionClickedHandler =
      sinonChrome.browserAction.onClicked.addListener.firstCall.args[0];

    // Calling this re-enables the content script with fresh config.
    // Simulates returning to a tab after modifying options.
    onActivatedHandler =
      sinonChrome.tabs.onActivated.addListener.firstCall.args[0];
  });

  beforeEach(async function () {
    // Return the identity URL when looking up popup CSS file.
    sinonChrome.extension.getURL.returnsArg(0);
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
        //initializeRcxContent({ popupcolor: color });
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
});

async function toggleRikaikun() {
  await onBrowserActionClickedHandler({ id: 0 });
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
  return new Promise((resolve) => {
    const popup = document.querySelector<HTMLDivElement>('#rikaichan-window');
    if (!popup) {
      return;
    }
    const o = new IntersectionObserver(() => {
      resolve();
      o.disconnect();
    });
    o.observe(popup);
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
      element.getBoundingClientRect().left,
      element.getBoundingClientRect().top,
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
  document.body.appendChild(root);
  return root;
}

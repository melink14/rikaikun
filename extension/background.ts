import { RcxDict } from './data';
import { RcxMain } from './rikaichan';
import { configPromise } from './configuration';
import { setupOffscreenDocument } from './offscreen-setup';

/**
 * Returns a promise for fully initialized RcxMain. Async due to config and
 * RcxDict initialization.
 */
async function createRcxMainPromise(): Promise<RcxMain> {
  const config = await configPromise;
  const dict = await RcxDict.create(config);
  const { enabled } = await chrome.storage.local.get({ enabled: false });
  return RcxMain.create(dict, config, enabled);
}
const rcxMainPromise: Promise<RcxMain> = createRcxMainPromise();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
chrome.action.onClicked.addListener(async (tab) => {
  const rcxMain = await rcxMainPromise;
  rcxMain.inlineToggle(tab);
});

// Passing a promise to `addListener` here allows us to await the promise in tests.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const rcxMain = await rcxMainPromise;
  rcxMain.onTabSelect(activeInfo.tabId);
});

chrome.runtime.onMessage.addListener((request, sender, response) => {
  void (async () => {
    const rcxMain = await rcxMainPromise;
    switch (request.type) {
      case 'enable?':
        console.log('enable?');
        if (sender.tab === undefined) {
          throw TypeError('sender.tab is always defined here.');
        }
        rcxMain.onTabSelect(sender.tab.id);
        break;
      case 'xsearch':
        console.log('xsearch');
        response(rcxMain.search(request.text, request.dictOption));
        break;
      case 'resetDict':
        console.log('resetDict');
        rcxMain.resetDict();
        break;
      case 'translate':
        console.log('translate');
        response(rcxMain.dict.translate(request.title));
        break;
      case 'makehtml':
        console.log('makehtml');
        response(rcxMain.dict.makeHtml(request.entry));
        break;
      case 'switchOnlyReading':
        console.log('switchOnlyReading');
        void chrome.storage.sync.set({
          onlyreading: !rcxMain.config.onlyreading,
        });
        break;
      case 'copyToClip':
        console.log('copyToClip');
        await rcxMain.copyToClip(sender.tab, request.entry);
        break;
      case 'playTTS':
        console.log('playTTS');
        await setupOffscreenDocument();
        try {
          await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'playTtsOffscreen',
            text: request.text,
          });
        } catch (e) {
          throw new Error('Error while having offscreen doc play TTS.', {
            cause: e,
          });
        }
        break;
      default:
        console.log('Unknown background request type:');
        console.log(request);
    }
  })();
  return true;
});

export { rcxMainPromise as TestOnlyRxcMainPromise };

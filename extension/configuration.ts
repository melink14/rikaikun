const DefaultConfig = {
  copySeparator: 'tab',
  disablekeys: false,
  highlight: true,
  kanjicomponents: true,
  lineEnding: 'n',
  maxClipCopyEntries: 7,
  maxDictEntries: 7,
  minihelp: true,
  onlyreading: false,
  popupcolor: 'blue',
  popupDelay: 150,
  popupLocation: 0,
  showOnKey: '',
  textboxhl: false,
  ttsEnabled: false,
  kanjiInfo: [
    { code: 'H', name: 'Halpern', shouldDisplay: true },
    { code: 'L', name: 'Heisig 5th Edition', shouldDisplay: true },
    { code: 'DN', name: 'Heisig 6th Edition', shouldDisplay: true },
    { code: 'E', name: 'Henshall', shouldDisplay: true },
    { code: 'DK', name: 'Kanji Learners Dictionary', shouldDisplay: true },
    { code: 'N', name: 'Nelson', shouldDisplay: true },
    { code: 'V', name: 'New Nelson', shouldDisplay: true },
    { code: 'Y', name: 'PinYin', shouldDisplay: true },
    { code: 'P', name: 'Skip Pattern', shouldDisplay: true },
    { code: 'IN', name: 'Tuttle Kanji &amp; Kana', shouldDisplay: true },
    { code: 'I', name: 'Tuttle Kanji Dictionary', shouldDisplay: true },
    { code: 'U', name: 'Unicode', shouldDisplay: true },
  ],
};
type Config = typeof DefaultConfig;

let currentConfig: Config | undefined;
const initOptions = (async function migrateOptions() {
  currentConfig = await getStorageSync();
  // Old version had a flat object here instead of an
  // array of objects.
  if (!(currentConfig.kanjiInfo instanceof Array)) {
    const newKanjiInfo = [];
    for (const info of DefaultConfig.kanjiInfo) {
      newKanjiInfo.push({
        ...info,
        shouldDisplay: currentConfig.kanjiInfo[info.code],
      });
    }
    currentConfig.kanjiInfo = newKanjiInfo;
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set(currentConfig!, resolve);
    });
  }
})();

async function getCurrentConfiguration(): Promise<Config> {
  // Probably not required but insures any migrations have
  // happened before we access them normally.
  await initOptions;
  return getStorageSync();
}

// Simply wrapper which makes `sync.get` `Promise` based.
function getStorageSync(): Promise<Config> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(DefaultConfig, function (cloudStorage) {
      resolve(cloudStorage as Config);
    });
  });
}

const updateConfigCallbacks: ((config: Config) => void)[] = [];
function registerUpdateConfigCallback(callback: (config: Config) => void) {
  updateConfigCallbacks.push(callback);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (currentConfig == undefined) return;

  Object.entries(changes).map((change) => {
    (currentConfig![change[0] as keyof Config] as unknown) = change[1].newValue;
  });
  updateConfigCallbacks.map((callback) => callback(currentConfig!));
});

export { getCurrentConfiguration, registerUpdateConfigCallback };
export type { Config };

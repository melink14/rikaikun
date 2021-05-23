const defaultConfig = {
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
type InternalConfig = typeof defaultConfig;
type Config = Readonly<InternalConfig>;

const createNormalizedConfiguration =
  async function (): Promise<InternalConfig> {
    const storageConfig = await getStorageSync();
    // Old version had a flat object here instead of an
    // array of objects.
    if (!(storageConfig.kanjiInfo instanceof Array)) {
      const newKanjiInfo = [];
      for (const info of defaultConfig.kanjiInfo) {
        newKanjiInfo.push({
          ...info,
          shouldDisplay: storageConfig.kanjiInfo[info.code],
        });
      }
      storageConfig.kanjiInfo = newKanjiInfo;
      await new Promise<void>((resolve) => {
        chrome.storage.sync.set(storageConfig, resolve);
      });
    }
    return storageConfig;
  };
const configPromise: Promise<Config> = createNormalizedConfiguration();

// Simply wrapper which makes `sync.get` `Promise` based.
function getStorageSync(): Promise<InternalConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultConfig, function (cloudStorage) {
      resolve(cloudStorage as InternalConfig);
    });
  });
}

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;
  const config = await configPromise;

  Object.entries(changes).map((change) => {
    (config![change[0] as keyof InternalConfig] as unknown) =
      change[1].newValue;
  });
});

export { configPromise };
export type { Config };

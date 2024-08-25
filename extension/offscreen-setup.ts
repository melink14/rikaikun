export async function setupOffscreenDocument() {
  // A simple try catch is easier to understand though perhaps less forward compatible.
  // See https://groups.google.com/a/chromium.org/g/chromium-extensions/c/D5Jg2ukyvUc.
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [
        chrome.offscreen.Reason.AUDIO_PLAYBACK,
        chrome.offscreen.Reason.CLIPBOARD,
      ],
      justification:
        'Copying word definitions to clipboard. Playing audio using TTS of the selected word.',
    });
  } catch (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    if (!message.startsWith('Only a single offscreen')) {
      throw error;
    }
  }
}

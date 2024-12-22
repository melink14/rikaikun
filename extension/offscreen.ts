import { copyToClipboard } from './clipboard';
import { tts } from './texttospeech';

chrome.runtime.onMessage.addListener(handleMessages);

let timeoutId = 0;
function handleMessages(message: {
  target: string;
  type: string;
  text: string;
}): void {
  if (message.target !== 'offscreen') {
    return;
  }
  clearTimeout(timeoutId);
  try {
    switch (message.type) {
      case 'copyToClipboardOffscreen':
        // Error if we received the wrong kind of data.
        if (typeof message.text !== 'string') {
          throw new TypeError(
            `Value provided must be a 'string', got '${typeof message.text}'.`
          );
        }
        copyToClipboard(message.text);
        break;
      case 'playTtsOffscreen':
        tts.play(message.text);
        break;
    }
  } finally {
    timeoutId = window.setTimeout(window.close, 30000);
  }
}

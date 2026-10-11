import { copyToClipboard } from './clipboard';

// Firefox alternative to copyToClipboardOffscreen logic
export function copyLocally(text: string) {
  const textArea = document.createElement('textarea');
  textArea.id = 'text';
  document.body.appendChild(textArea);
  try {
    copyToClipboard(text);
  } finally {
    textArea.remove();
  }
}

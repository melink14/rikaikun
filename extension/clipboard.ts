export function copyToClipboard(text: string) {
  const textEl = document.querySelector('#text');
  if (textEl === null) {
    throw new TypeError('Textarea for clipboard use not defined.');
  }
  if (!(textEl instanceof HTMLTextAreaElement)) {
    throw new TypeError('#text element in offscreen doc not text area.');
  }
  // `document.execCommand('copy')` works against the user's selection in a web
  // page. As such, we must insert the string we want to copy to the web page
  // and to select that content in the page before calling `execCommand()`.
  textEl.value = text;
  textEl.select();
  document.execCommand('copy');
}

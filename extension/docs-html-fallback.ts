function forceHtml(force: boolean) {
  if (!force) {
    return;
  }
  console.log(
    'rikaikun is forcing Docs to use HTML instead of canvas for rendering.'
  );
  const injectedCode = `(function() {window['_docs_force_html_by_ext'] = '${chrome.runtime.id}';})();`;

  const script = document.createElement('script');

  script.textContent = injectedCode;

  (document.head || document.documentElement).appendChild(script);
}

chrome.runtime.sendMessage({ type: 'forceDocsHtml?' }, forceHtml);

export { forceHtml as TestOnlyForceHtml };

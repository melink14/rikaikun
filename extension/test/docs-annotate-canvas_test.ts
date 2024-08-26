import { expect } from '@esm-bundle/chai';

declare global {
  interface Window {
    _docs_annotate_canvas_by_ext?: string;
  }
}

describe('docs-annotate-canvas.ts', function () {
  beforeEach(function () {
    delete window._docs_annotate_canvas_by_ext;
  });

  it('should set special property to rikaikun extension ID', async function () {
    await import('../docs-annotate-canvas.js');

    expect(window._docs_annotate_canvas_by_ext).to.equal(
      'jipdnfibhldikgcjhfnomkfpcebammhp'
    );
  });
});

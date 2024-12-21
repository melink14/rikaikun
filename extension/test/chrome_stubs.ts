/**
 * File loaded in base html for test runner in order to ensure chrome extension
 * APIs are available in SUT code.
 */

import sinon from 'sinon';
import * as sinonChrome from 'sinon-chrome';

// Start by copying base sinon-chrome stubs into the window chrome
// object
window.chrome = Object.assign(window.chrome, sinonChrome);

// Extend the chrome object with MV3 APIs sinon-chrome doesn't
// support. We'll use normal sinon stubs as it's hard to access the
// sinon-chrome special stubs and we don't use flush.
const mv3_stubs = {
  offscreen: {
    createDocument: sinon.stub(),
    Reason: { AUDIO_PLAYBACK: 0, CLIPBOARD: 1 },
  },
  action: {
    setBadgeText: sinon.stub(),
    setBadgeBackgroundColor: sinon.stub(),
    onClicked: { addListener: sinon.stub() },
  },
};

Object.assign(window.chrome, mv3_stubs);

// Save into a local variable so we can export.
// (Possibly better to start with the local variable...)
const stubbedChrome = window.chrome as unknown as typeof sinonChrome &
  typeof mv3_stubs;

// Export so that we can import this instead of the base sinon-chrome
// in tests.
export { stubbedChrome };

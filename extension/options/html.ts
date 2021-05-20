import { OptionsForm } from './component';
import { html } from 'lit';

export const optionsHtml = function (optionScope: OptionsForm) {
  if (optionScope._options == null) {
    throw TypeError('options was null even though it should be initialized.');
  }
  return html`
    <div id="rikaikun_options">
      <form id="optform" name="optform" @change="${optionScope._saveOptions}">
        <div id="options">
          <div id="gencon" class="tabContent">
            <h1>General</h1>
            <p>
              Popup color:
              <select class="inputfield" id="popupcolor" name="popupcolor">
                <option
                  value="blue"
                  ?selected=${optionScope._options.popupcolor === 'blue'}
                >
                  Blue
                </option>
                <option
                  value="lightblue"
                  ?selected=${optionScope._options.popupcolor === 'lightblue'}
                >
                  Light Blue
                </option>
                <option
                  value="black"
                  ?selected=${optionScope._options.popupcolor === 'black'}
                >
                  Black
                </option>
                <option
                  value="yellow"
                  ?selected=${optionScope._options.popupcolor === 'yellow'}
                >
                  Yellow
                </option>
              </select>
              <br />
              Default popup location:
              <select
                class="inputfield"
                id="popupLocation"
                name="popupLocation"
                .selectedIndex=${optionScope._options.popupLocation}
              >
                <option value="0">Cursor</option>
                <option value="1">Top Left</option>
                <option value="2">Bottom Right</option>
              </select>
              <br />
              <input
                type="checkbox"
                id="highlight"
                name="highlight"
                ?checked=${optionScope._options.highlight}
              />
              Highlight text
              <br />
              <input
                type="checkbox"
                id="textboxhl"
                name="textboxhl"
                ?checked=${optionScope._options.textboxhl}
              />
              Highlight text inside of text boxes
              <br />
              <input
                type="checkbox"
                id="onlyreading"
                name="onlyreading"
                ?checked=${optionScope._options.onlyreading}
              />
              Hide definitions and show only reading
              <br />
              <input
                type="checkbox"
                id="minihelp"
                name="minihelp"
                ?checked=${optionScope._options.minihelp}
              />
              Show mini help
              <br />
              <br />
              Show popup with delay:
              <input
                type="number"
                id="popupDelay"
                name="popupDelay"
                min="1"
                value=${optionScope._options.popupDelay}
              />
              milliseconds
            </p>
          </div>
          <div id="keycon" class="tabContent">
            <h1>Keyboard</h1>
            Show popup only on pressed key:<br />
            <input
              type="radio"
              name="showOnKey"
              value=""
              ?checked=${optionScope._options.showOnKey === ''}
            />Not used<br />
            <input
              type="radio"
              name="showOnKey"
              value="Alt"
              ?checked=${optionScope._options.showOnKey === 'Alt'}
            />Alt<br />
            <input
              type="radio"
              name="showOnKey"
              value="Ctrl"
              ?checked=${optionScope._options.showOnKey === 'Ctrl'}
            />Ctrl<br />
            <input
              type="radio"
              name="showOnKey"
              value="Alt+Ctrl"
              ?checked=${optionScope._options.showOnKey === 'Alt+Ctrl'}
            />Alt+Ctrl<br />
            <br />
            <strong>Keys when popup is visible</strong><br /><br />
            <table>
              <tr>
                <td>A</td>
                <td>Alternate popup location</td>
              </tr>
              <tr>
                <td>Y</td>
                <td>Move popup location down</td>
              </tr>
              <tr>
                <td>C</td>
                <td>Copy to clipboard</td>
              </tr>
              <tr>
                <td>D</td>
                <td>Hide/show definitions</td>
              </tr>
              <tr>
                <td>Shift/Enter&nbsp;&nbsp;</td>
                <td>Switch dictionaries</td>
              </tr>
              <tr>
                <td>B</td>
                <td>Previous character</td>
              </tr>
              <tr>
                <td>M</td>
                <td>Next character</td>
              </tr>
              <tr>
                <td>N</td>
                <td>Next word</td>
              </tr>
              <tr>
                <td>J</td>
                <td>Scroll back definitions</td>
              </tr>
              <tr>
                <td>K</td>
                <td>Scroll forward definitions</td>
              </tr>
            </table>
            <br />
            <input
              type="checkbox"
              id="disablekeys"
              name="disablekeys"
              ?checked=${optionScope._options.disablekeys}
            />
            Disable these keys
          </div>
          <div id="kanjicon" class="tabContent">
            <h1>Kanji Dictionary</h1>
            <p>
              <strong>Displayed information:</strong><br /><br />
              <input
                type="checkbox"
                id="kanjicomponents"
                name="kanjicomponents"
                ?checked=${optionScope._options.kanjicomponents}
              />
              Kanji Components
              <br />
              ${optionScope._options.kanjiInfo.map((component) => {
                return html`
                  <input
                    type="checkbox"
                    id=${component.code}
                    name="kanjiInfo"
                    value=${component.code}
                    ?checked=${component.shouldDisplay}
                  />
                  ${component.name}
                  <br />
                `;
              })}
            </p>
          </div>
          <div id="clipcon" class="tabContent">
            <h1>Copy to Clipboard</h1>
            <table>
              <tr>
                <td>Line ending:</td>
                <td>
                  <select id="lineEnding" name="lineEnding">
                    <option
                      value="n"
                      ?selected=${optionScope._options.lineEnding === 'n'}
                    >
                      Unix (\\n)
                    </option>
                    <option
                      value="rn"
                      ?selected=${optionScope._options.lineEnding === 'rn'}
                    >
                      Windows (\\r\\n)
                    </option>
                    <option
                      value="r"
                      ?selected=${optionScope._options.lineEnding === 'r'}
                    >
                      Mac (\\r)
                    </option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Field separator:</td>
                <td>
                  <select id="copySeparator" name="copySeparator">
                    <option
                      value="tab"
                      ?selected=${optionScope._options.copySeparator === 'tab'}
                    >
                      Tab
                    </option>
                    <option
                      value="comma"
                      ?selected=${optionScope._options.copySeparator ===
                      'comma'}
                    >
                      Comma
                    </option>
                    <option
                      value="space"
                      ?selected=${optionScope._options.copySeparator ===
                      'space'}
                    >
                      Space
                    </option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Maximum entries:</td>
                <td>
                  <input
                    type="number"
                    id="maxClipCopyEntries"
                    name="maxClipCopyEntries"
                    min="1"
                    value=${optionScope._options.maxClipCopyEntries}
                  />
                </td>
              </tr>
            </table>
          </div>
          <div id="tts" class="tabContent">
            <h1>Text-To-Speech</h1>
            <input
              type="checkbox"
              id="ttsEnabled"
              name="ttsEnabled"
              ?checked=${optionScope._options.ttsEnabled}
            />
            Enabled
          </div>
        </div>
      </form>
    </div>
  `;
};

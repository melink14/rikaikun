
chrome.browserAction.onClicked.addListener(rcxMain.inlineToggle);
chrome.tabs.onSelectionChanged.addListener(rcxMain.onTabSelect);
chrome.runtime.onMessage.addListener(
	function(request, sender, response) {
		switch(request.type) {
			case 'enable?':
				console.log('enable?');
				rcxMain.onTabSelect(sender.tab.id);
				break;
			case 'xsearch':
				console.log('xsearch');
				var e = rcxMain.search(request.text, request.showmode);
				response(e);
				break;
			case 'translate':
				console.log('translate');
				var e = rcxMain.dict.translate(request.title);
				response(e);
				break;
			case 'makehtml':
				console.log('makehtml');
				var html = rcxMain.dict.makeHtml(request.entry);
				response(html);
				break;
			case 'switchOnlyReading':
				console.log('switchOnlyReading');
				if(rcxMain.config.onlyreading != 'yes')
					rcxMain.config.onlyreading = 'yes';
				else
					rcxMain.config.onlyreading = 'no';
				break;
			case 'copyToClip':
				console.log('copyToClip');
				rcxMain.copyToClip(sender.tab, request.entry);
				break;
			default:
				console.log(request);
		}
	});
	
if(initStorage("v0.8.7", true)) {
	// v0.7
	initStorage("popupcolor", "blue");
	initStorage("highlight", "yes");
	
	// v0.8
	// No changes to options
	
	// V0.8.5
	initStorage("textboxhl", "no");

	// v0.8.6
	initStorage("onlyreading", "no");
	// v0.8.7
	initStorage("copySeparator", '\t');
	initStorage("maxClipCopyEntries", 7);
	initStorage("lineEnding", 0);

}

/** 
* Initializes the localStorage for the given key. 
* If the given key is already initialized, nothing happens. 
* 
* @author Teo (GD API Guru)
* @param key The key for which to initialize 
* @param initialValue Initial value of localStorage on the given key 
* @return true if a value is assigned or false if nothing happens 
*/ 
function initStorage(key, initialValue) {
  var currentValue = localStorage[key];
  if (!currentValue) {
	localStorage[key] = initialValue;
	return true;
  }
  return false;
}

rcxMain.config = {};
rcxMain.config.css = localStorage["popupcolor"];
rcxMain.config.highlight = localStorage["highlight"];
rcxMain.config.textboxhl = localStorage["textboxhl"];
rcxMain.config.onlyreading = localStorage["onlyreading"];
rcxMain.config.copySeparator = localStorage["copySeparator"];
rcxMain.config.maxClipCopyEntries = localStorage["maxClipCopyEntries"];
rcxMain.config.lineEnding = localStorage["lineEnding"];

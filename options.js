// Alias kanjiInfoLabelList for convenience.
var kanjiInfoLabelList = chrome.extension.getBackgroundPage().rcxDict.prototype.kanjiInfoLabelList;

/**
 * Retrieves saved options from chrome.storage.sync and populates form
 * elements.
 * TODO: Perhaps using form map data, we can set these directly.
 */
function populateFormFromCloudStorage() {
	chrome.storage.sync.get(chrome.extension.getBackgroundPage().optionsList,
		function (cloudStorage) {

			// Simple values

			document.optform.disablekeys.checked = cloudStorage.disablekeys;
			document.optform.highlighttext.checked = cloudStorage.highlight;
			document.optform.kanjicomponents.checked = cloudStorage.kanjicomponents;
			document.optform.maxClipCopyEntries.value = cloudStorage.maxClipCopyEntries;
			document.optform.minihelp.checked = cloudStorage.minihelp;
			document.optform.onlyreading.checked = cloudStorage.onlyreading;
			document.optform.popupDelay.value = cloudStorage.popupDelay;
			document.optform.popupLocation.selectedIndex = cloudStorage.popupLocation;
			document.optform.textboxhl.checked = cloudStorage.textboxhl;
			document.optform.ttsEnabled.checked = cloudStorage.ttsEnabled;
			document.optform.inlineDivs.checked = cloudStorage.inlineDivs;

			// Single select option groups
			for (var i = 0; i < document.optform.copySeparator.length; ++i) {
				if (document.optform.copySeparator[i].value === cloudStorage.copySeparator) {
					document.optform.copySeparator[i].selected = true;
					break;
				}
			}

			for (var i = 0; i < document.optform.lineEnding.length; ++i) {
				if (document.optform.lineEnding[i].value === cloudStorage.lineEnding) {
					document.optform.lineEnding[i].selected = true;
					break;
				}
			}

			for (var i = 0; i < document.optform.popupcolor.length; ++i) {
				if (document.optform.popupcolor[i].value == cloudStorage['popupcolor']) {
					document.optform.popupcolor[i].selected = true;
					break;
				}
			}

			for (var i = 0; i < document.optform.showOnKey.length; ++i) {
				if (document.optform.showOnKey[i].value === cloudStorage.showOnKey) {
					document.optform.showOnKey[i].checked = true;
					break;
				}
			}

			// Kanji Info check boxes created dynamically from whatever info is available.
			for (var i = 0; i < kanjiInfoLabelList.length; i +=2 ) {
				// Need to get every other element in the storage, so increment by 2.
				// We have abbreviation and full names. We use the abbrevations as form IDs.
				document.getElementById(kanjiInfoLabelList[i]).checked =
						cloudStorage.kanjiInfo[kanjiInfoLabelList[i]];
			}

		});
}

/**
 * Collects all options from form fields and updates in memory
 * config object as well as saves to cloud storage.
 * String values from form are converted to number/boolean if appropriate.
 */
function saveOptions() {
	var kanjiInfoObject = {};
	// Setting Kanji values
	for (var i = 0; i < kanjiInfoLabelList.length; i +=2 ) {
		kanjiInfoObject[kanjiInfoLabelList[i]] = document.getElementById(kanjiInfoLabelList[i]).checked;
	}
	var options = {
		copySeparator : document.optform.copySeparator.value,
		disablekeys : document.optform.disablekeys.checked,
		highlight : document.optform.highlighttext.checked,
		kanjicomponents : document.optform.kanjicomponents.checked,
		lineEnding : document.optform.lineEnding.value,
		maxClipCopyEntries : parseInt(document.optform.maxClipCopyEntries.value),
		minihelp : document.optform.minihelp.checked,
		onlyreading : document.optform.onlyreading.checked,
		popupcolor : document.optform.popupcolor.value,
		popupDelay : getPopUpDelay(),
		popupLocation : document.optform.popupLocation.value,
		showOnKey : document.optform.showOnKey.value,
		textboxhl : document.optform.textboxhl.checked,
		ttsEnabled : document.optform.ttsEnabled.checked,
		kanjiInfo: kanjiInfoObject,
		inlineDivs: document.optform.inlineDivs.checked
	}
	var backgroundPage = chrome.extension.getBackgroundPage();

	backgroundPage.rcxMain.config = options;
	backgroundPage.saveOptionsToCloudStorage();
}

function getPopUpDelay() {
	var popupDelay;
	try {
		popupDelay = parseInt(document.optform.popupDelay.value);
		if (!isFinite(popupDelay)) {
			throw Error('infinite');
		}
	} catch (err) {
		popupDelay = 150;
	}
	return popupDelay;
}

window.onload = populateFormFromCloudStorage;
document.querySelector('#submit').addEventListener('click', saveOptions);


/*function clicktab(tab) {
	selectedtab = document.getElementById(tab);
	// change format of all tabs to deselected
	// change format of selected tab to selected
	// hide all tab contents
	// show selected tab contents
}*/

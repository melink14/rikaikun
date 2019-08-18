arrRtkStories = [];

function fillVals() {
	var store = localStorage['popupcolor'];
	for(var i=0; i < document.optform.popupcolor.length; ++i) {
		if(document.optform.popupcolor[i].value == store) {
			document.optform.popupcolor[i].selected = true;
			break;
		}
	}

	document.optform.popupLocation.selectedIndex = localStorage['popupLocation'];
	
	if (localStorage['highlight'] == 'true')
		document.optform.highlighttext.checked = true;
	else
		document.optform.highlighttext.checked = false;

	if (localStorage['textboxhl'] == 'true')
		document.optform.textboxhl.checked = true;
	else
		document.optform.textboxhl.checked = false;
	
	if (localStorage['onlyreading'] == 'true')
		document.optform.onlyreading.checked = true;
	else
		document.optform.onlyreading.checked = false;
	
	if (localStorage['minihelp'] == 'true')
		document.optform.minihelp.checked = true;
	else
		document.optform.minihelp.checked = false;

	document.optform.popupDelay.value = localStorage["popupDelay"];

	if (localStorage['disablekeys'] == 'true')
		document.optform.disablekeys.checked = true;
	else
		document.optform.disablekeys.checked = false;

	if (localStorage['kanjicomponents'] == 'true')
		document.optform.kanjicomponents.checked = true;
	else
		document.optform.kanjicomponents.checked = false;

	numList = chrome.extension.getBackgroundPage().rcxDict.prototype.numList;

	for (i = 0; i*2 < numList.length; i++) {
		document.getElementById(numList[i*2]).checked = localStorage[numList[i*2]] == 'true' ? true : false;
	}

	store = localStorage['lineEnding'];
	for(var i=0; i < document.optform.lineEnding.length; ++i) {
		if(document.optform.lineEnding[i].value == store) {
			document.optform.lineEnding[i].selected = true;
			break;
		}
	}

	store = localStorage['copySeparator'];
	for(var i=0; i < document.optform.copySeparator.length; ++i) {
		if(document.optform.copySeparator[i].value == store) {
			document.optform.copySeparator[i].selected = true;
			break;
		}
	}

	document.optform.maxClipCopyEntries.value = parseInt(localStorage['maxClipCopyEntries']);

	store = localStorage['showOnKey'];
	for(var i = 0; i < document.optform.showOnKey.length; ++i) {
		if (document.optform.showOnKey[i].value === store) {
			document.optform.showOnKey[i].checked = true;
			break;
		}
	}
    
    //RTK
    /*
    function removeRtkStories(){
        const dictGroups = document.getElementById('dict-groups');
        localStorage.removeItem("rtkFilename");
        localStorage.removeItem("rtkStories");
        dictGroups.classList.add("novisible");   
        chrome.extension.getBackgroundPage().rcxMain.config.rtkStories = null;    
    }
    const dictGroups = document.getElementById('dict-groups');
    
                
      if (localStorage["rtkStories"]){
       
       dictGroups.classList.remove("novisible"); 
       dictGroups.innerHTML = '';
        var dict = document.createElement('div');
            dict.innerHTML = '<div class="dict-title" style="padding:5px 0"><h4>' + localStorage['rtkFilename'] + '\t</h4></div>';
            let del;

            del = document.createElement('button');
            del.innerHTML = 'Drop';
            del.setAttribute('class', 'btn btn-danger btn-dict-drop');
            del.onclick = removeRtkStories;

            dict.appendChild(del);
            dictGroups.appendChild(dict);      
        chrome.extension.getBackgroundPage().rcxMain.config.rtkStories = JSON.parse(localStorage["rtkStories"]);
       
      }else{
        dictGroups.classList.add("novisible");
      }         
	*/

}

function getVals() {
	localStorage['popupcolor'] = document.optform.popupcolor.value;
	localStorage['highlight'] = document.optform.highlighttext.checked;
	localStorage['textboxhl'] = document.optform.textboxhl.checked;
	localStorage['onlyreading'] = document.optform.onlyreading.checked;
	localStorage['minihelp'] = document.optform.minihelp.checked;
	localStorage['disablekeys'] = document.optform.disablekeys.checked;
	localStorage['kanjicomponents'] = document.optform.kanjicomponents.checked;

	var kanjiinfoarray = new Array(chrome.extension.getBackgroundPage().rcxDict.prototype.numList.length/2);
	numList = chrome.extension.getBackgroundPage().rcxDict.prototype.numList;
	for (i = 0; i*2 < numList.length; i++) {
		localStorage[numList[i*2]] = document.getElementById(numList[i*2]).checked;
		kanjiinfoarray[i] = localStorage[numList[i*2]];
	}

	localStorage['lineEnding'] = document.optform.lineEnding.value;
	localStorage['copySeparator'] = document.optform.copySeparator.value;
	localStorage['maxClipCopyEntries'] = document.optform.maxClipCopyEntries.value;

	var popupDelay;
	try {
		popupDelay = parseInt(document.optform.popupDelay.value);
		if (!isFinite(popupDelay)) {
			throw Error('infinite');
		}
		localStorage['popupDelay'] = document.optform.popupDelay.value;
	} catch (err) {
		popupDelay = 150;
		localStorage['popupDelay'] = "150";
	}
	localStorage['showOnKey'] = document.optform.showOnKey.value;
	localStorage['popupLocation'] = document.optform.popupLocation.value;
    
    
    // RTK
	/*
    if(  document.optform.dictfile.files.length != 0 ){
     var vidFile = document.optform.dictfile.files[0].name;  
      // Save
      localStorage["rtkFilename"] = vidFile;
      localStorage["rtkStories"] = JSON.stringify(arrRtkStories);   
      chrome.extension.getBackgroundPage().rcxMain.config.rtkStories = JSON.parse(localStorage["rtkStories"]);  
    }
      
	*/      

	chrome.extension.getBackgroundPage().rcxMain.config.css = localStorage["popupcolor"];
	chrome.extension.getBackgroundPage().rcxMain.config.highlight = localStorage["highlight"];
	chrome.extension.getBackgroundPage().rcxMain.config.textboxhl = localStorage["textboxhl"];
	chrome.extension.getBackgroundPage().rcxMain.config.onlyreading = localStorage["onlyreading"];
	chrome.extension.getBackgroundPage().rcxMain.config.minihelp = localStorage["minihelp"];
	chrome.extension.getBackgroundPage().rcxMain.config.popupDelay = popupDelay;
	chrome.extension.getBackgroundPage().rcxMain.config.disablekeys = localStorage["disablekeys"];
	chrome.extension.getBackgroundPage().rcxMain.config.showOnKey = localStorage["showOnKey"];
	chrome.extension.getBackgroundPage().rcxMain.config.kanjicomponents = localStorage["kanjicomponents"];
	chrome.extension.getBackgroundPage().rcxMain.config.kanjiinfo = kanjiinfoarray;
	chrome.extension.getBackgroundPage().rcxMain.config.lineEnding = localStorage["lineEnding"];
	chrome.extension.getBackgroundPage().rcxMain.config.copySeparator = localStorage["copySeparator"];
	chrome.extension.getBackgroundPage().rcxMain.config.maxClipCopyEntries = localStorage["maxClipCopyEntries"];
	chrome.extension.getBackgroundPage().rcxMain.config.popupLocation = localStorage["popupLocation"];
    
}



// KanjiKoohii
  /**
 * CSVToArray parses any String of Data including '\r' '\n' characters,
 * and returns an array with the rows of data.
 * @param {String} CSV_string - the CSV string you need to parse
 * @param {String} delimiter - the delimeter used to separate fields of data
 * @returns {Array} rows - rows of CSV where first row are column headers
 */
function CSVToArray (CSV_string, delimiter) {
   delimiter = (delimiter || ","); // user-supplied delimeter or default comma

   var pattern = new RegExp( // regular expression to parse the CSV values.
     ( // Delimiters:
       "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
       // Quoted fields.
       "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
       // Standard fields.
       "([^\"\\" + delimiter + "\\r\\n]*))"
     ), "gi"
   );

   var rows = [[]];  // array to hold our data. First row is column headers.
   // array to hold our individual pattern matching groups:
   var matches = false; // false if we don't find any matches
   // Loop until we no longer find a regular expression match
   while (matches = pattern.exec( CSV_string )) {
       var matched_delimiter = matches[1]; // Get the matched delimiter
       // Check if the delimiter has a length (and is not the start of string)
       // and if it matches field delimiter. If not, it is a row delimiter.
       if (matched_delimiter.length && matched_delimiter !== delimiter) {
         // Since this is a new row of data, add an empty row to the array.
         rows.push( [] );
       }
       var matched_value;
       // Once we have eliminated the delimiter, check to see
       // what kind of value was captured (quoted or unquoted):
       if (matches[2]) { // found quoted value. unescape any double quotes.
        matched_value = matches[2].replace(
          new RegExp( "\"\"", "g" ), "\""
        );
       } else { // found a non-quoted value
         matched_value = matches[3];
       }
       // Now that we have our value string, let's add
       // it to the data array.
       rows[rows.length - 1].push(matched_value);
   }
   return rows; // Return the parsed data Array
}

//
  function getAsText(fileToRead) {
      var reader = new FileReader();
      // Read file into memory as UTF-8      
      reader.readAsText(fileToRead);
      // Handle errors load
      reader.onload = loadHandler;
      reader.onerror = errorHandler;
    }

    function loadHandler(event) {
      var csv = event.target.result;
    
      arrRtkStories = CSVToArray (csv, ",");                
    }
    
    function errorHandler(evt) {
      if(evt.target.error.name == "NotReadableError") {
          alert("Canno't read file !");
      }
    }


function onRTKStoriesImport(e) {
    
    //dictionaryErrorShow(null);
    /*
    const dictFile = document.getElementById('dict-file'); //$('#dict-file');
    const dictImporter =  document.getElementById('dict-file');
    dictImporter.setAttribute('style', 'display:none');
    const dictProgress = document.getElementById('dict-import-progress');
    dictProgress.classList.remove("novisible");
    const dictProgressBar = document.getElementById('dict-progress-bar');
    const setProgress = percent => dictProgressBar.setAttribute('style','width:'+percent+'%');// dictProgress.find('.progress-bar').css('width', `${percent}%`);
    const updateProgress = (total, current) => setProgress(current / total * 100.0);

    setProgress(0.0);
    */
    
    //importDictionary(e.target.files[0], updateProgress);
    getAsText (e.target.files[0]);
    
}
window.onload = fillVals;



/*function clicktab(tab) {
	selectedtab = document.getElementById(tab);
	// change format of all tabs to deselected
	// change format of selected tab to selected
	// hide all tab contents
	// show selected tab contents
}*/


document.querySelector('#submit').addEventListener('click', getVals);
//
//document.getElementById('dictfile').onchange = onRTKStoriesImport;


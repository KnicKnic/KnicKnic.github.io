//javascript:(function(){var jsCode = document.createElement('script');jsCode.setAttribute('src', 'http://localhost:9999/add_croppy.js');document.body.appendChild(jsCode);}());

//javascript:(function(){var jsCode = document.createElement('script');jsCode.setAttribute('type','module');jsCode.setAttribute('src', 'https://knicknic.github.io/croppy/add_croppy.js');document.body.appendChild(jsCode);}());


// alert("Started");



function receiveCroppyMessage(event) {
    // Do we trust the sender of this message?  (might be
    // different from what we originally opened, for example).
    if (event.origin !== "https://knicknic.github.io") {
        return;
    }

    let fileObjects = []
    for (let file of event.data['data']) {
        let fileItem = file['blob'];
        fileItem = fileItem.slice(0, fileItem.size, "image/jpeg");
        fileItem.name = file['name'];
        fileObjects.push(fileItem);
    }

    let fileNames = "files: "
    for(let file of fileObjects)
    {
        fileNames = fileNames + " " + file.name;
    }
    alert("Got Call back " + fileNames);
    // event.source is popup
    // event.data is "hi there yourself!  the secret response is: rheeeeet!"
    processFilePromise['resolve'](fileObjects);
}
window.addEventListener('message', receiveCroppyMessage, false);


var iframe = document.createElement('iframe');
// iframe.style.display = "none";
iframe.src = 'https://knicknic.github.io/croppy/test.html';
document.body.appendChild(iframe);



function DoSend() {
    iframe.contentWindow.postMessage('host', '*')
}

var button = document.createElement('button');
// iframe.style.display = "none";
button.onclick = DoSend;
button.innerHTML = "hello";
document.body.appendChild(button);


function CreatePromiseEvent() {
    let resolver;
    let rejecter;
    let emptyPromise = new Promise((resolve, reject) => { resolver = resolve; rejecter = reject });
    emptyPromise['resolve'] = resolver;
    emptyPromise['reject'] = rejecter;
    return emptyPromise;
}

function ReadFile(file) {
    let readFile = CreatePromiseEvent();

    // read fileName & content
    let fr = new FileReader();
    fr.onload = function (txt) {
        let fileName = file.name

        let encoded_txt = txt.target.result;
        let content = new Uint8Array(encoded_txt);
        let sourceFilename = fileName

        readFile['resolve']([sourceFilename, content]);
    }
    fr.readAsArrayBuffer(file);

    return readFile;
};
// handle new images to process
var processFiles = async function (files) {
    // When the control has changed, there are new files

    let len = files.length;
    //if images
    let toProcess = []
    if (len > 0) {
        for (let fileIndex = 0; fileIndex < files.length; ++fileIndex) {
            let [fileName, content] = await ReadFile(files[fileIndex]);
            toProcess.push([fileName, content]);
        }
    }
    iframe.contentWindow.postMessage(toProcess, '*')
};

var browseButtonInstance = [];
BrowseButton.prototype._oldGetFiles = BrowseButton.prototype.getFiles
BrowseButton.prototype.getFiles = function (){
    browseButtonInstance = this;
    return this._oldGetFiles();
}

UploadQueue.prototype._oldQueue = UploadQueue.prototype._addQueue;
var processFilePromise = CreatePromiseEvent();

UploadQueue.prototype._addQueue = function(files) {
    var self = this;
    processFilePromise = CreatePromiseEvent();
    let process = processFiles(files);
    processFilePromise.then(files => {
        self._oldQueue(files);
        
        var fileSelect = browseButtonInstance.getFileSelect().get(0);
        fileSelect.value = "";
    });
};


UploadQueue.prototype._uploadFileForHTML5 = function(oProp) {
    var oFile = oProp.file;
    var sKey = oProp.key;
    oFile.state = this._states.PROGRESS;
    this._uploading++;
    var oXHR = new XMLHttpRequest()
      , oUpload = oXHR.upload;
    oUpload.addEventListener("progress", $.proxy(function(e) {
        if (!e.lengthComputable) {
            return
        }
        if (!this._xhr[sKey]) {
            return
        }
        oFile.loaded = e.loaded;
        oFile.rate = e.loaded && (e.loaded / oFile.size);
        this.trigger("uploadProgress", {
            oFile: oFile,
            sKey: sKey
        })
    }, this), false);
    oUpload.addEventListener("load", $.proxy(function() {
        var that = this;
        var func = arguments.callee;
        if (oXHR.readyState !== 4) {
            setTimeout(function() {
                func.call(that)
            }, 0);
            return
        }
        if (oXHR.status === 200) {
            this._setDoneState(sKey, oFile, "uploadLoad", oFile.size, 1, this._states.LOAD, oXHR.responseText)
        } else {
            this._setDoneState(sKey, oFile, "uploadError", 0, 0, this._states.ERROR)
        }
    }, this), false);
    oUpload.addEventListener("error", $.proxy(function() {
        this._setDoneState(sKey, oFile, "uploadError", 0, 0, this._states.ERROR)
    }, this), false);
    oUpload.addEventListener("abort", $.proxy(function() {
        this._setDoneState(sKey, oFile, "uploadAbort", 0, 0, this._states.NONE)
    }, this), false);
    oXHR.open("POST", this.url());
    oXHR.setRequestHeader("Cache-Control", "no-cache");
    oXHR.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    this._xhr[sKey] = oXHR;
    this.trigger("uploadStart", {
        oFile: oFile,
        sKey: sKey
    });
    var oFormData = new FormData();
    oFormData.append(this.option("sParamName"), oFile, oFile.name);
    oXHR.send(oFormData);
    return true
}

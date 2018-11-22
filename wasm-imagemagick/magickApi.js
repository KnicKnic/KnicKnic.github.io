
export function CreatePromiseEvent () {
    let resolver;
    let rejecter;
    let emptyPromise = new Promise((resolve, reject) => { resolver = resolve; rejecter = reject });
    emptyPromise['resolve'] = resolver;
    emptyPromise['reject'] = rejecter;
    return emptyPromise;
}
let drain = {'init': false,
             'items': []}

export function Call (inputFiles, command) {
    let request = {
        'files': inputFiles,
        'args': command,
        'requestNumber': magickWorkerPromisesKey
    };

    let emptyPromise = CreatePromiseEvent();
    magickWorkerPromises[magickWorkerPromisesKey] = emptyPromise;

    // if(!drain.init)
    // {
    //     drain.items.push(request);
    // }
    // else{
        magickWorker.postMessage(request);
    // }

    magickWorkerPromisesKey = magickWorkerPromisesKey + 1
    return emptyPromise;
}

function ChangeUrl(url, fileName)
{
    let splitUrl = url.split('/')
    splitUrl[splitUrl.length -1] = fileName
    return splitUrl.join('/')
}
function GetCurrentUrlDifferentFilename(fileName)
{
    return ChangeUrl(currentJavascriptURL, fileName)
}
const currentJavascriptURL = import.meta.url;
const magickWorkerUrl = GetCurrentUrlDifferentFilename('magick.js')
// let magickWorkerUrl = 'https://knicknic.github.io/wasm-imagemagick/magick.js'
let magickWorker = ''
// let magickWorker = new Worker(magickWorkerUrl);

let magickWorkerPromises = {}
let magickWorkerPromisesKey = 1

// handle responses as they stream in after being processed by image magick
function MagickWorkerOnMessage(e) {
    // display split images
    let response = e.data
    let getPromise = magickWorkerPromises[response['requestNumber']];
    delete magickWorkerPromises[response['requestNumber']];
    let files = response['processed']
    if (files.length == 0) {
        getPromise['reject']("No files generated")
    }
    else {
        getPromise['resolve'](files);
    }
};

function GenerateMagickWorkerText(magickUrl){
    // generates code for the following
    // var magickJsCurrentPath = 'magickUrl';
    // importScripts(magickJsCurrentPath);

    return "var magickJsCurrentPath = '" + magickUrl +"';\n" +
           'importScripts(magickJsCurrentPath);'
}


function XHRWorker(url, ready, scope) {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function() {
        let worker = new Worker(window.URL.createObjectURL(new Blob([this.responseText])));
        if (ready) {
            ready.call(scope, worker);
        }
    }, oReq);
    oReq.open("get", url, true);
    oReq.send();
}

function WorkerStart() {
    XHRWorker(magickWorkerUrl, function(worker) {
        magickWorker = worker;
        drain.init = true
        drain.items.forEach(element => {
            magickWorker.postMessage(element);
        });
        worker.onmessage = MagickWorkerOnMessage
    }, this);
}

// WorkerStart();
// let 
magickWorker = new Worker(window.URL.createObjectURL(new Blob([GenerateMagickWorkerText(magickWorkerUrl)])));
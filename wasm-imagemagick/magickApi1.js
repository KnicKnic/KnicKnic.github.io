// this file creates a webworker and then imports magick.js using that webworker

console.log("inside magickApi");

export function CreatePromiseEvent () {
    let resolver;
    let rejecter;
    let emptyPromise = new Promise((resolve, reject) => { resolver = resolve; rejecter = reject });
    emptyPromise['resolve'] = resolver;
    emptyPromise['reject'] = rejecter;
    return emptyPromise;
}

export function Call (inputFiles, command) {
    let request = {
        'files': inputFiles,
        'args': command,
        'requestNumber': magickWorkerPromisesKey
    };

    let emptyPromise = CreatePromiseEvent();
    magickWorkerPromises[magickWorkerPromisesKey] = emptyPromise;

    magickWorker.postMessage(request);

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

function getCurrentFile() {
    var originalFunc = Error.prepareStackTrace;

    let currentfile;
    try {
        Error.prepareStackTrace = function (err, stack) { 
            return stack;
         };
        throw new Error();
    } catch (err) {
        let stack = err.stack;
        currentfile = stack[0].getFileName();
    }

    Error.prepareStackTrace = originalFunc; 

    return currentfile;
}

let f = getCurrentFile();


// let currentJavascriptURL = 'https://knicknic.github.io/wasm-imagemagick/magickApi.js';
let currentJavascriptURL = './magickApi.js';

try {
    let packageUrl = getCurrentFile();;
    currentJavascriptURL = packageUrl;
} catch (error) {
    // eat
}

const magickWorkerUrl = GetCurrentUrlDifferentFilename('magick.js')
// const magickWorkerUrl = 'https://knicknic.github.io/wasm-imagemagick/magick.js'

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
let magickWorker;

if(currentJavascriptURL.startsWith('http'))
{
    magickWorker = new Worker(window.URL.createObjectURL(new Blob([GenerateMagickWorkerText(magickWorkerUrl)])));
}
else{
    magickWorker = new Worker(magickWorkerUrl);
}
magickWorker.onmessage = MagickWorkerOnMessage;
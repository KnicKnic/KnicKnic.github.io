
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

// function ChangeUrl(url, fileName)
// {
//     let splitUrl = url.split('/')
//     splitUrl[splitUrl.length -1] = fileName
//     return splitUrl.join('/')
// }
// let currentJavascriptURL = document.currentScript.src;
// function GetCurrentUrlDifferentFilename(fileName)
// {
//     return ChangeUrl(currentJavascriptURL, fileName)
// }
// let magickWorkerUrl = GetCurrentUrlDifferentFilename('magick.js')
let magickWorkerUrl = 'https://knicknic.github.io/wasm-imagemagick/magick.js'
let magickWorker = new Worker(magickWorkerUrl);

let magickWorkerPromises = {}
let magickWorkerPromisesKey = 1

// handle responses as they stream in after being processed by image magick
magickWorker.onmessage = function (e) {
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
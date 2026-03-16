function loadScript(url) {
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    head.appendChild(script);
}

loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');


// select a list of matching elements, context is optional
//function $(selector, context) {
//    return (context || document).querySelectorAll(selector);
//}

// select the first match only, context is optional
function $1(selector, context) {
    return (context || document).querySelector(selector);
}

function ajax(url, method = 'get', data = {}, success = function() {}, fail = function() {}, headers = {}) {
    axios({
            method: method,
            url: url,
            headers: headers,
            data: data,
            responseType: JSON,
        })
        .then(success)
        .catch(fail);
}
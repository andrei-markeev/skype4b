// parameters
var clientId = ""; // put client ID of your Azure application here

// call startAutodiscovery() to start the autodiscovery


// startup code

clientId = clientId || document.getElementById("client_id").value || localStorage.getItem("client_id");
localStorage.setItem("client_id", clientId);
document.getElementById("client_id").value = clientId;

if (document.location.hash && document.location.hash.length > 1) {
    parseHash();
}

// ---

function startAutodiscovery() {
    var initialHubUrl = "https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root";
    get(initialHubUrl, function(xmlhttp) {
        getHubUrl(JSON.parse(xmlhttp.responseText)._links.self.href);
    });
}

function getHubUrl(link) {
    var hubUrl = link.substr(0, link.indexOf('Autodiscover/'));
    localStorage.setItem('hubUrl', hubUrl);
    authenticate(hubUrl);
}

function authenticate(hubUrl) {
    var currentUrl = [location.protocol, '//', location.host, location.pathname].join('');

    // nonce
    var secret = Math.random().toString(36).substr(2, 10);
    localStorage.setItem('skype4b_secret', secret);

    var url = 'https://login.microsoftonline.com/common/oauth2/authorize?';
    url += 'response_type=token';
    url += '&client_id=' + clientId;
    url += '&redirect_uri=' + currentUrl;
    url += '&resource=' + hubUrl;
    url += '&state=' + secret;
    document.location.href = url;
}

function parseHash() {

    var access_token = "";
    var secret_returned = "";
    var error = "";
    var error_description = "";
    for (var p of document.location.hash.substr(1).split('&')) {
        if (p.indexOf('access_token=') == 0)
            access_token = p.substr('access_token='.length);
        else if (p.indexOf('state=') == 0)
            secret_returned = p.substr('state='.length);
        else if (p.indexOf('error=') == 0)
            error = p.substr('error='.length);
        else if (p.indexOf('error_description=') == 0)
            error_description = p.substr('error_description='.length);
    }

    var secret = localStorage.getItem('skype4b_secret');
    localStorage.removeItem('skype4b_secret');
    if (!error && secret != secret_returned)
        error = "Secrets don't match!";
    if (error) {
        alert(error + ": " + decodeURIComponent(error_description));
    } else {
        continueAutodiscovery(access_token);
    }

}

function continueAutodiscovery(access_token) {
    var applicationsUrl = localStorage.getItem("applicationsUrl");
    if (applicationsUrl) {
        localStorage.removeItem("applicationsUrl");
        initializeSession(access_token);
        return;
    }

    var hub_url = localStorage.getItem("hubUrl");
    var url = hub_url + "/autodiscover/autodiscoverservice.svc/root/oauth/user";
    
    proxyGet(access_token, url, function(xmlhttp) {
        if (xmlhttp.status == 200) {
            var response = JSON.parse(xmlhttp.responseText);
            if (response._links.redirect)
                getHubUrl(response._links.redirect.href);
            else if (response._links.applications) {
                localStorage.setItem("applicationsUrl", response._links.applications.href);
                getHubUrl(response._links.self.href);
            }
            else
                throw Error("Unexpected error!");
        } else
            throw Error("Error " + xmlhttp.status + ". Check DevTools->Network tab for details.");
    });
}

function initializeSession(access_token) {
    var hub_url = localStorage.getItem("hubUrl");

    var url = hub_url + "/ucwa/oauth/v1/applications";
    var random_guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    
    var initData = {
        UserAgent: "test",
        Culture: "en-US",
        EndpointId: random_guid
    };

    proxyPost(access_token, applicationsUrl, initData, function() {
        if (xmlhttp.status == 403)
            throw Error(xmlhttp.getResponseHeader("X-Ms-diagnostics"));
        else if (xmlhttp.status == 201) {
            var response = JSON.parse(xmlhttp.responseText);
            console.log(response);
            alert('Autodiscovery and authentication were successful! Now you can use the API.');
        } else
            throw Error("Returned:" + xmlhttp.status);
    });
}

function get(url, callback)
{
    // perform ajax request 
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            callback(xmlhttp);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function proxyGet(access_token, url, callback)
{
    var url = "http://markeev.com/posts/skype4b/proxy.php?url=" + url + "&access_token=" + access_token;
    get(url, callback);
}

function proxyPost(access_token, url, data, callback)
{
    // perform ajax request 
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            show(xmlhttp.responseText);
        }
    };
    xmlhttp.open("POST", url, true);
    xmlhttp.send(JSON.stringify(data));
}

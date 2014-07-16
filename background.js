chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {"from": "TreeStyleChrome", "cmd": "toggle"}, function(response) {
            console.log("TreeStyleChrome toggle: " + response.status ? "success" : "failure");
        });
    });
});

/*chrome.tabs.query({currentWindow: true}, function(tabs) {
    sendToActiveTab({cmd: "tabs", value: tabs});
});*/

chrome.browserAction.onClicked.addListener(function (tab) {
    sendToActiveTab({cmd: "tabs", value: [
        {id: 1, title: "THE TAB 1"},
        {id: 2, title: "THE TAB 2"},
        {id: 3, title: "THE TAB 3"}
    ]});

    sendToActiveTab({cmd: "toggle"}, function(response) {
        console.log("TreeStyleChrome toggle: " + response.status ? "success" : "failure");
    });
});

function sendToActiveTab(payload, callback) {
    payload.from = "TreeStyleChrome";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, payload, callback);
    });
}
var isOpen = true;

[chrome.tabs.onCreated, chrome.tabs.onUpdated, chrome.tabs.onRemoved, chrome.tabs.onActivated, chrome.tabs.onMoved].forEach(function(event){
    event.addListener(updateTabsList);
});

chrome.browserAction.onClicked.addListener(function() {
    isOpen = !isOpen;
    sendToAllTabs({cmd: "toggle", open: isOpen});
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "TreeStyleChrome.Content") {
            if (request.cmd == "tab.activate" && request.tab) {
                chrome.tabs.update(request.tab, {active: true});
            } else if (request.cmd == "tab.remove" && request.tab) {
                chrome.tabs.remove(request.tab);
            } else if (request.cmd == "tab.create") {
                chrome.tabs.create({active: true, url: 'chrome://newtab'});
            }
        }
    }
);

function updateTabsList() {
    chrome.tabs.query({}, function(tabs) {
        sendToAllTabs({cmd: "tabs", value: tabs});
    });
}

function sendToAllTabs(payload, callback) {
    payload.from = "TreeStyleChrome.Background";
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab){
            chrome.tabs.sendMessage(tab.id, payload, callback);
        });
    });
}
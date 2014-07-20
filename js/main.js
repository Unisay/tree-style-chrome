/** @jsx React.DOM */

var sidebarFrame = createSidebarFrame();
var sidebar = SideBar(null);

applyOnBody(function () {
    this.appendChild(sidebarFrame);
    showSideBar();
    injectIframeCss(sidebarFrame, chrome.extension.getURL("css/iframe.css"));
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "TreeStyleChrome.Background") {
            if (request.cmd == "toggle") {
                request.open ? showSideBar() : hideSideBar();
                sendResponse({status: true});
            } else if (request.cmd == "tabs") {
                if (request && request.value) {
                    renderSidebar(sidebar, request.value);
                }
            } else {
                sendResponse({status: false});
            }
        }
    }
);

var TabManager = {
    createTab: function () {
        this.sendMessage({cmd: 'tab.create'});
    },
    activate: function (tabId) {
        this.sendMessage({ cmd: 'tab.activate', tab: tabId });
    },
    remove: function (tabId) {
        this.sendMessage({ cmd: 'tab.remove', tab: tabId });
    },
    sendMessage: function (payload) {
        payload.from = 'TreeStyleChrome.Content';
        chrome.runtime.sendMessage(payload);
    }
};

function showSideBar() {
    sidebarFrame.style.display = 'block';
    narrowHostPage();
}

function hideSideBar() {
    sidebarFrame.style.display = 'none';
    revertHostPage();
}

function renderSidebar(sideBar, tabs) {
    if (sidebarFrame && sidebarFrame.contentDocument && sidebarFrame.contentDocument.body) {
        if (tabs) {
            sideBar.props.tabs = tabs;
        }
        React.renderComponent(sideBar, sidebarFrame.contentDocument.body);
    }
}

function injectIframeCss(iframe, href) {
    var cssLink = document.createElement("link");
    cssLink.href = href;
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    iframe.contentDocument.head.appendChild(cssLink);
}

function getHtmlElement() {
    if (document.documentElement) {
        return document.documentElement;
    } else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
        return document.getElementsByTagName('html')[0];
    } else {
        throw new Error("HTML element not found!");
    }
}

var backupCssText;
function narrowHostPage() {
    var offset = (sidebarFrame.clientWidth - 2);
    var html = getHtmlElement();
    backupCssText = html.style.cssText;
    html.style.cssText += ';position:absolute !important; ' +
        'left:' + offset + 'px !important; ' +
        'max-width: ' + (window.innerWidth - offset) + 'px !important;' +
        'width: 100%';
}

function revertHostPage() {
    getHtmlElement().style.cssText = backupCssText;
}

function createSidebarFrame() {
    var sidebarFrame = document.createElement("iframe");
    sidebarFrame.setAttribute("id", "TreeStyleChromeSidebarFrame");
    return sidebarFrame;
}

function applyOnBody(func) {
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                _.each(mutation.addedNodes, function (node) {
                    if (node instanceof HTMLBodyElement) {
                        func.apply(node);
                        observer.disconnect();
                    }
                });
            }
        })
    });
    observer.observe(document, { childList: true, subtree: true, attributes: false, characterData: false });
}
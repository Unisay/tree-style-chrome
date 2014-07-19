/** @jsx React.DOM */

var sidebarFrame = createSidebarFrame();

applyOnBody(function () {
    this.appendChild(sidebarFrame);
    narrowHostPage();
    injectIframeCss(sidebarFrame, chrome.extension.getURL("css/iframe.css"));
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "TreeStyleChrome.Background") {
            if (request.cmd == "toggle") {
                request.open
                    ? sidebarFrame.style.display = 'block'
                    : sidebarFrame.style.display = 'none';
                sidebarFrame.style.height = window.innerHeight + "px";
                sendResponse({status: true});
            } else if (request.cmd == "tabs") {
                if (request && request.value) {
                    renderSidebar(request.value);
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

function renderSidebar(tabs) {

    var Tab = React.createClass({displayName: 'Tab',
        handleClick: function (event) {
            if (event.button == 1) {
                TabManager.remove(this.props.key);
            } else {
                TabManager.activate(this.props.key);
            }

        },
        render: function () {
            var icon = this.props.icon || chrome.extension.getURL("img/loading.gif");
            var chromeThemePrefix = "chrome://theme";
            if (icon && icon.slice(0, chromeThemePrefix.length) == chromeThemePrefix) {
                icon = chrome.extension.getURL("img/chrome-32.png");
            }
            return React.DOM.div( {onClick:this.handleClick, className:(this.props.active ? 'tab active' : 'tab')}, 
                React.DOM.img( {className:"icon", src:icon} ),this.props.title);
        }
    });

    var TabsList = React.createClass({displayName: 'TabsList',
        render: function () {
            var tabNodes = this.props.tabs.map(function (tab) {
                return Tab( {key:tab.id, icon:tab.favIconUrl, title:tab.title, active:tab.active});
            });
            return React.DOM.div( {id:"tabsList"}, tabNodes);
        }
    });

    var SideBar = React.createClass({displayName: 'SideBar',
        handleDoubleClick: function () {
            TabManager.createTab();
        },
        render: function () {
            return React.DOM.div( {id:"sidebar", onDoubleClick:this.handleDoubleClick}, TabsList( {tabs:this.props.tabs}));
        }
    });

    if (sidebarFrame && sidebarFrame.contentDocument && sidebarFrame.contentDocument.body) {
        React.renderComponent(SideBar( {tabs:tabs} ), sidebarFrame.contentDocument.body);
    }
}

function injectIframeCss(iframe, href) {
    var cssLink = document.createElement("link");
    cssLink.href = href;
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    iframe.contentDocument.head.appendChild(cssLink);
}

function narrowHostPage() {
    var html;
    if (document.documentElement) {
        html = document.documentElement;
    } else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
        html = document.getElementsByTagName('html')[0];
    }
    html.style.marginLeft = sidebarFrame.clientWidth + 'px';
}

function createSidebarFrame() {
    var sidebarFrame = document.createElement("iframe");
    sidebarFrame.setAttribute("id", "TreeStyleChromeSidebarFrame");
    sidebarFrame.style.height = window.innerHeight + "px";
    return sidebarFrame;
}

function applyOnBody(func) {
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                Array.prototype.forEach.call(mutation.addedNodes, function (node) {
                    if (node instanceof HTMLBodyElement) {
                        func.apply(node);
                        observer.disconnect();
                    }
                });
            }
        })
    });
    observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        }
    );
}

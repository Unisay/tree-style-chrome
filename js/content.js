/** @jsx React.DOM */

var NewTabButton = React.createClass({displayName: 'NewTabButton',
    handleClick: function () {
        TabManager.createTab();
    },
    render: function () {
        return React.DOM.img( {className:"new-tab-button", src:chrome.extension.getURL("img/new-tab.png"), onClick:this.handleClick} )
    }
});

var Tab = React.createClass({displayName: 'Tab',
    handleClick: function (event) {
        if (event.button == 1) {
            this.close();
        } else {
            this.props.active = true;
            renderSidebar(sidebar);
            TabManager.activate(this.props.key);
        }
    },
    close: function() {
        TabManager.remove(this.props.key);
        return false;
    },
    getDepth: function () {
        var depth = 0;
        var tab = this.props.parentFunc.call();
        while (tab) {
            depth++;
            tab = tab.props.parentFunc.call();
        }
        return depth;
    },
    render: function () {
        var icon;
        if (this.props.loading) {
            icon = chrome.extension.getURL("img/loading.gif");
        } else {
            icon = this.props.icon || chrome.extension.getURL("img/loading.gif");
            var chromeThemePrefix = "chrome://theme";
            if (icon && icon.slice(0, chromeThemePrefix.length) == chromeThemePrefix) {
                icon = chrome.extension.getURL("img/chrome-32.png");
            }
        }
        var cssClass = this.props.active ? 'tab active' : 'tab';
        var style = {
            marginLeft: (10 * this.getDepth())
        };
        return (
            React.DOM.div( {style:style, onClick:this.handleClick, className:cssClass}, 
                React.DOM.div( {className:"tab-info"}, 
                    React.DOM.img( {className:"tab-icon", src:icon} ),
                    this.props.title
                ),
                React.DOM.div( {className:"tab-actions"}, 
                    React.DOM.img( {className:"tab-close", src:chrome.extension.getURL("img/cross.png"), onClick:this.close} )
                )
            ) );
    }
});

var SideBar = React.createClass({displayName: 'SideBar',
    handleDoubleClick: function () {
        TabManager.createTab();
    },
    render: function () {
        var tabNodes = this.props.tabs.map(function (tab) {
            return Tab(
            {key:tab.id,
            icon:tab.favIconUrl,
            title:tab.title,
            active:tab.active,
            loading:tab.status == 'loading',
            parentFunc:(function () {
                return tab.openerTabId ? _.find(tabNodes, function (tabNode) {
                    return tabNode.props.key == tab.openerTabId
                }) : undefined;
            })} );
        });
        return (
            React.DOM.div( {id:"sidebar", onDoubleClick:this.handleDoubleClick}, 
                tabNodes,
                NewTabButton(null )
            ) );
    }
});
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
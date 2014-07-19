/** @jsx React.DOM */

var sidebarFrame = createSidebarFrame();
var sidebar = createSidebar();

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

function createSidebar() {
    var Tab = React.createClass({
        handleClick: function (event) {
            if (event.button == 1) {
                TabManager.remove(this.props.key);
            } else {
                TabManager.activate(this.props.key);
            }

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
            return <div onClick={this.handleClick} className={cssClass}><img className="icon" src={icon} />{this.props.title}</div>;
        }
    });

    var TabsList = React.createClass({
        render: function () {
            var tabNodes = this.props.tabs.map(function (tab) {
                return <Tab key={tab.id} icon={tab.favIconUrl} title={tab.title} active={tab.active} loading={tab.status == 'loading'}/>;
            });
            return <div id="tabsList">{tabNodes}</div>;
        }
    });

    var SideBar = React.createClass({
        handleDoubleClick: function () {
            TabManager.createTab();
        },
        render: function () {
            return <div id="sidebar" onDoubleClick={this.handleDoubleClick}><TabsList tabs={this.props.tabs}/></div>;
        }
    });

    return <SideBar />;
}

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
    // sidebarFrame.style.height = window.innerHeight + "px";
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
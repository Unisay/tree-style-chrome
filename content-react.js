/** @jsx React.DOM */

var sidebarFrame = createSidebarFrame();

applyOnBody(function () {
    this.appendChild(sidebarFrame);
    injectIframeCss(sidebarFrame);
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "TreeStyleChrome") {
            if (request.cmd == "toggle") {
                sidebarFrame.style.display == 'none'
                    ? sidebarFrame.style.display = 'block'
                    : sidebarFrame.style.display = 'none';
                sidebarFrame.style.height = window.innerHeight + "px";
                sendResponse({status: true});
            } else if (request.cmd == "tabs") {
                renderSidebar(request.value);
            } else {
                sendResponse({status: false});
            }
        }
    }
);

function renderSidebar(tabs) {

    var Tab = React.createClass({displayName: 'Tab',
        render: function() {
            return React.DOM.div( {className:"tab"}, this.props.title);
        }
    });

    var TabsList = React.createClass({displayName: 'TabsList',
        render: function() {
            var tabNodes = this.props.tabs.map(function (tab) {
                return Tab( {key:tab.id, title:tab.title});
            });
            return React.DOM.div( {id:"tabsList"}, tabNodes);
        }
    });

    var SideBar = React.createClass({displayName: 'SideBar',
        render: function() {
            return (
                React.DOM.div( {id:"sidebar"}, 
                    TabsList( {tabs:this.props.tabs})
                )
            );
        }
    });

    React.renderComponent(SideBar( {tabs:tabs} ), sidebarFrame.contentDocument.body);
}

function injectIframeCss(iframe) {
    var cssLink = document.createElement("link");
    cssLink.href = chrome.extension.getURL("iframe.css");
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    iframe.contentDocument.head.appendChild(cssLink);
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

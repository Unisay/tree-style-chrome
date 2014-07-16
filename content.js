var sidebar = document.createElement("div");
sidebar.setAttribute("id", "TreeStyleChromeSidebar");
sidebar.style.height = window.innerHeight + "px";

window.onload = function() {
    document.body.appendChild(sidebar);
};

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "TreeStyleChrome") {
            if (request.cmd == "toggle") {
                sidebar.style.display == 'none'
                    ? sidebar.style.display = 'block'
                    : sidebar.style.display = 'none';
                sidebar.style.height = window.innerHeight + "px";
                sendResponse({status: true});
            }
            sendResponse({status: false});
        }
    }
);
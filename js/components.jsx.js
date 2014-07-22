/** @jsx React.DOM */

var NewTabButton = React.createClass({
    handleClick: function () {
        TabManager.createTab();
    },
    render: function () {
        return <img className="new-tab-button" src={chrome.extension.getURL("img/new-tab.png")} onClick={this.handleClick} />
    }
});

var Tab = React.createClass({
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
            <div style={style} onClick={this.handleClick} className={cssClass}>
                <div className="tab-info">
                    <img className="tab-icon" src={icon} />
                    {this.props.title}
                </div>
                <div className="tab-gradient" />
                <div className="tab-actions">
                    <img className="tab-close" src={chrome.extension.getURL("img/cross.png")} onClick={this.close} />
                </div>
            </div> );
    }
});

var SideBar = React.createClass({
    handleDoubleClick: function () {
        TabManager.createTab();
    },
    render: function () {
        var tabNodes = this.props.tabs.map(function (tab) {
            return <Tab
            key={tab.id}
            icon={tab.favIconUrl}
            title={tab.title}
            active={tab.active}
            loading={tab.status == 'loading'}
            parentFunc={(function () {
                return tab.openerTabId ? _.find(tabNodes, function (tabNode) {
                    return tabNode.props.key == tab.openerTabId
                }) : undefined;
            })} />;
        });
        return (
            <div id="sidebar" onDoubleClick={this.handleDoubleClick}>
                {tabNodes}
                <NewTabButton />
            </div> );
    }
});
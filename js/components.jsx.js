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
            TabManager.remove(this.props.key);
        } else {
            this.props.active = true;
            renderSidebar(sidebar);
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
        return <div onClick={this.handleClick} className={cssClass}>
            <img className="icon" src={icon} />{this.props.title}</div>;
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
                parent={tab.openerTabId} />;
        });
        return (
            <div id="sidebar" onDoubleClick={this.handleDoubleClick}>
                {tabNodes}
                <NewTabButton />
            </div>
        );
    }
});
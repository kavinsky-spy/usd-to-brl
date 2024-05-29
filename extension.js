const { St, GLib, Soup, Clutter, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

let _httpSession = new Soup.SessionAsync();

var CurrencyIndicator = GObject.registerClass(
class CurrencyIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Currency Indicator'), false);
        this.buttonText = new St.Label({
            text: _("Loading..."),
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.buttonText);
        Main.panel.addToStatusArea('currency-indicator', this);
        this._refresh();
        this._refreshPeriodically();
    }

    _refresh() {
        let message = Soup.Message.new('GET', API_URL);
        _httpSession.queue_message(message, (session, response) => {
            if (response.status_code !== Soup.KnownStatusCode.OK) {
                this.buttonText.set_text(_("Error"));
                return;
            }
            let json = JSON.parse(response.response_body.data);
            let rate = json.rates.BRL;
            this.buttonText.set_text(`USD/BRL: ${rate.toFixed(2)}`);
        });
    }

    _refreshPeriodically() {
        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3600, () => {
            this._refresh();
            return true; // Repeat.
        });
    }

    destroy() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        super.destroy();
    }
});

let _indicator;

function init() {
}

function enable() {
    _indicator = new CurrencyIndicator();
}

function disable() {
    _indicator.destroy();
    _indicator = null;
}

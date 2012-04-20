Ext.define('Onc.tabs.SystemTab', {
    extend: 'Onc.tabs.Tab',
    alias: 'widget.computesystemtab',

    defaults: {
        xtype: 'fieldset',
        margin: '0 0 10px 0'
    },
    autoScroll: true,

    tags: {
        'env:production' : 'Production',
        'env:staging' : 'Staging',
        'env:development' : 'Development',
        'env:infrastructure' : 'Infrastructure'
    },

    gauges: {
        'ram': {resource: 'memory', label: 'Physical Memory', iconCls: 'icon-memory'},
        'diskspace-root': {resource: '/', label: 'Root Partition', disk: true},
        'diskspace-storage': {resource: '/storage', label: 'Storage Partition', disk: true},
        'diskspace-vz': {resource: '/vz', label: 'VZ Partition', disk: true},
    },

    initComponent: function() {
        var me = this;
        var rec = this.record;
        var tagsRec = rec.get('tags');
        var tagItems = [];

        this.addEvents('vmsstart', 'vmsstop', 'vmssuspend', 'vmsgraceful');

        for (tag in this.tags) {
            tagItems[tagItems.length] = {
                itemId: tag,
                boxLabel: this.tags[tag],
                checked: Ext.Array.contains(tagsRec, tag)
            };
        }
        tagItems[tagItems.length] = {
            xtype: 'button',
            text: 'Save',
            handler: this.saveTags,
            scope: this
        };

        function _changeStateWithConfirmation(confirmTitle, confirmText, eventName, target, cb) {
            Ext.Msg.confirm(confirmTitle, confirmText,
                function(choice) {
                    if (choice === 'yes') {
                        me.setLoading(true, true);
                        me.fireEvent(eventName, target, function() {
                                    cb();
                                    me.setLoading(false);
                                    });
                    }
                });
        }

        var diskspaceUsage = rec.get('diskspace_usage');
        var diskspace = rec.get('diskspace');

        var gaugeItems = [];
        for (id in this.gauges) {
            gauge = this.gauges[id];
            if (gauge.disk && !diskspace[gauge.resource]) {
                continue;
            }
            var item = {
                itemId: id + '-gauge',
                label: gauge.label,
                unit: 'MB'
            };
            if (gauge.disk) {
                item.max = diskspace[gauge.resource];
                item.value = diskspaceUsage[gauge.resource];
                item.iconCls = 'icon-hd';
            } else {
                item.value = rec.get(gauge.resource + '_usage');
                item.max = rec.get(gauge.resource);
                item.iconCls = gauge.iconCls;
            }
            gaugeItems[gaugeItems.length] = item;
        }

        this.items = [{
            title: 'Power Control',
            items: [Ext.widget('computestatecontrol', {
                margin: 5,
                initialState: (rec.get('state') === 'active' ?
                               'running' :
                               rec.get('state') === 'suspended' ?
                               'suspended' :
                               'stopped'),
                disableDetails: true,
                listeners: {
                    'start': function(_, cb) { _changeStateWithConfirmation('Starting a VM',
                               'Are you sure you want to boot this VM?',
                               'vmsstart',
                               [rec],
                               cb);
                    },
                    'suspend': function(_, cb) { me.fireEvent('vmssuspend', [rec], cb); },
                    'graceful': function(_, cb) {
                        _changeStateWithConfirmation('Shutting down a VM',
                               'Are you sure? All of the processes inside a VM will be stoppped',
                               'vmsgraceful',
                               [rec],
                               cb);
                    },
                    'stop': function(_, cb) { me.fireEvent('vmsstop', [rec], cb); },
            }})]
        }, {
            title: 'Info',
            layout: {type: 'table', columns: 2},
            frame: true,
            defaults: {
                xtype: 'box',
                padding: 5
            },
            items: [
                {html: 'CPU info'}, {style: "font-weight: bold", html: rec.get('cpu_info')},
                {html: 'Memory'}, {style: "font-weight: bold", html: rec.get('memory') + 'MB'},
                {html: 'Swap'}, {style: "font-weight: bold", html: rec.get('swap_size') + 'MB'},
                {html: 'OS Release'}, {style: "font-weight: bold", html: rec.get('os_release')},
                {html: 'Kernel'}, {style: "font-weight: bold", html: rec.get('kernel')},
                {html: 'Template'}, {style: "font-weight: bold", html: rec.get('template')},
                {html: 'Uptime'}, {itemId: 'uptime', style: "font-weight: bold", html: rec.getUptime()},
                {html: 'ID'}, {style: "font-weight: bold", html: rec.getId()}]
        }, {
            title: "Metrics",
            layout: {type: 'table', columns: 2},
            frame: true,
            defaults: {
                xtype: 'gauge',
                width: 250,
                margin: 10
            },
            items: gaugeItems
        }, {
            title: "Tags",
            itemId: 'label-tags',
            layout: {type: 'table', columns: 4},
            frame: true,
            defaults: {
                xtype: 'checkboxfield',
                margin: 10
            },
            items: tagItems
        }];

        var me = this;
        this._uptimeUpdateInterval = setInterval(function() {
            me.down('#uptime').update(rec.get('state') === 'active' ?
                                      rec.getUptime() : 'Server is switched off.');
        }, 1000);

        this.callParent(arguments);
    },

    onRender: function() {
        this.callParent(arguments);
        this._streamSubscribe();
    },

    _streamSubscribe: function() {
        console.assert(!this._hubListener);
        this._hubListener = this._onDataFromHub.bind(this);

        var baseUrl= this.record.get('url');
        Onc.hub.Hub.subscribe(this._hubListener, {
            'memory': baseUrl + 'metrics/{0}_usage'.format('memory'),
            'diskspace': baseUrl + 'metrics/{0}_usage'.format('diskspace'),
        }, 'gauge');
    },

    _streamUnsubscribe: function() {
        Onc.hub.Hub.unsubscribe(this._hubListener);
    },

    _onDataFromHub: function(values) {
        this.down('#ram-gauge').setValue(values['memory']);
    },

    onDestroy: function() {
        this.callParent(arguments);

        clearInterval(this._uptimeUpdateInterval);
        delete this._uptimeUpdateInterval;

        this._streamUnsubscribe();
    },

    saveTags: function() {
        var rec = this.record;
        var tagsRec = rec.get('tags');
        var labelTags = this.getComponent('label-tags');

        for (tag in this.tags) {
            if (labelTags.getComponent(tag).getValue()) {
                Ext.Array.include(tagsRec, tag);
            } else {
                Ext.Array.remove(tagsRec, tag);
            }
        }

        rec.set('tags', tagsRec);
        rec.save();
    }
});

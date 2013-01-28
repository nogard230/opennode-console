Ext.define('Onc.controller.MainController', {
    extend: 'Ext.app.Controller',

    models: ['Base', 'Compute', 'IpRoute', 'Storage', 'Template', 'VirtualizationContainer', 'Hangar',
             'Templates', 'NetworkInterface', 'NetworkInterfaces'],
    stores: ['ComputesStore', 'PhysicalComputesStore', 'TemplatesStore'],
    views: ['compute.ComputeView'],

    refs: [{ref: 'tabs', selector: '#mainTabs'}],

    openComputeInTab: function(computeId) {
        var tabPanel = this.getTabs();
        var tab = tabPanel.child('computeview[computeId=' + computeId + ']');
        if (!tab) {
            var loadingMask = new Ext.LoadMask(Ext.getCmp('search-results'), {msg:'Loading. Please wait...'});
            loadingMask.show();
            this.getStore('ComputesStore').loadById(computeId,
                function(compute) {
                    tab = Ext.widget('computeview', {
                        record: compute,
                        computeId: computeId
                    });
                    tabPanel.add(tab);
                    tabPanel.setActiveTab(tab);
                },
                function(error) {
                    // TODO: visual display of the error
                    console.error('Error while loading data: ', error);
                    return;
                }
            );
            loadingMask.hide();
        } else {
            tabPanel.setActiveTab(tab);
        }
    },

    busListeners: {
        openCompute: function(computeId){
          this.openComputeInTab(computeId);
        },

        computeRemove: function(vmId, url){
            // close deleted VM compute tab
            var tabPanel = this.getTabs();
            var tab = tabPanel.child('computeview[computeId=' + vmId + ']');
            if(tab)
                tabPanel.remove(tab);
        }

    },

    // TODO: move global variables to separate locator class
    logViewerAppender: null,
    logViewer: null,

    init: function() {
        this.logViewerAppender = new Sm.log.LogViewerAppender();
        Sm.log.Logger.getRoot().addAppender(this.logViewerAppender);

        // set log level if LOG_LEVEL defined in config.js
        if(LOG_LEVEL)
            Sm.log.Logger.getRoot().setLevel(Sm.log.Level[LOG_LEVEL]);

        var log = Sm.log.Logger.getLogger( 'UI');

        this.control({
            '#mainTabs': {
                tabchange: function(tabPanel, newTab) {
                    var computeId = newTab.computeId;
                    this.fireBusEvent('computeDisplayed', computeId);
                }
            },
            '#vmmap': {
                showvmdetails: function(computeId) {
                    this.openComputeInTab(computeId);
                },
                newvm: function(parentCompute) {
                    this.fireBusEvent('displayNewVMDialog', parentCompute);
                }
            },
            '#tasks-button': {
                click: function() {
                    this.fireBusEvent('displayTaskManager');
                }
            },
            '#infrastructurejoin-button':{
                click: function() {
                    this.fireBusEvent('displayHostManager');
                }
            },
            '#viewlog-button': {
                click: function(){
                    // Create a log window
                    if(!this.logViewer){
                        this.logViewer = new Sm.log.LogViewerWindow({
                            appender : this.logViewerAppender,
                            minimizable: true
                        });
                        this.logViewer.on({
                            close: function(win, eOpts){
                                log.info('Log viewer closed - logs cleared');
                                this.logViewer = null;
                            },
                            // minimize implemented because closing viewer clear log list
                            minimize: function(win, eOpts){
                                log.info('Log viewer minimized');
                                win.hide();
                            },
                            scope: this
                        });
                        log.info('Log viewer created');
                    }
                    this.logViewer.setVisible(!this.logViewer.isVisible());
                    log.info('Log viewer displayed');
                }
            }
        });
    }
});

Ext.define('Onc.controller.ComputeController', {
    extend: 'Ext.app.Controller',

    views: ['compute.NewVmView'],

    refs: [
        {ref: 'computeInfo', selector: 'computeview'}
    ],

    init: function() {
        this.control({
            'computeview computevmlisttab #new-vm-button': {
                click: function() {
                    this.getView('compute.NewVmView').create({
                        parentCompute: this.getComputeInfo().record
                    }).show();
                }
            },
            'computeview computevmlisttab computevmmaptab': {
                showvmdetails: function(vm) {
                    var computeId = vm.get('id');
                    this.getController('MainController').openComputeInTab(computeId);
                },
                startvms: function(vms, callback) {
                    Ext.each(vms, function(vm) {
                        vm.set('state', 'active');
                        vm.save();
                    });
                    setTimeout(callback, 1000 + Math.random() * 150);
                },
                stopvms: function(vms, callback) {
                    Ext.each(vms, function(vm) {
                        vm.set('state', 'inactive');
                        vm.save();
                    });
                    setTimeout(callback, 1000 + Math.random() * 150);
                }
            }
        });

    }
});

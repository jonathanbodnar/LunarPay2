
var org_selector = {
    init: function () {
        $(document).on('click', '#org-selector .btn-change-org', function (e) {
            let xorgnx_id = $(this).attr('data-xorgnx_id');
            let type = $(this).attr('data-type');

            org_selector.changeOrg(xorgnx_id, type);

            e.preventDefault();
            //return false;
        });
    },
    setAsLoadingState: function (state) {
        if (state) { //show loader - hide selected org
            $('#org-selector .org-selector-spinner').show();
            $('#org-selector .org-title-wrapper').hide();
        } else {  //hide loader - show selected org
            $('#org-selector .org-selector-spinner').hide();
            $('#org-selector .org-title-wrapper').show();
        }
    },
    populate: function () {
        org_selector.setAsLoadingState(true);
        $.ajax({
            url: base_url + 'auth/get_orgnx_tree', type: "GET", dataType: "json",
            success: function (data) {
                
                _global_objects.currnt_org_with_fts_tpl = data.orgnx_tree.selected_org;

                if(data.status == true) {
                    $('#org-selector .org-title-wrapper .org-title').text(data.orgnx_tree.selected_org.org_name)
                            .attr('data-type', data.orgnx_tree.selected_org.type);

                    $.each(data.orgnx_tree.tree, function () {
                        let orgnxClone = $('#orgSelectorTemplates a[data-org_tpl="1"]').clone();
                        orgnxClone.removeAttr('data-org_tpl');
                        orgnxClone.attr('data-xorgnx_id', this.xorgnx_id);
                        orgnxClone.attr('data-type', 'org');

                        orgnxClone.find('.org_name').text(this.org_name);
                        $("#org-selector #org-selector-list-group").append(orgnxClone);

                        $.each(this.suborgs, function () {
                            let sorgnxClone = $('#orgSelectorTemplates a[data-sorg_tpl="1"]').clone();
                            sorgnxClone.removeAttr('data-sorg_tpl');
                            sorgnxClone.attr('data-xorgnx_id', this.sorg_id);
                            sorgnxClone.attr('data-type', 'sub');
                            sorgnxClone.find('.sorg_name').text(this.sorg_name);
                            $("#org-selector #org-selector-list-group").append(sorgnxClone);
                        });

                        if (this.suborgs.length > 0) { //if there is suborgnx just put an elemnt for creating an space, just better looking
                            $("#org-selector #org-selector-list-group").append('<div class="space-after-last-suborg"></div>');
                        }                    
                    });
                } else {
                    notify({title: 'Notification', 'message': data.message});
                    setTimeout(function(){
                        window.location.href = base_url +  'auth/logout';
                    }, 4000);
                    
                }
                
                org_selector.setAsLoadingState(false);
                
            },
            error: function (jqXHR, textStatus, errorJson) {
                org_selector.setAsLoadingState(false);
                if (typeof jqXHR.responseJSON !== 'undefined' &&
                        typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                    alert(jqXHR.responseJSON.message);
                } else {
                    alert("error: " + jqXHR.responseText);
                }
            }
        });
    },
    changeOrg: function (xorgnx_id, type) {
        org_selector.setAsLoadingState(true);
        var data = $("#general_token_form").serializeArray();
        var save_data = {};
        $.each(data, function () {
            save_data[this.name] = this.value;            
        });

        save_data['xorgnx_id'] = xorgnx_id;
        save_data['type'] = type;
      
                $.ajax({
                url: base_url + 'auth/set_current_user_orgnx', type: "POST", dataType: "json", data: save_data,
                        success: function (data) {
                        if(_global_objects.currnt_controller_method == "donors/profile"){                        
                             window.location.href = `${base_url}donors`;
                        } else{
                        window.location.reload();
                        }                        
                },
            error: function (jqXHR, textStatus, errorJson) {
                org_selector.setAsLoadingState(false);
                if (typeof jqXHR.responseJSON !== 'undefined' &&
                        typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                    alert(jqXHR.responseJSON.message);
                } else {
                    alert("error: " + jqXHR.responseText);
                }
            }
        });

    }
};

org_selector.init();
org_selector.populate();
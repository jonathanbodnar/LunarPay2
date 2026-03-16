(function () {

    $(document).ready(function () 
	{
	
        integrations.init();
        integrations.setButtonsEvents();
        integrations.initDevelopers();
        integrations.setButtonsEventsDevelopers();
	integrations.instripe();
	integrations.setButtonsEventstripe();
        integrations.freshbooks();
	integrations.setButtonsEventfreshbooks();
        integrations.quickbooks();
	integrations.setButtonsEventquickbooks();
        integrations.slack();
	integrations.setButtonsEventslack();
		
		
      if($('#integration_tab').val() == 'pcenter') {
            $('#nav-pills-tabs-planning_center-tab').click();
	   }

       if($('#integration_tab').val() == 'stripe') {
            $('#nav-pills-tabs-stripe-tab').click();
        }
        
      if($('#integration_tab').val() == 'freshbooks') {
            $('#nav-pills-tabs-freshbooks-tab').click();
        }
        
      if($('#integration_tab').val() == 'quickbooks') {
            $('#nav-pills-tabs-quickbooks-tab').click();
        }  
        
       if($('#integration_tab').val() == 'slack') {
            $('#nav-pills-tabs-slack-tab').click();
        }   
        
       if($('#integration_tab').val() == 'developers') {
            $('#nav-pills-tabs-developers-tab').click();
        }   
        
	
    });

    let integrations = 
	{
        init: function () 
		{
            loader('show');
            $.ajax({
                url: base_url + 'integrations/planningcenter/validatetoken', type: "GET",
                dataType: "json",
                cache: false,
                success: function (data) {
                    loader('hide');
					$('#btn_planning_center_oauth_conn').attr('href', data.oauth_url);
                    if (data.conn_status) {
                        $('.btn_planning_center_push').show();                        
                    } else {
                        $('.btn_planning_center_oauth_conn').show();
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    loader('hide');
                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                        alert(jqXHR.responseJSON.message);
                        location.reload();
                    } else {
                        alert("error: " + jqXHR.responseText);
                    }
                }
            });
        },

        /**
         * Initialize Developers section
         */
        initDevelopers: function () 
		{
            this.loadApiCredentials();
            this.loadWebhookConfig();
        },

        /**
         * Load API credentials
         */
        loadApiCredentials: function () 
		{
            $.ajax({
                url: base_url + 'developers/get_api_credentials', 
                type: "GET",
                dataType: "json",
                cache: false,
                success: function (data) {
                    if (data.status) {
                        integrations.renderApiCredentials(data.data);
                    } else {
                        integrations.renderApiCredentials(null);
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    integrations.renderApiCredentials(null);
                }
            });
        },

        /**
         * Render API credentials section
         */
        renderApiCredentials: function (credentials) 
		{
            let html = '';
            
            if (credentials) {
                html = `
                    
                    <div class="form-group">
                        <label><strong>API Key:</strong></label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="api_key_input" value="${credentials.api_key}" readonly>
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary" type="button" id="copy_api_key_main">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>API Secret:</strong></label>
                        <input type="text" class="form-control" id="api_secret_input" value="${credentials.api_secret}" readonly>
                        <small class="form-text text-muted">
                            ${credentials.has_secret ? 'Secret is masked for security and is not shown again. If lost, you must generate a new one.' : 'No secret generated yet.'}
                        </small>
                    </div>
                                        
                   <div class="form-row">
                        <div class="form-group col-md-6">
                            <label><strong>Created:</strong></label>
                            <input type="text" class="form-control" value="${credentials.created_at}" readonly>
                        </div>
                        <div class="form-group col-md-6">
                            <label><strong>Last Updated:</strong></label>
                            <input type="text" class="form-control" value="${credentials.updated_at || 'Never'}" readonly>
                        </div>
                    </div>
                    
                   <div class="d-flex align-items-center mt-2 mb-3">
                        <div class="w-50 pr-2">
                            <button id="btn_generate_credentials" class="btn btn-primary w-100" style="width: 300px!important;">
                                <i class="fas fa-sync-alt"></i> Generate New API Credentials
                            </button>
                        </div>                        
                    </div>
                `;
            } else {
                html = `
                    <div class="alert alert-dismissible alert-validation">
                        <p><i class="fas fa-info-circle"></i> No API credentials found. Generate your first set of credentials to start using the API.</p>
                    </div>
                    
                    <button id="btn_generate_credentials" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Generate API Credentials
                    </button>
                `;
            }
            
            $('#api-credentials-section').html(html);
            
            // Add event listeners for the new elements
            if (credentials) {
                $('#copy_api_key_main').on('click', function() {
                    let link = document.querySelector('#api_key_input').value;
                    navigator.clipboard.writeText(link);
                    notify({
                        title: 'Notification',
                        'message': 'API Key copied to your clipboard'
                    });
                });
            }
        },

        /**
         * Load webhook configuration
         */
        loadWebhookConfig: function () 
		{
            $.ajax({
                url: base_url + 'developers/get_webhook_config', 
                type: "GET",
                dataType: "json",
                cache: false,
                success: function (data) {
                    if (data.status) {
                        // Also check if API credentials exist
                        $.ajax({
                            url: base_url + 'developers/get_api_credentials',
                            type: "GET",
                            dataType: "json",
                            cache: false,
                            success: function (credentialsData) {
                                const hasApiCredentials = credentialsData.status;
                                integrations.renderWebhookConfig(data.data, hasApiCredentials);
                            },
                            error: function () {
                                integrations.renderWebhookConfig(data.data, false);
                            }
                        });
                    } else {
                        integrations.renderWebhookConfig({}, false);
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    integrations.renderWebhookConfig({}, false);
                }
            });
        },

        /**
         * Render webhook configuration section
         */
        renderWebhookConfig: function (config, forceHasApiCredentials = null) 
		{
            const subscriptionCreated = config.subscription_created || { enabled: false, url: '' };
            const subscriptionUpdated = config.subscription_updated || { enabled: false, url: '' };
            const bearerToken = config.bearer_token_masked || null;
            const hasBearerToken = config.has_bearer_token || false;
            
            // Use the URL from either event (they should be the same)
            const webhookUrl = subscriptionCreated.url || subscriptionUpdated.url || '';
            const webhookEnabled = subscriptionCreated.enabled || subscriptionUpdated.enabled;
            
            // Check if API credentials exist (we'll get this from the API credentials section)
            // If forceHasApiCredentials is provided, use that value instead
            const hasApiCredentials = forceHasApiCredentials !== null ? forceHasApiCredentials : $('#api-credentials-section').find('#api_key_input').length > 0;
            
            let html = `
                <div>
                    <p><i class="fas fa-info-circle"></i> Configure webhook endpoints to receive real-time notifications when events occur.</p>
                </div>
                
                <div class="form-group">
                    <label><strong>Webhook Bearer Token:</strong></label>
                    <input type="text" class="form-control" id="bearer_token_input" value="${bearerToken || ''}" readonly>
                    <small class="form-text text-muted">
                        ${hasBearerToken ? 'Bearer token is masked for security and is not shown again. If lost, you must generate a new one.' : 'No bearer token generated yet, you need one so lunarpay can authenticate the webhook request.'}
                    </small>
                    <br>
                    <button id="btn_generate_bearer" style="width: 300px!important;" class="btn btn-primary" ${hasApiCredentials ? '' : 'disabled'}>
                        <i class="fas fa-key"></i> ${hasBearerToken ? 'Generate New Bearer Token' : 'Generate Bearer Token'}
                    </button>
                    ${!hasApiCredentials ? '<br><small class="form-text text-default"><i class="fas fa-exclamation-triangle"></i> You must create API credentials first before generating a bearer token.</small>' : ''}
                </div>
                
                <hr>
                
                <form id="webhook-form">
                    <div class="form-group">
                        <span class="ml-2 font-weight-bold">Enable subscription webhook</span>
                        <br><br>
                        <label class="custom-toggle">
                            <input type="checkbox" id="webhook_enabled" 
                                   ${webhookEnabled ? 'checked' : ''}>
                            <span class="custom-toggle-slider rounded-circle"></span>
                        </label>
                        <small class="form-text text-muted">
                            When enabled, both subscription events will be sent to the webhook URL.
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>Webhook URL:</strong></label>
                        <div class="input-group mb-2">
                            <input type="url" class="form-control" id="webhook_url" 
                                   placeholder="https://your-domain.com/webhook/events" 
                                   value="${webhookUrl}"
                                   ${webhookEnabled ? '' : 'readonly'}>
                        </div>
                        <small class="form-text text-muted">
                            This URL will receive both "subscription_created" and "subscription_updated" events.
                        </small>
                    </div>
                    
                    <button id="btn_save_webhooks" style="width: 300px!important;" class="btn btn-primary" ${hasApiCredentials ? '' : 'disabled'}>
                        <i class="fas fa-save"></i> Save Webhook Configuration
                    </button>
                    ${!hasApiCredentials ? '<br><small class="form-text text-default"><i class="fas fa-exclamation-triangle"></i> You must create API credentials first before configuring webhooks.</small>' : ''}
                </form>
            `;
            
            $('#webhook-config-section').html(html);
        },

        /**
         * Set button events for developers section
         */
        setButtonsEventsDevelopers: function () 
		{
            // Handle webhook toggle to control input field
            $(document).on('change', '#webhook_enabled', function() {
                let isEnabled = $(this).is(':checked');
                let urlInput = $('#webhook_url');
                
                if (isEnabled) {
                    urlInput.prop('readonly', false);
                    urlInput.removeClass('bg-light');
                } else {
                    urlInput.prop('readonly', true);
                    urlInput.addClass('bg-light');
                }
            });

            // Generate credentials button
            $(document).on('click', '#btn_generate_credentials', function (e) {
                e.preventDefault();
                
                question_modal(
                    'New API Credentials',
                    'Existing credentials will be lost and replaced. Continue?'
                  ).then(function (result) {
                    if (result.value) {
                        let btn = helpers.btn_disable(document.querySelector('#btn_generate_credentials'));
                        
                        $.ajax({
                            url: base_url + 'developers/generate_api_credentials',
                            type: "POST",
                            dataType: "json",
                            success: function (result) {
                                helpers.btn_enable(btn);
                                if (result.status) {
                                    // Show the new credentials in a modal
                                    integrations.showNewCredentials(result.data);
                                    // Reload the credentials section
                                    integrations.loadApiCredentials();
                                    // Reload the webhook config section (will now detect API credentials)
                                    integrations.loadWebhookConfig();
                                } else {
                                    integrations.showAlert(result.message || 'Failed to generate credentials', 'danger');
                                }
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                integrations.showAlert('Error generating credentials: ' + jqXHR.responseText, 'danger');
                            }
                        });
                    }
                });
            });

            // Generate bearer token button
            $(document).on('click', '#btn_generate_bearer', function (e) {
                e.preventDefault();
                
                // Check if bearer token already exists
                let hasExistingToken = $('#bearer_token_input').val() && $('#bearer_token_input').val() !== '';
                let title = hasExistingToken ? 'Generate New Bearer Token' : 'Generate Bearer Token';
                let message = hasExistingToken 
                    ? 'Are you sure you want to generate a new bearer token? This will invalidate the current one.'
                    : 'Are you sure you want to generate a bearer token?';
                
                question_modal(title, message).then(function (result) {
                    if (result.value) {
                        let btn = helpers.btn_disable(document.querySelector('#btn_generate_bearer'));
                        
                        $.ajax({
                            url: base_url + 'developers/generate_bearer_token',
                            type: "POST",
                            dataType: "json",
                            success: function (result) {
                                helpers.btn_enable(btn);
                                if (result.status) {
                                    // Show the new bearer token in a modal
                                    integrations.showNewBearerToken(result.data.bearer_token);
                                    // Reload the webhook config section
                                    integrations.loadWebhookConfig();
                                } else {
                                    integrations.showAlert(result.message || 'Failed to generate bearer token', 'danger');
                                }
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                integrations.showAlert('Error generating bearer token: ' + jqXHR.responseText, 'danger');
                            }
                        });
                    }
                });
            });

            // Save webhooks button
            $(document).on('click', '#btn_save_webhooks', function (e) {
                e.preventDefault();
                
                let btn = helpers.btn_disable(this);
                
                let data = {
                    webhook_enabled: $('#webhook_enabled').is(':checked'),
                    webhook_url: $('#webhook_url').val()
                };
                
                $.ajax({
                    url: base_url + 'developers/save_webhook_config',
                    type: "POST",
                    dataType: "json",
                    data: data,
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            notify({title: 'Success', message: result.message});
                        } else {
                            error_message(result.message || 'Failed to save webhook configuration');                            
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        alert();
                        helpers.btn_enable(btn);
                        let errorMessage = 'Error saving webhook configuration';
                        
                        // Try to get error message from response
                        if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                            errorMessage = jqXHR.responseJSON.message;
                        } else if (jqXHR.responseText) {
                            errorMessage = 'Error: ' + jqXHR.responseText;
                        }
                        
                        notify({title: 'Error', message: errorMessage});
                    }
                });
            });
        },

        /**
         * Show new credentials in a modal
         */
        showNewCredentials: function (data) 
		{
            let modalHtml = `
                <div class="modal fade" id="newCredentialsModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    New API Credentials Generated
                                </h5>
                                <button type="button" class="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-dismissible alert-validation">
                                    <p><i class="fas fa-exclamation-triangle"></i> <strong>Important:</strong> Please copy and save these credentials in a secure location. The API secret will only be shown once and cannot be recovered.</p>
                                </div>                               
                                
                                <div class="form-group">
                                    <label><strong>API Key:</strong></label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="modal_api_key" value="${data.credentials.api_key}" readonly>
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button" id="copy_api_key_btn">
                                                <i class="fas fa-copy"></i> Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label><strong>API Secret:</strong></label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="modal_api_secret" value="${data.credentials.api_secret}" readonly>
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button" id="copy_api_secret_btn">
                                                <i class="fas fa-copy"></i> Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            $('#newCredentialsModal').remove();
            
            // Add modal to body and show it
            $('body').append(modalHtml);
            $('#newCredentialsModal').modal('show');
            
            // Add event listeners for copy buttons
            $('#copy_api_key_btn').on('click', function() {
                let link = document.querySelector('#modal_api_key').value;
                navigator.clipboard.writeText(link);
                notify({
                    title: 'Notification',
                    'message': 'API Key copied to your clipboard'
                });
            });
            
            $('#copy_api_secret_btn').on('click', function() {
                let link = document.querySelector('#modal_api_secret').value;
                navigator.clipboard.writeText(link);
                notify({
                    title: 'Notification',
                    'message': 'API Secret copied to your clipboard'
                });
            });
        },

        /**
         * Show new bearer token in a modal
         */
        showNewBearerToken: function (bearerToken) 
		{
            let modalHtml = `
                <div class="modal fade" id="newBearerTokenModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    New Bearer Token Generated
                                </h5>
                                <button type="button" class="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-dismissible alert-validation">
                                    <p><i class="fas fa-info-circle"></i> <strong>Usage:</strong> This bearer token will be included in the Authorization header when LunarPay sends webhook notifications to your endpoint. Your webhook endpoint should validate this token to ensure the request is coming from LunarPay.</p>
                                </div>
                                
                                <div class="form-group">
                                    <label><strong>Bearer Token:</strong></label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="modal_bearer_token" value="${bearerToken}" readonly>
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button" id="copy_bearer_token_btn">
                                                <i class="fas fa-copy"></i> Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="alert alert-dismissible alert-validation">
                                    <p><i class="fas fa-exclamation-triangle"></i> <strong>Important:</strong> Please copy and save this bearer token in a secure location. It will only be shown once and cannot be recovered.</p>
                                </div>
                                
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            $('#newBearerTokenModal').remove();
            
            // Add modal to body and show it
            $('body').append(modalHtml);
            $('#newBearerTokenModal').modal('show');
            
            // Add event listener for copy button
            $('#copy_bearer_token_btn').on('click', function() {
                let link = document.querySelector('#modal_bearer_token').value;
                navigator.clipboard.writeText(link);
                notify({
                    title: 'Notification',
                    'message': 'Bearer token copied to your clipboard'
                });
            });
        },
/**
         * Copy text to clipboard
         */
        copyToClipboard: function (text) 
		{
            navigator.clipboard.writeText(text).then(function() {
                notify({title: 'Notification', message: 'Copied to clipboard!'});
            }, function(err) {
                // Fallback for older browsers
                let textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    notify({title: 'Notification', message: 'Copied to clipboard!'});
                } catch (err) {
                    integrations.showAlert('Failed to copy to clipboard', 'danger');
                }
                document.body.removeChild(textArea);
            });
        },

        /**
         * Show standardized alert
         */
        showAlert: function (message, type) 
		{
            error_message(message);            
        },

        setButtonsEvents: function () 
		{
            $('#btn_planning_center_push').on('click', function (e) {
                let btn = helpers.btn_disable(this);
                $.ajax({
                    url: base_url + 'integrations/planningcenter/startpush', type: "POST",
                    dataType: "json",
                    data: {'commit': $('#commit_batch').is(':checked') ? 1 : 0},
                    success: function (result) {
                        helpers.btn_enable(btn);
                        console.log(result);
                        if (result.status) {
                            let message = '';
                            $.each(result.summary, function (i, val) {
                                message += '<p>' + val + '</p>';
                            });
                            success_message(message);

                        } else {
                            info_message(result.message);
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        helpers.btn_enable(btn);
                        alert(jqXHR.responseText);
                        //location.reload();
                    }
                });
                e.preventDefault();
                return false;
            });

            $('#btn_planning_center_disconnect').on('click', function (e) {
                let btn = helpers.btn_disable(this);
                $.ajax({
                    url: base_url + 'integrations/planningcenter/disconnect', type: "GET",
                    dataType: "json",
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            $('.btn_planning_center_push').hide();
                            $('.btn_planning_center_oauth_conn').show('fast');                            
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        helpers.btn_enable(btn);
                        alert(jqXHR.responseText);
                        //location.reload();
                    }
                });
                e.preventDefault();
                return false;
            });

            //==== Organization Changed
            async function loadSubOrganizations () {
                var selectInput = $('select[name="suborganization_id"]');
                var organization_id = $('select[name="organization_id"]').val();
                $('select[name="suborganization_id"]').empty();
                $('select[name="suborganization_id"]').append($('<option/>',{value:''}).html('Select a Sub Organization'));
                if(organization_id){
                    //Set Sub Organizations to Datatable Filters
                    await $.post(base_url + 'suborganizations/get_suborganizations_list', {organization_id:organization_id} , function (result) {
                        for (var i in result) {
                            selectInput.append($('<option/>'
                                ,{value: result[i].id,'data-token': result[i].token})
                                .html(result[i].name));
                        }
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            }

            loadSubOrganizations();

            //Get Settings with Organization Id
            $('select[name="organization_id"]').change(loadSubOrganizations);

            //Download Wordpress Link
            $('#download_wordpress_plugin').click(function (e) {
                e.preventDefault();
                var organization_id = $('select[name="organization_id"]').val();
                if(organization_id) {
                    var suborganization_id = $('select[name="suborganization_id"]').val();
                    var token = $('select[name="organization_id"] option:selected').data('token');
                    if(suborganization_id !== '') {
                        token = $('select[name="suborganization_id"] option:selected').data('token');
                    }
                    $.post(base_url + 'install/wordpress_download', {organization_id:organization_id,suborganization_id:suborganization_id,token:token}
                        , function (data) {
                            if (data.status === true) {
                                var file_path = data.data;
                                var a = document.createElement('A');
                                a.href = file_path;
                                a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }
                        }).fail(function (e) {
                        console.log(e);
                    });
                }
            });
        },
	
       instripe: function () 
		{	 
	        loader('show');
            $.ajax({
                url: base_url + 'integrations/stripe/validatetoken', type: "GET",
                dataType: "json",
                cache: false,
                success: function (data) {
                    loader('hide');
		   $('#btn_stripe_oauth_conn').attr('href', data.oauth_url);
                    if (data.conn_status) {
                        $('.btn_stripe_push').show();                        
                    } else {
                        $('.btn_stripe_oauth_conn').show();
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    loader('hide');
                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                        alert(jqXHR.responseJSON.message);
                        location.reload();
                    } else {
                        alert("error: " + jqXHR.responseText);
                    }
                }
            });			
			
		},
		
                setButtonsEventstripe: function ()
                {
                     $('#btn_stripe_disconnect').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/stripe/disconnect', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                helpers.btn_enable(btn);
                                if (result.status) {
                                    $('.btn_stripe_push').hide();
                                    $('.btn_stripe_oauth_conn').show('fast');
                                }
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                //location.reload();
                            }
                        });
                        e.preventDefault();
                        return false;
                    });


                    $('#btn_stripe_download').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/stripe/import_data', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                notify({title: 'Notification', 'message': result.message});
                                helpers.btn_enable(btn);                                
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                //location.reload();
                            }
                        });
                        e.preventDefault();
                        return false;
                    });

                },
                
                freshbooks: function ()
                {
                    loader('show');
                    $.ajax({
                        url: base_url + 'integrations/freshbooks/validatetoken', type: "GET",
                        dataType: "json",
                        cache: false,
                        success: function (data) {
                            loader('hide');
                            $('#btn_freshbooks_oauth_conn').attr('href', data.oauth_url);
                            if (data.conn_status) {
                                $('.btn_freshbooks_push').show();
                            } else {
                                $('.btn_freshbooks_oauth_conn').show();
                            }
                        },
                        error: function (jqXHR, textStatus, errorJson) {
                            loader('hide');
                            if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                alert(jqXHR.responseJSON.message);
                                location.reload();
                            } else {
                                alert("error: " + jqXHR.responseText);
                            }
                        }
                    });

                },
                     
		
                setButtonsEventfreshbooks: function ()
                {
                   
                    $('#btn_freshbooks_disconnect').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/freshbooks/disconnect', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                helpers.btn_enable(btn);
                                if (result.status) {
                                    $('.btn_freshbooks_push').hide();
                                    $('.btn_freshbooks_oauth_conn').show('fast');
                                }
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                
                            }
                        });
                        e.preventDefault();
                        return false;
                    });

                    $('#btn_freshbooks_up').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/freshbooks/push_data', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                if (result.status)
                                    success_message(
                                            '<p>' + result.push_summary.push_cust_count +  ' Customers created</p>' +
                                            '<p>' + result.push_summary.push_inv_count + ' Invoices created</p>' +
                                            '<p>' + result.push_summary.push_payment_count + ' Payments created</p>');
                                            
                                else 
                                {
                                  info_message(result.message);  
                                }   
                                helpers.btn_enable(btn);                                
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                //location.reload();
                            }
                        });
                        e.preventDefault();
                        return false;
                    });
                },
                
                quickbooks: function ()
                {
                    loader('show');
                    $.ajax({
                        url: base_url + 'integrations/quickbooks/validatetoken', type: "GET",
                        dataType: "json",
                        cache: false,
                        success: function (data) {
                            loader('hide');
                            $('#btn_quickbooks_oauth_conn').attr('href', data.oauth_url);
                            if (data.conn_status) {
                                $('.btn_quickbooks_push').show();
                            } else {
                                $('.btn_quickbooks_oauth_conn').show();
                            }
                        },
                        error: function (jqXHR, textStatus, errorJson) {
                            loader('hide');
                            if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                alert(jqXHR.responseJSON.message);
                                location.reload();
                            } else {
                                alert("error: " + jqXHR.responseText);
                            }
                        }
                    });

                },
                    
                    
                setButtonsEventquickbooks: function ()
                {
                    $('#btn_quickbooks_disconnect').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/quickbooks/disconnect', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                helpers.btn_enable(btn);
                                if (result.status) {
                                    $('.btn_quickbooks_push').hide();
                                    $('.btn_quickbooks_oauth_conn').show('fast');
                                }
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                
                            }
                        });
                        e.preventDefault();
                        return false;
                    });

                    $('#btn_quickbooks_up').on('click', function (e) {
                        let btn = helpers.btn_disable(this);
                        $.ajax({
                            url: base_url + 'integrations/quickbooks/push_data', type: "GET",
                            dataType: "json",
                            success: function (result) {
                                if (result.status)
                                    success_message(
                                            '<p>' + result.push_summary.push_cust_count +  ' Customers created</p>' +
                                            '<p>' + result.push_summary.push_inv_count  + ' Invoices created</p>' +
                                            '<p>' + result.push_summary.push_item_count + ' Item created</p>' +
                                            '<p>' + result.push_summary.push_payment_count + ' Payments created</p>');
                                            
                                else 
                                {
                                  info_message(result.message);  
                                }   
                                helpers.btn_enable(btn);                                
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                helpers.btn_enable(btn);
                                alert(jqXHR.responseText);
                                //location.reload();
                            }
                        });
                        e.preventDefault();
                        return false;
                    });
                },
                
                slack: function ()
                {
                    loader('show');
                    $.ajax({
                        url: base_url + 'integrations/slack/validatetoken', type: "GET",
                        dataType: "json",
                        cache: false,
                        success: function (data) {
                            loader('hide');
                            $('#btn_slack_conn').attr('href', data.oauth_url);
                            if (data.stateslack == 'D') {
                                $('#slack_enable_system').prop('checked', false);
                                $('#slack_text_oauth').val(data.conn_status);
                                $('#slack_channel').val(data.slack_channel);
                                $('.btn_slack_save').show();

                            } else {
                                $('#slack_enable_system').prop('checked', true);
                                $('#slack_text_oauth').val(data.conn_status);
                                $('#slack_channel').val(data.slack_channel);
                                $('.btn_slack_save').show();
                            }
                        }
                    });

                },
                
                setButtonsEventslack: function ()
                {                    
                    $('#slack_enable_system').on('click', function (e) {
                        var statte = ($('#slack_enable_system').prop("checked"));
                        var data = $("#general_token_form").serializeArray();
                        var slack_data = {};
                        $.each(data, function () {
                            slack_data[this.name] = this.value;
                        });
                        slack_data['slider_state'] = statte;
                        $.ajax({
                            url: base_url + 'integrations/slack/stateslider', type: "POST",
                            dataType: "json",
                            data: slack_data,
                            success: function (result) {
                                notify({title: 'Notification', 'message': result.message});
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                alert(jqXHR.responseText);
                            }
                        });
                    });                          
                     $('#btn_slack_testconection').on('click', function (e) {
                        var slack_text_oauth = $('#slack_text_oauth').val();
                        var slack_channel = $('#slack_channel').val();
                        var data = $("#general_token_form").serializeArray();
                        var slack_data = {};
                        $.each(data, function () {
                            slack_data[this.name] = this.value;
                        });
                        slack_data['slack_text_oauth'] = slack_text_oauth;
                        slack_data['slack_channel'] = slack_channel;
                        slack_data['testmessage'] = 1;
                        $.ajax({
                            url: base_url + 'integrations/slack/savedataslack', type: "POST",
                            dataType: "json",
                            data: slack_data,
                            success: function (result) {
                                notify({title: 'Notification', 'message': result.message});
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                alert(jqXHR.responseText);
                            }
                        });
                        e.preventDefault();
                        return false;

                    });
                                       
                    $('#btn_slack_save').on('click', function (e) {
                        var slack_text_oauth = $('#slack_text_oauth').val();
                        var slack_channel = $('#slack_channel').val();
                        var data = $("#general_token_form").serializeArray();
                        var slack_data = {};
                        $.each(data, function () {
                            slack_data[this.name] = this.value;
                        });
                        slack_data['slack_text_oauth'] = slack_text_oauth;
                        slack_data['slack_channel'] = slack_channel;
                        slack_data['testmessage'] = 0;
                        $.ajax({
                            url: base_url + 'integrations/slack/savedataslack', type: "POST",
                            dataType: "json",
                            data: slack_data,
                            success: function (result) {
                                notify({title: 'Notification', 'message': result.message});
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                alert(jqXHR.responseText);
                            }
                        });
                        e.preventDefault();
                        return false;
                    });
                },

    };
}());



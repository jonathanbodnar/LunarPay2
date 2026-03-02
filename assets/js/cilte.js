(function () {

}());
var params = {
    notify_on_modal_hide_time: 500,
    time_out_token_refresh: 3000
};
//https://codeseven.github.io/toastr/demo.html
toastr_defaults = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "3000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut",
    "tapToDismiss": true
};
dt_language = {
    "sEmptyTable": "No data available in table",
    "sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
    "sInfoEmpty": "Showing 0 to 0 of 0 entries",
    "sInfoFiltered": "(filtered from _MAX_ total entries)",
    "sInfoPostFix": "",
    "sInfoThousands": ",",
    "sLengthMenu": "Show _MENU_",
    "sLoadingRecords": "Loading...",
    "sProcessing": "Loading...",
    "sSearch": "",
    "searchPlaceholder": "Search",
    "sZeroRecords": "No matching records found",
    "oPaginate": {
        "sFirst": "First",
        "sLast": "Last",
        "sNext": ">",
        "sPrevious": "<"
    },
    "oAria": {
        "sSortAscending": ": activate to sort column ascending",
        "sSortDescending": ": activate to sort column descending"
    }
};
var helpers = {
    table_filter_on_enter: function (datatable) {
        var table_id = datatable.attr("id");
        var filter = $("#" + table_id + "_filter input");
        filter.unbind();
        filter.bind('keyup', function (e) {
            if (e.keyCode == 13) {
                datatable.fnFilter(this.value);
            }
        });
    },
    btn_disable: function (btn) {
        $(btn).prop('disabled', true);
        loader('show');
        return btn;
    },
    btn_enable: function (btn) {
        $(btn).prop('disabled', false);
        loader('hide');
        return btn;
    },
    searchInObjectsArrayPriIndex: function (arr, search, pri) {
        var result = null;
        if (pri == "index") {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].index === search) {
                    result = arr[i];
                    break;
                }
            }
        }
        return result;
    },
    slugify: function (text) {
        return text
            .toString()               // Cast to string
            .toLowerCase()            // Convert the string to lowercase letters
            .normalize('NFD')    // The normalize() method returns the Unicode Normalization Form of a given string.
            .trim()                   // Remove whitespace from both sides of a string
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-');        // Replace multiple - with single -
    },
    getTextColor : function (hexcolor){

        // If a leading # is provided, remove it
        if (hexcolor.slice(0, 1) === '#') {
            hexcolor = hexcolor.slice(1);
        }

        // Convert to RGB value
        var r = parseInt(hexcolor.substr(0,2),16);
        var g = parseInt(hexcolor.substr(2,2),16);
        var b = parseInt(hexcolor.substr(4,2),16);

        // Get YIQ ratio
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Check contrast
        return (yiq >= 128) ? 'black' : 'white';

    },
    getUrlSearchParams : function () {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const params = new URLSearchParams(url.search);
        
        return params;
    },
    removeUrlParam: function (key) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete(key);
        const newUrl = `${window.location.pathname}?${urlParams}`;
        window.history.pushState(null, '', newUrl); // Update the URL without reloading
    },
    addUrlParam: function (key, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(key, value);
        const newUrl = `${window.location.pathname}?${urlParams}`;
        window.history.pushState(null, '', newUrl); // Update the URL without reloading
    }
};
function success_message(message) {
    Swal.fire(
            'Success',
            message,
            'success'
            )
}
function success_message_callback(message, callback) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        //footer: '<a href>Why do I have this issue?</a>',
    }).then((result) => {
        callback();
    });
}
function error_message(message) {
    Swal.fire(
            'Error',
            message,
            'error'
            )
}

function error_message_callback(message, callback, param1) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        //footer: '<a href>Why do I have this issue?</a>',
    }).then((result) => {
        callback(param1);
    });
}

function info_message(message) {
    Swal.fire('Information', message, 'info')
}

function info_message_custom_html(html) {
    Swal.fire({
        title: 'Information',
        html: html,
        icon: 'info'
    })
}

function delete_question(object) {
    return Swal.fire({
        title: 'Delete ' + object,
        text: 'Confirm action',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
}

function question_modal(title, text) {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    })
}

function loader(option) {
    if (option === "show") {        
        $("#cover_spin").fadeIn('fast'); 
    } else if (option === "hide") {
        $("#cover_spin").fadeOut('fast');
    }
}

function notify(options) {
    if(!options.icon) options.icon = 'ni ni-check-bold';
    if(!options.align) options.align = 'right';

    $.notify({
        icon: options.icon,
        title: options.title,
        message: options.message,
        url: ''
    }, {
        element: 'body',
        type: 'primary',
        allow_dismiss: true,
        placement: {
            from: 'top',
            align: options.align
        },
        offset: {
            x: 15, // Keep this as default
            y: 15 // Unless there'll be alignment issues as this value is targeted in CSS
        },
        spacing: 10,
        z_index: 1080,
        delay: 2000, //notify_delay
        timer: 2000, //notify_timer
        url_target: '_blank',
        mouse_over: true,
        animate: {enter: 1000, exit: 1000},
        template: '<div data-notify="container" class="alert alert-dismissible alert-{0} alert-notify" role="alert" style="width: 350px;">' +
            '<span class="alert-icon" data-notify="icon"></span> ' +
            '<div class="alert-text"</div> ' +
            '<span class="alert-title" data-notify="title">{1}</span> ' +
            '<span data-notify="message">{2}</span>' +
            '</div>' +
            //'<div class="progress" data-notify="progressbar">' +
            //'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            //'</div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
//            '<button type="button" class="close" data-notify="dismiss" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '</div>'
    });

}

function setup_multiple_modal(modal) {
    const zIndex = 1050 + 10 * $('.modal:visible').length;
    $(modal).css('z-index', zIndex);
    setTimeout(() => $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack'));
}

var general = {
    csrfToken: {
        setValues: function () {
            let input = $('#general_token_form').find('input').first();
            general.csrfToken.name = $(input).attr('name');
            general.csrfToken.value = $(input).val();
        },
        name: null,
        value: null
    },
    mobileApp: {
        init: function () {
            $('#free_app_nav_link').on('click', function (e) {
                //====3
                let suggested_name_bk = '';
                let create_app = function (app_name) {
                    loader('show');

                    let data = {};
                    data['app_name'] = app_name;
                    data[general.csrfToken.name] = general.csrfToken.value;

                    $.ajax({url: base_url + 'gbarber/create_app', cache: false, method: 'POST', data: data, success: function (data) {
                            loader('hide');
                            if (data.status) {
                                success_message(data.message);
                            } else {
                                error_message_callback(data.message, open_app_modal, suggested_name_bk);
                            }
                            typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        }
                    });
                };
                let open_app_modal = async function (suggested_name) {
                    suggested_name_bk = suggested_name;
                    await Swal.fire({
                        title: 'App address name',
                        text: 'From 4 to 15 letters or numbers, no accents, no spaces',
                        icon: 'info',
                        input: 'text',
                        inputValue: suggested_name, showCancelButton: true, inputValidator: (value) => {
                            if (value) {
                                create_app(value);
                                return;
                            }
                            return 'Provide an app name please';
                        }
                    });
                };
                let validate_app = function () {
                    loader('show');
                    $.ajax({url: base_url + 'gbarber/validate_app', cache: false, method: 'GET', success: function (result) {
                            loader('hide');
                            if (result.status) {
                                if (result.app_already_created) {
                                    window.open(result.app_url, '_blank');
                                    return;
                                }
                                open_app_modal(result.data.suggested_name);
                            } else {
                                info_message(result.message);
                            }
                        }
                    });
                };
                validate_app();
                e.preventDefault();
                return false;
            });
        }
    }
};
general.csrfToken.setValues();
general.mobileApp.init();
if(base_url === 'https://devapp.chatgive.com/'){
    $('.messaging_menu').show();
}


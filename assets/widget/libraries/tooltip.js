var tt = function () {
    var instance;
    var _self = this;

    this.idSelector = 'hired_tooltip';
    this.text = 'Default text';
    this.top = 0;
    this.left = 0;
    //this.direction = 'bottom';
    this.direction = typeof this.direction !== 'undefined' ? this.direction : 'bottom';
    this.target;

    //Create actual element and tie element to object for reference
    this.node = document.createElement("div");
    this.node.setAttribute("id", this.idSelector);
    this.node.className = this.node.className + "tooltip__hidden";
    this.node.innerHTML = this.text;
    document.body.appendChild(this.node);

    this.show = function () { //Rerender tooltip
        var location_order = ['top', 'right', 'bottom', 'left', 'top'];

        _self.node.innerHTML = _self.text;
        var direction = _self.direction;
        if (direction) {
            $(this.node).addClass('tooltip__expanded ' + 'tooltip__expanded-' + direction);
        } else {
            $(this.node).addClass('tooltip__expanded');
        }
        $(this.node).removeClass('tooltip__hidden');


        if ($(hiredTooltip.node).is(':offscreen')) {
            //$('#console').text('offscreen')

            hiredTooltip.hide();
            hiredTooltip.direction = location_order[location_order.indexOf(hiredTooltip.direction) + 1]
            moveTip(hiredTooltip.node, hiredTooltip.target);
        }
        ;

    }

    this.hide = function () { //Hide tooltip
        $(_self.node).css('top', '0');
        $(_self.node).css('left', '0');
        $(_self.node).attr('class', '');
        $(_self.node).addClass('tooltip__hidden');
    }

};


//Create global simple_tooltip
$( document ).ready(function() {
    hiredTooltip = new tt();

    //Mouseover to show
    $("body").on('mouseover','.hired-tooltip',function (ee) {
        var _self = this;
        hiredTooltip.target = _self; //Default to self

        var name_classes = _self.className.split(' ');
        name_classes.forEach(function(cc){
            if (cc.indexOf('hired-tooltip-') != -1){ //Find a directional tag
                hiredTooltip.direction = cc.split('-')[cc.split('-').length-1];
            }
        });

        if ($(this).attr('data-tooltip-text') && $(this).attr('data-tooltip-text') !== '') {

            hiredTooltip.text = $(this).attr('data-tooltip-text');
            hiredTooltip.node.innerHTML = $(this).attr('data-tooltip-text');
            if ($(_self).attr('data-tooltip-target')) hiredTooltip.target = $(_self).attr('data-tooltip-target')
            moveTip(hiredTooltip.node, hiredTooltip.target);
        }
    });

    $("body").on('mouseout','.hired-tooltip',function (ee) { //Re-hide tooltip
        hiredTooltip.hide();
    });

//Move tip to proper location before display
    function moveTip(ell, target, callback) {

        var $target = $(hiredTooltip.target);
        var $ell = $(ell);

        var buu = 15; //Default padding size in px
        //var center_height = -($ell.outerHeight()/2) + $target.outerHeight()/2;
        var center_height = -($ell.innerHeight() / 2) / 2;
        var center_width = -($ell.innerWidth() / 2) + $target.innerWidth() / 2;

        var locations = {
            'top': [-$ell.innerHeight() - buu, center_width],
            'right': [center_height, $target.innerWidth() + buu],
            'bottom': [$target.innerHeight() + buu, center_width],
            'left': [center_height, -$ell.innerWidth() - buu]
        }
        location_order = ['top', 'right', 'bottom', 'left', 'top'];
        var location_keys = Object.keys(locations);

        $(ell).css('top', $(target).offset().top + locations[hiredTooltip.direction][0]);
        $(ell).css('left', $(target).offset().left + locations[hiredTooltip.direction][1]);

        if ($ell.is(':offscreen')) {
            hiredTooltip.direction = location_order[location_order.indexOf(hiredTooltip.direction) + 1];
            hiredTooltip.show();
        } else {
            hiredTooltip.show();
        }
    }


    jQuery.expr.filters.offscreen = function (el) {
        return (
            (el.offsetLeft + el.offsetWidth) < 0
            || (el.offsetTop + el.offsetHeight) < 0
            || (el.offsetLeft + el.offsetWidth > window.innerWidth || el.offsetTop + el.offsetHeight > window.innerHeight)
        );
    };
});




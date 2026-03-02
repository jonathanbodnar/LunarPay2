<style>
    #org-selector .list-group-item {
        border: 1px solid white       
    }
    #org-selector .x-org {
        border-top: 1px solid #e9ecef!important;
        padding:10px;
    }

    #org-selector .border-top-hide {
        border-bottom: 1px solid white;    
    }

    #org-selector .x-suborg {
        padding-left: 45px!important;
    }

    #org-selector .dropdown-menu {
        border-radius: 5px;
    }
    #org-selector .space-after-last-suborg {
        height:7px; /*just for better looking*/
    }
</style>

<!-- templates -->
<div id="orgSelectorTemplates" style="display: none">
    <a href="" data-org_tpl="1" class="x-org list-group-item list-group-item-action btn-change-org">
        <div class="row align-items-center">
            <div class="col-auto">
                <!-- Avatar -->
            </div>
            <div class="col ml--2 pl-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="mb-0 text-sm org_name"></h4>
                    </div>                                                    
                </div>                                                
            </div>
        </div>
    </a>
    <a href="" data-sorg_tpl="1" class="x-suborg list-group-item list-group-item-action p-1 pt-0 btn-change-org">
        <div class="row align-items-center">
            <div class="col-auto">
                <!-- Avatar -->
            </div>
            <div class="col ml--2 pl-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0 sorg_name"></h5>
                    </div>                                                    
                </div>                                                
            </div>
        </div>
        <div class="end-x-suborg-items"></div>
    </a>
</div>

<style>
    /* The selector is loaded twice, however we hide one depending of the screen */
    @media (max-width: 1200px) {
        #org-selector.screen-desktop {
            display: none !important;
        }
        #org-selector.screen-mobile {
            display: block !important;            
        }

        #org-selector.screen-mobile a.nav-link{
            padding-left: 0px!important;
        }
    }

    @media (min-width: 1201px) {
        #org-selector.screen-desktop {
            display: block !important;
        }
        #org-selector.screen-mobile {
            display: none !important;
        }
    }
</style>

<!-- org selector wrapper -->
<li class="nav-item dropdown float-right <?= isset($screen) && $screen ? "screen-$screen" : '' ?>" id="org-selector">
    <a class="nav-link" id="org-selector-title" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i class="fas fa-circle-notch fa-spin fa-2x org-selector-spinner"></i>
        <span class="org-title-wrapper" style="display: none"><strong class="org-title"></strong> 
        <!-- <i class="fa fa-chevron-down"></i> -->
    </span>
    </a>
    <div class="dropdown-menu dropdown-menu-lg  dropdown-menu-left  py-0 overflow-hidden mt-2 ml-2">                                
        <!-- List group -->
        <div class="list-group list-group-flush">
            <div id="org-selector-list-group">

            </div>
            <div>
                <a href="<?= BASE_URL ?>organizations" class="x-org list-group-item list-group-item-action p-2 py-3">
                    <div class="row align-items-center">
                        <div class="col-auto">

                        </div>
                        <div class="col ml--2 pl-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="mb-0 font-italic font-weight-normal">View All Companies</h5>
                                </div>                                                    
                            </div>                                                
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
</li>
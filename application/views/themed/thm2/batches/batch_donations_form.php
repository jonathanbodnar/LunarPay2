<style>
    #batch-donations-form-container input.select2-search__field[aria-controls^="select2-person"] {
        margin: 0 !important;
    }

    #batch-donations-form-container .select2-results__options[id^="select2-person"] {
        max-height: 190px !important;
    }
    
    /*we are adding the add donation button to all donations rows, hidding all buttons but the last one*/
    #batch-donations-form-container .btn-add-donation {
        display: none;
    }
    #batch-donations-form-container .donation-row:last-child .btn-add-donation {
        display: block!important;
    }
    /* -------------------------------------- */
   
    #batch-donations-form-container .donation-row:only-child .remove-donation-row-btn { /*if there is only one row, hide the remove button*/
        display: none!important;
    }
    
    #batch-donations-form-container .btn-add-donation:focus {
        border: solid!important
    }
    
    #batch-donations-form-container .donation-row .form-group {
        margin-bottom: 0px!important; /*Remove the default maring-bottom to form-group on donations form*/
    }
    
</style>
<div id="batch-donations-form-container" style="display: none" class="pt-2 px-4 pb-5">
    <h6 class="heading-small mb-0 text-muted mb-1">Add Donations In Bulk</h6>
    <!--<hr class="mt-1 mb-2">-->
    <?php echo form_open("batches/save_donations", ['role' => 'form', 'id' => 'batch-donations-form', 'autocomplete' => 'off']); ?>
    <div id="batch-donations-form-items"></div>
    <?php echo form_close(); ?>
    <div class="row mt-4">
        <div class="col"></div>
        <div class="col-md-6 text-center">
            <button id="btn-save-donations" class="w-100 btn btn-primary">Save Donations Batch</button>
        </div>
        <div class="col"></div>
    </div>
</div>
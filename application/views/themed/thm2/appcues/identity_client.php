<?php if (defined('APPCUES_ENABLED') && APPCUES_ENABLED): ?>
    <script>
        window.Appcues.identify(
                "<?= $this->session->userdata('user_id'); ?>", // unique, required
                {
                    createdAt: <?= $this->session->userdata('created_on'); ?>,
                    accountId: "<?= $this->session->userdata('user_id'); ?>",
                    email: "<?= $this->session->userdata('email'); ?>",
                    role: "client"
                }
        );
    </script>
    <?php
 endif;

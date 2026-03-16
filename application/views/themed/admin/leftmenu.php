<!-- Sidenav -->
<nav class="sidenav navbar navbar-vertical  fixed-left  navbar-expand-xs navbar-light bg-white" id="sidenav-main" style="z-index: 1040">
    <div class="scrollbar-inner">
        <!-- Brand -->
        <div class="sidenav-header  d-flex  align-items-center">
            <a class="navbar-brand" href="<?= base_url() ?>">
                <img src="<?= BASE_ASSETS ?>images/brand/mainlogoAdmin.png?v=1.1.png" class="navbar-brand-img" alt="...">
            </a>
            <div class=" ml-auto ">
                <!-- Sidenav toggler -->
                <div class="sidenav-toggler d-none d-xl-block" data-action="sidenav-unpin" data-target="#sidenav-main">
                    <div class="sidenav-toggler-inner">
                        <i class="sidenav-toggler-line"></i>
                        <i class="sidenav-toggler-line"></i>
                        <i class="sidenav-toggler-line"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="navbar-inner">
            <!-- Collapse -->
            <div class="collapse navbar-collapse" id="sidenav-collapse-main">
                <!-- Nav items -->
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a href="<?= BASE_URL_ADMIN ?>accounts" class="nav-link <?= $view_index == 'accounts/index' ? 'active' : '' ?>">
                            <i class="fas fa-user-friends"></i>
                            <span class="nav-link-text">Merchants</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?= BASE_URL_ADMIN ?>acl" class="nav-link <?= $view_index == 'acl/index' ? 'active' : '' ?>">
                            <i class="fas fa-user-ninja"></i>
                            <span class="nav-link-text">Administrators</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?= BASE_URL_ADMIN ?>referrals" class="nav-link <?= $view_index == 'referrals/index' || $view_index == 'referrals/view' ? 'active' : '' ?>">
                            <i class="fas fa-bullhorn"></i>
                            <span class="nav-link-text">Affiliates</span>
                        </a>
                    </li>                    
                </ul>
            </div>
        </div>
    </div>
</nav>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setting up your session...</title>
    <style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e5e5e5 100%);
        color: #000000;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .container {
        text-align: center;
        max-width: 500px;
        padding: 2rem;
        position: relative;
    }

    .loading-card {
        background: rgba(0, 0, 0, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 20px;
        padding: 3rem 2rem;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.05);
        position: relative;
        overflow: hidden;
    }

    .logo {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #333333 0%, #666666 100%);
        border-radius: 50%;
        margin: 0 auto 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        color: #ffffff;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-top: 3px solid #333333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1.5rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #000000;
    }

    .subtitle {
        color: #555555;
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 2rem;
    }

    .status {
        background: rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 1rem;
        margin-top: 1.5rem;
    }

    .status-text {
        color: #333333;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 1rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #333333, #666666);
        border-radius: 2px;
        animation: progress 3s ease-in-out;
    }

    @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
    }

    .redirect-info {
        margin-top: 1.5rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.03);
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .redirect-url {
        color: #333333;
        font-size: 0.85rem;
        word-break: break-all;
        font-family: 'Courier New', monospace;
    }

    .manual-link {
        display: inline-block;
        margin-top: 1rem;
        color: #000000;
        text-decoration: none;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .manual-link:hover {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.4);
    }

</style>

</head>
<body>
    
    <div class="container">
        <div class="loading-card">
            <!-- <div class="logo">
                
            </div> -->
            <img src="https://app.lunarpay.com/assets/thm2/images/brand/logo.png?ver=1.0&invert=0.7&format=png" width="80" alt="Lunarpay" style="filter: invert(0.2); margin-bottom: 1rem" />
            <!-- <div class="spinner"></div> -->
            <h1>Setting up payment session</h1>
            <p class="subtitle">Please wait while we configure your payment session.</p>
            
            <div class="status">
                <div class="status-text" id="statusText">Initializing session...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <div class="redirect-info">
                <div style="font-size: 0.8rem; color: #888; margin-bottom: 0.5rem;">Redirecting to:</div>
                <div class="redirect-url" id="redirectUrl"><?= $viewData['redirect_url'] ?></div>
                <a href="<?= $viewData['redirect_url'] ?>" target="_blank" class="manual-link" id="manualLink" style="display: none;">
                    Click here if not redirected automatically
                </a>
            </div>
        </div>
    </div>

    <script>
        var auth_access_tk_var = '<?= WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME ?>';
        var auth_refresh_tk_var = '<?= WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME ?>';
        
        // Status messages for better UX
        const statusMessages = [
            'Initializing session...',
            'Redirecting...'
        ];

        let currentStep = 0;
        const statusText = document.getElementById('statusText');
        const manualLink = document.getElementById('manualLink');

        // Function to update status
        function updateStatus(message) {
            statusText.textContent = message;
        }

        // Function to set localStorage and redirect
        function setupSession() {
            try {
                // Step 1: Set localStorage items
                updateStatus(statusMessages[0]);
                
                setTimeout(() => {
                    localStorage.setItem(auth_access_tk_var, '<?= $viewData['access_token'] ?>');
                    localStorage.setItem(auth_refresh_tk_var, '<?= $viewData['refresh_token'] ?>');
                    
                    // Step 2: Redirect
                    updateStatus(statusMessages[1]);
                    
                    setTimeout(() => {
                        window.location.href = '<?= $viewData['redirect_url'] ?>';
                    }, 1400);
                    
                }, 1200);
                
            } catch (error) {
                console.error('Error setting up session:', error);
                updateStatus('Error setting up session. Please try again.');
                manualLink.style.display = 'inline-block';
            }
        }

        // Start the session setup when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Small delay to show the loading animation
            setTimeout(() => {
                setupSession();
            }, 500);
        });

        // Fallback: if redirect doesn't happen within 10 seconds, show manual link
        setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
                manualLink.style.display = 'inline-block';
                updateStatus('Redirect taking longer than expected. You can click the link below.');
            }
        }, 10000);
    </script>
</body>
</html>


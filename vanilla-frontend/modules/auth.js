// Simple authentication module
window.auth = {
    // Initialize auth state
    init: function() {
        this.user = null;
        // Wait for DOM to be fully loaded before checking auth
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkAuth();
            });
        } else {
            this.checkAuth();
        }
    },

    // Check if user is authenticated
    checkAuth: async function() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showLogin();
                return;
            }
            
            const response = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.user = user;
                this.showPanel();
            } else {
                // Token invalid or expired
                localStorage.removeItem('token');
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLogin();
        }
    },

    // Login function
    login: async function(username, password) {
        try {
            console.log('Login attempt for:', username);
            console.log('API URL:', `${window.API_BASE_URL}/api/auth/login`);
            
            const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Login response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Login successful, user data:', data.user);
                this.user = data.user;
                localStorage.setItem('token', data.token);
                this.showPanel();
                return { success: true };
            } else {
                console.error('Login failed with status:', response.status);
                let errorMessage = 'Login failed';
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Login network error:', error);
            return { success: false, error: 'Network error - please check your connection' };
        }
    },

    // Show login page
    showLogin: function() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this._renderLoginForm();
            });
        } else {
            this._renderLoginForm();
        }
    },
    
    // Helper to render login form
    _renderLoginForm: function() {
        const app = document.getElementById('app');
        if (!app) return;
        
        // Hide sidebar and toggle button during login
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle-btn');
        const mainContent = document.getElementById('main-content');
        
        if (sidebar) sidebar.style.display = 'none';
        if (sidebarToggle) sidebarToggle.style.display = 'none';
        if (mainContent) mainContent.style.width = '100%';
        
        // Clear existing content and center the login form
        app.style.display = 'flex';
        app.style.justifyContent = 'center';
        app.style.alignItems = 'center';
        app.style.minHeight = '100vh';
        app.innerHTML = '';
        
        // Check if template exists
        const template = document.getElementById('login-template');
        if (!template) {
            console.error('Login template not found');
            app.innerHTML = '<div style="padding: 20px;"><h2>Error: Login template not found</h2></div>';
            return;
        }
        
        // Render login form
        app.innerHTML = template.innerHTML;
        
        // Add login form handler
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Login form submitted');
                
                const username = form.querySelector('input[name="username"]').value;
                const password = form.querySelector('input[name="password"]').value;
                
                console.log('Attempting login with:', username);
                
                const result = await this.login(username, password);
                console.log('Login result:', result);
                
                if (result.success) {
                    // Hide login form
                    const loginContainer = document.getElementById('login-container');
                    if (loginContainer) {
                        loginContainer.style.display = 'none';
                    }
                    
                    // Show main app
                    const app = document.getElementById('app');
                    if (app) {
                        app.style.display = 'flex';
                    }
                    
                    // Manually call showPanel to ensure UI updates
                    this.showPanel();
                    
                    // Reload page to ensure all scripts initialize properly
                    window.location.reload();
                } else {
                    const errorDiv = document.getElementById('login-error');
                    if (errorDiv) {
                        errorDiv.textContent = result.error;
                        errorDiv.style.display = 'block';
                    }
                }
            });
        } else {
            console.error('Login form not found in template');
        }
    },

    // Show main panel
    showPanel: function() {
        console.log('Showing main panel');
        // Reset app display
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'flex';
            app.style.justifyContent = 'normal';
            app.style.alignItems = 'normal';
            app.style.minHeight = 'auto';
            
            // Show sidebar and main content
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle-btn');
            const mainContent = document.getElementById('main-content');
            
            if (sidebar && mainContent) {
                // Make sure they're visible
                sidebar.style.display = 'flex';
                sidebarToggle.style.display = 'block';
                mainContent.style.display = 'block';
                mainContent.style.width = 'auto';
                
                // Update user info in sidebar if available
                const statusDiv = document.getElementById('sidebar-status');
                if (statusDiv && this.user) {
                    statusDiv.innerHTML = `
                        <div style="text-align: center; padding: 12px; border-top: 1px solid rgba(255,255,255,0.2); margin-top: auto;">
                            <div style="margin-bottom: 8px; font-size: 0.9em;">Logged in as:</div>
                            <div style="font-weight: bold; margin-bottom: 12px;">${this.user.name || this.user.username}</div>
                            <button onclick="window.auth.logout()" style="
                                background: #be292c;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 0.85em;
                                width: 100%;
                                margin-top: 8px;
                            " onmouseover="this.style.background='#a01e21'" onmouseout="this.style.background='#be292c'">
                                Logout
                            </button>
                        </div>
                    `;
                }
                
                // Show/hide Users menu item based on role (admin, systemsadmin, and superadmin)
                const usersMenuItem = document.getElementById('users-menu-item');
                if (usersMenuItem) {
                    const canManage = this.user && (
                        this.user.role === 'superadmin' || 
                        this.user.role === 'systemsadmin' || 
                        this.user.role === 'admin'
                    );
                    usersMenuItem.style.display = canManage ? 'block' : 'none';
                }
                
                // Trigger overview section display
                const overviewBtn = document.querySelector('button[data-section="overview"]');
                if (overviewBtn) {
                    overviewBtn.click();
                }
            } else {
                console.error('Sidebar or main content not found');
            }
        } else {
            console.error('App element not found');
        }
    },

    // Get current user info for PDF
    getUserInfo: function() {
        return {
            name: this.user?.name || this.user?.username || 'Unknown User',
            creation_date: new Date().toLocaleDateString()
        };
    },
    
    // Logout function
    logout: function() {
        localStorage.removeItem('token');
        this.user = null;
        this.showLogin();
    }
};
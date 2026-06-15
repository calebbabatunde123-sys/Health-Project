// Auth Script for Helixcare Login/Signup
class AuthSystem {
    constructor() {
        this.currentForm = 'login';
        this.isSubmitting = false;
        this.users = this.loadUsersFromStorage();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
        this.checkAuthState();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Form toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formType = e.target.dataset.form;
                this.switchForm(formType);
            });
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSocialLogin(btn);
            });
        });

        // Modal buttons
        document.getElementById('modalPrimaryBtn').addEventListener('click', () => {
            this.hideModal();
            this.redirectToDashboard();
        });

        document.getElementById('modalSecondaryBtn').addEventListener('click', () => {
            this.hideModal();
        });

        // Forgot password link
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Close modal on backdrop click
        document.getElementById('successModal').addEventListener('click', (e) => {
            if (e.target.id === 'successModal') {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                this.clearToasts();
            }
        });
    }

    // Form Switching
    switchForm(formType) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const toggleBtns = document.querySelectorAll('.toggle-btn');

        // Update toggle buttons
        toggleBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.form === formType) {
                btn.classList.add('active');
            }
        });

        // Switch forms with animation
        if (formType === 'login') {
            signupForm.classList.remove('active');
            setTimeout(() => {
                loginForm.classList.add('active');
            }, 150);
        } else {
            loginForm.classList.remove('active');
            setTimeout(() => {
                signupForm.classList.add('active');
            }, 150);
        }

        this.currentForm = formType;
        this.clearFormErrors();
    }

    // Password Toggle Setup
    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.dataset.target;
                const input = document.getElementById(targetId);
                const icon = toggle.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    // Password Strength Setup
    setupPasswordStrength() {
        const passwordInput = document.getElementById('signupPassword');
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthFill = strengthIndicator.querySelector('.strength-fill');
        const strengthText = strengthIndicator.querySelector('.strength-text');

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = this.calculatePasswordStrength(password);
            
            strengthFill.className = 'strength-fill';
            
            if (password.length === 0) {
                strengthFill.classList.remove('weak', 'medium', 'strong');
                strengthText.textContent = 'Password strength';
                return;
            }

            switch (strength.level) {
                case 'weak':
                    strengthFill.classList.add('weak');
                    strengthText.textContent = 'Weak password';
                    break;
                case 'medium':
                    strengthFill.classList.add('medium');
                    strengthText.textContent = 'Medium strength';
                    break;
                case 'strong':
                    strengthFill.classList.add('strong');
                    strengthText.textContent = 'Strong password';
                    break;
            }
        });
    }

    // Form Validation Setup
    setupFormValidation() {
        // Real-time validation for email fields
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmail(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateEmail(input);
                }
            });
        });

        // Real-time validation for required fields
        document.querySelectorAll('input[required], select[required]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateRequired(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateRequired(input);
                }
            });
        });

        // Confirm password validation
        const confirmPassword = document.getElementById('confirmPassword');
        const signupPassword = document.getElementById('signupPassword');
        
        if (confirmPassword && signupPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(signupPassword, confirmPassword);
            });
            
            signupPassword.addEventListener('input', () => {
                if (confirmPassword.value) {
                    this.validatePasswordMatch(signupPassword, confirmPassword);
                }
            });
        }
    }

    // Validation Methods
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError(input, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError(input, 'Please enter a valid email address');
            return false;
        }
        
        this.hideFieldError(input);
        return true;
    }

    validateRequired(input) {
        const value = input.value.trim();
        
        if (!value) {
            const fieldName = input.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            this.showFieldError(input, `${fieldName} is required`);
            return false;
        }
        
        this.hideFieldError(input);
        return true;
    }

    validatePasswordMatch(password, confirmPassword) {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            return false;
        }
        
        this.hideFieldError(confirmPassword);
        return true;
    }

    validatePasswordStrength(password) {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        
        const strength = this.calculatePasswordStrength(password);
        if (strength.level === 'weak') {
            return { isValid: false, message: 'Please choose a stronger password' };
        }
        
        return { isValid: true };
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let level = 'weak';
        
        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Character variety checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        if (score <= 2) level = 'weak';
        else if (score <= 4) level = 'medium';
        else level = 'strong';
        
        return { score, level };
    }

    // Error Display Methods
    showFieldError(input, message) {
        input.classList.add('error');
        const errorElement = document.getElementById(input.id + 'Error');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    hideFieldError(input) {
        input.classList.remove('error');
        const errorElement = document.getElementById(input.id + 'Error');
        
        if (errorElement) {
            errorElement.classList.remove('show');
            setTimeout(() => {
                if (!errorElement.classList.contains('show')) {
                    errorElement.textContent = '';
                }
            }, 300);
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.form-input, .form-select').forEach(input => {
            input.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
            setTimeout(() => {
                error.textContent = '';
            }, 300);
        });
    }

    // Form Submission Handlers
    async handleLogin() {
        if (this.isSubmitting) return;
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validate form
        let isValid = true;
        
        if (!this.validateEmail(document.getElementById('loginEmail'))) {
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError(document.getElementById('loginPassword'), 'Password is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading state
        this.setSubmitButtonLoading('loginSubmitBtn', true);
        this.isSubmitting = true;
        
        try {
            // Simulate API call
            await this.delay(1500);
            
            // Check if user exists (in real app, this would be server-side)
            const user = this.users.find(u => u.email === email);
            
            if (!user || user.password !== password) {
                throw new Error('Invalid email or password');
            }
            
            // Successful login
            this.saveUserSession(user, rememberMe);
            this.showToast('success', 'Login Successful', 'Welcome back to Helixcare!');
            
            setTimeout(() => {
                this.showSuccessModal(
                    'Welcome Back!',
                    `Hi ${user.firstName}, ready to continue health journey?`,
                    'Start Your Journey Today',
                    'Go to Dashboard'
                );
            }, 1000);
            
        } catch (error) {
            this.showToast('error', 'Login Failed', error.message);
        } finally {
            this.setSubmitButtonLoading('loginSubmitBtn', false);
            this.isSubmitting = false;
        }
    }

    async handleSignup() {
        if (this.isSubmitting) return;
        
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('signupEmail').value.trim(),
            role: document.getElementById('userRole').value,
            password: document.getElementById('signupPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            agreeTerms: document.getElementById('agreeTerms').checked,
            emailUpdates: document.getElementById('emailUpdates').checked
        };
        
        // Validate form
        let isValid = true;
        
        // Required field validations
        ['firstName', 'lastName', 'signupEmail', 'userRole', 'signupPassword', 'confirmPassword'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!this.validateRequired(field)) {
                isValid = false;
            }
        });
        
        // Email validation
        if (!this.validateEmail(document.getElementById('signupEmail'))) {
            isValid = false;
        }
        
        // Password strength validation
        const passwordValidation = this.validatePasswordStrength(formData.password);
        if (!passwordValidation.isValid) {
            this.showFieldError(document.getElementById('signupPassword'), passwordValidation.message);
            isValid = false;
        }
        
        // Password match validation
        if (!this.validatePasswordMatch(
            document.getElementById('signupPassword'),
            document.getElementById('confirmPassword')
        )) {
            isValid = false;
        }
        
        // Terms agreement validation
        if (!formData.agreeTerms) {
            this.showFieldError(document.getElementById('agreeTerms'), 'You must agree to the terms and conditions');
            isValid = false;
        }
        
        // Check if email already exists
        if (this.users.find(u => u.email === formData.email)) {
            this.showFieldError(document.getElementById('signupEmail'), 'An account with this email already exists');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading state
        this.setSubmitButtonLoading('signupSubmitBtn', true);
        this.isSubmitting = true;
        
        try {
            // Simulate API call
            await this.delay(2000);
            
            // Create new user
            const newUser = {
                id: Date.now(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                password: formData.password, // In real app, this would be hashed
                emailUpdates: formData.emailUpdates,
                createdAt: new Date().toISOString(),
                isVerified: false
            };
            
            // Save user
            this.users.push(newUser);
            this.saveUsersToStorage();
            this.saveUserSession(newUser, true);
            
            this.showToast('success', 'Account Created', 'Welcome to Helixcare!');
            
            setTimeout(() => {
                this.showSuccessModal(
                    'Account Created Successfully!',
                    `Welcome to Helixcare, ${newUser.firstName}! Your health journey starts now.`,
                    'Start Your Journey Today',
                    'Explore Our Features'
                );
            }, 1000);
            
        } catch (error) {
            this.showToast('error', 'Signup Failed', 'Something went wrong. Please try again.');
        } finally {
            this.setSubmitButtonLoading('signupSubmitBtn', false);
            this.isSubmitting = false;
        }
    }

    // Social Login Handler
    async handleSocialLogin(button) {
        const provider = button.classList.contains('google-btn') ? 'Google' : 'GitHub';
        
        this.showToast('info', `${provider} Login`, `Redirecting to ${provider}...`);
        
        // Simulate social login process
        await this.delay(1000);
        
        // In a real app, this would redirect to the OAuth provider
        this.showToast('warning', 'Demo Mode', 'Social login is not available in demo mode');
    }

    // Forgot Password Handler
    handleForgotPassword() {
        const email = document.getElementById('loginEmail').value.trim();
        
        if (!email) {
            this.showToast('warning', 'Email Required', 'Please enter your email address first');
            document.getElementById('loginEmail').focus();
            return;
        }
        
        if (!this.validateEmail(document.getElementById('loginEmail'))) {
            return;
        }
        
        this.showToast('info', 'Password Reset', 'Password reset instructions sent to your email');
    }

    // Loading State Management
    setSubmitButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.classList.remove('hidden');
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.classList.add('hidden');
        }
    }

    // Modal Management
    showSuccessModal(title, message, primaryText, secondaryText) {
        const modal = document.getElementById('successModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const primaryBtn = document.getElementById('modalPrimaryBtn');
        const secondaryBtn = document.getElementById('modalSecondaryBtn');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        primaryBtn.textContent = primaryText;
        secondaryBtn.textContent = secondaryText;
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);
    }

    hideModal() {
        const modal = document.getElementById('successModal');
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    // Toast Notifications
    showToast(type, title, message, duration = 4000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => this.removeToast(toast), duration);
        
        return toast;
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    clearToasts() {
        document.querySelectorAll('.toast').forEach(toast => {
            this.removeToast(toast);
        });
    }

    // Storage Management
    saveUserSession(user, remember) {
        const sessionData = {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            timestamp: Date.now()
        };
        
        if (remember) {
            localStorage.setItem('helixcare_session', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('helixcare_session', JSON.stringify(sessionData));
        }
    }

    loadUsersFromStorage() {
        const users = localStorage.getItem('helixcare_users');
        return users ? JSON.parse(users) : [];
    }

    saveUsersToStorage() {
        localStorage.setItem('helixcare_users', JSON.stringify(this.users));
    }

    checkAuthState() {
        const session = localStorage.getItem('helixcare_session') || sessionStorage.getItem('helixcare_session');
        
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000; // 24 hours
                
                if (!isExpired) {
                    // User is already logged in
                    setTimeout(() => {
                        this.showToast('info', 'Already Logged In', 'You are already signed in to your account');
                    }, 1000);
                } else {
                    // Session expired
                    localStorage.removeItem('helixcare_session');
                    sessionStorage.removeItem('helixcare_session');
                }
            } catch (e) {
                // Invalid session data
                localStorage.removeItem('helixcare_session');
                sessionStorage.removeItem('helixcare_session');
            }
        }
    }

    // Navigation
    redirectToDashboard() {
        // In a real app, this would redirect to the dashboard
        this.showToast('success', 'Redirecting', 'Taking you to your dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html'; // or wherever your dashboard is
        }, 2000);
    }

    // Utility Methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize the auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Clear any sensitive form data when page becomes visible again
        setTimeout(() => {
            if (window.authSystem) {
                window.authSystem.clearFormErrors();
            }
        }, 100);
    }
});

// Handle form auto-complete
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Page was loaded from cache, clear any form states
        document.querySelectorAll('form').forEach(form => form.reset());
        if (window.authSystem) {
            window.authSystem.clearFormErrors();
        }
    }
});

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    if (window.authSystem) {
        window.authSystem.showToast('error', 'System Error', 'Something went wrong. Please refresh the page.');
    }
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.authSystem) {
        window.authSystem.showToast('error', 'Network Error', 'Please check your connection and try again.');
    }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}
const signupForm = document.getElementById("signupFormElement");

signupForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const role = document.getElementById("userRole").value;

  if (!role) {
    alert("Please select a role");
    return;
  }

  // Save role temporarily
  localStorage.setItem("userRole", role);

  if (role === "doctor") {
    window.location.href = "/HTML/doctor-register.html";
  } 
  else if (role === "therapist") {
    window.location.href = "/HTML/therapist-register.html";
  } 
  else if (role === "client") {
    window.location.href = "/HTML/Med reg.html";
  }
});
const medForm = document.getElementById("medFormElement");

medForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Check if form is valid
  if (!medForm.checkValidity()) {
    alert("Please fill all required medical details");
    return;
  }

  // Mark profile as completed
  localStorage.setItem("medicalCompleted", "true");

  // Now allow account creation / redirect
  alert("Medical profile completed!");

  window.location.href = "/HTML/dashboard.html"; // or home
});
const role = localStorage.getItem("userRole");
const medicalDone = localStorage.getItem("medicalCompleted");

if (role === "client" && medicalDone !== "true") {
  window.location.href = "/HTML/Med reg.html";
}
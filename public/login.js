let currentRole = "customer";
let pwVisible = false;

// ── API call
async function apiCall(url, method, data) {
    let response;
    if (method == "POST") {
        response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    } else {
        response = await fetch(url, {
            method: method,
        });
    }
    console.log(response);

    return await response.json();
}

// ── Role toggle ─────────────────────────────────────────────────────────
function setRole(role) {
    currentRole = role;
    document
        .getElementById("role-customer")
        .classList.toggle("active", role === "customer");
    document
        .getElementById("role-staff")
        .classList.toggle("active", role === "staff");
    clearMessages();
}

// ── Password visibility toggle ───────────────────────────────────────────
function togglePw() {
    pwVisible = !pwVisible;
    document.getElementById("pw-input").type = pwVisible ? "text" : "password";
    document.getElementById("eye-icon").className = pwVisible
        ? "ti ti-eye-off"
        : "ti ti-eye";
}

// ── Message helpers ──────────────────────────────────────────────────────
function clearMessages() {
    document.getElementById("error-msg").style.display = "none";
    document.getElementById("success-msg").style.display = "none";
}
function showError(msg) {
    const el = document.getElementById("error-msg");
    el.textContent = msg;
    el.style.display = "block";
    document.getElementById("success-msg").style.display = "none";
}
function showSuccess(msg) {
    const el = document.getElementById("success-msg");
    el.textContent = msg;
    el.style.display = "block";
    document.getElementById("error-msg").style.display = "none";
}

// ── Login handler ────────────────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById("email-input").value.trim();
    const pw = document.getElementById("pw-input").value;
    const btn = document.getElementById("login-btn");

    if (!email) {
        showError("Please enter your email address.");
        return;
    }
    if (!email.includes("@")) {
        showError("Please enter a valid email address.");
        return;
    }
    if (!pw) {
        showError("Please enter your password.");
        return;
    }
    if (pw.length < 4) {
        showError("Password must be at least 4 characters.");
        return;
    }

    // Loading state
    btn.disabled = true;
    btn.innerHTML =
        '<i class="ti ti-loader-2" aria-hidden="true" style="animation:spin 0.8s linear infinite"></i> Signing in…';

    const data = {
        email,
        password: pw,
    };
    let loginStatus = await apiCall("/login", "POST", data);
    console.log(loginStatus);

    localStorage.setItem("role", loginStatus.role);
    localStorage.setItem("token", loginStatus.token);

    // Simulate network request — replace with your real auth call
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML =
            '<i class="ti ti-login" aria-hidden="true"></i> Sign in';
        if (loginStatus.code == 200) {
            showSuccess(loginStatus.message);
            window.location.assign("/");
        } else {
            showError(loginStatus.message)
        }
    }, 1400);
}

// ── Guest access ─────────────────────────────────────────────────────────
function handleGuest() {
    localStorage.setItem("role", "Guest");
    window.location.assign("/");
    // TODO: window.location.href = '/menu';
}

// ── Forgot password ───────────────────────────────────────────────────────
function showForgot() {
    const email = document.getElementById("email-input").value.trim();
    if (!email) {
        showError('Enter your email first, then click "Forgot password".');
        return;
    }
    showSuccess("Password reset link sent to " + email);
    // TODO: call your reset API here
}

// ── Register note ─────────────────────────────────────────────────────────
function showRegister() {
    showSuccess(
        "Please speak to your cafeteria manager to get an account set up.",
    );
}

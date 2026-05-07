const MENU = [
    // ── Data ──────────────────────────────────────────────────────────────────
    {
        id: 1,
        cat: "mains",
        emoji: "🍝",
        name: "Pasta Bolognese",
        desc: "Classic beef ragù with tagliatelle",
        price: 89,
        isNew: false,
    },
    {
        id: 2,
        cat: "mains",
        emoji: "🥗",
        name: "Caesar Salad",
        desc: "Romaine, parmesan, croutons",
        price: 72,
        isNew: false,
    },
    {
        id: 3,
        cat: "mains",
        emoji: "🌯",
        name: "Chicken Wrap",
        desc: "Grilled chicken with tzatziki",
        price: 79,
        isNew: true,
    },
    {
        id: 4,
        cat: "mains",
        emoji: "🍲",
        name: "Soup of the Day",
        desc: "Ask staff for today's selection",
        price: 55,
        isNew: false,
    },
    {
        id: 5,
        cat: "snacks",
        emoji: "🥨",
        name: "Pretzel & Dip",
        desc: "Soft pretzel with cheese sauce",
        price: 39,
        isNew: false,
    },
    {
        id: 6,
        cat: "snacks",
        emoji: "🧆",
        name: "Falafel Bites",
        desc: "5 pieces with hummus",
        price: 45,
        isNew: true,
    },
    {
        id: 7,
        cat: "drinks",
        emoji: "☕",
        name: "Flat White",
        desc: "Double espresso with steamed milk",
        price: 35,
        isNew: false,
    },
    {
        id: 8,
        cat: "drinks",
        emoji: "🍵",
        name: "Matcha Latte",
        desc: "Ceremonial grade, oat milk",
        price: 38,
        isNew: false,
    },
    {
        id: 9,
        cat: "drinks",
        emoji: "🥤",
        name: "Fresh Juice",
        desc: "Orange or apple, pressed daily",
        price: 32,
        isNew: false,
    },
    {
        id: 10,
        cat: "desserts",
        emoji: "🍰",
        name: "Carrot Cake",
        desc: "Cream cheese frosting",
        price: 48,
        isNew: false,
    },
    {
        id: 11,
        cat: "desserts",
        emoji: "🍫",
        name: "Brownie",
        desc: "Dark chocolate, warm",
        price: 42,
        isNew: false,
    },
    {
        id: 12,
        cat: "mains",
        emoji: "🥙",
        name: "Veggie Burger",
        desc: "Beetroot patty, aioli, fries",
        price: 85,
        isNew: true,
    },
];

let cart = {}; // { itemId: quantity }
let orders = []; // array of placed order objects
let orderCounter = 1;
let cartVisible = false;
let currentOrderFilter = "all";

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

// ── Menu rendering ────────────────────────────────────────────────────────
function renderMenu(cat) {
    const grid = document.getElementById("menu-grid");
    const items = cat === "all" ? MENU : MENU.filter((i) => i.cat === cat);
    grid.innerHTML = items
        .map(
            (item) => `
      <div class="menu-card" onclick="addToCart(${item.id})">
        ${item.isNew ? '<span class="badge-new">New</span>' : ""}
        <span class="food-emoji">${item.emoji}</span>
        <div class="food-name">${item.name}</div>
        <div class="food-desc">${item.desc}</div>
        <div class="food-footer">
          <span class="food-price">kr ${item.price}</span>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">+</button>
        </div>
      </div>
    `,
        )
        .join("");
}

function filterCat(cat, btn) {
    document
        .querySelectorAll(".cat-tab")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderMenu(cat);
}

// ── Cart logic ────────────────────────────────────────────────────────────
function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    showToast(MENU.find((i) => i.id === id).name + " added");
    updateCartUI();
    if (!cartVisible) toggleCart();
}

function toggleCart() {
    cartVisible = !cartVisible;
    document.getElementById("cart-panel").style.display = cartVisible
        ? "block"
        : "none";
    updateCartUI();
}

function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    updateCartUI();
}

function updateCartUI() {
    const keys = Object.keys(cart)
        .map(Number)
        .filter((k) => cart[k] > 0);
    const count = keys.reduce((s, k) => s + cart[k], 0);
    document.getElementById("cart-count").textContent = count;

    if (!keys.length) {
        document.getElementById("cart-items-list").innerHTML =
            '<div class="cart-empty">No items yet — add something from the menu!</div>';
        document.getElementById("cart-total").textContent = "kr 0";
        return;
    }

    let total = 0;
    document.getElementById("cart-items-list").innerHTML = keys
        .map((id) => {
            const item = MENU.find((i) => i.id === id);
            const sub = item.price * cart[id];
            total += sub;
            return `
        <div class="cart-item">
          <div class="ci-name">${item.emoji} ${item.name}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="ci-qty-ctrl">
              <button class="qty-btn" onclick="changeQty(${id}, -1)">−</button>
              <span style="font-size:14px;font-weight:500;min-width:14px;text-align:center">${cart[id]}</span>
              <button class="qty-btn" onclick="changeQty(${id}, 1)">+</button>
            </div>
            <div class="ci-price">kr ${sub}</div>
          </div>
        </div>`;
        })
        .join("");

    document.getElementById("cart-total").textContent = "kr " + total;
}

// ── Order placement ───────────────────────────────────────────────────────
async function placeOrder() {
    const keys = Object.keys(cart)
        .map(Number)
        .filter((k) => cart[k] > 0);
    if (!keys.length) {
        showToast("Add items first!");
        return;
    }

    const name =
        document.getElementById("customer-name").value.trim() || "Guest";
    const items = keys.map((id) => {
        const i = MENU.find((m) => m.id === id);
        return { ...i, qty: cart[id] };
    });
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const now = new Date();
    const timeStr =
        now.getHours() +
        ":" +
        (now.getMinutes() < 10 ? "0" : "") +
        now.getMinutes();

    const order = {
        id: orderCounter++,
        name,
        items,
        total,
        status: "Preparing",
        time: timeStr,
    };
    orders.unshift(order);
    console.log(orders);
    const response = await apiCall("/set/order", "POST", {
        name,
        keys,
        cart,
        token: localStorage.getItem("token"),
    });
    console.log(response);

    cart = {};
    document.getElementById("customer-name").value = "";
    updateCartUI();
    toggleCart();
    showToast(response.message);
    renderOrders();
    updateStats();
}

// ── Orders page ───────────────────────────────────────────────────────────
async function renderOrders() {
    const list = document.getElementById("orders-list");
    let orderData = await apiCall("/get/orders/" + currentOrderFilter, "GET");
    let usersData =
        (await apiCall("/get/user/" + localStorage.getItem("token"), "GET")) ||
        null;
    let role = usersData?.data[0]?.role ? usersData.data[0].role : null;

    if (!orderData.length) {
        list.innerHTML = '<div class="no-orders">No orders here yet</div>';
        return;
    }

    list.innerHTML = orderData
        .map(
            (o) => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">#${String(o.ID).padStart(3, "0")} · ${o.time}</div>
            <div class="order-name">${o.name}</div>
          </div>
          <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-items-list">
          ${JSON.parse(o.items)
              .map((i) => `${i.emoji} ${i.name} ×${i.qty}`)
              .join(" &nbsp;·&nbsp; ")}
        </div>
        <div class="order-footer">
        ${
            role == "staff"
                ? `<div style="display:flex;gap:6px">
            ${o.status === "Preparing" ? `<button class="status-btn" onclick="setStatus(${o.ID}, 'Ready')">Mark ready</button>` : ""}
            ${o.status === "Ready" ? `<button class="status-btn" onclick="setStatus(${o.ID}, 'Delivered')">Mark delivered</button>` : ""}
            ${o.status === "Delivered" ? `<span style="font-size:12px;color:var(--text-muted)">Completed</span>` : ""}
          </div>`
                : ""
        }

          <div class="order-total">kr ${o.total}</div>
        </div>
      </div>
    `,
        )
        .join("");
}

async function setStatus(id, status) {
    const response = await apiCall("/set/status", "POST", { id, status });
    console.log(response);
    renderOrders();
}

function filterOrders(filter, btn) {
    currentOrderFilter = filter;
    document
        .querySelectorAll(".filter-chip")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderOrders();
}

async function updateStats() {
    let orderData = await apiCall("/get/orders/" + currentOrderFilter, "GET");
    document.getElementById("stat-total").textContent = orderData.length;
    document.getElementById("stat-prep").textContent = orderData.filter(
        (o) => o.status === "Preparing",
    ).length;
    document.getElementById("stat-ready").textContent = orderData.filter(
        (o) => o.status === "Ready",
    ).length;
}

// ── Page navigation ───────────────────────────────────────────────────────
function showPage(p, btn) {
    document
        .querySelectorAll(".page")
        .forEach((x) => x.classList.remove("active"));
    document.getElementById("page-" + p).classList.add("active");
    document
        .querySelectorAll(".nav-tab")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (p === "orders") {
        renderOrders();
        updateStats();
    }
}

// ── Toast notification ────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
}

// ── Init ──────────────────────────────────────────────────────────────────
renderMenu("all");

function navigate(url) {
    window.location.assign(url);
}

if (localStorage.getItem("role")) {
    document.getElementById("loginBtn").remove();
}

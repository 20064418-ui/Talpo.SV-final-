/* eslint-disable */
// Código original de components/clothing.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
const productsData = [
    {
        id: 1,
        name: 'Talapo cap',
        price: 35.00,
        shortDesc: 'Premium cotton cap with high-quality embroidery. Classic, comfortable design—ideal for any occasion..',
        images: [
            '/assets/img/clothing/gorra1.png',
            '/assets/img/clothing/gorra3.png',
            '/assets/img/clothing/gorra4.png'
        ],
        colors: ['Indigo Blue', 'Electric Blue', 'Sky Blue' ],
        sizes: ['S', 'M', 'L', 'XL'],
        comments: [
            { user: 'Gerardo M.', initial: 'GM', date: '3 days ago', stars: '⭐⭐⭐⭐⭐', text: 'The fabric thickness is perfect. You can tell its premium apparel just by looking at the internal stitching.' },
            { user: 'Elena R.', initial: 'ER', date: '1 week ago', stars: '⭐⭐⭐⭐⭐', text: 'Very good quality' }
        ]
    },
];

let cart = [];
let currentProduct = null;

// Inicialización de elementos
__ready( () => {
    initCatalog();
    setupEventListeners();
});

function initCatalog() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = productsData.map(p => `
        <div class="product-card">
            <div class="product-card-img">
                <img src="${p.images[0]}" alt="${p.name}">
            </div>
            <div class="product-card-body">
                <h4 class="product-card-title">${p.name}</h4>
                <div class="product-card-price">$${p.price.toFixed(2)}</div>
                <p class="product-card-desc">${p.shortDesc}</p>
                <button class="btn-view-more" data-id="${p.id}">View details</button>
            </div>
        </div>
    `).join('');

    // Asignar eventos dinámicos a los botones creados
    grid.querySelectorAll('.btn-view-more').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            openProductDetail(id);
        });
    });
}

function setupEventListeners() {
    document.getElementById('btn-mayoreo')?.addEventListener('click', () => {
        alert('Minimum 24 assorted garments. Wholesale discounts are applied directly in your quote.');
    });

    document.getElementById('btn-collection')?.addEventListener('click', () => {
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('cart-trigger')?.addEventListener('click', () => toggleCart(true));
    document.getElementById('close-cart-btn')?.addEventListener('click', () => toggleCart(false));
    document.getElementById('close-modal-btn')?.addEventListener('click', () => toggleDetailModal(false));
    document.getElementById('close-size-btn')?.addEventListener('click', () => toggleSizeModal(false));
    
    document.getElementById('shipping-zone')?.addEventListener('change', updateTotal);
    document.getElementById('btn-checkout-confirm')?.addEventListener('click', () => {
        alert('Preparing checkout...');
    });
}

function openProductDetail(id) {
    currentProduct = productsData.find(p => p.id === id);
    const content = document.getElementById('modal-product-content');
    if (!currentProduct || !content) return;
    
    const thumbsHTML = currentProduct.images.map((img, i) => `
        <div class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}">
            <img src="${img}">
        </div>
    `).join('');

    const colorsHTML = currentProduct.colors.map((c, i) => `
        <button class="attr-btn ${i === 0 ? 'selected' : ''}" data-type="color">${c}</button>
    `).join('');

    const sizesHTML = currentProduct.sizes.map((s, i) => `
        <button class="attr-btn ${i === 0 ? 'selected' : ''}" data-type="size">${s}</button>
    `).join('');

    const commentsHTML = currentProduct.comments.map(c => `
        <div class="comment-box">
            <div class="comment-avatar">${c.initial}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-user">${c.user}</span>
                    <span class="comment-date">${c.date}</span>
                </div>
                <span class="comment-stars">${c.stars}</span>
                <p class="comment-text">"${c.text}"</p>
            </div>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="product-gallery">
            <div class="thumbnail-stack">${thumbsHTML}</div>
            <div class="main-stage">
                <img id="modal-main-img" src="${currentProduct.images[0]}" alt="${currentProduct.name}">
            </div>
        </div>
        <div class="product-info">
            <h2>${currentProduct.name}</h2>
            <div class="price-tag">$${currentProduct.price.toFixed(2)}</div>

            <div class="attribute-title">Garment color</div>
            <div class="attribute-selector" id="modal-colors">${colorsHTML}</div>

            <div class="attribute-title">Available size</div>
            <div class="attribute-selector" id="modal-sizes">${sizesHTML}</div>

            <div class="meta-extra-selectors">
                <div>
                    <div class="attribute-title">Quantity</div>
                    <input type="number" id="modal-qty" class="qty-input" value="1" min="1" max="10">
                </div>
                <div>
                    <div class="attribute-title">Production notes</div>
                    <input type="text" id="modal-notes" class="note-input" placeholder="Ej: Tallaje exacto, empaque...">
                </div>
            </div>

            <span class="size-guide-trigger" id="size-guide-open">📐 See the full size guide</span>

            <div class="badge-delivery-info">
                <span>🚀</span> <strong>Premium delivery:</strong> Express dispatch with Cargo Expreso nationwide.
            </div>

            <button class="btn-add-to-cart" id="add-to-cart-btn">Add to cart</button>

            <div class="details-accordion">
                <div class="attribute-title">Product details</div>
                <p>${currentProduct.shortDesc}</p>
            </div>

            <div class="comments-section">
                <div class="attribute-title" style="margin-bottom: 16px;">Verified reviews (${currentProduct.comments.length})</div>
                ${commentsHTML}
            </div>
        </div>
    `;

    // Re-bindear eventos del contenido del modal inyectado
    content.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            const currentThumb = e.currentTarget;
            const src = currentThumb.getAttribute('data-img');
            document.getElementById('modal-main-img').src = src;
            content.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            currentThumb.classList.add('active');
        });
    });

    content.querySelectorAll('.attr-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentBtn = e.currentTarget;
            currentBtn.parentElement.querySelectorAll('.attr-btn').forEach(b => b.classList.remove('selected'));
            currentBtn.classList.add('selected');
        });
    });

    document.getElementById('size-guide-open')?.addEventListener('click', () => toggleSizeModal(true));
    document.getElementById('add-to-cart-btn')?.addEventListener('click', addCurrentToCart);

    toggleDetailModal(true);
}

function toggleDetailModal(open) { 
    document.getElementById('detail-modal').style.display = open ? 'flex' : 'none'; 
}

function toggleSizeModal(open) { 
    document.getElementById('size-modal').style.display = open ? 'flex' : 'none'; 
}

function toggleCart(open) { 
    document.getElementById('cart-sidebar').classList.toggle('open', open); 
}

function addCurrentToCart() {
    const colorBtn = document.getElementById('modal-colors').querySelector('.attr-btn.selected');
    const sizeBtn = document.getElementById('modal-sizes').querySelector('.attr-btn.selected');
    const qty = parseInt(document.getElementById('modal-qty').value) || 1;
    
    const selectedColor = colorBtn ? colorBtn.innerText : 'One color';
    const selectedSize = sizeBtn ? sizeBtn.innerText : 'One size';

    for(let i=0; i<qty; i++) {
        cart.push({
            name: currentProduct.name,
            price: currentProduct.price,
            color: selectedColor,
            size: selectedSize,
            img: currentProduct.images[0]
        });
    }

    document.getElementById('cart-count').innerText = cart.length;
    toggleDetailModal(false);
    renderCart();
    toggleCart(true);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    if(cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--gris-texto); margin-top: 40px;">Your cart is empty.</p>`;
        document.getElementById('subtotal-val').innerText = `$0.00`;
        document.getElementById('shipping-val').innerText = `$0.00`;
        document.getElementById('total-val').innerText = `$0.00`;
        return;
    }
    
    let subtotal = 0;
    container.innerHTML = cart.map((item, index) => {
        subtotal += item.price;
        return `
            <div class="cart-item">
                <div class="cart-item-img"><img src="${item.img}" alt="${item.name}"></div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-variant">${item.color} / Size ${item.size}</div>
                    <p>$${item.price.toFixed(2)}</p>
                    <span style="font-size:11px; color:#EF4444; cursor:pointer; font-weight:600;" class="remove-cart-item" data-index="${index}">Remove</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.remove-cart-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeItem(index);
        });
    });

    document.getElementById('subtotal-val').innerText = `$${subtotal.toFixed(2)}`;
    updateTotal();
}

function removeItem(index) {
    cart.splice(index, 1);
    document.getElementById('cart-count').innerText = cart.length;
    renderCart();
}

function updateTotal() {
    if (cart.length === 0) return;
    let subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    let shipping = parseFloat(document.getElementById('shipping-zone').value) || 0;
    
    document.getElementById('shipping-val').innerText = `$${shipping.toFixed(2)}`;
    document.getElementById('total-val').innerText = `$${(subtotal + shipping).toFixed(2)}`;
}
;

if (typeof __onload === "function") __ready(__onload);

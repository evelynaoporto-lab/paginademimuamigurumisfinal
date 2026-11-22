const products = window.MIMU_PRODUCTS || [];
const categories = ['Todos','Peluches amigurumis','Llaveros','Flores y ramos','Decoración','Scrunchies','Marcapáginas'];
const descriptions = {
  'Peluches amigurumis':'Amigurumi tejido a mano, con detalles realizados cuidadosamente.',
  'Llaveros':'Un pequeño accesorio tejido a crochet para llevar o regalar.',
  'Flores y ramos':'Flores tejidas a mano, pensadas para acompañar un regalo especial.',
  'Decoración':'Detalles tejidos a mano para decorar y celebrar ocasiones especiales.'
};
const INSTAGRAM_LINK = 'https://www.instagram.com/amigurumis_mimu?dmpr=YXliMmRlNm91cnc=';
const WHATSAPP_LINK = 'https://wa.me/qr/2J5IUY5SJVCJD1';
const money = value => '$' + (Number.isFinite(Number(value)) ? Number(value) : 0).toLocaleString('es-AR');
const asset = file => 'assets/' + file;
const $ = id => document.getElementById(id);
let activeCategory = 'Todos';
let currentProduct = null;
function safeRead(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : fallback; }
  catch (_) { return fallback; }
}
function safeWrite(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
let cart = safeRead('mimuCart', []).filter(item => item && typeof item.id === 'string' && Number.isFinite(Number(item.qty)) && Number(item.qty) > 0).map(item => ({id:item.id, qty:Math.max(1,Math.floor(Number(item.qty)))}));
let favorites = safeRead('mimuFavorites', []).filter(id => typeof id === 'string');
function productCard(product) {
  const saved = favorites.includes(product.id);
  const description = product.description || descriptions[product.category] || 'Creación artesanal hecha a mano, con atención en cada detalle.';
  return `<article class="product-card"><div class="product-image"><img src="${asset(product.image)}" alt="${product.name}" loading="lazy"><button class="heart-btn ${saved?'saved':''}" data-favorite="${product.id}" aria-label="${saved?'Quitar de':'Guardar en'} favoritos">${saved?'♥':'♡'}</button></div><div class="product-info"><span class="product-category">${product.category}</span><h3>${product.name}</h3><p>${description}</p><div class="product-bottom"><strong class="product-price">${money(product.price)}</strong><div class="product-actions"><button class="details-btn" data-details="${product.id}">Detalles</button><button class="add-btn" data-add="${product.id}">Agregar +</button></div></div></div></article>`;
}
function renderFeatured() {
  const picks = [products[0], products.find(p=>p.category==='Flores y ramos'), products.find(p=>p.name==='Ranita')].filter(Boolean);
  if ($('featuredGrid')) $('featuredGrid').innerHTML = picks.map(productCard).join('');
}
function renderTabs() {
  if ($('categoryTabs')) $('categoryTabs').innerHTML = categories.map(category=>`<button class="${activeCategory===category?'active':''}" data-tab="${category}">${category}</button>`).join('');
}
function renderCatalog() {
  renderTabs();
  const query = ($('catalogSearch')?.value || '').trim().toLocaleLowerCase('es');
  const filtered = products.filter(product => (activeCategory==='Todos' || product.category===activeCategory) && (`${product.name} ${product.category}`.toLocaleLowerCase('es').includes(query)));
  if ($('catalogGrid')) $('catalogGrid').innerHTML = filtered.map(productCard).join('');
  if ($('resultsCount')) $('resultsCount').textContent = `${filtered.length} ${filtered.length===1?'producto':'productos'}`;
  if ($('emptyState')) $('emptyState').hidden = filtered.length > 0;
}
function updateCart() {
  cart = cart.filter(item => item && products.some(product=>product.id===item.id) && Number.isFinite(Number(item.qty)) && Number(item.qty)>0)
    .map(item=>({id:item.id, qty:Math.max(1,Math.floor(Number(item.qty)))}));
  safeWrite('mimuCart', cart);
  const count = cart.reduce((sum,item)=>sum + item.qty, 0);
  ['cartCount','cartCountTop','cartCountFloat'].forEach(id=>{const node=$(id); if(node) node.textContent=String(count);});
  const itemsNode=$('cartItems');
  if(itemsNode) itemsNode.innerHTML=cart.map(item=>{
    const product=products.find(p=>p.id===item.id); if(!product) return '';
    return `<div class="cart-item"><img src="${asset(product.image)}" alt="${product.name}"><div><h4>${product.name}</h4><small>${money(product.price)}</small><div class="quantity"><button data-qty="${product.id}" data-change="-1" aria-label="Restar">−</button><span>${item.qty}</span><button data-qty="${product.id}" data-change="1" aria-label="Sumar">+</button></div></div><button class="remove-item" data-remove="${product.id}" aria-label="Quitar producto">×</button></div>`;
  }).join('');
  const total=cart.reduce((sum,item)=>{const product=products.find(p=>p.id===item.id);return sum+(product ? Number(product.price)*item.qty : 0);},0);
  if($('cartTotal')) $('cartTotal').textContent=money(total);
  if($('cartEmpty')) $('cartEmpty').classList.toggle('hidden',cart.length>0);
  if($('cartBottom')) $('cartBottom').classList.toggle('hidden',cart.length===0);
}
function openCart() { $('cartDrawer')?.classList.add('open'); $('cartOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart() { $('cartDrawer')?.classList.remove('open'); $('cartOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function addToCart(id) { if(!products.some(p=>p.id===id)) return; const found=cart.find(item=>item.id===id); if(found) found.qty++; else cart.push({id,qty:1}); updateCart(); openCart(); }
function showView(name) {
  const map={home:'homeView',catalog:'catalogView',about:'aboutView',process:'processView',contact:'contactView'};
  document.querySelectorAll('.view').forEach(view=>view.classList.remove('active'));
  const target=$(map[name] || 'homeView'); if(target) target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'}); $('mainNav')?.classList.remove('open');
  if(name==='catalog') renderCatalog();
}
function openProduct(id) {
  const product=products.find(item=>item.id===id); if(!product) return; currentProduct=product;
  if($('modalImage')) { $('modalImage').src=asset(product.image); $('modalImage').alt=product.name; }
  if($('modalName')) $('modalName').textContent=product.name;
  if($('modalDescription')) $('modalDescription').textContent=product.description || descriptions[product.category] || 'Creación artesanal hecha a mano, con atención en cada detalle.';
  if($('modalPrice')) $('modalPrice').textContent=money(product.price);
  $('productModal')?.classList.add('open');
}
function closeProduct() { $('productModal')?.classList.remove('open'); }
document.addEventListener('click', event=>{
  const view=event.target.closest('[data-view]'); if(view){event.preventDefault();showView(view.dataset.view);}
  const details=event.target.closest('[data-details]'); if(details) openProduct(details.dataset.details);
  const add=event.target.closest('[data-add]'); if(add) addToCart(add.dataset.add);
  const tab=event.target.closest('[data-tab]'); if(tab){activeCategory=tab.dataset.tab;renderCatalog();}
  const category=event.target.closest('[data-category]'); if(category){activeCategory=category.dataset.category;showView('catalog');renderCatalog();}
  const favorite=event.target.closest('[data-favorite]'); if(favorite){const id=favorite.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];safeWrite('mimuFavorites',favorites);renderFeatured();if($('catalogView')?.classList.contains('active'))renderCatalog();}
  const quantity=event.target.closest('[data-qty]'); if(quantity){const item=cart.find(x=>x.id===quantity.dataset.qty);if(item){item.qty+=Number(quantity.dataset.change);if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);updateCart();}}
  const remove=event.target.closest('[data-remove]'); if(remove){cart=cart.filter(item=>item.id!==remove.dataset.remove);updateCart();}
  if(event.target.closest('[data-close-modal]')) closeProduct();
});
if($('catalogSearch')) $('catalogSearch').addEventListener('input',renderCatalog);
if($('homeSearch')) $('homeSearch').addEventListener('keydown',event=>{if(event.key==='Enter'){showView('catalog');if($('catalogSearch')) $('catalogSearch').value=event.target.value;renderCatalog();}});
if($('menuToggle')) $('menuToggle').addEventListener('click',()=>$('mainNav')?.classList.toggle('open'));
['openCartTop','openCartFloat'].forEach(id=>{if($(id)) $(id).addEventListener('click',openCart);});
if($('closeCart')) $('closeCart').addEventListener('click',closeCart);
if($('cartOverlay')) $('cartOverlay').addEventListener('click',closeCart);
if($('continueShopping')) $('continueShopping').addEventListener('click',()=>{closeCart();showView('catalog');});
if($('checkout')) $('checkout').addEventListener('click',()=>{
  if(!cart.length) return;
  const lines=cart.map(item=>{const product=products.find(p=>p.id===item.id);return product?`• ${product.name} x${item.qty} — ${money(product.price*item.qty)}`:'';}).filter(Boolean);
  const total=cart.reduce((sum,item)=>{const product=products.find(p=>p.id===item.id);return sum+(product?product.price*item.qty:0);},0);
  const message=`¡Hola! Quiero realizar este pedido en Amigurumis Mimu:\n\n${lines.join('\n')}\n\nTotal estimado: ${money(total)}\n\n¡Quedo pendiente para confirmar disponibilidad!`;
  const url=WHATSAPP_LINK+'?text='+encodeURIComponent(message);
  window.open(url,'_blank','noopener');
});
if($('modalAdd')) $('modalAdd').addEventListener('click',()=>{if(currentProduct)addToCart(currentProduct.id);closeProduct();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeCart();closeProduct();}});
renderFeatured(); renderCatalog(); updateCart();

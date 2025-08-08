// app.js — Vanilla JS SPA (hash routing) + localStorage persistence
const PRODUCTS_JSON = 'products.json';
const STORAGE_KEY = 'demo_products_v1';

const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const deleteFromDetail = document.getElementById('deleteFromDetail');

let products = [];

// --- helpers ---
function saveToStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
function loadFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { products = JSON.parse(raw); return true; } catch(e){ return false; }
  }
  return false;
}
function fetchProducts(){
  return fetch(PRODUCTS_JSON).then(r => r.json());
}

// --- rendering ---
function renderProducts(list){
  listView.innerHTML = '';
  if(!list.length){
    listView.innerHTML = `<p style="grid-column:1/-1;color:#666;">Heç bir məhsul tapılmadı.</p>`;
    return;
  }
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.title)}" />
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(truncate(p.description, 90))}</p>
      <div class="meta">
        <div class="price">$${p.price}</div>
      </div>
      <div class="actions">
        <button class="btn secondary" data-id="${p.id}" data-action="view">Bax</button>
        <button class="btn danger" data-id="${p.id}" data-action="delete">Sil</button>
      </div>
    `;
    listView.appendChild(card);
  });
}

function renderDetail(id){
  const p = products.find(x => x.id === id);
  if(!p){ alert('Məhsul tapılmadı'); location.hash = ''; return; }
  document.getElementById('detailImg').src = p.image;
  document.getElementById('detailTitle').textContent = p.title;
  document.getElementById('detailDesc').textContent = p.description;
  document.getElementById('detailPrice').textContent = `$${p.price}`;
  deleteFromDetail.dataset.id = p.id;
}

// --- small utils ---
function truncate(s, n){ return s.length>n ? s.slice(0,n-1)+'…' : s; }
function escapeHtml(unsafe){
  return unsafe.replace(/[&<"']/g, m => ({'&':'&amp;','<':'&lt;','"':'&quot;',"'":"&#039;"}[m]));
}

// --- actions ---
function handleListClick(e){
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if(action === 'view'){ location.hash = '#product-' + id; }
  else if(action === 'delete'){ 
    if(confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')){
      products = products.filter(x => x.id !== id);
      saveToStorage();
      applySearch(); // re-render
    }
  }
}

function deleteById(id){
  products = products.filter(x => x.id !== id);
  saveToStorage();
  location.hash = ''; // go back to list
  applySearch();
}

function applySearch(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const filtered = products.filter(p => {
    if(!q) return true;
    return p.title.toLowerCase().includes(q) 
        || p.description.toLowerCase().includes(q)
        || String(p.price).includes(q);
  });
  // show list, hide detail
  listView.classList.remove('hidden');
  detailView.classList.add('hidden');
  renderProducts(filtered);
}

// --- routing ---
function handleHashChange(){
  const hash = location.hash || '';
  if(hash.startsWith('#product-')){
    const id = hash.replace('#product-','');
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    renderDetail(id);
  } else {
    // show list
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    applySearch();
  }
}

// --- init ---
document.addEventListener('DOMContentLoaded', async () => {
  // load from storage else fetch JSON
  const loaded = loadFromStorage();
  if(!loaded){
    try {
      const remote = await fetchProducts();
      products = remote;
      saveToStorage();
    } catch(e){
      console.error('JSON fetch failed', e);
      alert('Məhsul datasını yükləmək mümkün olmadı.');
      products = [];
    }
  }
  applySearch();
});

listView.addEventListener('click', handleListClick);
searchInput.addEventListener('input', () => applySearch());
resetBtn.addEventListener('click', () => { searchInput.value=''; applySearch(); });

window.addEventListener('hashchange', handleHashChange);
backBtn.addEventListener('click', () => { location.hash = ''; });
deleteFromDetail.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if(!id) return;
  if(confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) deleteById(id);
});

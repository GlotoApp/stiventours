// script.js: carga data.json y renderiza los pasadías, además muestra un modal con detalles
let stData = null;

async function loadData(){
  try{
    const res = await fetch('data.json');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    stData = data;
    document.title = (data.siteName || 'Stiventours') + ' | Agencia de Turismo';
    const valid = validateData(data);
    if(valid.invalid.length){
      showValidationWarning(valid.invalid);
    }
    renderPasadias(valid.items);
  }catch(e){
    console.error('Error cargando data.json', e);
    showLoadError('No se pudo cargar la lista de pasadías. Verifica que estés sirviendo el sitio desde un servidor (no file://) y que `data.json` exista.');
  }
}

function validateData(data){
  const required = ['id','title','price','currency','image','short','features','long'];
  const items = Array.isArray(data && data.pasadias) ? data.pasadias : [];
  const validItems = [];
  const invalid = [];
  items.forEach(it=>{
    const missing = required.filter(k=>{
      if(!(k in it)) return true;
      if(k==='features') return !Array.isArray(it.features);
      return false;
    });
    if(missing.length) invalid.push({id: it.id || '(sin id)', missing}); else validItems.push(it);
  });
  return {items: validItems, invalid};
}

function showValidationWarning(list){
  if(!list || !list.length) return;
  const container = document.getElementById('pasadias-list');
  if(!container) return;
  const warn = document.createElement('div');
  warn.className = 'col-span-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800';
  warn.innerHTML = `<strong>Aviso:</strong> Se detectaron entradas inválidas en <em>data.json</em>. IDs problemáticos: ${list.map(x=>escapeHtml(x.id)).join(', ')}.`;
  container.parentNode.insertBefore(warn, container);
}

function showLoadError(message){
  const container = document.getElementById('pasadias-list');
  if(!container) return;
  container.innerHTML = `<div class="col-span-3 p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">${escapeHtml(message)}</div>`;
}

function renderPasadias(list){
  const container = document.getElementById('pasadias-list');
  if(!container) return;
  container.innerHTML = '';
  list.forEach(item => {
    const col = document.createElement('div');
    col.className = 'tour-card group';
    col.innerHTML = `
      <div class="relative overflow-hidden">
        <img loading="lazy" src="${item.image}" alt="${escapeHtml(item.title)}" class="thumb">
      </div>
      <div class="body">
        <h3 class="text-2xl font-bold text-blue-900 mb-3">${escapeHtml(item.title)}</h3>
        <p class="text-sm text-gray-600 mb-4">${escapeHtml(item.short)}</p>
        <ul class="text-sm text-gray-600 mb-4">
          ${item.features.map(f=>`<li>• ${escapeHtml(f)}</li>`).join('')}
        </ul>
        <div class="flex justify-between items-center">
          <span class="price text-2xl">$${escapeHtml(item.price)} <small class="text-xs text-gray-400">${escapeHtml(item.currency)}</small></span>
          <button data-id="${item.id}" class="ver-mas bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Ver más</button>
        </div>
      </div>
    `;
    container.appendChild(col);
  })

  // delegación de eventos para botones Ver más
  container.querySelectorAll('.ver-mas').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = btn.getAttribute('data-id');
      const item = list.find(x=>x.id===id);
      if(item) showModal(item);
    })
  })
}

function showModal(item){
  let modal = document.getElementById('st-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'st-modal';
    modal.className = 'st-modal';
    modal.innerHTML = `
      <div class="panel">
        <div class="content">
          <button id="st-close" style="float:right;background:#eee;border-radius:8px;padding:6px 10px;border:none;cursor:pointer">✕</button>
          <h2 id="st-title" class="text-2xl font-bold mb-2"></h2>
          <img id="st-image" src="" alt="" style="width:100%;border-radius:8px;object-fit:cover;margin-bottom:12px">
          <p id="st-long" class="text-gray-700"></p>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;justify-content:space-between">
            <span class="price" id="st-price"></span>
            <a id="st-book" class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold" href="#">Reservar</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e=>{ if(e.target===modal) toggleModal(false) })
  }

  document.getElementById('st-title').textContent = item.title;
  const img = document.getElementById('st-image');
  img.src = item.image;
  img.alt = item.title;
  img.loading = 'lazy';
  document.getElementById('st-long').textContent = item.long;
  document.getElementById('st-price').textContent = `$${item.price} ${item.currency}`;
  document.getElementById('st-book').href = `https://wa.me/${(getContactPhone())}?text=${encodeURIComponent('Hola, quiero reservar: '+item.title)}`;

  const closeBtn = document.getElementById('st-close');
  closeBtn.onclick = ()=> toggleModal(false);
  // accesibilidad: establecer atributos ARIA y foco en el panel
  const panel = modal.querySelector('.panel');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-labelledby','st-title');
  panel.tabIndex = -1;
  panel.focus();
  toggleModal(true);
}

// Mobile nav toggle
function toggleMobileNav(){
  const nav = document.getElementById('main-nav');
  const btn = document.getElementById('mobile-nav-btn');
  if(!nav || !btn) return;
  const isHidden = nav.classList.contains('hidden');
  if(isHidden){
    nav.classList.remove('hidden');
    nav.classList.add('mobile-open');
    btn.setAttribute('aria-expanded','true');
  } else {
    nav.classList.add('hidden');
    nav.classList.remove('mobile-open');
    btn.setAttribute('aria-expanded','false');
  }
}

// conectar listener para botón mobile
function initUI(){
  // mobile menu
  const mb = document.getElementById('mobile-nav-btn');
  if(mb) mb.addEventListener('click', toggleMobileNav);

  // smooth anchor scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if(href && href.startsWith('#')){
        const target = document.querySelector(href);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth',block:'start'});
          // close mobile nav after click
          const nav = document.getElementById('main-nav');
          if(nav && nav.classList.contains('mobile-open')){
            nav.classList.add('hidden'); nav.classList.remove('mobile-open');
            const btn = document.getElementById('mobile-nav-btn'); if(btn) btn.setAttribute('aria-expanded','false');
          }
        }
      }
    })
  });

  // header scroll effect
  const header = document.querySelector('header');
  if(header){
    const handler = ()=>{
      if(window.scrollY>24) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    };
    handler();
    window.addEventListener('scroll', handler, {passive:true});
  }

  // reveal-on-scroll for elements with .reveal and tour cards
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('visible');
        observer.unobserve(en.target);
      }
    });
  },{threshold:0.12});

  document.querySelectorAll('.reveal, .tour-card').forEach(el=> observer.observe(el));
}

function toggleModal(show){
  const modal = document.getElementById('st-modal');
  if(!modal) return;
  if(show) modal.classList.add('active'); else modal.classList.remove('active');
}

function getContactPhone(){
  if(stData && stData.contact && stData.contact.phone){
    // limpiar caracteres no numéricos
    return String(stData.contact.phone).replace(/[^0-9]/g,'');
  }
  return '573001234567';
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]});
}

// inicialización
window.addEventListener('DOMContentLoaded', ()=>{ loadData(); initUI(); });

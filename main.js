function $(sel){return document.querySelector(sel)}

const bankData = JSON.parse(document.getElementById('bank-data').textContent);
const bankDetailsEl = $('#bank-details');
const qrContainer = $('#qr-container');
const stripePk = bankData.stripe_pk || '';
let stripe = null;
if(stripePk){ stripe = Stripe(stripePk); }

function renderBank(){
  const t = `Beneficiary: ${bankData.beneficiary}\nBank: ${bankData.bank}\nAccount: ${bankData.account}\nCurrency: ${bankData.currency}\nSWIFT: ${bankData.swift}\nNote: ${bankData.note}`;
  bankDetailsEl.textContent = t;
}

// Copy details
$('#copy-bank').addEventListener('click', ()=>{
  navigator.clipboard.writeText(bankDetailsEl.textContent).then(()=>{
    alert('Bank details copied to clipboard');
  }).catch(()=>alert('Copy failed'));
});

// QR
$('#gen-qr').addEventListener('click', ()=>{
  qrContainer.innerHTML = '';
  const payload = bankDetailsEl.textContent;
  new QRCode(qrContainer, {text: payload, width:200, height:200});
});

// Presets
// Bank-form presets only (avoid colliding with card presets)
document.querySelectorAll('#donation-form .presets button').forEach(b=>{
  b.addEventListener('click', ()=>{ $('#amount').value = b.dataset.amt; });
});

// Card payment presets
document.querySelectorAll('.payment-amt').forEach(b=>{
  b.addEventListener('click', ()=>{ $('#card-amount').value = b.dataset.amt; });
});

// Pay with card
$('#pay-card').addEventListener('click', async ()=>{
  const amt = Number($('#card-amount').value || 0);
  if(!amt || amt < 1000 || amt > 100000){ alert('Amount must be between 1,000 and 100,000 MNT'); return }
  if(!stripe){ alert('Card payments are not configured. Use bank transfer or PayPal.'); return }
  try{
    const resp = await fetch('/api/checkout', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount: amt})});
    const data = await resp.json();
    if(!data.sessionId || !stripe){ alert('Card payments are not configured on the server. Please use bank transfer.'); return }
    const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    if(result.error) alert(result.error.message);
  }catch(e){ alert('Payment failed or not configured.'); }
});

// Donor storage
const STORAGE_KEY = 'tt_donors_v1';
function loadDonors(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch(e){return []}
}
function saveDonors(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }
async function addDonor(d){
  // try server first
  try{
    const res = await fetch('/api/donors', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
    if(res.ok){
      const jr = await res.json();
      d.id = jr.id || null; d.synced = true;
    }
  }catch(e){ /* ignore, fallback to local */ }
  const list = loadDonors(); list.unshift(d); saveDonors(list); return d;
}

function renderDonors(){
  const ul = $('#donor-list'); ul.innerHTML = '';
  const list = loadDonors();
  list.slice(0,20).forEach(d=>{
    const li = document.createElement('li');
    const name = d.name? d.name : 'Anonymous';
    li.textContent = `${name} — ${d.amount} MNT${d.note? ' — ' + d.note: ''} (${new Date(d.t).toLocaleString()})`;
    ul.appendChild(li);
  });
}

// animate adding donor
function animateDonorAdd(donor){
  const ul = $('#donor-list');
  const li = document.createElement('li'); li.classList.add('donor-new');
  const name = donor.name? donor.name : 'Anonymous';
  li.textContent = `${name} — ${donor.amount} MNT${donor.note? ' — ' + donor.note: ''} (${new Date(donor.t).toLocaleString()})`;
  ul.insertBefore(li, ul.firstChild);
  setTimeout(()=> li.classList.remove('donor-new'), 800);
}

$('#donation-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const amount = Number($('#amount').value || 0);
  if(amount < 1000 || amount > 100000){ alert('Amount must be between 1,000 and 100,000 MNT'); return }
  const donor = {name: $('#donor-name').value.trim(), note: $('#donor-note').value.trim(), amount, t: Date.now() };
  const saved = await addDonor(donor);
  animateDonorAdd(saved);
  $('#donation-form').reset();
  showToast(saved.synced? 'Donation recorded on server — thank you!' : 'Record saved locally. Complete the bank transfer.');
});

$('#download-csv').addEventListener('click', ()=>{
  const list = loadDonors();
  if(!list.length){ alert('No donors saved yet'); return }
  const rows = [['name','amount','note','timestamp']].concat(list.map(d=>[d.name||'',d.amount,d.note||'',new Date(d.t).toISOString()]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'donors.csv'; a.click(); URL.revokeObjectURL(url);
});

// Countdown / schedule
const dtInput = $('#stream-datetime');
const cd = $('#countdown');
function nextDefaultStream(){
  const d = new Date(); d.setDate(d.getDate()+1); d.setHours(18,0,0,0); return d;
}
function toLocalDatetimeInputValue(d){
  const pad = n=>String(n).padStart(2,'0');
  const yyyy = d.getFullYear(); const mm = pad(d.getMonth()+1); const dd = pad(d.getDate());
  const hh = pad(d.getHours()); const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

if(!dtInput.value) dtInput.value = toLocalDatetimeInputValue(nextDefaultStream());

function updateCountdown(){
  const target = new Date(dtInput.value);
  const diff = target - new Date();
  if(diff<=0){ cd.textContent = 'LIVE or Finished'; return }
  const s = Math.floor(diff/1000)%60;
  const m = Math.floor(diff/1000/60)%60;
  const h = Math.floor(diff/1000/3600)%24;
  const days = Math.floor(diff/1000/3600/24);
  cd.textContent = (days? days + 'd ':'') + String(h).padStart(2,'0')+ ':' + String(m).padStart(2,'0')+ ':' + String(s).padStart(2,'0');
}
setInterval(updateCountdown, 1000);
dtInput.addEventListener('change', updateCountdown);

// Init
renderBank(); renderDonors(); updateCountdown();

// Setup payment buttons state
function setupPaymentButtons(){
  const payCardBtn = document.getElementById('pay-card');
  const payPaypalBtn = document.getElementById('pay-paypal');
  if(!stripe){ payCardBtn.disabled = true; payCardBtn.textContent = 'Card (not configured)'; payCardBtn.classList.add('disabled'); }
  if(!bankData.paypal_link){ payPaypalBtn.disabled = true; payPaypalBtn.textContent = 'PayPal (not configured)'; payPaypalBtn.classList.add('disabled'); }
}
setupPaymentButtons();

// Wire a simple Roblox profile link (no avatar fetch)
{
  const robloxHref = (bankData.roblox_profile||'').trim();
  const robloxHeader = document.getElementById('roblox-header-link');
  if(robloxHeader){
    robloxHeader.href = robloxHref || '#';
    if(!robloxHref){ robloxHeader.classList.add('disabled'); robloxHeader.title = 'Roblox link not configured'; }
  }
  const profileLink = document.getElementById('profile-link');
  if(profileLink && robloxHref){ profileLink.href = robloxHref; }
  const headerImg = document.getElementById('profile-avatar'); if(headerImg && !headerImg.src) headerImg.src = 'css/avatar-fallback.png';
}

// Toast helper
function showToast(msg, timeout=3000){
  let t = document.getElementById('site-toast');
  if(!t){ t = document.createElement('div'); t.id='site-toast'; t.className='site-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('visible');
  setTimeout(()=> t.classList.remove('visible'), timeout);
}

// PayPal button: opens configured PayPal link if present
document.getElementById('pay-paypal').addEventListener('click', ()=>{
  const link = bankData.paypal_link || '';
  if(!link){ alert('PayPal not configured. Use bank transfer or card.'); return }
  window.open(link, '_blank');
});

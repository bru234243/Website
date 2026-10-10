async function api(path, opts){
  const res = await fetch(path, opts||{});
  if(res.status===401) throw new Error('unauth');
  return res.json();
}

document.getElementById('btn-login').addEventListener('click', async ()=>{
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  try{
    await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    document.getElementById('login').style.display='none';
    document.getElementById('panel').style.display='block';
    loadDonors(); loadStats();
  }catch(e){alert('Login failed')}
});

document.getElementById('btn-logout').addEventListener('click', async ()=>{ await fetch('/api/logout',{method:'POST'}); location.reload(); });
document.getElementById('btn-refresh').addEventListener('click', ()=>{ loadDonors(); loadStats(); });
document.getElementById('btn-export').addEventListener('click', ()=>{ window.location = '/api/export'; });

async function loadDonors(){
  try{
    const list = await api('/api/donors');
    const tbody = document.getElementById('donors'); tbody.innerHTML='';
    list.forEach(d=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.id}</td><td>${escapeHtml(d.name)}</td><td>${d.amount}</td><td>${escapeHtml(d.note)}</td><td>${new Date(d.created_at).toLocaleString()}</td><td>${d.received? 'Yes':'No'}</td><td><button data-id="${d.id}" class="mark">${d.received ? 'Mark unpaid' : 'Mark received'}</button></td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.mark').forEach(b=>b.addEventListener('click', async ()=>{
      const donor = list.find(item => String(item.id) === b.dataset.id);
      if (!donor) return;
      await fetch(`/api/donors/${donor.id}/mark`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({received:donor.received ? 0 : 1})});
      loadDonors(); loadStats();
    }));
  }catch(e){ if(e.message==='unauth') { alert('Please login'); location.reload(); } else console.error(e) }
}

async function loadStats(){ try{ const s = await api('/api/stats'); document.getElementById('stats').textContent = `Donors: ${s.count} — Total: ${s.total} MNT — Received: ${s.received}` } catch(e){console.error(e)} }

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':"&#39;"}[c])); }

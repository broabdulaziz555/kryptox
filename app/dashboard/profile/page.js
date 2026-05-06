'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ChevronRight, LogOut, Shield, Globe, Bell, FileText, Trash2 } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const LANGUAGES = [
  {code:'en',label:'English'},{code:'ru',label:'Русский'},{code:'uz',label:"O'zbek"},
  {code:'kz',label:'Қазақша'},{code:'kg',label:'Кыргызча'},{code:'tj',label:'Тоҷикӣ'},
  {code:'ar',label:'العربية'},{code:'tr',label:'Türkçe'},{code:'zh',label:'中文'},
  {code:'hi',label:'हिंदी'},{code:'de',label:'Deutsch'},{code:'fr',label:'Français'},
  {code:'es',label:'Español'},{code:'pt',label:'Português'},{code:'ja',label:'日本語'},
  {code:'ko',label:'한국어'},
];

function Row({ icon: Icon, label, value, onClick, danger, toggle, toggled }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', display:'flex', alignItems:'center', gap:12,
      padding:'14px 16px', background:'none', border:'none', cursor: onClick||toggle ? 'pointer' : 'default',
      textAlign:'left', transition:'background 150ms',
    }}
    onMouseEnter={e => { if(onClick||toggle) e.currentTarget.style.background='var(--bg-card-hover)'; }}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      {Icon && (
        <div style={{
          width:32, height:32, borderRadius:'var(--radius-md)',
          background: danger ? 'rgba(255,77,106,0.1)' : 'rgba(79,142,247,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={15} color={danger ? 'var(--accent-red)' : 'var(--accent-blue)'} />
        </div>
      )}
      <span style={{ flex:1, fontSize:14, fontWeight:500, color: danger ? 'var(--accent-red)' : 'var(--text-primary)' }}>
        {label}
      </span>
      {value && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{value}</span>}
      {toggle && (
        <div onClick={e => { e.stopPropagation(); toggle(); }}
          style={{
            width:44, height:24, borderRadius:12,
            background: toggled ? 'var(--accent-blue)' : 'var(--bg-card-hover)',
            position:'relative', transition:'background 200ms', cursor:'pointer',
            border: toggled ? 'none' : '1px solid var(--border)',
          }}>
          <div style={{
            position:'absolute', top:toggled?2:1, left:toggled?22:1,
            width:20, height:20, borderRadius:'50%', background:'#fff',
            transition:'left 200ms', boxShadow:'0 2px 4px rgba(0,0,0,0.3)',
          }} />
        </div>
      )}
      {onClick && !toggle && <ChevronRight size={14} color="var(--text-muted)" />}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase',
        letterSpacing:1, padding:'0 16px', marginBottom:4 }}>{title}</div>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [user, setUser]         = useState(null);
  const [bio, setBio]           = useState('');
  const [lang, setLang]         = useState('en');
  const [isBiz, setIsBiz]       = useState(false);
  const [editBio, setEditBio]   = useState(false);
  const [editLang, setEditLang] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [notifications, setNotif] = useState(true);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('kryptox_user') || '{}');
    setUser(u); setBio(u.bio || ''); setLang(u.preferredLanguage || 'en'); setIsBiz(u.isBusiness || false);
    api.get('/users/me/profile').then(d => {
      setBio(d.bio||''); setLang(d.preferredLanguage||'en'); setIsBiz(d.isBusiness||false);
      const merged = { ...u, ...d };
      setUser(merged);
      localStorage.setItem('kryptox_user', JSON.stringify(merged));
    }).catch(()=>{});
  }, []);

  const save = async (patch) => {
    setSaving(true);
    try {
      const updated = await api.put('/users/me/profile', patch);
      const merged = { ...user, ...updated };
      setUser(merged); localStorage.setItem('kryptox_user', JSON.stringify(merged));
      success('Saved!');
    } catch(e) { toastError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const logout = () => {
    localStorage.removeItem('kryptox_token');
    localStorage.removeItem('kryptox_user');
    localStorage.removeItem('kryptox_address');
    router.replace('/onboarding');
  };

  const copyAddress = () => {
    const addr = localStorage.getItem('kryptox_address') || user?.publicAddress;
    if (addr) { navigator.clipboard.writeText(addr); success('Address copied!'); }
  };

  const addr = localStorage.getItem('kryptox_address') || user?.publicAddress || '';
  const shortAddr = addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : '—';
  const langLabel = LANGUAGES.find(l => l.code === lang)?.label || lang;

  return (
    <MobileLayout title="Profile" showBack={false}>
      <div style={{ padding:'0 0 16px' }}>

        {/* Profile header */}
        <div style={{ padding:'24px 16px', textAlign:'center' }}>
          <div style={{
            width:80, height:80, borderRadius:'50%', background:'var(--accent-gradient)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:28, color:'#fff', margin:'0 auto 12px',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'K'}
          </div>
          <div style={{ fontWeight:800, fontSize:20 }}>@{user?.username}</div>
          {bio && <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4, lineHeight:1.5 }}>{bio}</div>}
          <button onClick={copyAddress} style={{
            display:'inline-flex', alignItems:'center', gap:6, marginTop:8,
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-full)', padding:'6px 12px', cursor:'pointer',
          }}>
            <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)' }}>{shortAddr}</span>
            <Copy size={12} color="var(--text-muted)" />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:1, padding:'0 16px', marginBottom:20 }}>
          {[['0','Transactions'],['0','Contacts'],['2025','Member Since']].map(([v,l]) => (
            <div key={l} style={{ flex:1, textAlign:'center', background:'var(--bg-card)',
              border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'12px 8px' }}>
              <div style={{ fontWeight:800, fontSize:18 }}>{v}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Account */}
        <Section title="Account">
          <Row icon={null} label="Edit Bio" value={bio.slice(0,20)||'Add bio'} onClick={() => setEditBio(true)} />
          <div style={{ height:1, background:'var(--border)', margin:'0 16px' }} />
          <Row icon={null} label="Language" value={langLabel} onClick={() => setEditLang(true)} />
          <div style={{ height:1, background:'var(--border)', margin:'0 16px' }} />
          <Row icon={null} label="Business Account" toggle={() => { const n=!isBiz; setIsBiz(n); save({isBusiness:n}); }} toggled={isBiz} />
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row icon={Shield} label="Backup Seed Phrase" onClick={() => router.push('/onboarding?mode=backup')} />
          <div style={{ height:1, background:'var(--border)', margin:'0 16px' }} />
          <Row icon={null} label="Notifications" toggle={() => setNotif(p=>!p)} toggled={notifications} />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row icon={Globe} label="Language" value={langLabel} onClick={() => setEditLang(true)} />
          <div style={{ height:1, background:'var(--border)', margin:'0 16px' }} />
          <Row icon={FileText} label="Username Auctions" onClick={() => router.push('/auction')} />
        </Section>

        {/* Danger */}
        <Section title="Account">
          <Row icon={LogOut} label="Sign Out" onClick={logout} danger />
        </Section>

      </div>

      {/* Bio sheet */}
      {editBio && (
        <div className="sheet-backdrop" onClick={() => setEditBio(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ fontWeight:700, fontSize:17, marginBottom:16 }}>Edit Bio</div>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={160} rows={4}
              className="input" style={{ resize:'none', fontSize:16, lineHeight:1.5, marginBottom:8 }}
              placeholder="Tell people about yourself…" />
            <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right', marginBottom:16 }}>{bio.length}/160</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setEditBio(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={() => { save({bio}); setEditBio(false); }} disabled={saving} className="btn-primary" style={{ flex:1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language sheet */}
      {editLang && (
        <div className="sheet-backdrop" onClick={() => setEditLang(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ fontWeight:700, fontSize:17, marginBottom:16 }}>Select Language</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxHeight:300, overflowY:'auto' }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); save({preferredLanguage:l.code}); setEditLang(false); }}
                  style={{
                    padding:'12px 14px', borderRadius:'var(--radius-md)', textAlign:'left',
                    background: lang===l.code ? 'var(--accent-gradient)' : 'var(--bg-card)',
                    border:`1px solid ${lang===l.code ? 'transparent' : 'var(--border)'}`,
                    color: lang===l.code ? '#fff' : 'var(--text-primary)',
                    fontWeight:500, fontSize:13, cursor:'pointer',
                  }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

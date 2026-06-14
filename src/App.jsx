import { useMemo, useState } from 'react';
import { Bookmark, ExternalLink, Clock, Plus, Trash2, ChefHat } from 'lucide-react';
import { FIREBASE_READY } from './firebase';
import { useNutrition, todayLocal } from './useNutrition';

const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
const TABS = [['recipes', '📖 Recipes'], ['mealprep', '🥗 Meal Prep'], ['log', '📝 Log']];

export default function App() {
  const { user, authReady, isOwner, demo, data, toggleSaveRecipe, addLog, deleteLog, login, logout } = useNutrition();
  const [tab, setTab] = useState('recipes');
  const [open, setOpen] = useState(null); // expanded recipe id
  const [form, setForm] = useState({ meal: '', kcal: '', protein: '' });

  const recipes = useMemo(() => [...(data.recipes || [])].sort((a, b) => Number(b.saved) - Number(a.saved)), [data.recipes]);
  const thisWeek = (data.mealPrep || [])[0];
  const todayLog = (data.log || []).filter((l) => l.date === todayLocal());
  const todayProtein = todayLog.reduce((s, l) => s + (Number(l.protein) || 0), 0);
  const todayKcal = todayLog.reduce((s, l) => s + (Number(l.kcal) || 0), 0);

  if (!authReady) return <div className="wrap"><p className="dim center" style={{ marginTop: 48 }}>Loading…</p></div>;
  if (FIREBASE_READY && !user) {
    return (
      <div className="wrap center" style={{ marginTop: 80 }}>
        <div className="logo">🥗</div><h1>Mike's Nutrition</h1>
        <p className="dim" style={{ maxWidth: 320, margin: '8px auto 20px' }}>Recipes, meal-prep, and a light food log.</p>
        <button className="btn app" onClick={login}>Sign in with Google</button>
      </div>
    );
  }
  if (FIREBASE_READY && user && !isOwner) {
    return <div className="wrap center" style={{ marginTop: 80 }}><h1>Mike's Nutrition</h1><p className="dim">Personal app. Signed in as {user.email}.</p><button className="btn def" onClick={logout} style={{ marginTop: 12 }}>Sign out</button></div>;
  }

  const submitLog = () => {
    if (!form.meal.trim()) return;
    addLog({ meal: form.meal.trim(), kcal: Number(form.kcal) || 0, protein: Number(form.protein) || 0, note: '' });
    setForm({ meal: '', kcal: '', protein: '' });
  };

  return (
    <div className="wrap">
      <header className="head"><div><span className="logo-sm">🥗</span> <b>Mike's Nutrition</b></div>{FIREBASE_READY && <button className="btn def sm" onClick={logout}>Sign out</button>}</header>
      {demo && <div className="banner">Demo mode — connect Firebase to see your real data. Sample shown.</div>}

      <nav className="chips">{TABS.map(([id, label]) => <button key={id} className={'chip' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>)}</nav>

      {tab === 'recipes' && (
        <>
          {recipes.length === 0 && <p className="dim center" style={{ marginTop: 30 }}>No recipes yet. Rupert will suggest some.</p>}
          {recipes.map((r) => (
            <article className="card" key={r.id}>
              <div className="r-head" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <div>
                  <div className="r-title"><ChefHat size={15} /> {r.title}</div>
                  <div className="r-meta">{r.minutes ? `${r.minutes} min · ` : ''}{(r.tags || []).join(' · ')}{r.source ? ` · ${r.source}` : ''}</div>
                </div>
                <button className={'iconbtn' + (r.saved ? ' on' : '')} onClick={(e) => { e.stopPropagation(); toggleSaveRecipe(r.id); }} title="Save"><Bookmark size={15} /></button>
              </div>
              {open === r.id && (
                <div className="r-body">
                  {r.ingredients?.length > 0 && <><div className="r-sub">Ingredients</div><ul>{r.ingredients.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
                  {r.steps?.length > 0 && <><div className="r-sub">Steps</div><ol>{r.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></>}
                  {r.link && <a className="btn def sm" href={r.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Source</a>}
                </div>
              )}
            </article>
          ))}
        </>
      )}

      {tab === 'mealprep' && (
        thisWeek ? (
          <section className="card">
            <h3><Clock size={14} /> Week of {thisWeek.week}</h3>
            {thisWeek.items.map((it, i) => (
              <div className="mp-row" key={i}>
                <div className="mp-name">{it.name}</div>
                <div className="mp-meta">{[it.batch, it.macros].filter(Boolean).join(' · ')}</div>
              </div>
            ))}
          </section>
        ) : <p className="dim center" style={{ marginTop: 30 }}>No meal-prep plan yet.</p>
      )}

      {tab === 'log' && (
        <>
          <section className="card">
            <h3>Today · {todayKcal} kcal · {todayProtein}g protein</h3>
            <div className="log-form">
              <input placeholder="What did you eat?" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })} />
              <div className="log-row2">
                <input type="number" inputMode="numeric" placeholder="kcal" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
                <input type="number" inputMode="numeric" placeholder="protein g" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
                <button className="btn app sm" onClick={submitLog}><Plus size={14} /> Add</button>
              </div>
            </div>
          </section>
          {(data.log || []).map((l) => (
            <div className="log-item" key={l.id}>
              <div><div className="log-meal">{l.meal}</div><div className="log-meta">{l.date} · {l.kcal || 0} kcal · {l.protein || 0}g</div></div>
              <button className="iconbtn" onClick={() => deleteLog(l.id)} title="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </>
      )}

      <footer className="foot">Mike's Nutrition · build {BUILD}</footer>
    </div>
  );
}

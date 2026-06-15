// Data hook for Mike's Nutrition. One doc: nutrition/{uid}
//   recipes:  [{ id, title, tags[], minutes, source, link, ingredients[], steps[], saved }]
//   mealPrep: [{ id, week, items:[{ name, macros, batch }] }]   (Rupert's Sunday meal-prep)
//   log:      [{ id, date, meal, kcal, protein, note }]
// Rupert (mikeslife crons / mini) writes recipes + mealPrep; Mike adds log entries.
// DEMO mode with seed data when Firebase env is absent.
import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, provider, FIREBASE_READY, OWNER_EMAIL } from './firebase';

const ET = 'America/New_York';
export const todayLocal = () => new Intl.DateTimeFormat('en-CA', { timeZone: ET, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const SEED = {
  recipes: [
    { id: 'r1', title: 'Turkey Quinoa Chili', tags: ['high-protein', 'batch'], minutes: 45, source: 'Rupert', link: '', ingredients: ['1 lb ground turkey', '1 cup quinoa', 'black beans', 'fire-roasted tomatoes', 'chili spices'], steps: ['Brown turkey', 'Add aromatics + spices', 'Simmer with quinoa + tomatoes 25 min', 'Stir in beans'], saved: true },
    { id: 'r2', title: 'Greek Chicken Bowls', tags: ['high-protein', 'meal-prep'], minutes: 30, source: 'Rupert', link: '', ingredients: ['chicken thighs', 'cucumber', 'cherry tomatoes', 'tzatziki', 'brown rice'], steps: ['Marinate + sear chicken', 'Assemble over rice with veg + tzatziki'], saved: true },
    { id: 'r3', title: 'Egg & Veggie Muffins', tags: ['breakfast', 'batch'], minutes: 25, source: 'Rupert', link: '', ingredients: ['8 eggs', 'spinach', 'bell pepper', 'feta'], steps: ['Whisk eggs', 'Fold in veg + feta', 'Bake muffin tin 20 min @375'], saved: false },
  ],
  mealPrep: [
    { id: 'mp1', week: todayLocal(), items: [
      { name: 'Turkey Quinoa Chili', macros: '~38g protein / serving', batch: '6 servings' },
      { name: 'Greek Chicken Bowls', macros: '~42g protein / serving', batch: '4 servings' },
      { name: 'Egg & Veggie Muffins', macros: '~12g protein each', batch: '12 muffins' },
    ] },
  ],
  log: [
    { id: 'l1', date: todayLocal(), meal: 'Breakfast — egg muffins x2', kcal: 280, protein: 24, note: '' },
  ],
};

export function useNutrition() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!FIREBASE_READY);
  const [data, setData] = useState(FIREBASE_READY ? { recipes: [], mealPrep: [], log: [] } : { ...SEED, refreshedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() });
  const demo = !FIREBASE_READY;

  useEffect(() => {
    if (!FIREBASE_READY) return;
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
  }, []);

  const isOwner = !!user && user.email === OWNER_EMAIL;

  useEffect(() => {
    if (!FIREBASE_READY || !user || !isOwner) return;
    return onSnapshot(doc(db, 'nutrition', 'data'), (snap) => {
      const d = snap.data() || {};
      setData({ recipes: d.recipes || [], mealPrep: d.mealPrep || [], log: d.log || [], refreshedAt: d.refreshedAt || null });
    }, (e) => console.error('nutrition listener', e));
  }, [user, isOwner]);

  const patch = useCallback(async (next) => {
    if (demo) { setData((p) => ({ ...p, ...next })); return; }
    if (!user) return;
    const ref = doc(db, 'nutrition', 'data');
    try { await updateDoc(ref, next); } catch { await setDoc(ref, next, { merge: true }); }
  }, [demo, user]);

  const toggleSaveRecipe = useCallback((id) => {
    setData((p) => { const recipes = p.recipes.map((r) => (r.id === id ? { ...r, saved: !r.saved } : r)); patch({ recipes }); return { ...p, recipes }; });
  }, [patch]);

  const addLog = useCallback((entry) => {
    setData((p) => { const log = [{ id: 'l' + Date.now(), date: todayLocal(), ...entry }, ...p.log]; patch({ log }); return { ...p, log }; });
  }, [patch]);

  const deleteLog = useCallback((id) => {
    setData((p) => { const log = p.log.filter((x) => x.id !== id); patch({ log }); return { ...p, log }; });
  }, [patch]);

  const login = () => FIREBASE_READY && signInWithPopup(auth, provider).catch((e) => console.error(e));
  const logout = () => FIREBASE_READY && signOut(auth);

  return { user, authReady, isOwner, demo, data, toggleSaveRecipe, addLog, deleteLog, login, logout };
}

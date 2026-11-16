import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import '../assets/styles/placements.css';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const sections = {
  batches: { title: 'Batch placements', fields: [['year', 'Batch year'], ['total', 'Total students (display text)']], empty: { year: '', total: '', hospitals: [] } },
  internationalPlacements: { title: 'International placements', fields: [['name', 'Graduate name'], ['initials', 'Initials'], ['role', 'Role'], ['hospital', 'Hospital'], ['location', 'Location'], ['country', 'Country'], ['flag', 'Flag emoji', 'optional'], ['program', 'Program']], empty: { name: '', initials: '', role: '', hospital: '', location: '', country: '', flag: '', program: '' } },
  partners: { title: 'Recruiters', fields: [['name', 'Hospital name'], ['location', 'Location']], empty: { name: '', location: '' } },
  destinations: { title: 'Destinations', fields: [['label', 'Destination'], ['count', 'Status (e.g. 3 Placed)']], empty: { label: '', count: '' } },
  stats: { title: 'Statistics', fields: [['label', 'Label'], ['number', 'Value'], ['suffix', 'Suffix (e.g. + or %)', 'optional'], ['icon', 'Icon', 'icon']], empty: { label: '', number: '', suffix: '', icon: 'FiUsers' } },
};
const emptyData = () => Object.fromEntries(Object.keys(sections).map(key => [key, []]));

export default function Placements() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [section, setSection] = useState('batches');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API}/api/placements`, { signal: controller.signal });
        if (response.status === 404) { setData(emptyData()); return; }
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load placements.');
        setData(result.data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = items => {
    setData(current => ({ ...current, [section]: items }));
    setDirty(true);
    setMessage('');
  };
  const update = (index, key, value) => change(data[section].map((item, i) => i === index ? { ...item, [key]: value } : item));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/api/placements/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: data[section] }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save placements.');
      setData(result.data);
      setDirty(false);
      setMessage('Saved. The public placement page will show these changes when loaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="placements-editor">
    <div className="page-header"><div className="page-header-left"><h2>Placements</h2><p>Manage batch records, recruiters and placement statistics.</p></div></div>
    {error && <div role="alert" className="placements-notice">{error}{!data && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry</button>}</div>}
    {message && <p role="status" className="placements-notice">{message}</p>}
    {!data && !error && <p role="status">Loading placements...</p>}
    {data && <>
      <div className="placements-tabs" aria-label="Placement sections">
        {Object.entries(sections).map(([key, config]) => <button type="button" key={key} aria-pressed={section === key} disabled={saving || (dirty && section !== key)} className={section === key ? 'btn-primary' : 'btn-secondary'} onClick={() => { setSection(key); setError(''); setMessage(''); }}>{config.title} ({data[key].length})</button>)}
      </div>
      <form onSubmit={save}>
        <fieldset disabled={saving}>
          <div className="placements-actions"><h3>{sections[section].title}</h3><button type="button" className="btn-secondary" onClick={() => change([...data[section], structuredClone(sections[section].empty)])}>Add record</button></div>
          {data[section].length === 0 && <p>No records yet. Add a record to display it on the website.</p>}
          {data[section].map((item, index) => <article className="placements-record" key={`${section}-${index}`}>
            <div className="placements-actions"><h4>Record {index + 1}</h4><button type="button" className="btn-secondary" onClick={() => { if (window.confirm('Remove this record? Save changes to apply the removal.')) change(data[section].filter((_, i) => i !== index)); }}>Remove</button></div>
            <div className="placements-fields">{sections[section].fields.map(([key, label, type]) => <label className="form-group" key={key}>{label}
              {type === 'icon' ? <select value={item[key]} onChange={event => update(index, key, event.target.value)}>{[['FiUsers', 'Students'], ['FiHome', 'Hospitals'], ['FiGlobe', 'International'], ['FiTrendingUp', 'Growth']].map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select> : <input required={type !== 'optional'} value={item[key] ?? ''} onChange={event => update(index, key, event.target.value)} />}
            </label>)}</div>
            {section === 'batches' && <div>
              <h4>Hospitals · Listed count: {item.hospitals.reduce((sum, hospital) => sum + Number(hospital.count || 0), 0)}</h4>
              {item.hospitals.map((hospital, hospitalIndex) => <div className="placements-hospital" key={hospitalIndex}>
                <label>Hospital<input required value={hospital.name} onChange={event => update(index, 'hospitals', item.hospitals.map((entry, i) => i === hospitalIndex ? { ...entry, name: event.target.value } : entry))} /></label>
                <label>Students<input type="number" required min="0" step="1" value={hospital.count} onChange={event => update(index, 'hospitals', item.hospitals.map((entry, i) => i === hospitalIndex ? { ...entry, count: event.target.value === '' ? '' : Number(event.target.value) } : entry))} /></label>
                <button type="button" className="btn-secondary" aria-label={`Remove hospital ${hospitalIndex + 1}`} onClick={() => update(index, 'hospitals', item.hospitals.filter((_, i) => i !== hospitalIndex))}>Remove</button>
              </div>)}
              <button type="button" className="btn-secondary" onClick={() => update(index, 'hospitals', [...item.hospitals, { name: '', count: 0 }])}>Add hospital</button>
            </div>}
          </article>)}
          <div className="placements-actions">
            <span>{dirty ? 'Unsaved changes. Save or discard before switching sections.' : 'All changes saved.'}</span>
            <button type="button" className="btn-secondary" disabled={!dirty} onClick={() => { if (window.confirm('Discard unsaved changes?')) { setData(null); setDirty(false); setError(''); setMessage(''); setAttempt(value => value + 1); } }}>Discard changes</button>
            <button type="submit" className="btn-primary" disabled={!dirty}>{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </fieldset>
      </form>
    </>}
  </div>;
}

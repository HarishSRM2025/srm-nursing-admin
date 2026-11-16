import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import '../assets/styles/conduct.css';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const sections = {
  'general-rules': 'General rules', 'disciplinary-committee': 'Disciplinary committee',
  students: 'Students', dress: 'Dress code', hostel: 'Hostel', ragging: 'Anti-ragging',
  principal: 'Principal', faculty: 'Faculty', support: 'Support staff',
};
const blank = id => ({ id, title: sections[id], institution: '', address: '', institutionHeader: '', intro: '', subtitle: '', paragraphs: [], table: [], rules: [], boys: [], girls: [] });
const renumber = rows => rows.map((row, index) => ({ ...row, num: index + 1 }));

function TextList({ title, values, onChange }) {
  return <div className="conduct-list"><h4>{title}</h4>
    {values.map((value, index) => <div className="conduct-row" key={index}>
      <label>{title} {index + 1}<textarea required value={value} onChange={event => onChange(values.map((text, i) => i === index ? event.target.value : text))} /></label>
      <button type="button" className="btn-secondary" onClick={() => onChange(values.filter((_, i) => i !== index))}>Remove</button>
    </div>)}
    <button type="button" className="btn-secondary" onClick={() => onChange([...values, ''])}>Add {title.toLowerCase()}</button>
  </div>;
}

function Rules({ title, rules, onChange, details }) {
  const update = (index, patch) => onChange(rules.map((rule, i) => i === index ? { ...rule, ...patch } : rule));
  return <div><h3>{title} ({rules.length})</h3>
    {rules.map((rule, index) => <article className="conduct-card" key={index}>
      <label>Rule {index + 1}<textarea required value={rule.text} onChange={event => update(index, { text: event.target.value })} /></label>
      <div className="conduct-actions">
        <button type="button" className="btn-secondary" disabled={index === 0} onClick={() => { const next = [...rules]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(renumber(next)); }}>Move up</button>
        <button type="button" className="btn-secondary" onClick={() => { if (window.confirm('Remove this rule? Save to apply the removal.')) onChange(renumber(rules.filter((_, i) => i !== index))); }}>Remove rule</button>
      </div>
      {details === 'students' && <TextList title="Subclauses" values={rule.subClauses || []} onChange={values => update(index, { subClauses: values, isCompound: values.length > 0 })} />}
      {details === 'ragging' && <>
        <TextList title="Punishments" values={(rule.punishments || []).map(item => item.text)} onChange={values => update(index, { punishments: values.map((text, i) => ({ num: i + 1, text })) })} />
        <TextList title="Appeals" values={rule.subAppeals || []} onChange={values => update(index, { subAppeals: values })} />
      </>}
    </article>)}
    <button type="button" className="btn-secondary" onClick={() => onChange([...rules, { num: rules.length + 1, text: '' }])}>Add rule</button>
  </div>;
}

export default function CodeOfConduct() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [id, setId] = useState('general-rules');
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API}/api/code-of-conduct`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Unable to load code of conduct.');
        setData(result.data);
        setDraft(result.data.find(item => item.id === 'general-rules') || blank('general-rules'));
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

  const update = patch => { setDraft(current => ({ ...current, ...patch })); setDirty(true); setMessage(''); };
  async function save(event) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API}/api/code-of-conduct/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save.');
      setData(current => [...current.filter(item => item.id !== id), result.data]);
      setDraft(result.data); setDirty(false);
      setMessage('Saved. Changes appear on the public page when it is loaded.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="conduct-editor">
    <div className="page-header"><div className="page-header-left"><h2>Code of Conduct</h2><p>Edit institutional rules and committee members. Save each section before switching.</p></div></div>
    {error && <p role="alert">{error} {!data && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry</button>}</p>}
    {message && <p role="status">{message}</p>}
    {!data && !error && <p role="status">Loading code of conduct...</p>}
    {data && draft && <>
      <div className="conduct-actions" aria-label="Code of conduct sections">{Object.entries(sections).map(([key, title]) => <button key={key} type="button" aria-pressed={key === id} className={key === id ? 'btn-primary' : 'btn-secondary'} disabled={saving || (dirty && key !== id)} onClick={() => { setId(key); setDraft(data.find(item => item.id === key) || blank(key)); setError(''); setMessage(''); }}>{title}</button>)}</div>
      <form onSubmit={save}><fieldset disabled={saving}>
        <label>Title<input required value={draft.title} onChange={event => update({ title: event.target.value })} /></label>
        {id === 'general-rules' && <>
          <label>Institution<input value={draft.institution} onChange={event => update({ institution: event.target.value })} /></label>
          <label>Address<input value={draft.address} onChange={event => update({ address: event.target.value })} /></label>
          <TextList title="Paragraphs" values={draft.paragraphs} onChange={paragraphs => update({ paragraphs })} />
        </>}
        {id === 'disciplinary-committee' && <>
          <label>Description<textarea value={draft.subtitle} onChange={event => update({ subtitle: event.target.value })} /></label>
          <h3>Committee members</h3>
          {draft.table.map((member, index) => <div className="conduct-card" key={index}>
            {['name', 'position'].map(key => <label key={key}>{key === 'name' ? 'Name' : 'Position'}<input required value={member[key]} onChange={event => update({ table: draft.table.map((row, i) => i === index ? { ...row, [key]: event.target.value } : row) })} /></label>)}
            <button type="button" className="btn-secondary" onClick={() => { if (window.confirm('Remove this committee member?')) update({ table: draft.table.filter((_, i) => i !== index).map((row, i) => ({ ...row, sno: String(i + 1) })) }); }}>Remove member</button>
          </div>)}
          <button type="button" className="btn-secondary" onClick={() => update({ table: [...draft.table, { sno: String(draft.table.length + 1), name: '', position: '' }] })}>Add member</button>
        </>}
        {!['general-rules', 'disciplinary-committee'].includes(id) && <>
          {id === 'students' && <label>Institution heading<input value={draft.institutionHeader} onChange={event => update({ institutionHeader: event.target.value })} /></label>}
          <label>Introduction<textarea value={id === 'ragging' ? draft.subtitle : draft.intro} onChange={event => update({ [id === 'ragging' ? 'subtitle' : 'intro']: event.target.value })} /></label>
          {id === 'dress' ? <>
            <Rules title="Boys uniform" rules={draft.boys} onChange={boys => update({ boys })} />
            <Rules title="Girls uniform" rules={draft.girls} onChange={girls => update({ girls })} />
          </> : <Rules title="Rules" rules={draft.rules} details={id} onChange={rules => update({ rules })} />}
        </>}
        <div className="conduct-actions">
          <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <button type="button" className="btn-secondary" disabled={!dirty} onClick={() => { if (window.confirm('Discard unsaved changes?')) { setDraft(data.find(item => item.id === id) || blank(id)); setDirty(false); setError(''); setMessage(''); } }}>Discard changes</button>
          <button type="submit" className="btn-primary" disabled={!dirty}>{saving ? 'Saving...' : 'Save section'}</button>
        </div>
      </fieldset></form>
    </>}
  </div>;
}

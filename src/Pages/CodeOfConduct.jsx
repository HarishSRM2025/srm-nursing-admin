import { useEffect, useState } from 'react';
import { MdArrowUpward, MdArrowDownward, MdDeleteOutline, MdAdd, MdSave, MdFormatListNumbered } from 'react-icons/md';
import { useAuth } from '../Context/AuthContext';
import '../assets/styles/conduct.css';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const sections = {
  'general-rules': 'General rules', 'disciplinary-committee': 'Disciplinary committee',
  students: 'Students', dress: 'Dress code', hostel: 'Hostel', ragging: 'Anti-ragging',
  principal: 'Principal', faculty: 'Faculty', support: 'Support staff',
};
const blank = id => ({ id, title: sections[id], institution: '', address: '', institutionHeader: '', intro: '', subtitle: '', paragraphs: [], table: [], rules: [], boys: [], girls: [] });
const orderSection = section => {
  const ordered = rows => [...(rows || [])].sort((a, b) => Number(a.num) - Number(b.num)).map((row, i) => ({ ...row, num: i + 1 }));
  return { ...blank(section.id), ...section, rules: ordered(section.rules).map(rule => ({ ...rule, ...(rule.punishments ? { punishments: ordered(rule.punishments) } : {}) })), boys: ordered(section.boys), girls: ordered(section.girls), table: [...(section.table || [])].sort((a, b) => Number(a.sno) - Number(b.sno)).map((row, i) => ({ ...row, sno: String(i + 1) })) };
};
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
  const update = (index, patch) => onChange(renumber(rules.map((rule, i) => i === index ? { ...rule, ...patch } : rule)));
  const move = (from, to) => {
    if (to < 0 || to >= rules.length) return;
    const next = [...rules];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(renumber(next));
  };
  return <section className="conduct-rules">
    <div className="conduct-rule-heading"><div><h3>{title} <span className="conduct-count">{rules.length}</span></h3><p>Displayed in this order on the website. Moving a rule updates its number automatically.</p></div>
      <button type="button" className="btn-secondary" onClick={() => onChange(renumber([...rules, { text: '' }]))}><MdAdd /> Add rule</button>
    </div>
    {!rules.length && <p className="conduct-empty">No rules in this section. Add a rule to get started.</p>}
    {rules.map((rule, index) => <article className="conduct-card conduct-rule-card" key={index}>
      <div className="conduct-rule-top">
        <span className="conduct-rule-number">{String(rule.num).padStart(2, '0')}</span>
        <strong>Rule {rule.num}</strong>
        <div className="conduct-rule-tools">
          <button type="button" className="conduct-icon-button" aria-label={'Move rule ' + rule.num + ' up'} title="Move up" disabled={index === 0} onClick={() => move(index, index - 1)}><MdArrowUpward /></button>
          <button type="button" className="conduct-icon-button" aria-label={'Move rule ' + rule.num + ' down'} title="Move down" disabled={index === rules.length - 1} onClick={() => move(index, index + 1)}><MdArrowDownward /></button>
          <label className="conduct-position">Position<select aria-label={'Position of rule ' + rule.num} value={index} onChange={event => move(index, Number(event.target.value))}>{rules.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
          <button type="button" className="conduct-icon-button conduct-delete" aria-label={'Remove rule ' + rule.num} title="Remove rule" onClick={() => { if (window.confirm('Remove this rule? Save to apply the removal.')) onChange(renumber(rules.filter((_, i) => i !== index))); }}><MdDeleteOutline /></button>
        </div>
      </div>
      <label className="conduct-rule-text">Rule text<textarea rows={Math.min(12, Math.max(3, Math.ceil(rule.text.length / 85)))} required value={rule.text} onChange={event => update(index, { text: event.target.value })} /></label>
      {details === 'students' && <details className="conduct-details" open={(rule.subClauses || []).length > 0}>
        <summary>Subclauses <span className="conduct-count">{(rule.subClauses || []).length}</span></summary>
        <TextList title={'Rule ' + rule.num + ' ? Subclause'} values={rule.subClauses || []} onChange={values => update(index, { subClauses: values, isCompound: values.length > 0 })} />
      </details>}
      {details === 'ragging' && <details className="conduct-details" open={Boolean(rule.punishments?.length || rule.subAppeals?.length)}>
        <summary>Additional details <span className="conduct-count">{(rule.punishments?.length || 0) + (rule.subAppeals?.length || 0)}</span></summary>
        <TextList title={'Rule ' + rule.num + ' ? Punishment'} values={(rule.punishments || []).map(item => item.text)} onChange={values => update(index, { punishments: values.map((text, i) => ({ num: i + 1, text })) })} />
        <TextList title={'Rule ' + rule.num + ' ? Appeal'} values={rule.subAppeals || []} onChange={values => update(index, { subAppeals: values })} />
      </details>}
    </article>)}
    <button type="button" className="conduct-add-rule" onClick={() => onChange(renumber([...rules, { text: '' }]))}><MdAdd /> Add rule {rules.length + 1}</button>
  </section>;
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
        const ordered = result.data.map(orderSection);
        setData(ordered);
        setDraft(ordered.find(item => item.id === 'general-rules') || blank('general-rules'));
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
    <header className="conduct-page-heading"><span className="conduct-page-icon"><MdFormatListNumbered /></span><div><span className="conduct-eyebrow">INSTITUTION POLICIES</span><h2>Code of Conduct</h2><p>Manage the rules your students and staff see on the website.</p></div></header>
    {error && <p className="conduct-notice conduct-notice--error" role="alert">{error} {!data && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry</button>}</p>}
    {message && <p className="conduct-notice conduct-notice--success" role="status">{message}</p>}
    {!data && !error && <p role="status">Loading code of conduct...</p>}
    {data && draft && <div className="conduct-workspace">
      <nav className="conduct-section-nav" aria-label="Code of conduct sections"><h3>Sections <span>09</span></h3><p>Choose a section to edit</p>{Object.entries(sections).map(([key, title], index) => <button key={key} type="button" aria-current={key === id ? 'page' : undefined} disabled={saving || (dirty && key !== id)} onClick={() => { setId(key); setDraft(data.find(item => item.id === key) || blank(key)); setError(''); setMessage(''); }}><span className="conduct-nav-number">{String(index + 1).padStart(2, '0')}</span><span>{title}</span></button>)}{dirty && <p className="conduct-nav-hint">Save or discard your changes before switching sections.</p>}</nav>
      <form className="conduct-form" onSubmit={save}><fieldset disabled={saving}>
        <div className="conduct-section-heading"><span className="conduct-eyebrow">EDIT SECTION</span><h2>{sections[id]}</h2><p>Changes remain a draft until you save this section.</p></div>
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
        <div className="conduct-savebar">
          <span className={dirty ? 'conduct-state conduct-state--dirty' : 'conduct-state'}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <button type="button" className="btn-secondary" disabled={!dirty} onClick={() => { if (window.confirm('Discard unsaved changes?')) { setDraft(data.find(item => item.id === id) || blank(id)); setDirty(false); setError(''); setMessage(''); } }}>Discard changes</button>
          <button type="submit" className="btn-primary" disabled={!dirty}><MdSave /> {saving ? 'Saving...' : 'Save section'}</button>
        </div>
      </fieldset></form>
    </div>}
  </div>;
}

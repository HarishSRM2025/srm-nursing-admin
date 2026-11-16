import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdGroups2,
  MdImage,
  MdRefresh,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdFormatListBulleted,
} from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICON_OPTIONS = [
  { name: 'stethoscope', label: 'Stethoscope' },
  { name: 'book-open', label: 'Book (Open)' },
  { name: 'newspaper', label: 'Newspaper / Journal' },
  { name: 'languages', label: 'Languages' },
  { name: 'palette', label: 'Palette / Cultural' },
  { name: 'heart-handshake', label: 'Heart Handshake' },
  { name: 'heart-pulse', label: 'Heart Pulse / Wellness' },
  { name: 'cross', label: 'Cross / Red Cross' },
  { name: 'shield-alert', label: 'Shield Alert / Committee' },
  { name: 'globe', label: 'Globe / SDG' },
];

const CATEGORY_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'welfare', label: 'Welfare' },
  { value: 'committee', label: 'Committee' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  slug: '',
  code: '',
  shortName: '',
  tagline: '',
  category: 'other',
  icon: 'stethoscope',
  aim: '',
  objectives: [''],
  order: 0,
  status: 'active',
  imageFile: null,
};

export default function Clubs() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/clubs`);
      if (!res.ok) {
        let msg = 'Failed to fetch clubs';
        try { const j = await res.json(); msg = j.message || msg; } catch { /* ignored */ }
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json.clubs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubs(); }, []);

  const filtered = data.filter((d) => {
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchCategory = categoryFilter === 'All' || d.category === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.shortName && d.shortName.toLowerCase().includes(q)) ||
      (d.slug && d.slug.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q));
    return matchStatus && matchCategory && matchSearch;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, order: data.length + 1 });
    setImagePreview(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      code: item.code || '',
      shortName: item.shortName || item.name || '',
      tagline: item.tagline || '',
      category: item.category || 'other',
      icon: item.icon || 'stethoscope',
      aim: item.aim || '',
      objectives: (item.objectives && item.objectives.length > 0) ? [...item.objectives] : [''],
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      imageFile: null,
    });
    if (item.coverImage) {
      setImagePreview(
        item.coverImage.startsWith('http')
          ? item.coverImage
          : `${API_URL}/uploads/${item.coverImage}`
      );
    } else {
      setImagePreview(null);
    }
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
    setImagePreview(null);
    setSaving(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleObjectiveChange = (index, value) => {
    const updated = [...form.objectives];
    updated[index] = value;
    setForm((prev) => ({ ...prev, objectives: updated }));
  };

  const addObjective = () => {
    setForm((prev) => ({ ...prev, objectives: [...prev.objectives, ''] }));
  };

  const removeObjective = (index) => {
    if (form.objectives.length <= 1) return;
    setForm((prev) => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Club name is required'); return; }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('slug', form.slug.trim());
    formData.append('code', form.code.trim());
    formData.append('shortName', form.shortName.trim() || form.name.trim());
    formData.append('tagline', form.tagline.trim());
    formData.append('category', form.category);
    formData.append('icon', form.icon);
    formData.append('aim', form.aim.trim());
    formData.append('order', form.order);
    formData.append('status', form.status);

    const validObjectives = form.objectives.map((o) => o.trim()).filter(Boolean);
    formData.append('objectives', JSON.stringify(validObjectives));

    if (form.imageFile) {
      formData.append('coverImage', form.imageFile);
    } else if (editItem && editItem.coverImage) {
      formData.append('coverImage', editItem.coverImage);
    }

    try {
      const targetId = editItem ? (editItem._id || editItem.slug) : null;
      const url = editItem ? `${API_URL}/api/clubs/${targetId}` : `${API_URL}/api/clubs`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });

      if (!res.ok) {
        let msg = 'Failed to save club';
        try { const errJson = await res.json(); msg = errJson.message || msg; } catch { /* ignored */ }
        throw new Error(msg);
      }

      closeModal();
      await fetchClubs();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clubs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let msg = 'Failed to delete club';
        try { const j = await res.json(); msg = j.message || msg; } catch { /* ignored */ }
        throw new Error(msg);
      }
      setDeleteConfirm(null);
      await fetchClubs();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setLoading(true);
    const toggledStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/clubs/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggledStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchClubs();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefaults = async () => {
    if (!window.confirm('Reset and re-seed all 12 default clubs with their complete content and images? Any customizations will be restored to defaults.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clubs/seed?force=true`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reseed clubs');
      await fetchClubs();
      alert('Successfully reseeded default clubs!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Clubs &amp; Committees</h2>
          <p>Manage student clubs, committees, and cells — their aims, objectives, images, and visibility on the frontend.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleReseedDefaults} disabled={loading} title="Reseed default 12 clubs">
            <MdRefresh /> Reseed Defaults
          </button>
          <button className="btn-primary" onClick={openAdd} disabled={loading}>
            <MdAdd /> Add Club
          </button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by name, slug, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} of {data.length} clubs</span>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading clubs: {error}. Please verify the backend is running.
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 80 }}>Image</th>
                <th>Club Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Objectives</th>
                <th>Status</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading clubs...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <MdGroups2 style={{ fontSize: 40, color: 'var(--text-muted)' }} />
                      <p>No clubs found.</p>
                      <button className="btn-secondary" style={{ marginTop: 10 }} onClick={handleReseedDefaults}>
                        <MdRefresh /> Seed Default Clubs
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const imageSrc = item.coverImage
                    ? (item.coverImage.startsWith('http') ? item.coverImage : `${API_URL}/uploads/${item.coverImage}`)
                    : null;

                  return (
                    <tr key={item._id}>
                      {/* Order */}
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MdGroups2 style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                          {item.order}
                        </span>
                      </td>

                      {/* Cover Image */}
                      <td>
                        <div style={{
                          width: 52, height: 40, borderRadius: 6, overflow: 'hidden',
                          background: '#f1f5f9', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', border: '1px solid var(--border)'
                        }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <MdImage style={{ fontSize: 20, color: 'var(--text-muted)' }} />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.shortName || ''}</div>
                      </td>

                      {/* Slug */}
                      <td>
                        <code style={{ fontSize: 12, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0', color: '#64748b' }}>
                          {item.slug}
                        </code>
                      </td>

                      {/* Category */}
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: '#5b21b6',
                          color: '#ffffff',
                          textTransform: 'capitalize',
                          display: 'inline-block',
                          letterSpacing: '0.3px'
                        }}>
                          {item.category}
                        </span>
                      </td>

                      {/* Objectives count */}
                      <td>
                        {item.objectives && item.objectives.length > 0 ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: '#0284c7',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            letterSpacing: '0.3px'
                          }}>
                            <MdFormatListBulleted style={{ verticalAlign: 'middle', marginRight: 4, color: '#ffffff' }} />
                            {item.objectives.length} items
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={loading}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            background: item.status === 'active' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: item.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          }}
                          title={`Click to mark as ${item.status === 'active' ? 'inactive' : 'active'}`}
                        >
                          {item.status === 'active' ? <MdVisibility /> : <MdVisibilityOff />}
                          {item.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => openEdit(item)} title="Edit" disabled={loading}>
                            <MdEdit />
                          </button>
                          <button className="btn-icon btn-icon--danger" onClick={() => setDeleteConfirm(item)} title="Delete" disabled={loading}>
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {modal && (
        <Modal open={true} onClose={closeModal} title={editItem ? `Edit: ${editItem.name}` : 'Add New Club'}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Row: Name + Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Club Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Student Nurses Association (SNA)"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input
                  className="form-input"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="01"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Row: Short Name + Slug */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Short Name</label>
                <input
                  className="form-input"
                  value={form.shortName}
                  onChange={(e) => setForm((p) => ({ ...p, shortName: e.target.value }))}
                  placeholder="SNA"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (URL ID)</label>
                <input
                  className="form-input"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="student-nurses-association"
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-generated from name if blank</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                className="form-input"
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="A short inspiring tagline for the club"
              />
            </div>

            {/* Row: Category + Icon + Order + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select className="form-input" value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}>
                  {ICON_OPTIONS.map((i) => (
                    <option key={i.name} value={i.name}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Order</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Cover Image */}
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 90, height: 70, borderRadius: 8, overflow: 'hidden',
                  background: '#f1f5f9', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <MdImage style={{ fontSize: 28, color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {editItem && editItem.coverImage && !form.imageFile
                      ? `Current: ${editItem.coverImage}`
                      : 'Upload JPG, PNG, or WebP — recommended 600×400px'}
                  </div>
                </div>
              </div>
            </div>

            {/* Aim */}
            <div className="form-group">
              <label className="form-label">Aim</label>
              <textarea
                className="form-input"
                rows={4}
                value={form.aim}
                onChange={(e) => setForm((p) => ({ ...p, aim: e.target.value }))}
                placeholder="Describe the aim of this club..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Objectives */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Objectives</span>
                <button type="button" className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={addObjective}>
                  + Add
                </button>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.objectives.map((obj, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>{idx + 1}.</span>
                    <input
                      className="form-input"
                      value={obj}
                      onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                      placeholder={`Objective ${idx + 1}`}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeObjective(idx)}
                      disabled={form.objectives.length <= 1}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--danger)', fontSize: 18, padding: '0 4px',
                        opacity: form.objectives.length <= 1 ? 0.3 : 1
                      }}
                      title="Remove"
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Club'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {deleteConfirm && (
        <Modal open={true} onClose={() => setDeleteConfirm(null)} title="Delete Club">
          <div style={{ padding: '8px 0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={loading}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(deleteConfirm._id)} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


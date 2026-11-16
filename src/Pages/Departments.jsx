import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdLayers,
  MdImage,
  MdCheckCircle,
  MdRefresh,
  MdVisibility,
  MdVisibilityOff,
  MdColorLens,
  MdFormatListBulleted,
  MdClose
} from 'react-icons/md';
import {
  FaHeartbeat,
  FaUserMd,
  FaUsers,
  FaBaby,
  FaBrain,
  FaFemale,
  FaStethoscope,
  FaFlask,
  FaHospital,
  FaHandHoldingHeart,
  FaSchool,
  FaAmbulance,
  FaSyringe,
  FaChild,
  FaSmile,
  FaAppleAlt,
  FaCommentMedical,
  FaHeadSideVirus,
  FaCalendarAlt,
  FaBabyCarriage,
  FaShieldAlt,
  FaCheckCircle as FaCheck,
  FaUniversity
} from 'react-icons/fa';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICON_OPTIONS = [
  { name: 'FaHeartbeat', label: 'Heartbeat (Fundamentals)', icon: FaHeartbeat },
  { name: 'FaUserMd', label: 'Doctor / Adult Care', icon: FaUserMd },
  { name: 'FaUsers', label: 'Community / Public Health', icon: FaUsers },
  { name: 'FaBaby', label: 'Baby / Paediatric', icon: FaBaby },
  { name: 'FaBrain', label: 'Brain / Mental Health', icon: FaBrain },
  { name: 'FaFemale', label: 'Female / Midwifery', icon: FaFemale },
  { name: 'FaStethoscope', label: 'Stethoscope', icon: FaStethoscope },
  { name: 'FaFlask', label: 'Lab Flask / Simulation', icon: FaFlask },
  { name: 'FaHospital', label: 'Hospital Building', icon: FaHospital },
  { name: 'FaHandHoldingHeart', label: 'Hand & Heart / Caring', icon: FaHandHoldingHeart },
  { name: 'FaSchool', label: 'School Health', icon: FaSchool },
  { name: 'FaAmbulance', label: 'Ambulance / Emergency', icon: FaAmbulance },
  { name: 'FaSyringe', label: 'Syringe / Clinical', icon: FaSyringe },
  { name: 'FaChild', label: 'Child', icon: FaChild },
  { name: 'FaSmile', label: 'Smile / Child Care', icon: FaSmile },
  { name: 'FaAppleAlt', label: 'Nutrition / Health', icon: FaAppleAlt },
  { name: 'FaCommentMedical', label: 'Counselling & Advice', icon: FaCommentMedical },
  { name: 'FaHeadSideVirus', label: 'Mental / Psychology', icon: FaHeadSideVirus },
  { name: 'FaCalendarAlt', label: 'Calendar / Events', icon: FaCalendarAlt },
  { name: 'FaBabyCarriage', label: 'Baby Carriage / Newborn', icon: FaBabyCarriage },
  { name: 'FaShieldAlt', label: 'Shield / Safety', icon: FaShieldAlt },
  { name: 'FaUniversity', label: 'University / Academy', icon: FaUniversity },
];

const PRESET_COLORS = [
  '#4b2e83', // Purple
  '#0f8ca6', // Teal / Cyan
  '#0f7a5a', // Green
  '#c2760c', // Orange
  '#7c3aed', // Violet
  '#b5456a', // Rose
  '#2563eb', // Royal Blue
  '#dc2626', // Red
];

const renderIconByName = (name, fallback = FaUniversity) => {
  const match = ICON_OPTIONS.find(i => i.name === name);
  const Comp = match ? match.icon : fallback;
  return <Comp />;
};

const emptyForm = {
  title: '',
  shortName: '',
  deptId: '',
  eyebrow: '',
  color: '#4b2e83',
  icon: 'FaHeartbeat',
  imageAlt: '',
  order: 0,
  status: 'active',
  descriptionText: '',
  highlights: [
    { icon: 'FaStethoscope', text: '' },
    { icon: 'FaFlask', text: '' }
  ],
  imageFile: null
};

export default function Departments() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/departments`);
      if (!res.ok) {
        let msg = 'Failed to fetch academic departments';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch { /* ignored */ }
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json.departments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filtered = data.filter(d => {
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.shortName && d.shortName.toLowerCase().includes(q)) ||
      (d.deptId && d.deptId.toLowerCase().includes(q)) ||
      (d.eyebrow && d.eyebrow.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({
      ...emptyForm,
      order: data.length + 1,
      eyebrow: `Department 0${data.length + 1}`
    });
    setImagePreview(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      shortName: item.shortName || item.title || '',
      deptId: item.deptId || '',
      eyebrow: item.eyebrow || '',
      color: item.color || '#4b2e83',
      icon: item.icon || 'FaHeartbeat',
      imageAlt: item.imageAlt || item.title || '',
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      descriptionText: Array.isArray(item.description) ? item.description.join('\n\n') : (item.description || ''),
      highlights: (item.highlights && item.highlights.length > 0)
        ? item.highlights.map(h => ({ icon: h.icon || 'FaCheckCircle', text: h.text || '' }))
        : [{ icon: 'FaStethoscope', text: '' }],
      imageFile: null
    });

    if (item.image) {
      if (item.image.startsWith('http')) {
        setImagePreview(item.image);
      } else {
        setImagePreview(`${API_URL}/uploads/${item.image}`);
      }
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
      setForm(prev => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleHighlightChange = (index, field, value) => {
    const updated = [...form.highlights];
    updated[index][field] = value;
    setForm(prev => ({ ...prev, highlights: updated }));
  };

  const addHighlightField = () => {
    setForm(prev => ({
      ...prev,
      highlights: [...prev.highlights, { icon: 'FaCheckCircle', text: '' }]
    }));
  };

  const removeHighlightField = (index) => {
    if (form.highlights.length <= 1) return;
    const updated = form.highlights.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, highlights: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Department title is required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('shortName', form.shortName.trim() || form.title.trim());
    formData.append('deptId', form.deptId.trim());
    formData.append('eyebrow', form.eyebrow.trim());
    formData.append('color', form.color.trim());
    formData.append('icon', form.icon.trim());
    formData.append('imageAlt', form.imageAlt.trim() || form.title.trim());
    formData.append('order', form.order);
    formData.append('status', form.status);

    // Split paragraphs
    const paragraphs = form.descriptionText
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);
    formData.append('description', JSON.stringify(paragraphs));

    // Highlights
    const validHighlights = form.highlights.filter(h => h.text.trim().length > 0);
    formData.append('highlights', JSON.stringify(validHighlights));

    if (form.imageFile) {
      formData.append('image', form.imageFile);
    } else if (editItem && editItem.image) {
      formData.append('image', editItem.image);
    }

    try {
      const targetId = editItem ? (editItem._id || editItem.deptId || editItem.id) : null;
      const url = editItem ? `${API_URL}/api/departments/${targetId}` : `${API_URL}/api/departments`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });

      if (!res.ok) {
        let msg = 'Failed to save department';
        try {
          const errJson = await res.json();
          msg = errJson.message || msg;
        } catch { /* ignored */ }
        throw new Error(msg);
      }

      closeModal();
      await fetchDepartments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        let msg = 'Failed to delete department';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch { /* ignored */ }
        throw new Error(msg);
      }
      setDeleteConfirm(null);
      await fetchDepartments();
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
      const res = await fetch(`${API_URL}/api/departments/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggledStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchDepartments();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefaults = async () => {
    if (!window.confirm('Reset and re-seed the default 6 SRM Academic Departments with their complete content and images? Any customizations will be restored to defaults.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/departments/seed?force=true`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to reseed departments');
      await fetchDepartments();
      alert('Successfully reseeded default academic departments!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Academic Departments</h2>
          <p>Manage the nursing departments, curriculum descriptions, highlights, lab images, and colors displayed on the frontend.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleReseedDefaults} disabled={loading} title="Reseed default 6 departments">
            <MdRefresh /> Reseed Defaults
          </button>
          <button className="btn-primary" onClick={openAdd} disabled={loading}>
            <MdAdd /> Add Department
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by title, tab label, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="filter-count">
          {filtered.length} of {data.length} departments
        </span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading departments: {error}. Please verify the backend is running.
        </div>
      )}

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Image</th>
                <th>Department Name</th>
                <th>Navbar Tab</th>
                <th>Slug (ID)</th>
                <th>Color & Icon</th>
                <th>Highlights</th>
                <th>Status</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading departments...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <MdLayers style={{ fontSize: 40, color: 'var(--text-muted)' }} />
                      <p>No academic departments found.</p>
                      <button className="btn-secondary" style={{ marginTop: 10 }} onClick={handleReseedDefaults}>
                        <MdRefresh /> Seed Default Departments
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const imageSrc = item.image
                    ? (item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`)
                    : null;

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MdLayers style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                          {item.order}
                        </span>
                      </td>
                      <td>
                        <div style={{
                          width: 52,
                          height: 40,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <MdImage style={{ fontSize: 20, color: 'var(--text-muted)' }} />
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.eyebrow}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {item.shortName || item.title}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0', color: '#64748b' }}>
                          #{item.deptId}
                        </code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: item.color || '#4b2e83',
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            title={`Color: ${item.color}`}
                          >
                            {renderIconByName(item.icon)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.icon}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          background: '#eff6ff',
                          color: '#2563eb',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontWeight: 500
                        }}>
                          <MdCheckCircle style={{ fontSize: 13 }} />
                          {item.highlights?.length || 0} items
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`status-badge ${item.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          style={{ border: 'none', cursor: 'pointer' }}
                          title="Click to toggle status"
                        >
                          {item.status === 'active' ? (
                            <>
                              <MdVisibility style={{ marginRight: 4 }} /> Active
                            </>
                          ) : (
                            <>
                              <MdVisibilityOff style={{ marginRight: 4 }} /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(item)}
                            title="Edit Department"
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => setDeleteConfirm(item)}
                            title="Delete Department"
                          >
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

      {/* ADD / EDIT MODAL */}
      {modal && (
        <Modal
          open={true}
          title={editItem ? 'Edit Academic Department' : 'Add Academic Department'}
          onClose={closeModal}
          size="lg"
        >
          <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 6 }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Department Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fundamentals of Nursing"
                  value={form.title}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      title: val,
                      shortName: prev.shortName ? prev.shortName : val,
                      deptId: prev.deptId ? prev.deptId : val.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                    }));
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Navbar Tab Label</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fundamentals"
                  value={form.shortName}
                  onChange={e => setForm(prev => ({ ...prev, shortName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Anchor ID / Slug</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. fundamentals"
                  value={form.deptId}
                  onChange={e => setForm(prev => ({ ...prev, deptId: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Eyebrow Text</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Department 01"
                  value={form.eyebrow}
                  onChange={e => setForm(prev => ({ ...prev, eyebrow: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.order}
                  onChange={e => setForm(prev => ({ ...prev, order: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Theme Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                    style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={form.color}
                    onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <span
                      key={c}
                      onClick={() => setForm(prev => ({ ...prev, color: c }))}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: form.color === c ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)'
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department Icon</label>
                <select
                  className="form-select"
                  value={form.icon}
                  onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.name} value={opt.name}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Preview: <span style={{ color: form.color, fontSize: 16 }}>{renderIconByName(form.icon)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Department & Laboratory Image</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 140,
                  height: 90,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                      <MdImage style={{ fontSize: 28, margin: '0 auto 4px' }} />
                      No Image
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-input"
                    style={{ padding: '6px' }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Upload a high quality photo of the laboratory, classroom, or department training (JPG/PNG).
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Image Alt Text (e.g. Fundamentals of Nursing Laboratory)"
                    value={form.imageAlt}
                    onChange={e => setForm(prev => ({ ...prev, imageAlt: e.target.value }))}
                    style={{ marginTop: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Description Paragraphs</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -4, marginBottom: 6 }}>
                Enter the department introduction. Separate multiple paragraphs by adding a blank line between them.
              </p>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Paragraph 1...&#10;&#10;Paragraph 2..."
                value={form.descriptionText}
                onChange={e => setForm(prev => ({ ...prev, descriptionText: e.target.value }))}
              />
            </div>

            {/* HIGHLIGHTS */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Key Features & Highlights</label>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={addHighlightField}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  <MdAdd /> Add Highlight
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.highlights.map((hl, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      className="form-select"
                      style={{ width: 180, flexShrink: 0 }}
                      value={hl.icon}
                      onChange={e => handleHighlightChange(idx, 'icon', e.target.value)}
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.name} value={opt.name}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Highlight #${idx + 1} (e.g. Structured clinical progression)`}
                      value={hl.text}
                      onChange={e => handleHighlightChange(idx, 'text', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {form.highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHighlightField(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: 4
                        }}
                        title="Remove highlight"
                      >
                        <MdClose style={{ fontSize: 18 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : (editItem ? 'Update Department' : 'Create Department')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <Modal
          open={true}
          title="Confirm Delete"
          onClose={() => setDeleteConfirm(null)}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
              Are you sure you want to delete the department <strong>{deleteConfirm.title}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              This will remove the department card and navbar link from the college website.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


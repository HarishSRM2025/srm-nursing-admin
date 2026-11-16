import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdImage,
  MdRefresh,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdFormatListBulleted,
  MdEco,
  MdPhotoLibrary,
} from 'react-icons/md';
import {
  FaBroom,
  FaTrashAlt,
  FaBan,
  FaTree,
  FaSolarPanel,
  FaShuttleVan,
  FaGasPump,
  FaTint,
  FaWater,
  FaWalking,
  FaLeaf,
  FaSeedling,
  FaRecycle,
  FaCheckCircle,
} from 'react-icons/fa';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICON_OPTIONS = [
  { name: 'FaLeaf', label: 'Leaf (General Green)', icon: FaLeaf },
  { name: 'FaBroom', label: 'Broom (Cleanliness)', icon: FaBroom },
  { name: 'FaTrashAlt', label: 'Trash / Segregation', icon: FaTrashAlt },
  { name: 'FaBan', label: 'Ban (Plastic Free)', icon: FaBan },
  { name: 'FaTree', label: 'Tree (Green Cover)', icon: FaTree },
  { name: 'FaSolarPanel', label: 'Solar Panel (Renewable Energy)', icon: FaSolarPanel },
  { name: 'FaShuttleVan', label: 'Shuttle / E-Vehicles', icon: FaShuttleVan },
  { name: 'FaGasPump', label: 'Gas Pump (Biogas)', icon: FaGasPump },
  { name: 'FaTint', label: 'Water Drop (Rainwater Harvesting)', icon: FaTint },
  { name: 'FaWater', label: 'Water Waves (Treatment & RO)', icon: FaWater },
  { name: 'FaWalking', label: 'Walking (Pedestrian Pathways)', icon: FaWalking },
  { name: 'FaSeedling', label: 'Seedling', icon: FaSeedling },
  { name: 'FaRecycle', label: 'Recycle', icon: FaRecycle },
];

const renderIconByName = (name) => {
  const match = ICON_OPTIONS.find((i) => i.name === name);
  const Comp = match ? match.icon : FaLeaf;
  return <Comp />;
};

const emptyInitiativeForm = {
  title: '',
  initiativeId: '',
  number: '',
  icon: 'FaLeaf',
  imageAlt: '',
  text: '',
  points: [{ label: '', icon: 'FaCheckCircle' }],
  metricValue: '',
  metricLabel: '',
  order: 0,
  status: 'active',
  imageFile: null,
};

const emptyGalleryForm = {
  title: '',
  alt: '',
  order: 0,
  status: 'active',
  imageFile: null,
};

export default function GreenCampus() {
  const [activeTab, setActiveTab] = useState('initiatives'); // 'initiatives' | 'gallery'

  // Initiatives State
  const [initiatives, setInitiatives] = useState([]);
  const [initSearch, setInitSearch] = useState('');
  const [initStatusFilter, setInitStatusFilter] = useState('All');
  const [initModal, setInitModal] = useState(false);
  const [editInit, setEditInit] = useState(null);
  const [initForm, setInitForm] = useState(emptyInitiativeForm);
  const [initImagePreview, setInitImagePreview] = useState(null);
  const [deleteInitConfirm, setDeleteInitConfirm] = useState(null);

  // Gallery State
  const [gallery, setGallery] = useState([]);
  const [galModal, setGalModal] = useState(false);
  const [editGal, setEditGal] = useState(null);
  const [galForm, setGalForm] = useState(emptyGalleryForm);
  const [galImagePreview, setGalImagePreview] = useState(null);
  const [deleteGalConfirm, setDeleteGalConfirm] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchInitiatives = async () => {
    try {
      const res = await fetch(`${API_URL}/api/green-campus/initiatives`);
      if (res.ok) {
        const j = await res.json();
        setInitiatives(j.initiatives || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API_URL}/api/green-campus/gallery`);
      if (res.ok) {
        const j = await res.json();
        setGallery(j.gallery || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchInitiatives(), fetchGallery()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered initiatives
  const filteredInitiatives = initiatives.filter((item) => {
    const matchStatus = initStatusFilter === 'All' || item.status === initStatusFilter;
    const q = initSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.initiativeId && item.initiativeId.toLowerCase().includes(q)) ||
      (item.number && item.number.toLowerCase().includes(q)) ||
      (item.text && item.text.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  // ─── Initiative Handlers ───
  const openAddInitiative = () => {
    setEditInit(null);
    const nextNum = String(initiatives.length + 1).padStart(2, '0');
    setInitForm({
      ...emptyInitiativeForm,
      number: nextNum,
      order: initiatives.length + 1,
    });
    setInitImagePreview(null);
    setInitModal(true);
  };

  const openEditInitiative = (item) => {
    setEditInit(item);
    setInitForm({
      title: item.title || '',
      initiativeId: item.initiativeId || '',
      number: item.number || '',
      icon: item.icon || 'FaLeaf',
      imageAlt: item.imageAlt || item.title || '',
      text: item.text || '',
      points: item.points && item.points.length > 0
        ? item.points.map((p) => ({ label: p.label || p, icon: p.icon || 'FaCheckCircle' }))
        : [{ label: '', icon: 'FaCheckCircle' }],
      metricValue: item.metric?.value || '',
      metricLabel: item.metric?.label || '',
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      imageFile: null,
    });

    if (item.image) {
      setInitImagePreview(
        item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`
      );
    } else {
      setInitImagePreview(null);
    }
    setInitModal(true);
  };

  const handleInitImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInitForm((p) => ({ ...p, imageFile: file }));
      setInitImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePointChange = (idx, value) => {
    const updated = [...initForm.points];
    updated[idx].label = value;
    setInitForm((p) => ({ ...p, points: updated }));
  };

  const addPointField = () => {
    setInitForm((p) => ({
      ...p,
      points: [...p.points, { label: '', icon: 'FaCheckCircle' }],
    }));
  };

  const removePointField = (idx) => {
    if (initForm.points.length <= 1) return;
    setInitForm((p) => ({
      ...p,
      points: p.points.filter((_, i) => i !== idx),
    }));
  };

  const handleInitiativeSubmit = async (e) => {
    e.preventDefault();
    if (!initForm.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('title', initForm.title.trim());
    formData.append('initiativeId', initForm.initiativeId.trim());
    formData.append('number', initForm.number.trim());
    formData.append('icon', initForm.icon);
    formData.append('imageAlt', initForm.imageAlt.trim() || initForm.title.trim());
    formData.append('text', initForm.text.trim());
    formData.append('order', initForm.order);
    formData.append('status', initForm.status);

    const validPoints = initForm.points
      .filter((p) => p.label && p.label.trim().length > 0)
      .map((p) => ({ label: p.label.trim(), icon: p.icon || 'FaCheckCircle' }));
    formData.append('points', JSON.stringify(validPoints));

    if (initForm.metricValue.trim()) {
      formData.append(
        'metric',
        JSON.stringify({
          value: initForm.metricValue.trim(),
          label: initForm.metricLabel.trim(),
        })
      );
    } else {
      formData.append('metric', 'null');
    }

    if (initForm.imageFile) {
      formData.append('image', initForm.imageFile);
    } else if (editInit && editInit.image) {
      formData.append('image', editInit.image);
    }

    try {
      const targetId = editInit ? (editInit._id || editInit.initiativeId) : null;
      const url = editInit
        ? `${API_URL}/api/green-campus/initiatives/${targetId}`
        : `${API_URL}/api/green-campus/initiatives`;
      const method = editInit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        let msg = 'Failed to save initiative';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch { /* ignored */ }
        throw new Error(msg);
      }

      setInitModal(false);
      setEditInit(null);
      await fetchInitiatives();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInitiative = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/green-campus/initiatives/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete initiative');
      setDeleteInitConfirm(null);
      await fetchInitiatives();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInitStatus = async (item) => {
    setLoading(true);
    const toggledStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/green-campus/initiatives/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggledStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchInitiatives();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Gallery Handlers ───
  const openAddGallery = () => {
    setEditGal(null);
    setGalForm({
      ...emptyGalleryForm,
      order: gallery.length + 1,
    });
    setGalImagePreview(null);
    setGalModal(true);
  };

  const openEditGallery = (item) => {
    setEditGal(item);
    setGalForm({
      title: item.title || '',
      alt: item.alt || '',
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      imageFile: null,
    });
    if (item.image) {
      setGalImagePreview(
        item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`
      );
    } else {
      setGalImagePreview(null);
    }
    setGalModal(true);
  };

  const handleGalImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGalForm((p) => ({ ...p, imageFile: file }));
      setGalImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!editGal && !galForm.imageFile) {
      alert('Image file is required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('title', galForm.title.trim());
    formData.append('alt', galForm.alt.trim() || galForm.title.trim());
    formData.append('order', galForm.order);
    formData.append('status', galForm.status);

    if (galForm.imageFile) {
      formData.append('image', galForm.imageFile);
    } else if (editGal && editGal.image) {
      formData.append('image', editGal.image);
    }

    try {
      const url = editGal
        ? `${API_URL}/api/green-campus/gallery/${editGal._id}`
        : `${API_URL}/api/green-campus/gallery`;
      const method = editGal ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        let msg = 'Failed to save gallery item';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch { /* ignored */ }
        throw new Error(msg);
      }

      setGalModal(false);
      setEditGal(null);
      await fetchGallery();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/green-campus/gallery/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete gallery item');
      setDeleteGalConfirm(null);
      await fetchGallery();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefaults = async () => {
    if (
      !window.confirm(
        'Reset and reseed default 10 Green Campus initiatives and 4 gallery photos? Any customizations will be restored.'
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/green-campus/seed?force=true`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to reseed');
      await loadData();
      alert('Successfully reseeded default Green Campus initiatives & gallery photos!');
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
          <h2>Green Campus Management</h2>
          <p>Manage eco-friendly campus initiatives, sustainability metrics, and the green campus gallery photos.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleReseedDefaults} disabled={loading} title="Reseed default Green Campus content">
            <MdRefresh /> Reseed Defaults
          </button>
          {activeTab === 'initiatives' ? (
            <button className="btn-primary" onClick={openAddInitiative} disabled={loading}>
              <MdAdd /> Add Initiative
            </button>
          ) : (
            <button className="btn-primary" onClick={openAddGallery} disabled={loading}>
              <MdAdd /> Add Photo
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabs Bar ─── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('initiatives')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            background: activeTab === 'initiatives' ? 'var(--primary)' : '#f1f5f9',
            color: activeTab === 'initiatives' ? '#ffffff' : '#64748b',
          }}
        >
          <MdEco /> Campus Initiatives ({initiatives.length})
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            background: activeTab === 'gallery' ? 'var(--primary)' : '#f1f5f9',
            color: activeTab === 'gallery' ? '#ffffff' : '#64748b',
          }}
        >
          <MdPhotoLibrary /> Photo Gallery ({gallery.length})
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error: {error}. Please ensure the backend is running.
        </div>
      )}

      {/* ─── TAB 1: INITIATIVES ─── */}
      {activeTab === 'initiatives' && (
        <>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <MdSearch />
              <input
                className="search-input"
                placeholder="Search by title, number, or keyword..."
                value={initSearch}
                onChange={(e) => setInitSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={initStatusFilter}
              onChange={(e) => setInitStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="filter-count">
              {filteredInitiatives.length} of {initiatives.length} initiatives
            </span>
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 80 }}>Image</th>
                    <th>Initiative Title</th>
                    <th>Icon</th>
                    <th>Key Points</th>
                    <th>Key Metric</th>
                    <th>Status</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && initiatives.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        Loading green campus initiatives...
                      </td>
                    </tr>
                  ) : filteredInitiatives.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <MdEco style={{ fontSize: 40, color: 'var(--text-muted)' }} />
                          <p>No initiatives found.</p>
                          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={handleReseedDefaults}>
                            <MdRefresh /> Seed Default Initiatives
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInitiatives.map((item) => {
                      const imageSrc = item.image
                        ? item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`
                        : null;

                      return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: '#f1f5f9',
                              fontSize: 12,
                            }}>
                              {item.number || item.order}
                            </span>
                          </td>
                          <td>
                            <div style={{
                              width: 54, height: 40, borderRadius: 6, overflow: 'hidden',
                              background: '#f1f5f9', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', border: '1px solid var(--border)'
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
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              <code>#{item.initiativeId}</code>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#10b981', color: '#ffffff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13
                              }}>
                                {renderIconByName(item.icon)}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.icon}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: '#0284c7',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              letterSpacing: '0.3px',
                            }}>
                              <MdFormatListBulleted style={{ verticalAlign: 'middle', marginRight: 4, color: '#ffffff' }} />
                              {item.points?.length || 0} points
                            </span>
                          </td>
                          <td>
                            {item.metric?.value ? (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 10px',
                                borderRadius: 20,
                                background: '#059669',
                                color: '#ffffff',
                                display: 'inline-block',
                              }}>
                                {item.metric.value} ({item.metric.label})
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleInitStatus(item)}
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
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-icon" onClick={() => openEditInitiative(item)} title="Edit" disabled={loading}>
                                <MdEdit />
                              </button>
                              <button className="btn-icon btn-icon--danger" onClick={() => setDeleteInitConfirm(item)} title="Delete" disabled={loading}>
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
        </>
      )}

      {/* ─── TAB 2: GALLERY ─── */}
      {activeTab === 'gallery' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {gallery.map((item) => {
            const imgSrc = item.image
              ? item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`
              : '';

            return (
              <div
                key={item._id}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ height: 160, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                  <img src={imgSrc} alt={item.alt || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: item.status === 'active' ? '#059669' : '#dc2626',
                    color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    {item.title || 'Green Campus Photo'}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Order: {item.order}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn-icon" onClick={() => openEditGallery(item)} title="Edit">
                    <MdEdit />
                  </button>
                  <button className="btn-icon btn-icon--danger" onClick={() => setDeleteGalConfirm(item)} title="Delete">
                    <MdDelete />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Initiative Add/Edit Modal ─── */}
      {initModal && (
        <Modal open={true} onClose={() => setInitModal(false)} title={editInit ? `Edit: ${editInit.title}` : 'Add Campus Initiative'}>
          <form onSubmit={handleInitiativeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title & Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Initiative Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={initForm.title}
                  onChange={(e) => setInitForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Clean Campus"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number</label>
                <input
                  className="form-input"
                  value={initForm.number}
                  onChange={(e) => setInitForm((p) => ({ ...p, number: e.target.value }))}
                  placeholder="01"
                />
              </div>
            </div>

            {/* Slug & Icon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Initiative ID (Slug)</label>
                <input
                  className="form-input"
                  value={initForm.initiativeId}
                  onChange={(e) => setInitForm((p) => ({ ...p, initiativeId: e.target.value }))}
                  placeholder="clean-campus"
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-generated if empty</span>
              </div>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select
                  className="form-input"
                  value={initForm.icon}
                  onChange={(e) => setInitForm((p) => ({ ...p, icon: e.target.value }))}
                >
                  {ICON_OPTIONS.map((i) => (
                    <option key={i.name} value={i.name}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Order</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={initForm.order}
                  onChange={(e) => setInitForm((p) => ({ ...p, order: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={initForm.status}
                  onChange={(e) => setInitForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Image */}
            <div className="form-group">
              <label className="form-label">Initiative Image</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 90, height: 70, borderRadius: 8, overflow: 'hidden',
                  background: '#f1f5f9', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {initImagePreview ? (
                    <img src={initImagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <MdImage style={{ fontSize: 28, color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handleInitImageChange} style={{ fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {editInit && editInit.image && !initForm.imageFile
                      ? `Current: ${editInit.image}`
                      : 'Recommended format: JPG/PNG/WebP'}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Description */}
            <div className="form-group">
              <label className="form-label">Description / Narrative</label>
              <textarea
                className="form-input"
                rows={3}
                value={initForm.text}
                onChange={(e) => setInitForm((p) => ({ ...p, text: e.target.value }))}
                placeholder="Describe the green campus initiative..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Metric (Optional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Key Metric (e.g. 425+)</label>
                <input
                  className="form-input"
                  value={initForm.metricValue}
                  onChange={(e) => setInitForm((p) => ({ ...p, metricValue: e.target.value }))}
                  placeholder="e.g. 425+"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Metric Label</label>
                <input
                  className="form-input"
                  value={initForm.metricLabel}
                  onChange={(e) => setInitForm((p) => ({ ...p, metricLabel: e.target.value }))}
                  placeholder="Trees planted across campus"
                />
              </div>
            </div>

            {/* Points / Highlights */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Key Highlights / Action Points</span>
                <button type="button" className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={addPointField}>
                  + Add Point
                </button>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {initForm.points.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 20 }}>{idx + 1}.</span>
                    <input
                      className="form-input"
                      value={p.label}
                      onChange={(e) => handlePointChange(idx, e.target.value)}
                      placeholder={`Highlight point ${idx + 1}`}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removePointField(idx)}
                      disabled={initForm.points.length <= 1}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--danger)', fontSize: 18, padding: '0 4px',
                        opacity: initForm.points.length <= 1 ? 0.3 : 1
                      }}
                      title="Remove"
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-secondary" onClick={() => setInitModal(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editInit ? 'Save Changes' : 'Add Initiative'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Gallery Add/Edit Modal ─── */}
      {galModal && (
        <Modal open={true} onClose={() => setGalModal(false)} title={editGal ? 'Edit Gallery Photo' : 'Add Gallery Photo'}>
          <form onSubmit={handleGallerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Photo Title / Caption</label>
              <input
                className="form-input"
                value={galForm.title}
                onChange={(e) => setGalForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Solar panels on rooftop"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alt Text</label>
              <input
                className="form-input"
                value={galForm.alt}
                onChange={(e) => setGalForm((p) => ({ ...p, alt: e.target.value }))}
                placeholder="Solar panels on rooftop"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Order</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={galForm.order}
                  onChange={(e) => setGalForm((p) => ({ ...p, order: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={galForm.status}
                  onChange={(e) => setGalForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Image File <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 90, height: 70, borderRadius: 8, overflow: 'hidden',
                  background: '#f1f5f9', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {galImagePreview ? (
                    <img src={galImagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <MdImage style={{ fontSize: 28, color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handleGalImageChange} style={{ fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {editGal && editGal.image && !galForm.imageFile
                      ? `Current: ${editGal.image}`
                      : 'Choose photo to upload'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-secondary" onClick={() => setGalModal(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editGal ? 'Save Changes' : 'Upload Photo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Initiative Confirm Modal ─── */}
      {deleteInitConfirm && (
        <Modal open={true} onClose={() => setDeleteInitConfirm(null)} title="Delete Initiative">
          <div style={{ padding: '8px 0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteInitConfirm.title}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setDeleteInitConfirm(null)} disabled={loading}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDeleteInitiative(deleteInitConfirm._id)} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* ─── Delete Gallery Confirm Modal ─── */}
      {deleteGalConfirm && (
        <Modal open={true} onClose={() => setDeleteGalConfirm(null)} title="Delete Photo">
          <div style={{ padding: '8px 0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete this photo from the Green Campus gallery?
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setDeleteGalConfirm(null)} disabled={loading}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDeleteGallery(deleteGalConfirm._id)} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


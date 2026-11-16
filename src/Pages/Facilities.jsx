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
  MdDomain,
  MdFormatListBulleted,
} from 'react-icons/md';
import {
  FiMonitor,
  FiUsers,
  FiBook,
  FiActivity,
  FiZap,
  FiMusic,
  FiTruck,
  FiHome,
  FiCoffee,
  FiWifi,
  FiShield,
  FiHeart,
} from 'react-icons/fi';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

const ICON_MAP = {
  FiMonitor,
  FiUsers,
  FiBook,
  FiActivity,
  FiZap,
  FiMusic,
  FiTruck,
  FiHome,
  FiCoffee,
  FiWifi,
  FiShield,
  FiHeart,
};

const ICON_OPTIONS = [
  { name: 'FiMonitor', label: 'Smart Class / Monitor', icon: FiMonitor },
  { name: 'FiUsers', label: 'Hall / Events / Community', icon: FiUsers },
  { name: 'FiBook', label: 'Library / Knowledge', icon: FiBook },
  { name: 'FiActivity', label: 'Laboratory / Clinical', icon: FiActivity },
  { name: 'FiZap', label: 'Sports & Athletics', icon: FiZap },
  { name: 'FiMusic', label: 'Cultural / Music', icon: FiMusic },
  { name: 'FiTruck', label: 'Transport / Bus', icon: FiTruck },
  { name: 'FiHome', label: 'Hostel / Residence', icon: FiHome },
  { name: 'FiCoffee', label: 'Canteen / Dining', icon: FiCoffee },
  { name: 'FiWifi', label: 'WiFi / Internet', icon: FiWifi },
  { name: 'FiShield', label: 'Security & Safety', icon: FiShield },
  { name: 'FiHeart', label: 'Health & Wellness', icon: FiHeart },
];

const renderIconByName = (name) => {
  const IconComp = ICON_MAP[name] || FiMonitor;
  return <IconComp />;
};

const TAG_OPTIONS = [
  'Academic',
  'Events',
  'Knowledge',
  'Clinical',
  'Wellness',
  'Culture',
  'Commute',
  'Residence',
  'Dining',
  'Campus',
];

const emptyForm = {
  tag: 'Academic',
  title: '',
  desc: '',
  icon: 'FiMonitor',
  features: [''],
  order: 0,
  status: 'active',
  imageFile: null,
};

export default function Facilities() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchFacilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/facilities`);
      if (!res.ok) {
        let msg = 'Failed to fetch facilities';
        try {
          const j = await res.json();
          msg = j.message || j.error || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json.facilities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const filtered = data.filter((item) => {
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchTag = tagFilter === 'All' || item.tag?.toLowerCase() === tagFilter.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.tag?.toLowerCase().includes(q) ||
      item.desc?.toLowerCase().includes(q);
    return matchStatus && matchTag && matchSearch;
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
      tag: item.tag || 'Academic',
      title: item.title || '',
      desc: item.desc || '',
      icon: item.icon || 'FiMonitor',
      features: item.features && item.features.length > 0 ? [...item.features] : [''],
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      imageFile: null,
    });
    if (item.img) {
      setImagePreview(
        item.img.startsWith('http') ? item.img : `${API_URL}/uploads/${item.img}`
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

  const handleFeatureChange = (index, value) => {
    const updated = [...form.features];
    updated[index] = value;
    setForm((prev) => ({ ...prev, features: updated }));
  };

  const addFeature = () => {
    setForm((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    if (form.features.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Facility title is required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('tag', form.tag.trim());
    formData.append('title', form.title.trim());
    formData.append('desc', form.desc.trim());
    formData.append('icon', form.icon);
    formData.append('order', form.order);
    formData.append('status', form.status);

    const validFeatures = form.features.map((f) => f.trim()).filter(Boolean);
    formData.append('features', JSON.stringify(validFeatures));

    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    try {
      const url = editItem
        ? `${API_URL}/api/facilities/${editItem._id}`
        : `${API_URL}/api/facilities`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        let msg = 'Failed to save facility';
        try {
          const errJson = await res.json();
          msg = errJson.error || errJson.message || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }

      closeModal();
      await fetchFacilities();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/facilities/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let msg = 'Failed to delete facility';
        try {
          const j = await res.json();
          msg = j.error || j.message || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }
      setDeleteConfirm(null);
      await fetchFacilities();
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
      const res = await fetch(`${API_URL}/api/facilities/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggledStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchFacilities();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefaults = async () => {
    if (
      !window.confirm(
        'Reset and re-seed all 9 default campus facilities with their full content, features, and images? Any custom changes will be overwritten.'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/facilities/seed?force=true`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reseed facilities');
      await fetchFacilities();
      alert('Successfully reseeded default facilities!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return filename.startsWith('http') ? filename : `${API_URL}/uploads/${filename}`;
  };

  return (
    <div>
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Campus Facilities</h2>
          <p>
            Manage campus infrastructure, smart classrooms, labs, sports, hostels, and dining amenities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={handleReseedDefaults}
            disabled={loading}
            title="Reset and populate the 9 default facilities"
          >
            <MdRefresh /> Reseed Defaults
          </button>
          <button className="btn-primary" onClick={openAdd} disabled={loading}>
            <MdAdd /> Add Facility
          </button>
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by title, tag, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="filter-select"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="All">All Tags</option>
          {TAG_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="filter-count">
          {filtered.length} of {data.length} facilities
        </span>
      </div>

      {/* ─── Error Notice ─── */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ⚠️ Error loading facilities: {error}. Please verify the backend is running.
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th style={{ width: 80 }}>Image</th>
                <th style={{ width: 220 }}>Facility Title</th>
                <th style={{ width: 110 }}>Tag</th>
                <th style={{ width: 70 }}>Icon</th>
                <th>Description</th>
                <th style={{ width: 140 }}>Features</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading facilities...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <MdDomain style={{ fontSize: 44, color: 'var(--text-muted)' }} />
                      <p>No facilities found.</p>
                      <button
                        className="btn-secondary"
                        style={{ marginTop: 10 }}
                        onClick={handleReseedDefaults}
                      >
                        <MdRefresh /> Seed Default Facilities
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const imgUrl = getImageUrl(item.img);
                  return (
                    <tr key={item._id || index}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                          {item.order || index + 1}
                        </span>
                      </td>
                      <td>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.title}
                            style={{
                              width: 56,
                              height: 40,
                              borderRadius: 6,
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              background: '#f1f5f9',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 56,
                              height: 40,
                              borderRadius: 6,
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <MdImage size={18} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            padding: '3px 9px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                          }}
                        >
                          {item.tag || 'General'}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: '#f8fafc',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            fontSize: 16,
                          }}
                          title={item.icon}
                        >
                          {renderIconByName(item.icon)}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: 360,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                          }}
                          title={item.desc}
                        >
                          {item.desc}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(14, 165, 233, 0.12)',
                            color: '#0284c7',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {item.features?.length || 0} features
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle status"
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <span
                            className={`badge ${
                              item.status === 'active' ? 'badge-success' : 'badge-danger'
                            }`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {item.status === 'active' ? (
                              <MdVisibility size={12} />
                            ) : (
                              <MdVisibilityOff size={12} />
                            )}
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(item)}
                            title="Edit Facility"
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => setDeleteConfirm(item)}
                            title="Delete Facility"
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

      {/* ─── Add / Edit Modal ─── */}
      {modal && (
        <Modal
          open={true}
          size="lg"
          title={editItem ? `Edit Facility: ${editItem.title}` : 'Add Campus Facility'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Facility Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Smart Class Rooms"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Tag <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  required
                  list="tag-options"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="e.g. Academic, Events, Clinical"
                />
                <datalist id="tag-options">
                  {TAG_OPTIONS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select
                  className="form-select"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.label} ({opt.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder="1, 2, 3..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                className="form-textarea"
                required
                rows={3}
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                placeholder="Detailed description of the campus facility..."
              />
            </div>

            {/* Key Features List */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Key Features / Amenities</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 10px', fontSize: 12 }}
                  onClick={addFeature}
                >
                  <MdAdd /> Add Feature
                </button>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {form.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>
                      {idx + 1}.
                    </span>
                    <input
                      className="form-input"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      placeholder={`Feature #${idx + 1} (e.g. Smart Boards)`}
                      style={{ flex: 1 }}
                    />
                    {form.features.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => removeFeature(idx)}
                        title="Remove"
                      >
                        <MdClose />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Facility Image</label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {imagePreview && (
              <div style={{ marginBottom: 8 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Image Preview:
                </label>
                <div style={{ marginTop: 6 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxHeight: 140,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <Modal
          open={true}
          title="Delete Facility"
          onClose={() => setDeleteConfirm(null)}
        >
          <p style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This facility will no longer be visible on the frontend.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeleteConfirm(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => handleDelete(deleteConfirm._id)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Facility'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

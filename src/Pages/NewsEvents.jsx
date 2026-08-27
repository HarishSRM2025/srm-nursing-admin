import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdCampaign, MdCloudUpload } from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  category: 'Events',
  tags: '',
  registrationFee: 'Free',
  registrationLink: '',
  status: 'Upcoming',
  isActive: 'ACTIVE',
  imageFiles: null,
  existingImages: []
};

const formatDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

export default function NewsEvents() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imgPreview, setImgPreview] = useState([]); // always an array
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/events/get-all-events`);
      if (!res.ok) throw new Error('Failed to fetch events from backend');
      const json = await res.json();
      setData(json.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = data.filter(d =>
    (catFilter === 'All' || d.category === catFilter) &&
    (statusFilter === 'All' || d.status === statusFilter) &&
    (d.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setImgPreview([]);
    setModal(true);
  };

  const openEdit = item => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      startDate: formatDateTimeLocal(item.startDate),
      endDate: formatDateTimeLocal(item.endDate),
      venue: item.venue || '',
      category: item.category || 'Events',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      registrationFee: item.registrationFee || 'Free',
      registrationLink: item.registrationLink || '',
      status: item.status || 'Upcoming',
      isActive: item.isActive || 'ACTIVE',
      imageFiles: null,           // no new files yet
      existingImages: item.image || []  // keep existing images from DB
    });

    if (item.image && item.image.length > 0) {
      const previews = item.image.map(img => {
        const normalized = img.replace(/\\/g, '/');
        return normalized.startsWith('http') ? normalized : `${API_URL}/${normalized}`;
      });
      setImgPreview(previews);
    } else {
      setImgPreview([]);
    }
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('startDate', form.startDate);
    formData.append('endDate', form.endDate);
    formData.append('venue', form.venue.trim());
    formData.append('category', form.category);
    formData.append('registrationFee', form.registrationFee.trim());
    formData.append('registrationLink', form.registrationLink.trim());
    formData.append('status', form.status);
    formData.append('isActive', form.isActive);

    // Process tags
    const parsedTags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(parsedTags));

    // Append new image files if any were selected
    if (form.imageFiles && form.imageFiles.length > 0) {
      for (let i = 0; i < form.imageFiles.length; i++) {
        formData.append('image', form.imageFiles[i]);
      }
    }

    // Always send existingImages when editing so backend can preserve them
    if (editItem) {
      formData.append('existingImages', JSON.stringify(form.existingImages));
    }

    try {
      let res;
      if (editItem) {
        res = await fetch(`${API_URL}/api/events/update-event/${editItem._id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/api/events/create-event`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        let errMsg = 'Failed to save event';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        } else {
          errMsg = await res.text();
        }
        throw new Error(errMsg);
      }

      closeModal();
      await fetchEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/delete-event/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      setDeleteConfirm(null);
      await fetchEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle new image file selection
  const handleImg = e => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setForm(f => ({ ...f, imageFiles: files }));
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      // Replace previews for new files but keep existing count in mind
      // New selections fully replace the "new files" portion
      setImgPreview([...form.existingImages.map(img => {
        const normalized = img.replace(/\\/g, '/');
        return normalized.startsWith('http') ? normalized : `${API_URL}/${normalized}`;
      }), ...previews]);
    }
  };

  // Remove a preview image
  const removePreview = (idx) => {
    const existingCount = form.existingImages.length;

    if (idx < existingCount) {
      // Removing an existing (already saved) image
      const updatedExisting = form.existingImages.filter((_, i) => i !== idx);
      setForm(f => ({ ...f, existingImages: updatedExisting }));
      setImgPreview(prev => prev.filter((_, i) => i !== idx));
    } else {
      // Removing a newly selected file preview
      // We can only remove from preview visually; FileList can't be mutated
      // So we rebuild imageFiles from remaining new previews via DataTransfer
      const newIdx = idx - existingCount;
      if (form.imageFiles) {
        const dt = new DataTransfer();
        Array.from(form.imageFiles).forEach((file, i) => {
          if (i !== newIdx) dt.items.add(file);
        });
        setForm(f => ({ ...f, imageFiles: dt.files.length > 0 ? dt.files : null }));
      }
      setImgPreview(prev => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Events Management</h2>
          <p>Publish college events, workshops, seminars, and cultural programs.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={loading}>
          <MdAdd /> Add Event
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Events">Events</option>
          <option value="Workshop">Workshop</option>
          <option value="Seminar">Seminar</option>
          <option value="Cultural">Cultural</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <span className="filter-count">{filtered.length} of {data.length} items</span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading events: {error}. Please verify the backend is running.
        </div>
      )}

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={8}><div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading events...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><MdCampaign /><p>No items found.</p></div></td></tr>
              ) : filtered.map((item, i) => {
                let imgSource = '';
                if (item.image && item.image.length > 0) {
                  const normalizedPath = item.image[0].replace(/\\/g, '/');
                  imgSource = normalizedPath.startsWith('http') ? normalizedPath : `${API_URL}/${normalizedPath}`;
                }
                return (
                  <tr key={item._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div className="table-img">
                        <img src={imgSource} alt={item.title} onError={e => e.target.style.display = 'none'} />
                      </div>
                    </td>
                    <td>
                      <div className="cell-primary" style={{ maxWidth: 220 }}>{item.title}</div>
                      <div className="cell-secondary" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{item.category}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.venue || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Completed' ? 'badge-active' : item.status === 'Cancelled' ? 'badge-inactive' : 'badge-pending'}`}>
                        <span className="badge-dot"></span>{item.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => openEdit(item)} disabled={loading}><MdEdit /> Edit</button>
                        <button className="btn-danger" onClick={() => setDeleteConfirm(item._id)} disabled={loading}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Event' : 'Add Event'}
        subtitle="Fill in the details for publishing the event"
        icon={<MdCampaign />}
        iconBg="#fce7f3"
        iconColor="#db2777"
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={closeModal} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editItem ? 'Update' : 'Publish'}
          </button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label">
              Featured Images
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
                (Select multiple images)
              </span>
            </label>
            <label className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImg}
                disabled={loading}
              />
              {imgPreview.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
                  {imgPreview.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                      />
                      {/* Badge: label existing vs new */}
                      <span style={{
                        position: 'absolute', bottom: 2, left: 2,
                        background: idx < form.existingImages.length ? 'rgba(16,185,129,0.85)' : 'rgba(99,102,241,0.85)',
                        color: 'white', fontSize: 9, borderRadius: 3, padding: '1px 4px', fontWeight: 600
                      }}>
                        {idx < form.existingImages.length ? 'Saved' : 'New'}
                      </span>
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); removePreview(idx); }}
                        disabled={loading}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          background: '#ef4444', color: 'white', border: 'none',
                          borderRadius: '50%', width: 20, height: 20,
                          cursor: 'pointer', fontSize: 14, lineHeight: '20px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0, fontWeight: 700
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {/* Add more tile */}
                  <div style={{
                    width: 80, height: 80, border: '2px dashed var(--border)',
                    borderRadius: 6, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text-muted)', fontSize: 28,
                    cursor: 'pointer', userSelect: 'none'
                  }}>+</div>
                </div>
              ) : (
                <div>
                  <div className="upload-icon"><MdCloudUpload /></div>
                  <div className="upload-text">
                    <p><strong>Click to upload</strong></p>
                    <span>PNG, JPG up to 5MB · Select multiple images</span>
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="form-group full">
            <label className="form-label">Title <span className="required">*</span></label>
            <input className="form-input" placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} disabled={loading}>
              <option value="Events">Events</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Cultural">Cultural</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input className="form-input" placeholder="Event venue" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date & Time</label>
            <input className="form-input" type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date & Time</label>
            <input className="form-input" type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Registration Fee</label>
            <input className="form-input" placeholder="e.g. Free, Rs. 100" value={form.registrationFee} onChange={e => setForm(f => ({ ...f, registrationFee: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Registration Link</label>
            <input className="form-input" placeholder="e.g. Google Forms URL" value={form.registrationLink} onChange={e => setForm(f => ({ ...f, registrationLink: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="e.g. Health, Workshop, Students" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} disabled={loading}>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Active State</label>
            <select className="form-select" value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))} disabled={loading}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="form-group full">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="4" placeholder="Full description of the event..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={loading} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Event"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={<>
          <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={loading}>Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} disabled={loading}
            style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </>}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Permanently delete this event item?</p>
      </Modal>
    </div>
  );
}
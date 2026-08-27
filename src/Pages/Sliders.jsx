import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdSlideshow, MdCloudUpload, MdImage } from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const emptyForm = { tagline: '', title: '', description: '', status: 'Active', order: '', image: '', imageFile: null };

export default function Sliders() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imgPreview, setImgPreview] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSliders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/slider/get-slider`);
      if (!res.ok) {
        throw new Error('Failed to fetch sliders');
      }
      const json = await res.json();
      setData(json.slider || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const filtered = data.filter(d =>
    (statusFilter === 'All' || d.Status === statusFilter) &&
    ((d.Title && d.Title.toLowerCase().includes(search.toLowerCase())) || 
     (d.Tag && d.Tag.toLowerCase().includes(search.toLowerCase())))
  );

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setImgPreview(''); setModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({
      tagline: item.Tag || '',
      title: item.Title || '',
      description: item.Description || '',
      status: item.Status || 'Active',
      order: item.Order || '',
      image: item.Image || '',
      imageFile: null
    });
    setImgPreview(`${API_URL}/uploads/${item.Image}`);
    setModal(true);
  };
  
  const closeModal = () => { setModal(false); setEditItem(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tagline.trim()) { alert('Tag Line is required'); return; }
    if (!form.title.trim()) { alert('Title is required'); return; }
    if (!form.description.trim()) { alert('Description is required'); return; }
    if (form.order === '') { alert('Display Order is required'); return; }
    if (!editItem && !form.imageFile) { alert('Please upload a slider image'); return; }

    setLoading(true);
    const formData = new FormData();
    formData.append('Tag', form.tagline.trim());
    formData.append('Title', form.title.trim());
    formData.append('Description', form.description.trim());
    formData.append('Status', form.status);
    formData.append('Order', Number(form.order));
    if (form.imageFile) {
      formData.append('Image', form.imageFile);
    }

    try {
      let res;
      if (editItem) {
        res = await fetch(`${API_URL}/api/slider/update-slider/${editItem._id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/api/slider/add-slider`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        let errMsg = 'Failed to save slider';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }

      closeModal();
      await fetchSliders();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/slider/delete-slider/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete slider');
      }
      setDeleteConfirm(null);
      await fetchSliders();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImg = e => {
    const file = e.target.files[0];
    if (file) {
      setImgPreview(URL.createObjectURL(file));
      setForm(f => ({ ...f, imageFile: file }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Home Sliders</h2>
          <p>Manage homepage hero slides, CTA buttons, and display status.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={loading}><MdAdd /> New Slider</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search sliders..." value={search} onChange={e => setSearch(e.target.value)} disabled={loading} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} disabled={loading}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span className="filter-count">{filtered.length} of {data.length} entries</span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading sliders: {error}. Please verify the backend is running.
        </div>
      )}

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Tag Line</th>
                <th>Title</th>
                <th>Description</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading sliders...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><MdSlideshow /><p>No sliders found.</p></div></td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item._id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                  <td>
                    <div className="table-img">
                      <img src={`${API_URL}/uploads/${item.Image}`} alt={item.Title} onError={e => e.target.style.display = 'none'} />
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.Tag}</td>
                  <td>
                    <span className="cell-primary">{item.Title}</span>
                  </td>
                  <td style={{ maxWidth: 260, color: 'var(--text-secondary)' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.Description}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-blue">{item.Order}</span>
                  </td>
                  <td>
                    <span className={`badge ${item.Status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      <span className="badge-dot"></span>{item.Status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => openEdit(item)} disabled={loading}><MdEdit /> Edit</button>
                      <button className="btn-danger" onClick={() => setDeleteConfirm(item._id)} disabled={loading}><MdDelete /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span className="pagination-info">Showing 1 to {filtered.length} of {filtered.length} entries</span>
          <div className="pagination-btns">
            <button className="page-btn" disabled>‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled>›</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Slider' : 'Add New Slider'}
        subtitle="Configure homepage hero slide details"
        icon={<MdSlideshow />}
        iconBg="#dbeafe"
        iconColor="#2563eb"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal} disabled={loading}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : editItem ? 'Update Slider' : 'Add Slider'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label">Slider Image {editItem ? '(Leave empty to keep existing)' : <span className="required">*</span>}</label>
            <label className="image-upload-area" style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleImg} disabled={loading} style={{ display: 'none' }} />
              {imgPreview ? (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%' }}>
                  <img src={imgPreview} alt="preview" className="img-preview" style={{ maxHeight: 120, objectFit: 'contain' }} />
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>
                    {form.imageFile ? form.imageFile.name : 'Using current image'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="upload-icon"><MdCloudUpload /></div>
                  <div className="upload-text">
                    <p><strong>Click to upload</strong> or drag and drop</p>
                    <span>PNG, JPG, WEBP up to 5MB — Recommended: 1920×700px</span>
                  </div>
                </div>
              )}
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Tag Line <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. Excellence in Nursing Education" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. SRM Nursing College" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group full">
            <label className="form-label">Description <span className="required">*</span></label>
            <textarea className="form-textarea" placeholder="Brief description shown below the title..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Display Order <span className="required">*</span></label>
            <input className="form-input" type="number" placeholder="1" min="1" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} disabled={loading}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Slider"
        subtitle="This action cannot be undone"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={loading}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={loading} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Are you sure you want to delete this slider? The image and all associated data will be permanently removed.</p>
      </Modal>
    </div>
  );
}

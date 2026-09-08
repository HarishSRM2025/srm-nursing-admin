import React, { useState, useEffect, useMemo } from 'react';
import {
  MdMail,
  MdPhone,
  MdSearch,
  MdDelete,
  MdCheckCircle,
  MdPendingActions,
  MdMarkEmailRead,
  MdFilterList,
  MdVisibility,
  MdSend,
  MdBusiness,
  MdAdd,
  MdEdit,
  MdRefresh
} from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ITEMS_PER_PAGE = 10;

export default function Enquiries() {
  const [activeTab, setActiveTab] = useState('enquiries'); // 'enquiries' | 'departments'
  const [contacts, setContacts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Department modal states
  const [deptModal, setDeptModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', desc: '', email: '', phone: '', img: '', status: 'active' });
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState(null);

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/contact`);
      if (!res.ok) throw new Error('Failed to fetch contact enquiries');
      const json = await res.json();
      if (json && json.contacts) {
        setContacts(json.contacts);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/department`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.departments) {
          setDepartments(json.departments);
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchDepartments();
  }, []);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchSource = sourceFilter === 'All' || (c.source && c.source.toLowerCase().includes(sourceFilter.toLowerCase()));
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.message && c.message.toLowerCase().includes(q));

      return matchStatus && matchSource && matchSearch;
    });
  }, [contacts, search, statusFilter, sourceFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  const handlePageChange = p => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // Update Status
  const handleUpdateStatus = async (id, newStatus, currentNotes) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: currentNotes })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchContacts();
      if (selectedContact && selectedContact._id === id) {
        setSelectedContact(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Contact
  const handleDeleteContact = async id => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete enquiry');
      setDeleteConfirm(null);
      if (selectedContact && selectedContact._id === id) {
        setSelectedContact(null);
      }
      await fetchContacts();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Department Handlers
  const openAddDept = () => {
    setEditDept(null);
    setDeptForm({ name: '', desc: '', email: '', phone: '', img: '', status: 'active' });
    setDeptModal(true);
  };

  const openEditDept = d => {
    setEditDept(d);
    setDeptForm({
      name: d.name || '',
      desc: d.desc || '',
      email: d.email || '',
      phone: d.phone || '',
      img: d.img || '',
      status: d.status || 'active'
    });
    setDeptModal(true);
  };

  const handleSaveDept = async e => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.email) {
      alert('Department name and email are required');
      return;
    }
    setLoading(true);
    try {
      const url = editDept ? `${API_URL}/api/department/${editDept._id}` : `${API_URL}/api/department`;
      const method = editDept ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm)
      });
      if (!res.ok) throw new Error('Failed to save department');
      setDeptModal(false);
      await fetchDepartments();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async id => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/department/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      setDeleteDeptConfirm(null);
      await fetchDepartments();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'new':
        return <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}><span className="badge-dot" style={{ background: '#dc2626' }}></span>New</span>;
      case 'in-progress':
        return <span className="badge" style={{ background: '#fef3c7', color: '#d97706' }}><span className="badge-dot" style={{ background: '#d97706' }}></span>In Progress</span>;
      case 'contacted':
        return <span className="badge" style={{ background: '#dbeafe', color: '#2563eb' }}><span className="badge-dot" style={{ background: '#2563eb' }}></span>Contacted</span>;
      case 'resolved':
        return <span className="badge" style={{ background: '#d1fae5', color: '#059669' }}><span className="badge-dot" style={{ background: '#059669' }}></span>Resolved</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Contact Enquiries & Departments</h2>
          <p>Review messages received from "Get In Touch With Us" & "Talk To Us", and manage department contacts.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => { fetchContacts(); fetchDepartments(); }} disabled={loading}>
            <MdRefresh /> Refresh
          </button>
          {activeTab === 'departments' && (
            <button className="btn-primary" onClick={openAddDept}>
              <MdAdd /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('enquiries')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'enquiries' ? 'var(--primary)' : '#f1f5f9',
            color: activeTab === 'enquiries' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <MdMail /> Enquiries & Messages ({contacts.length})
        </button>
        {/*<button
          onClick={() => setActiveTab('departments')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'departments' ? 'var(--primary)' : '#f1f5f9',
            color: activeTab === 'departments' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
           <MdBusiness /> General Enquiries by Department ({departments.length}) 
        </button>
          */}
      </div>

      {activeTab === 'enquiries' ? (
        <>
          {/* Stats Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}>
            <div style={{
              background: 'white',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(75, 46, 131, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22
              }}>
                <MdMail />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total || contacts.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Inquiries</div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22
              }}>
                <MdPendingActions />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.new}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>New Messages</div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22
              }}>
                <MdMarkEmailRead />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.inProgress}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>In Progress</div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22
              }}>
                <MdCheckCircle />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.resolved}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Resolved</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="search-input-wrap">
              <MdSearch />
              <input
                className="search-input"
                placeholder="Search by name, email, phone, or message keywords..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              className="filter-select"
              value={sourceFilter}
              onChange={e => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Sources</option>
              <option value="Home">Home - Get In Touch</option>
              <option value="Contact Page">Contact Page - Talk To Us</option>
            </select>

            <span className="filter-count">
              {filteredContacts.length} of {contacts.length} enquiries
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
              ⚠️ Error loading enquiries: {error}
            </div>
          )}

          {/* Table */}
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 180 }}>Sender</th>
                    <th style={{ width: 180 }}>Subject / Program</th>
                    <th>Message</th>
                    <th style={{ width: 140 }}>Source</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>Loading enquiries...</div>
                      </td>
                    </tr>
                  ) : paginatedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <MdMail />
                          <p>No enquiries found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((c, i) => {
                      const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                      return (
                        <tr key={c._id || itemIndex}>
                          <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{itemIndex}</td>
                          <td>
                            <div>
                              <span className="cell-primary" style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>
                                {c.name}
                              </span>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                                <span>{c.email}</span>
                                {c.phone && <span>{c.phone}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                              {c.subject || c.program || 'General Enquiry'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <p style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                              maxWidth: 340,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {c.message}
                            </p>
                          </td>
                          <td>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '3px 8px',
                              background: 'var(--body-bg)',
                              borderRadius: 4,
                              color: 'var(--text-secondary)'
                            }}>
                              {c.source || 'Contact Form'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'inline-block' }}>
                              {getStatusBadge(c.status || 'new')}
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button
                                className="btn-edit"
                                onClick={() => setSelectedContact(c)}
                                title="View details"
                              >
                                <MdVisibility /> View
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => setDeleteConfirm(c._id)}
                                title="Delete enquiry"
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

            {/* Pagination */}
            <div className="table-pagination">
              <span className="pagination-info">
                Showing {filteredContacts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredContacts.length)} of {filteredContacts.length} entries
              </span>
              <div className="pagination-btns">
                <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    className={`page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Departments Management Tab */
        // <div>
        //   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        //     {departments.map((d, i) => (
        //       <div
        //         key={d._id || i}
        //         style={{
        //           background: 'white',
        //           borderRadius: 16,
        //           overflow: 'hidden',
        //           border: '1px solid var(--border-light)',
        //           boxShadow: 'var(--shadow-sm)',
        //           display: 'flex',
        //           flexDirection: 'column'
        //         }}
        //       >
        //         {d.img && (
        //           <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
        //             <img
        //               src={d.img}
        //               alt={d.name}
        //               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        //               onError={e => { e.target.style.display = 'none'; }}
        //             />
        //           </div>
        //         )}
        //         <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        //           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        //             <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</h3>
        //             <span className={`badge ${d.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
        //               <span className="badge-dot"></span>{d.status}
        //             </span>
        //           </div>

        //           <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 14, flex: 1 }}>
        //             {d.desc}
        //           </p>

        //           <div style={{ background: 'var(--body-bg)', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
        //             <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        //               <MdMail /> {d.email}
        //             </div>
        //             {d.phone && (
        //               <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        //                 <MdPhone /> {d.phone}
        //               </div>
        //             )}
        //           </div>

        //           <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        //             <button className="btn-edit" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEditDept(d)}>
        //               <MdEdit /> Edit Department
        //             </button>
        //             <button className="btn-danger" onClick={() => setDeleteDeptConfirm(d._id)}>
        //               <MdDelete />
        //             </button>
        //           </div>
        //         </div>
        //       </div>
        //     ))}
        //   </div>
        // </div>

        <></>
      )}

      {/* View Enquiry Details Modal */}
      <Modal
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Enquiry Details"
        subtitle={`Submitted on ${selectedContact?.createdAt ? new Date(selectedContact.createdAt).toLocaleString() : 'N/A'}`}
        icon={<MdMail />}
        iconBg="rgba(75, 46, 131, 0.1)"
        iconColor="var(--primary)"
        size="lg"
        footer={
          <>
            <a
              href={`mailto:${selectedContact?.email}?subject=Regarding your enquiry: ${encodeURIComponent(selectedContact?.subject || '')}`}
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <MdSend /> Reply via Email
            </a>
            <button className="btn-secondary" onClick={() => setSelectedContact(null)}>
              Close
            </button>
          </>
        }
      >
        {selectedContact && (
          <div>
            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
              <div style={{ background: 'var(--body-bg)', padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sender Name</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedContact.name}</p>
              </div>

              <div style={{ background: 'var(--body-bg)', padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>{selectedContact.email}</p>
              </div>

              <div style={{ background: 'var(--body-bg)', padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{selectedContact.phone || 'Not provided'}</p>
              </div>

              <div style={{ background: 'var(--body-bg)', padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source / Origin</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedContact.source || 'General Contact'}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject / Program</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {selectedContact.subject || selectedContact.program || 'General Enquiry'}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Message Content</span>
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                padding: 16,
                marginTop: 6,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line'
              }}>
                {selectedContact.message}
              </div>
            </div>

            {/* Change Status Control */}
            <div style={{
              background: '#f1f5f9',
              padding: 16,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Update Lead Status:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['new', 'in-progress', 'contacted', 'resolved'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selectedContact._id, s, selectedContact.notes)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      border: 'none',
                      cursor: 'pointer',
                      background: selectedContact.status === s ? 'var(--primary)' : 'white',
                      color: selectedContact.status === s ? 'white' : 'var(--text-secondary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Department Modal */}
      <Modal
        open={deptModal}
        onClose={() => setDeptModal(false)}
        title={editDept ? 'Edit Department Contact' : 'Add Department Contact'}
        subtitle="Configure general enquiry contacts for specific college departments"
        icon={<MdBusiness />}
        iconBg="rgba(75, 46, 131, 0.1)"
        iconColor="var(--primary)"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeptModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveDept} disabled={loading}>
              {loading ? 'Saving...' : editDept ? 'Update Department' : 'Add Department'}
            </button>
          </>
        }
      >
        <div className="form-grid cols-1">
          <div className="form-group">
            <label className="form-label">Department Name <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Admissions Office"
              value={deptForm.name}
              onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Scope <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Course details, eligibility & seat enquiries."
              value={deptForm.desc}
              onChange={e => setDeptForm({ ...deptForm, desc: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email <span className="required">*</span></label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. admissions@nc.srmtrichy.edu.in"
              value={deptForm.email}
              onChange={e => setDeptForm({ ...deptForm, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (Optional)</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={deptForm.img}
              onChange={e => setDeptForm({ ...deptForm, img: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={deptForm.status}
              onChange={e => setDeptForm({ ...deptForm, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Contact Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Enquiry"
        subtitle="This action cannot be undone"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => handleDeleteContact(deleteConfirm)}
              disabled={loading}
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Are you sure you want to permanently delete this contact inquiry?
        </p>
      </Modal>

      {/* Delete Department Modal */}
      <Modal
        open={!!deleteDeptConfirm}
        onClose={() => setDeleteDeptConfirm(null)}
        title="Delete Department"
        subtitle="This action cannot be undone"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteDeptConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => handleDeleteDept(deleteDeptConfirm)}
              disabled={loading}
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Are you sure you want to delete this department contact card?
        </p>
      </Modal>
    </div>
  );
}

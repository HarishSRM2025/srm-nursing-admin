import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSlideshow,
  MdCampaign,
  MdNewspaper,
  MdGroups,
  MdScience,
  MdMail,
  MdEmojiEvents,
  MdArrowForward,
  MdCheckCircle,
  MdAdd
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    enquiries: '...',
    sliders: '...',
    events: '...',
    newsletters: '...',
    leadership: '...',
    publications: '...',
    achievements: '...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllCounts = async () => {
      try {
        const [contactRes, slidersRes, eventsRes, newslettersRes, leadershipRes, pubsRes, achieveRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/contact`),
          fetch(`${API_URL}/api/slider/get-slider`),
          fetch(`${API_URL}/api/events/get-all-events`),
          fetch(`${API_URL}/api/newsletter`),
          fetch(`${API_URL}/api/leadership/get`),
          fetch(`${API_URL}/api/publication`),
          fetch(`${API_URL}/api/achievement`)
        ]);

        let contactCount = 0;
        if (contactRes.status === 'fulfilled' && contactRes.value.ok) {
          const cJson = await contactRes.value.json();
          contactCount = cJson.total !== undefined ? cJson.total : (Array.isArray(cJson.contacts) ? cJson.contacts.length : 0);
        }

        let slidersCount = 0;
        if (slidersRes.status === 'fulfilled' && slidersRes.value.ok) {
          const sJson = await slidersRes.value.json();
          slidersCount = Array.isArray(sJson) ? sJson.length : sJson.sliders ? sJson.sliders.length : (sJson.data ? sJson.data.length : 0);
        }

        let eventsCount = 0;
        if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
          const eJson = await eventsRes.value.json();
          eventsCount = Array.isArray(eJson) ? eJson.length : eJson.events ? eJson.events.length : 0;
        }

        let newslettersCount = 0;
        if (newslettersRes.status === 'fulfilled' && newslettersRes.value.ok) {
          const nJson = await newslettersRes.value.json();
          newslettersCount = Array.isArray(nJson) ? nJson.length : nJson.newsletters ? nJson.newsletters.length : 0;
        }

        let leadershipCount = 0;
        if (leadershipRes.status === 'fulfilled' && leadershipRes.value.ok) {
          const lJson = await leadershipRes.value.json();
          leadershipCount = Array.isArray(lJson) ? lJson.length : lJson.data ? lJson.data.length : (lJson.leadership ? lJson.leadership.length : 0);
        }

        let pubsCount = 0;
        if (pubsRes.status === 'fulfilled' && pubsRes.value.ok) {
          const pJson = await pubsRes.value.json();
          pubsCount = Array.isArray(pJson) ? pJson.length : pJson.publications ? pJson.publications.length : 0;
        }

        let achievementsCount = 0;
        if (achieveRes.status === 'fulfilled' && achieveRes.value.ok) {
          const aJson = await achieveRes.value.json();
          achievementsCount = aJson.total !== undefined ? aJson.total : (Array.isArray(aJson.achievements) ? aJson.achievements.length : 0);
        }

        setCounts({
          enquiries: contactCount,
          sliders: slidersCount,
          events: eventsCount,
          newsletters: newslettersCount,
          leadership: leadershipCount,
          publications: pubsCount,
          achievements: achievementsCount
        });
      } catch (err) {
        console.error('Error fetching dashboard counts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCounts();
  }, []);

  const modules = [
    {
      title: 'Contact Enquiries',
      count: counts.enquiries,
      route: '/enquiries',
      icon: MdMail,
      color: 'red',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      desc: 'Messages from "Get In Touch With Us" & "Talk To Us"'
    },
    {
      title: 'Home Sliders',
      count: counts.sliders,
      route: '/sliders',
      icon: MdSlideshow,
      color: 'teal',
      badgeBg: '#cffafe',
      badgeColor: '#0891b2',
      desc: 'Active Hero Sliders & Banners on the homepage'
    },
    {
      title: 'News & Events',
      count: counts.events,
      route: '/news-events',
      icon: MdCampaign,
      color: 'orange',
      badgeBg: '#fef3c7',
      badgeColor: '#d97706',
      desc: 'College news, workshops, conferences, and celebrations'
    },
    {
      title: 'Newsletters',
      count: counts.newsletters,
      route: '/newsletters',
      icon: MdNewspaper,
      color: 'purple',
      badgeBg: '#ede9fe',
      badgeColor: '#7c3aed',
      desc: 'Monthly & annual college newsletters in PDF format'
    },
    {
      title: 'Leadership',
      count: counts.leadership,
      route: '/leadership',
      icon: MdGroups,
      color: 'blue',
      badgeBg: '#dbeafe',
      badgeColor: '#2563eb',
      desc: 'Chairman, Dean, Principal, and Management leadership profiles'
    },
    {
      title: 'Research & Publications',
      count: counts.publications,
      route: '/research',
      icon: MdScience,
      color: 'purple',
      badgeBg: 'rgba(75, 46, 131, 0.1)',
      badgeColor: 'var(--primary)',
      desc: 'Faculty research papers, journal articles, and certifications'
    },
    {
      title: 'Student Achievements',
      count: counts.achievements,
      route: '/achievements',
      icon: MdEmojiEvents,
      color: 'green',
      badgeBg: '#d1fae5',
      badgeColor: '#059669',
      desc: 'Student awards, merit certificates, and competition achievements'
    }
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
        color: 'white',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '4px 12px',
            borderRadius: 50,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 10
          }}>
            <MdCheckCircle /> Backend Connected & Live
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>
            SRM Trichy College of Nursing Admin
          </h2>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>
            Manage all live website modules with instant database synchronization.
          </p>
        </div>
      </div>

      {/* Integrated Modules Grid */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        Backend Integrated Modules
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 18,
        marginBottom: 30
      }}>
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(m.route)}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '22px 24px',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--primary-light)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: m.badgeBg,
                    color: m.badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    <Icon />
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    {loading ? '...' : m.count}
                  </div>
                </div>

                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {m.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  {m.desc}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid var(--border-light)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--primary)'
              }}>
                <span>Manage Records</span>
                <MdArrowForward />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>Quick Navigation</h3>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          padding: '16px 0 6px'
        }}>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: '#dc2626' }}
            onClick={() => navigate('/enquiries')}
          >
            <MdMail /> View Enquiries
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px' }}
            onClick={() => navigate('/sliders')}
          >
            <MdSlideshow /> Manage Sliders
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: '#d97706' }}
            onClick={() => navigate('/news-events')}
          >
            <MdCampaign /> Manage Events
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: '#7c3aed' }}
            onClick={() => navigate('/newsletters')}
          >
            <MdNewspaper /> Manage Newsletters
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: '#2563eb' }}
            onClick={() => navigate('/leadership')}
          >
            <MdGroups /> Manage Leadership
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: 'var(--primary)' }}
            onClick={() => navigate('/research')}
          >
            <MdScience /> Manage Research
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px', background: '#059669' }}
            onClick={() => navigate('/achievements')}
          >
            <MdEmojiEvents /> Student Achievements
          </button>
        </div>
      </div>
    </div>
  );
}

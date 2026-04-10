import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/admin', label: 'ड्यासबोर्ड' },
  { path: '/admin/articles', label: 'लेखहरू' },
  { path: '/admin/books', label: 'पुस्तकहरू' },
  { path: '/admin/interviews', label: 'अन्तर्वार्ताहरू' },
  { path: '/admin/songs', label: 'गीतहरू' },
];

export default function AdminNav() {
  const location = useLocation();

  return (
    <nav style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem 2rem',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      fontFamily: 'var(--font-body)',
      flexWrap: 'wrap',
    }}>
      {navLinks.map(({ path, label }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              color: isActive ? 'white' : 'var(--text-primary)',
              background: isActive ? 'var(--crimson)' : 'transparent',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'background 0.2s',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

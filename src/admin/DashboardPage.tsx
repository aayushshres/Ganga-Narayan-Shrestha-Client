import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles, fetchBooks, fetchInterviews, fetchSongs } from '../api/index';
import type { Article } from '../types';

export default function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [bookCount, setBookCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [songCount, setSongCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchArticles(), fetchBooks(), fetchInterviews(), fetchSongs()])
      .then(([fetchedArticles, fetchedBooks, fetchedInterviews, fetchedSongs]) => {
        setArticles(fetchedArticles);
        setBookCount(fetchedBooks.length);
        setInterviewCount(fetchedInterviews.length);
        setSongCount(fetchedSongs.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>लोड हुँदैछ...</p>;
  }

  const articleCount = articles.filter((a) => a.category === 'article').length;
  const literatureCount = articles.filter((a) => a.category === 'literature').length;
  const recentArticles = articles.slice(0, 5);

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <div style={{
      background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px',
      border: '1px solid var(--border-color)', flex: 1, minWidth: '200px',
      boxShadow: 'var(--shadow)',
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '1rem', fontFamily: 'var(--font-body)' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '2rem' }}>ड्यासबोर्ड</h2>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
        <StatCard title="लेखहरू" value={articles.length} />
        <StatCard title="लेख" value={articleCount} />
        <StatCard title="साहित्य" value={literatureCount} />
        <StatCard title="पुस्तकहरू" value={bookCount} />
        <StatCard title="अन्तर्वार्ताहरू" value={interviewCount} />
        <StatCard title="गीतहरू" value={songCount} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>हालका लेखहरू</h3>
      <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {recentArticles.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>कुनै लेख उपलब्ध छैन।</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {recentArticles.map((a, idx) => (
              <li key={a._id} style={{
                padding: '1rem 1.5rem',
                borderBottom: idx === recentArticles.length - 1 ? 'none' : '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <span style={{ background: 'var(--crimson)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {a.category === 'article' ? 'लेख' : 'साहित्य'}
                </span>
                <span style={{ fontWeight: '500' }}>{a.title}</span>
                <Link to="/admin/articles" style={{ marginLeft: 'auto', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  व्यवस्थापन →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

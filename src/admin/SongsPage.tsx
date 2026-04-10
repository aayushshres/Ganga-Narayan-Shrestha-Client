import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSongs, createSong, updateSong, deleteSong } from '../api/index';
import type { Song, SongFormData } from '../types';

const inputStyle = {
  padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%',
  fontFamily: 'var(--font-body)', fontSize: '1rem', boxSizing: 'border-box' as const,
};
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' as const };

export default function SongsPage() {
  const { token } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SongFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadSongs = () => {
    setLoading(true);
    fetchSongs().then(setSongs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadSongs(); }, []);

  const handleAdd = async () => {
    if (!token || !title || !youtubeId) return;
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    const data: SongFormData = { title, youtubeId, order: 0 };
    try {
      await createSong(data, token);
      setSubmitSuccess('गीत सफलतापूर्वक थपियो!');
      setTitle(''); setYoutubeId('');
      loadSongs();
      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm('यो गीत मेट्ने?')) return;
    try {
      await deleteSong(id, token);
      setSongs(songs.filter((s) => s._id !== id));
    } catch (err: unknown) { alert((err as Error).message || 'Unknown error'); }
  };

  const startEdit = (s: Song) => {
    setEditId(s._id);
    setEditData({ title: s.title, youtubeId: s.youtubeId, order: s.order });
  };

  const handleSave = async () => {
    if (!token || !editId) return;
    setIsSaving(true);
    try {
      const updated = await updateSong(editId, editData, token);
      setSongs(songs.map((s) => (s._id === editId ? updated : s)));
      setEditId(null);
    } catch (err: unknown) { alert((err as Error).message || 'Unknown error'); }
    finally { setIsSaving(false); }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>नयाँ गीत थप्नुहोस्</h2>

      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>शीर्षक</label>
          <input type="text" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>YouTube ID</label>
          <input type="text" style={inputStyle} value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          {submitSuccess && <p style={{ color: 'green', marginBottom: '1rem' }}>{submitSuccess}</p>}
          {submitError && <p style={{ color: '#D32F2F', marginBottom: '1rem' }}>{submitError}</p>}
          <button onClick={handleAdd} disabled={isSubmitting} style={{ background: 'var(--crimson)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
            {isSubmitting ? 'थप्दैछ...' : 'थप्नुहोस्'}
          </button>
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>गीतहरू</h2>

      {loading ? <p>लोड हुँदैछ...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>शीर्षक</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>कार्यहरू</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((s) => (
              editId === s._id ? (
                <tr key={s._id}>
                  <td colSpan={2} style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>शीर्षक</label>
                        <input type="text" style={inputStyle} value={editData.title ?? ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>YouTube ID</label>
                        <input type="text" style={inputStyle} value={editData.youtubeId ?? ''} onChange={(e) => setEditData({ ...editData, youtubeId: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} disabled={isSaving} style={{ padding: '0.5rem 1.2rem', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '4px', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                          {isSaving ? '...' : 'सुरक्षित गर्नुहोस्'}
                        </button>
                        <button onClick={() => setEditId(null)} style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
                          रद्द गर्नुहोस्
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={s._id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>{s.title}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => startEdit(s)} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      सम्पादन गर्नुहोस्
                    </button>
                    <button onClick={() => handleDelete(s._id)} style={{ padding: '0.4rem 0.8rem', background: '#D32F2F', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      मेट्नुहोस्
                    </button>
                  </td>
                </tr>
              )
            ))}
            {songs.length === 0 && (
              <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center' }}>कुनै गीत भेटिएन।</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Category {
  id: string;
  name: string;
  icon_url?: string;
  color?: string;
}

export default function AppCategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          window.location.href = '/login';
          return;
        }
        const { data, error } = await supabase.functions.invoke('list-categories', { body: {} });
        if (error) throw error;
        setCategories((data as any)?.items ?? []);
      } catch (e) {
        console.error('[AppCategoriesClient] load error', e);
        setError('Error cargando categorías');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCategoryClick = (c: Category) => {
    const p = new URLSearchParams({ c: c.id });
    window.location.href = '/app/search?' + p.toString();
  };

  if (loading) {
    return <div>Cargando categorías…</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div
      className="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
        gap: 12,
        justifyContent: 'center',
      }}
    >
      {categories.map((c) => (
        <button
          key={c.id}
          className="card"
          style={{ border: '1px solid ' + (c.color || '#e5e7eb'), borderRadius: 12, padding: 16, background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}
          aria-label={c.name}
          onClick={() => handleCategoryClick(c)}
        >
          {c.icon_url && (
            <img
              className="icon"
              src={c.icon_url}
              alt={c.name}
              style={{ width: 64, height: 64, marginBottom: 8, objectFit: 'contain' }}
            />
          )}
          <span className="sr-only">{c.name}</span>
        </button>
      ))}
    </div>
  );
}

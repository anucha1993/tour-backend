'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ marginBottom: '1rem' }}>เกิดข้อผิดพลาด</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error.message || 'Something went wrong'}</p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            ลองอีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}

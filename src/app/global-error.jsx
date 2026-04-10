'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" className="dark h-full">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f131d',
          color: '#dfe2f1',
          fontFamily: 'Inter, Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 520, padding: '2rem' }}>
          {/* Animated glitch icon */}
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1.5rem',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #a4e6ff, #00d1ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: '#bbc9cf',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            An unexpected error occurred while loading the page. Don&apos;t worry — this is
            temporary. Please try again.
          </p>

          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(0,209,255,0.4)',
              background: 'rgba(0,209,255,0.1)',
              color: '#00d1ff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0,209,255,0.2)';
              e.currentTarget.style.borderColor = 'rgba(0,209,255,0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,209,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(0,209,255,0.4)';
            }}
          >
            Try Again
          </button>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </div>
      </body>
    </html>
  );
}

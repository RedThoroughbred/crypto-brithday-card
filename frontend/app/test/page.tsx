// Minimal test page to bypass layout issues
export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>GeoGift Test Page</h1>
      <p>If you can see this, the server is working!</p>
      <a href="/create" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go to Create Gift Page
      </a>
    </div>
  );
}
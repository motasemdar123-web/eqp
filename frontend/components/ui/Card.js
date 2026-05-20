export default function Card({ children, className = '' }) {
  return (
    <section className={`ds-card ${className}`}>
      {children}
    </section>
  );
}

export default function Field({ label, children }) {
  return (
    <label className="ds-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

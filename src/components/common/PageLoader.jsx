export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="state-wrap">
      <div className="state-card">{message}</div>
    </div>
  );
}
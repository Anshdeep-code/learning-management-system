import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn mt-6">
        Go home
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-slate-600 text-lg mb-8">
        La página que buscas no existe.
      </p>
      <a
        href="/"
        className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow hover:bg-primary/90 transition"
      >
        Volver al inicio
      </a>
    </div>
  );
}

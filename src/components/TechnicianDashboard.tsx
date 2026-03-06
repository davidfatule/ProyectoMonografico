export function TechnicianDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Panel de Técnico</h2>
      <p className="text-slate-600 mb-4">
        Aquí puedes ver y actualizar tus tickets asignados.
      </p>
      <div className="p-4 bg-white rounded-xl shadow">
        <h3 className="font-semibold mb-2">Tickets asignados</h3>
        <p className="text-sm text-slate-500">Listado de tickets pendientes</p>
      </div>
    </div>
  );
}
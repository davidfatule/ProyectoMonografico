export function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Panel de Administración</h2>
      <p className="text-slate-600 mb-4">
        Aquí puedes gestionar usuarios y tickets.
      </p>
      {/* Ejemplo de sección */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-xl shadow">
          <h3 className="font-semibold mb-2">Usuarios</h3>
          <p className="text-sm text-slate-500">Listado de usuarios registrados</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <h3 className="font-semibold mb-2">Tickets</h3>
          <p className="text-sm text-slate-500">Listado de tickets abiertos</p>
        </div>
      </div>
    </div>
  );
}
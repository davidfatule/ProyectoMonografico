import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HeadphonesIcon, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/api/endpoints";
import { useLogin, useUser } from "@/hooks/auth";

type LoginForm = z.infer<typeof api.auth.login.input>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user } = useUser();
  const login = useLogin();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: { username: "", password: "" }
  });

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  // Redirigir al dashboard cuando el login termine bien (por si onSuccess no dispara)
  useEffect(() => {
    if (login.isSuccess) setLocation("/dashboard");
  }, [login.isSuccess, setLocation]);

  const onSubmit = (data: LoginForm) => {
    setErrorMsg("");
    const credentials = { username: data.username.trim(), password: data.password.trim() };
    login.mutate(credentials, {
      onSuccess: () => setLocation("/dashboard"),
      onError: (err) => setErrorMsg(err.message),
    });
  };

  const handleFormSubmit = form.handleSubmit(onSubmit);

  // Si ya hay usuario, no mostrar nada (useEffect redirige al dashboard)
  if (user) return null;

  // Mientras carga la sesión, mostrar formulario; si /api/auth/me falla, también se muestra el login
  return (
    <div className="min-h-screen flex bg-[#F5F8FA] relative">
      <Link
        href="/"
        className="fixed top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 no-underline text-sm font-medium bg-white/90 backdrop-blur-sm py-2 px-3 rounded-lg border border-slate-200/80 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <HeadphonesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-slate-900">Andrickson Soporte<span className="text-primary"></span></span>
          </div>

          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Bienvenido de nuevo</h2>
          <p className="text-slate-500 mb-8">Inicia sesión en el portal de empleados para continuar.</p>

          <div className="bg-white py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-slate-100">
            <form
              onSubmit={handleFormSubmit}
              className="space-y-6"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    {...form.register("username")}
                    className="pl-10 h-12 rounded-xl bg-slate-50"
                    placeholder="admin o tecnico1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="pl-10 pr-11 h-12 rounded-xl bg-slate-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset rounded-r-xl"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {(errorMsg || Object.keys(form.formState.errors).length > 0) && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {errorMsg ||
                    (form.formState.errors.username?.message as string) ||
                    (form.formState.errors.password?.message as string) ||
                    "Revisa usuario y contraseña."}
                </div>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full h-12 text-lg rounded-xl shadow-lg font-medium text-white disabled:opacity-50 transition"
                style={{ backgroundColor: "#347AFF" }}
              >
                {login.isPending ? "Ingresando..." : "Ingresar"}
              </button>

              <p className="text-xs text-slate-400 text-center pt-2">
                Usuario temporal: <strong>admin</strong> / <strong>admin123</strong> (o tecnico1 / tecnico123)
              </p>
            </form>
          </div>
        </div>
      </div>
      
      {/* Decorative side panel */}
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-900 mix-blend-multiply opacity-90" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center">
          <div className="w-full max-w-lg glass p-10 rounded-3xl backdrop-blur-xl border-white/10 bg-white/5">
            <h3 className="text-3xl font-display font-bold text-white mb-6">Gestión eficiente de incidencias</h3>
            <p className="text-blue-100 text-lg leading-relaxed">
              Mantén el control de todos los tickets de soporte, evalúa el desempeño de tu equipo y garantiza la mejor experiencia para tus clientes en una sola plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


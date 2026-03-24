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

/** Estilo compartido: campos con ligera elevación y foco suave */
const floatingInputClass =
  "h-12 w-full rounded-[14px] border border-slate-200/95 bg-slate-50 pl-10 pr-3 text-slate-900 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08),0_1px_4px_-2px_rgba(15,23,42,0.05)] transition-all duration-200 placeholder:text-slate-400 focus:border-[#347AFF]/55 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#347AFF]/18 hover:border-slate-300 hover:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.12)]";

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isSuccess } = useUser();
  const login = useLogin();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: { username: "", password: "" }
  });

  useEffect(() => {
    if (isSuccess && user) setLocation("/dashboard");
  }, [isSuccess, user, setLocation]);

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

  // Solo ocultar si la query confirmó sesión (evita pantalla en blanco con caché obsoleto)
  if (isSuccess && user) return null;

  // Mientras carga la sesión local, mostrar formulario.
  return (
    <div className="min-h-dvh flex bg-[#F5F8FA] relative">
      <Link
        href="/"
        className="fixed z-10 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 no-underline text-sm font-medium bg-white/90 backdrop-blur-sm py-2 px-3 rounded-lg border border-slate-200/80 shadow-sm touch-manipulation min-h-[44px]"
        style={{
          top: "max(1rem, env(safe-area-inset-top, 0px))",
          left: "max(1rem, env(safe-area-inset-left, 0px))",
        }}
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

          <div className="rounded-[28px] border border-slate-100/90 bg-white p-9 sm:p-10 shadow-[0_22px_56px_-18px_rgba(15,23,42,0.14),0_10px_28px_-12px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.04)]">
            <form
              onSubmit={handleFormSubmit}
              className="space-y-6"
              noValidate
            >
              <div>
                <label className="mb-2.5 block text-sm font-semibold tracking-tight text-slate-800">
                  Usuario
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                  </div>
                  <Input
                    {...form.register("username")}
                    type="text"
                    autoComplete="username"
                    className={floatingInputClass}
                    placeholder="usuario"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-semibold tracking-tight text-slate-800">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    autoComplete="current-password"
                    className={`${floatingInputClass} pr-11 placeholder:text-slate-400`}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#347AFF]/30 focus-visible:ring-offset-2 rounded-r-[14px]"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {(errorMsg || Object.keys(form.formState.errors).length > 0) && (
                <div className="rounded-[14px] border border-red-100 bg-red-50/90 p-3.5 text-sm text-red-600 shadow-sm">
                  {errorMsg ||
                    (form.formState.errors.username?.message as string) ||
                    (form.formState.errors.password?.message as string) ||
                    "Revisa usuario y contraseña."}
                </div>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                className="h-12 w-full rounded-[14px] bg-[#347AFF] text-base font-bold text-white shadow-[0_10px_28px_-6px_rgba(52,122,255,0.55),0_4px_14px_-4px_rgba(52,122,255,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2b6ae6] hover:shadow-[0_14px_36px_-8px_rgba(52,122,255,0.5),0_6px_18px_-6px_rgba(52,122,255,0.35)] active:translate-y-0 active:shadow-[0_6px_20px_-6px_rgba(52,122,255,0.45)] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {login.isPending ? "Ingresando..." : "Ingresar"}
              </button>
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


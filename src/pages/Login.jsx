import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      // La navegación será manejada por AuthContext/ProtectedRoute
    }
    
    setLoading(false);
  };

  return (
    // Contenedor principal que ocupa toda la página y envuelve ambos lados
    <div className="min-h-screen flex items-stretch">
        
        {/* Lado izquierdo: Imagen de portada (se oculta en dispositivos pequeños) */}
        <div className="hidden lg:flex w-1/2 relative">
          <img
            src="/images/portada.jpg"
            alt="Asiste University"
            className="object-cover w-full h-full"
          />
        </div>
  
        {/* Lado derecho: Formulario de Login con fondo gris claro */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gray-100">
          <div className="max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
                <LogIn className="h-6 w-6 text-primary-600" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Iniciar Sesión
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sistema de Inducción Asiste University
              </p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="form-input pr-10"
                      placeholder="Tu contraseña"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
  
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
  
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Regístrate aquí
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
  };
  
  export default Login;
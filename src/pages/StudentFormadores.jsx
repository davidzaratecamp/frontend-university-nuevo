import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Mail, 
  Calendar,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentFormadores = () => {
  const { user } = useAuth();
  const [formadores, setFormadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyFormadores();
  }, []);

  const fetchMyFormadores = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getMyFormadores();
      setFormadores(response.data.formadores || []);
    } catch (error) {
      toast.error('Error al cargar formadores');
      console.error('Error fetching formadores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Formadores</h1>
          <p className="text-gray-600 mt-2">Conoce a tu equipo de formación y soporte</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Formadores</p>
              <p className="text-2xl font-semibold text-gray-900">{formadores.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Especialización</p>
              <p className="text-lg font-semibold text-gray-900">Inducción</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Soporte</p>
              <p className="text-lg font-semibold text-gray-900">24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formadores Grid */}
      {formadores.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No tienes formadores asignados</p>
          <p className="text-sm text-gray-400">
            Contacta al administrador para que te asigne un formador
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formadores.map((formador) => (
            <div key={formador.id} className="card hover:shadow-lg transition-all duration-200">
              {/* Profile Header */}
              <div className="text-center mb-6">
                {formador.profile_image ? (
                  <img 
                    src={formador.profile_image} 
                    alt={formador.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {formador.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {formador.name}
                </h3>
                
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm font-medium">Formador</span>
                </div>
                
                <p className="text-gray-600 text-sm">
                  {formador.bio || 'Especialista en procesos de inducción y desarrollo de competencias'}
                </p>
                
                {/* Cursos compartidos */}
                {formador.shared_courses && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Cursos en común:</h4>
                    <div className="flex flex-wrap gap-1">
                      {formador.shared_courses.split(',').map((course, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {course.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{formador.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Asignado desde {new Date(formador.assigned_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formador.course_count || 0} curso(s) en común
                  </span>
                </div>
              </div>

              {/* Expertise Areas */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Áreas de Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Inducción
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Mentoring
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Evaluación
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <a
                  href="/forum"
                  className="w-full btn-primary text-center flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Ir al Foro
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Information */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Necesitas ayuda adicional?
            </h3>
            
            <p className="text-gray-600 mb-4">
              Tus formadores están aquí para apoyarte en tu proceso de inducción. 
              No dudes en contactarlos si tienes preguntas sobre los cursos, 
              actividades o cualquier aspecto de tu aprendizaje.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Horario de atención: Lunes a Viernes 8:00 AM - 6:00 PM</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>Soporte telefónico: Ext. 1234</span>
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => toast.info('Centro de ayuda en desarrollo')}
                className="btn-secondary text-sm"
              >
                Centro de Ayuda
              </button>
              
              <button 
                onClick={() => toast.info('FAQ en desarrollo')}
                className="btn-outline text-sm"
              >
                Preguntas Frecuentes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFormadores;
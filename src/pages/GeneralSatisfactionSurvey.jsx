import { useState, useEffect } from 'react';
import { satisfactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const GeneralSatisfactionSurvey = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSurvey, setExistingSurvey] = useState(null);
  const [formData, setFormData] = useState({
    overall_experience: 0,
    content_quality: 0,
    platform_usability: 0,
    formador_support: 0,
    time_management: 0,
    would_recommend: true,
    comments: '',
    suggestions: ''
  });

  useEffect(() => {
    checkExistingSurvey();
  }, []);

  const checkExistingSurvey = async () => {
    try {
      const response = await satisfactionAPI.checkGeneralSubmitted();
      if (response.data.has_submitted) {
        setHasSubmitted(true);
        const surveyResponse = await satisfactionAPI.getMyGeneralSurvey();
        setExistingSurvey(surveyResponse.data.survey);
        if (surveyResponse.data.survey) {
          setFormData({
            overall_experience: surveyResponse.data.survey.overall_experience,
            content_quality: surveyResponse.data.survey.content_quality,
            platform_usability: surveyResponse.data.survey.platform_usability,
            formador_support: surveyResponse.data.survey.formador_support,
            time_management: surveyResponse.data.survey.time_management,
            would_recommend: surveyResponse.data.survey.would_recommend,
            comments: surveyResponse.data.survey.comments || '',
            suggestions: surveyResponse.data.survey.suggestions || ''
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing survey:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.overall_experience || !formData.content_quality || 
        !formData.platform_usability || !formData.formador_support || 
        !formData.time_management) {
      toast.error('Por favor completa todas las calificaciones');
      return;
    }

    try {
      setLoading(true);
      await satisfactionAPI.createGeneral(formData);
      toast.success('Encuesta de satisfacción enviada exitosamente');
      setHasSubmitted(true);
      checkExistingSurvey();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al enviar la encuesta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (field, rating) => {
    setFormData({ ...formData, [field]: rating });
  };

  const renderStarRating = (field, label, value) => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => !hasSubmitted && handleRatingChange(field, star)}
              disabled={hasSubmitted}
              className={`p-1 ${hasSubmitted ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'} transition-transform`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= value
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-3 text-sm text-gray-600 self-center">
            {value > 0 ? `${value}/5` : 'Sin calificar'}
          </span>
        </div>
      </div>
    );
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular', 
      4: 'Bueno',
      5: 'Excelente'
    };
    return texts[rating] || 'Sin calificar';
  };

  if (hasSubmitted && existingSurvey) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Gracias por tu Opinión!</h1>
          <p className="text-gray-600">
            Tu encuesta de satisfacción general ha sido enviada exitosamente
          </p>
        </div>

        {/* Results Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de tu Evaluación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Experiencia General:</span>
                <span className="font-medium">{getRatingText(existingSurvey.overall_experience)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Calidad del Contenido:</span>
                <span className="font-medium">{getRatingText(existingSurvey.content_quality)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usabilidad de la Plataforma:</span>
                <span className="font-medium">{getRatingText(existingSurvey.platform_usability)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Soporte de Formadores:</span>
                <span className="font-medium">{getRatingText(existingSurvey.formador_support)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gestión del Tiempo:</span>
                <span className="font-medium">{getRatingText(existingSurvey.time_management)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recomendarías:</span>
                <span className="font-medium">
                  {existingSurvey.would_recommend ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {existingSurvey.comments && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Comentarios:</h4>
              <p className="text-gray-600 text-sm">{existingSurvey.comments}</p>
            </div>
          )}

          {existingSurvey.suggestions && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Sugerencias:</h4>
              <p className="text-gray-600 text-sm">{existingSurvey.suggestions}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Enviado el {new Date(existingSurvey.submitted_at).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Encuesta de Satisfacción General
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Nos interesa conocer tu experiencia general con todo el proceso de inducción. 
          Tu opinión nos ayuda a mejorar continuamente nuestro programa.
        </p>
      </div>

      {/* Survey Form */}
      <div className="card max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rating Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {renderStarRating(
                'overall_experience',
                '¿Cómo calificarías tu experiencia general con el proceso de inducción?',
                formData.overall_experience
              )}

              {renderStarRating(
                'content_quality',
                '¿Qué tan útil y relevante fue el contenido de los cursos?',
                formData.content_quality
              )}

              {renderStarRating(
                'platform_usability',
                '¿Qué tal te pareció la facilidad de uso de la plataforma?',
                formData.platform_usability
              )}
            </div>

            <div className="space-y-6">
              {renderStarRating(
                'formador_support',
                '¿Cómo calificas el soporte y acompañamiento de tus formadores?',
                formData.formador_support
              )}

              {renderStarRating(
                'time_management',
                '¿Los tiempos asignados para cada actividad fueron adecuados?',
                formData.time_management
              )}

              {/* Recommendation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Recomendarías este proceso de inducción a otros?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, would_recommend: true })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      formData.would_recommend
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, would_recommend: false })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      !formData.would_recommend
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios Adicionales
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="form-input"
                rows="4"
                placeholder="Comparte cualquier comentario sobre tu experiencia general..."
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Sugerencias de Mejora
              </label>
              <textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                className="form-input"
                rows="4"
                placeholder="¿Qué sugerencias tienes para mejorar el proceso?"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Enviando...' : 'Enviar Encuesta'}
            </button>
          </div>
        </form>
      </div>

      {/* Information Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              ¿Por qué es importante tu opinión?
            </h3>
            <p className="text-blue-800 text-sm">
              Tu retroalimentación nos permite identificar fortalezas y áreas de mejora 
              en nuestro proceso de inducción, garantizando una mejor experiencia para 
              futuros participantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSatisfactionSurvey;
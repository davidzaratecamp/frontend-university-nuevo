import { useState, useEffect } from 'react';
import { satisfactionAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  Heart, 
  ThumbsUp, 
  MessageSquare,
  BookOpen,
  CheckCircle,
  Send,
  Award,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const SatisfactionSurvey = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [existingSurvey, setExistingSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const [formData, setFormData] = useState({
    overall_rating: 0,
    content_quality: 0,
    instructor_rating: 0,
    difficulty_level: 0,
    comments: '',
    would_recommend: true
  });

  const ratingLabels = {
    overall_rating: 'Calificación General del Curso',
    content_quality: 'Calidad del Contenido',
    instructor_rating: 'Calificación de Formadores',
    difficulty_level: 'Nivel de Dificultad'
  };

  const ratingDescriptions = {
    overall_rating: '¿Qué tan satisfecho estás con el curso en general?',
    content_quality: '¿Qué tan útil y relevante fue el contenido?',
    instructor_rating: '¿Qué tan efectivos fueron tus formadores?',
    difficulty_level: '¿Qué tan apropiado fue el nivel de dificultad?'
  };

  const difficultyLabels = {
    1: 'Muy Fácil',
    2: 'Fácil', 
    3: 'Adecuado',
    4: 'Difícil',
    5: 'Muy Difícil'
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchExistingSurvey();
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesRes = await coursesAPI.getAll();
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      toast.error('Error al cargar cursos');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingSurvey = async () => {
    try {
      const response = await satisfactionAPI.getByCourseAndStudent(selectedCourse, user.id);
      if (response.data.survey) {
        setExistingSurvey(response.data.survey);
        setFormData({
          overall_rating: response.data.survey.overall_rating,
          content_quality: response.data.survey.content_quality,
          instructor_rating: response.data.survey.instructor_rating,
          difficulty_level: response.data.survey.difficulty_level,
          comments: response.data.survey.comments || '',
          would_recommend: response.data.survey.would_recommend
        });
      } else {
        setExistingSurvey(null);
        setFormData({
          overall_rating: 0,
          content_quality: 0,
          instructor_rating: 0,
          difficulty_level: 0,
          comments: '',
          would_recommend: true
        });
      }
    } catch (error) {
      setExistingSurvey(null);
      setFormData({
        overall_rating: 0,
        content_quality: 0,
        instructor_rating: 0,
        difficulty_level: 0,
        comments: '',
        would_recommend: true
      });
    }
  };

  const handleRatingChange = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      toast.error('Por favor selecciona un curso');
      return;
    }

    if (formData.overall_rating === 0 || formData.content_quality === 0 || 
        formData.instructor_rating === 0 || formData.difficulty_level === 0) {
      toast.error('Por favor completa todas las calificaciones');
      return;
    }

    try {
      setSubmitting(true);
      
      const surveyData = {
        ...formData,
        course_id: parseInt(selectedCourse),
        student_id: user.id
      };

      if (existingSurvey) {
        await satisfactionAPI.update(existingSurvey.id, surveyData);
        toast.success('Encuesta actualizada exitosamente');
      } else {
        await satisfactionAPI.create(surveyData);
        toast.success('Encuesta enviada exitosamente');
      }
      
      setShowThankYou(true);
      
    } catch (error) {
      toast.error('Error al enviar la encuesta');
      console.error('Error submitting survey:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, field }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(field, star)}
            className={`p-1 transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
            }`}
          >
            <Star className={`h-6 w-6 ${star <= rating ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="card">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Gracias por tu Retroalimentación!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar 
              continuamente la calidad de nuestros cursos de inducción.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Valoramos tu experiencia</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Mejoramos continuamente</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Excelencia en educación</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setShowThankYou(false);
                setSelectedCourse('');
                fetchExistingSurvey();
              }}
              className="btn-secondary"
            >
              Evaluar Otro Curso
            </button>
            
            <button
              onClick={() => window.location.href = '/courses'}
              className="btn-primary"
            >
              Volver a Mis Cursos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Encuesta de Satisfacción</h1>
        <p className="text-gray-600">
          Tu opinión nos ayuda a mejorar la experiencia de aprendizaje
        </p>
      </div>

      {/* Course Selection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Selecciona un Curso para Evaluar</h3>
        </div>
        
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="form-input"
          required
        >
          <option value="">Selecciona un curso...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        
        {existingSurvey && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Ya has evaluado este curso anteriormente. Puedes actualizar tu evaluación.
            </p>
          </div>
        )}
      </div>

      {/* Survey Form */}
      {selectedCourse && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Questions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Calificaciones</h3>
            
            <div className="space-y-6">
              {Object.entries(ratingLabels).map(([field, label]) => (
                <div key={field} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{label}</h4>
                      <p className="text-sm text-gray-600">{ratingDescriptions[field]}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <StarRating 
                        rating={formData[field]} 
                        onRatingChange={handleRatingChange}
                        field={field}
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                        {formData[field] > 0 && (
                          field === 'difficulty_level' 
                            ? difficultyLabels[formData[field]]
                            : `${formData[field]}/5`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendación</h3>
            
            <div className="space-y-3">
              <p className="text-gray-600">¿Recomendarías este curso a otros estudiantes?</p>
              
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="would_recommend"
                    checked={formData.would_recommend === true}
                    onChange={() => setFormData(prev => ({ ...prev, would_recommend: true }))}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-gray-900 flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    Sí, lo recomendaría
                  </span>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="would_recommend"
                    checked={formData.would_recommend === false}
                    onChange={() => setFormData(prev => ({ ...prev, would_recommend: false }))}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-red-600" />
                    No lo recomendaría
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentarios Adicionales</h3>
            
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              className="form-input h-32 resize-none"
              placeholder="Comparte tus comentarios, sugerencias o cualquier aspecto que te gustaría destacar sobre el curso..."
            />
            
            <p className="text-sm text-gray-500 mt-2">
              Tu retroalimentación detallada nos ayuda a identificar áreas de mejora específicas.
            </p>
          </div>

          {/* Submit Button */}
          <div className="card">
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 px-8 py-3 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                {submitting 
                  ? 'Enviando...' 
                  : existingSurvey 
                    ? 'Actualizar Evaluación' 
                    : 'Enviar Evaluación'
                }
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-3">
              Tu evaluación es confidencial y se utiliza únicamente para mejorar nuestros cursos.
            </p>
          </div>
        </form>
      )}

      {/* Information Panel */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Heart className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Por qué es importante tu opinión?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Mejoramos continuamente el contenido y metodología</span>
              </div>
              
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>Reconocemos a los mejores formadores</span>
              </div>
              
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>Desarrollamos nuevos cursos basados en tus necesidades</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatisfactionSurvey;
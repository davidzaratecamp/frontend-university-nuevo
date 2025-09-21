import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { satisfactionAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  BarChart3,
  MessageSquare,
  Users,
  Filter,
  Download,
  Eye,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Satisfaction = () => {
  const { isAdmin, isEstudiante } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [courses, setCourses] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [courseSummaries, setCourseSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyData, setSurveyData] = useState({
    course_id: '',
    overall_rating: 5,
    content_quality: 5,
    instructor_rating: 5,
    difficulty_level: 3,
    comments: '',
    would_recommend: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin()) {
        const [overallRes, coursesRes] = await Promise.all([
          satisfactionAPI.getOverallSummary(),
          coursesAPI.getAll()
        ]);
        
        setOverallSummary(overallRes.data.summary);
        setCourses(coursesRes.data.courses);
        
        // Get course-specific summaries
        const summaryPromises = coursesRes.data.courses.map(course =>
          satisfactionAPI.getCourseSummary(course.id)
        );
        const summaryResponses = await Promise.all(summaryPromises);
        
        const summariesMap = {};
        coursesRes.data.courses.forEach((course, index) => {
          summariesMap[course.id] = summaryResponses[index].data.summary;
        });
        setCourseSummaries(summariesMap);
        
      } else if (isEstudiante()) {
        const [surveysRes, coursesRes] = await Promise.all([
          satisfactionAPI.getMySurveys(),
          coursesAPI.getAll()
        ]);
        
        setSurveys(surveysRes.data.surveys);
        setCourses(coursesRes.data.courses);
      }
    } catch (error) {
      toast.error('Error al cargar datos de satisfacción');
      console.error('Error fetching satisfaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    try {
      await satisfactionAPI.submit(surveyData);
      toast.success('Encuesta de satisfacción enviada exitosamente');
      setShowSurveyModal(false);
      setSurveyData({
        course_id: '',
        overall_rating: 5,
        content_quality: 5,
        instructor_rating: 5,
        difficulty_level: 3,
        comments: '',
        would_recommend: true
      });
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al enviar encuesta';
      toast.error(message);
    }
  };

  const renderStars = (rating, size = 'h-5 w-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderRatingInput = (label, value, onChange, max = 5) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-2">
        {[...Array(max)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={`p-1 rounded ${
              i < value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-500 transition-colors`}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{value}/5</span>
      </div>
    </div>
  );

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
          <h1 className="text-3xl font-bold text-gray-900">
            {isEstudiante() ? 'Evaluación de Satisfacción' : 'Análisis de Satisfacción'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEstudiante() 
              ? 'Evalúa tu experiencia con los cursos' 
              : 'Monitorea la satisfacción de los estudiantes'
            }
          </p>
        </div>
{isAdmin() && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/satisfaction-details')}
              className="btn-secondary flex items-center gap-2"
            >
              <UserCheck className="h-5 w-5" />
              Ver por Estudiante
            </button>
          </div>
        )}
        {isEstudiante() && (
          <button
            onClick={() => setShowSurveyModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Star className="h-5 w-5" />
            Nueva Evaluación
          </button>
        )}
      </div>

      {/* Admin View */}
      {isAdmin() && overallSummary && (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                  <p className="text-2xl font-semibold text-gray-900">{overallSummary.total_responses}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {overallSummary.avg_overall_rating ? Number(overallSummary.avg_overall_rating).toFixed(1) : '0.0'}/5
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Satisfacción</p>
                  <p className="text-2xl font-semibold text-gray-900">{overallSummary.satisfaction_percentage || 0}%</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Recomendación</p>
                  <p className="text-2xl font-semibold text-gray-900">{overallSummary.recommendation_percentage || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Detalladas</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calidad del Contenido</span>
                    <span>{overallSummary.avg_content_quality ? Number(overallSummary.avg_content_quality).toFixed(1) : '0.0'}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${overallSummary.avg_content_quality ? (Number(overallSummary.avg_content_quality) / 5) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calificación del Instructor</span>
                    <span>{overallSummary.avg_instructor_rating ? Number(overallSummary.avg_instructor_rating).toFixed(1) : '0.0'}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${overallSummary.avg_instructor_rating ? (Number(overallSummary.avg_instructor_rating) / 5) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Nivel de Dificultad</span>
                    <span>{overallSummary.avg_difficulty_level ? Number(overallSummary.avg_difficulty_level).toFixed(1) : '0.0'}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${overallSummary.avg_difficulty_level ? (Number(overallSummary.avg_difficulty_level) / 5) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Calificaciones</h3>
              <div className="space-y-3">
                {overallSummary.rating_distribution?.map((item) => (
                  <div key={item.overall_rating} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(item.overall_rating, 'h-4 w-4')}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(item.count / overallSummary.total_responses) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Summaries */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfacción por Curso</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuestas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfacción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recomendación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => {
                    const summary = courseSummaries[course.id];
                    if (!summary || summary.total_responses === 0) return null;
                    
                    return (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {summary.total_responses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(Number(summary.avg_overall_rating) || 0), 'h-4 w-4')}
                            <span className="text-sm text-gray-600 ml-2">
                              {summary.avg_overall_rating ? Number(summary.avg_overall_rating).toFixed(1) : '0.0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {summary.satisfaction_percentage || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {summary.recommendation_percentage || 0}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student View */}
      {isEstudiante() && (
        <>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mis Evaluaciones</h3>
            {surveys.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No has enviado evaluaciones aún</p>
                <button
                  onClick={() => setShowSurveyModal(true)}
                  className="btn-primary"
                >
                  Enviar Primera Evaluación
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.map((survey) => (
                  <div key={survey.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{survey.course_title}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(survey.submitted_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-600">General</span>
                        <div className="flex items-center gap-1">
                          {renderStars(survey.overall_rating, 'h-4 w-4')}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Contenido</span>
                        <div className="flex items-center gap-1">
                          {renderStars(survey.content_quality, 'h-4 w-4')}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Instructor</span>
                        <div className="flex items-center gap-1">
                          {renderStars(survey.instructor_rating, 'h-4 w-4')}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Recomendación</span>
                        <div className="flex items-center gap-1">
                          {survey.would_recommend ? (
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {survey.would_recommend ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {survey.comments && (
                      <div className="bg-gray-50 rounded p-3">
                        <span className="text-xs text-gray-600">Comentarios:</span>
                        <p className="text-sm text-gray-800 mt-1">{survey.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Evaluación de Satisfacción
            </h3>
            
            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              <div>
                <label className="form-label">Curso</label>
                <select
                  required
                  value={surveyData.course_id}
                  onChange={(e) => setSurveyData({...surveyData, course_id: e.target.value})}
                  className="form-input"
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              {renderRatingInput(
                'Calificación General',
                surveyData.overall_rating,
                (value) => setSurveyData({...surveyData, overall_rating: value})
              )}

              {renderRatingInput(
                'Calidad del Contenido',
                surveyData.content_quality,
                (value) => setSurveyData({...surveyData, content_quality: value})
              )}

              {renderRatingInput(
                'Calificación del Instructor',
                surveyData.instructor_rating,
                (value) => setSurveyData({...surveyData, instructor_rating: value})
              )}

              {renderRatingInput(
                'Nivel de Dificultad',
                surveyData.difficulty_level,
                (value) => setSurveyData({...surveyData, difficulty_level: value})
              )}

              <div>
                <label className="form-label">¿Recomendarías este curso?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommend"
                      checked={surveyData.would_recommend === true}
                      onChange={() => setSurveyData({...surveyData, would_recommend: true})}
                      className="mr-2"
                    />
                    <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommend"
                      checked={surveyData.would_recommend === false}
                      onChange={() => setSurveyData({...surveyData, would_recommend: false})}
                      className="mr-2"
                    />
                    <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Comentarios (opcional)</label>
                <textarea
                  value={surveyData.comments}
                  onChange={(e) => setSurveyData({...surveyData, comments: e.target.value})}
                  className="form-input h-24 resize-none"
                  placeholder="Comparte tu experiencia..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Enviar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Satisfaction;
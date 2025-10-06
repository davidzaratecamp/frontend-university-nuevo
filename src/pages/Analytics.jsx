import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Target,
  Calendar,
  BarChart3,
  Activity,
  Smile,
  ThumbsUp,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      toast.error('Error al cargar analíticas');
      console.error('Error fetching analytics:', error);
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos de analíticas disponibles</p>
      </div>
    );
  }

  // Prepare chart data with gradients and better colors
  const usersByRoleData = {
    labels: data.usersByRole.map(item => item.role.charAt(0).toUpperCase() + item.role.slice(1)),
    datasets: [{
      label: 'Cantidad',
      data: data.usersByRole.map(item => item.count),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 146, 60, 0.8)',
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(251, 146, 60, 1)',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const gradesDistributionData = {
    labels: data.gradesDistribution.map(item => item.grade_range),
    datasets: [{
      label: 'Estudiantes',
      data: data.gradesDistribution.map(item => item.count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const enrollmentTrendData = {
    labels: data.enrollmentTrend.map(item => {
      const [year, month] = item.month.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[parseInt(month) - 1]} ${year}`;
    }),
    datasets: [{
      label: 'Nuevos Estudiantes',
      data: data.enrollmentTrend.map(item => item.enrollments),
      fill: true,
      borderColor: 'rgba(139, 92, 246, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(139, 92, 246, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3,
    }]
  };

  const activityByDayData = {
    labels: data.activityByDay.map(item => item.day_name || 'N/A'),
    datasets: [{
      label: 'Evaluaciones Completadas',
      data: data.activityByDay.map(item => item.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
      ],
      borderWidth: 2,
      borderRadius: 10,
    }]
  };

  const generalSatisfactionData = {
    labels: [
      'Calidad del Contenido',
      'Soporte del Formador',
      'Usabilidad',
      'Gestión del Tiempo',
      'Experiencia General'
    ],
    datasets: [{
      label: 'Satisfacción (sobre 5)',
      data: [
        data.generalSatisfactionStats?.avg_content_quality || 0,
        data.generalSatisfactionStats?.avg_formador_support || 0,
        data.generalSatisfactionStats?.avg_platform_usability || 0,
        data.generalSatisfactionStats?.avg_time_management || 0,
        data.generalSatisfactionStats?.avg_overall_experience || 0,
      ],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3,
    }]
  };

  const satisfactionTrendData = {
    labels: data.satisfactionTrend.map(item => {
      const [year, month] = item.month.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[parseInt(month) - 1]} ${year}`;
    }),
    datasets: [{
      label: 'Experiencia General (sobre 5)',
      data: data.satisfactionTrend.map(item => item.avg_experience),
      fill: true,
      borderColor: 'rgba(236, 72, 153, 1)',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(236, 72, 153, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3,
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false }
      },
      x: {
        ticks: { font: { size: 12 } },
        grid: { display: false }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          padding: 15,
          font: { size: 13, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false }
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false }
      }
    }
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { padding: 15, font: { size: 13 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: { stepSize: 1, font: { size: 11 } },
        pointLabels: { font: { size: 12, weight: '500' } },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      }
    }
  };

  const avgGeneralSatisfaction = Number(data.generalSatisfactionStats?.avg_overall_experience) || 0;
  const totalGeneralSurveys = Number(data.generalSatisfactionStats?.total_surveys) || 0;
  const wouldRecommendGeneral = Number(data.generalSatisfactionStats?.would_recommend_count) || 0;
  const recommendPercentage = totalGeneralSurveys > 0 ? ((wouldRecommendGeneral / totalGeneralSurveys) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analíticas del Sistema</h1>
          <p className="text-gray-600 mt-2">Métricas y estadísticas en tiempo real</p>
        </div>
        <button onClick={fetchAnalytics} className="btn-primary flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Cursos</p>
              <p className="text-3xl font-bold mt-2">{data.coursesData.total_courses || 0}</p>
              <p className="text-blue-100 text-xs mt-1">{data.coursesData.total_activities || 0} actividades</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Estudiantes Activos</p>
              <p className="text-3xl font-bold mt-2">{data.enrollmentStats.unique_students || 0}</p>
              <p className="text-green-100 text-xs mt-1">{data.enrollmentStats.total_enrollments || 0} inscripciones</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Promedio General</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round((data.gradesStats.quizzes.avg_quiz_grade + data.gradesStats.workshops.avg_workshop_grade) / 2) || 0}%
              </p>
              <p className="text-yellow-100 text-xs mt-1">Quizzes y Talleres</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Award className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Satisfacción</p>
              <p className="text-3xl font-bold mt-2">
                {avgGeneralSatisfaction ? (avgGeneralSatisfaction * 20).toFixed(0) : 0}%
              </p>
              <p className="text-purple-100 text-xs mt-1">{totalGeneralSurveys} encuestas</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Smile className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Satisfacción General de Estudiantes</h2>
            <p className="text-sm text-gray-600">Evaluación de la experiencia completa de formación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Experiencia Promedio</p>
                <p className="text-2xl font-bold text-indigo-600">{avgGeneralSatisfaction.toFixed(1)}/5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recomendarían</p>
                <p className="text-2xl font-bold text-green-600">{recommendPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Encuestas Completadas</p>
                <p className="text-2xl font-bold text-blue-600">{totalGeneralSurveys}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={usersByRoleData} options={barChartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribución de Calificaciones</h3>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={gradesDistributionData} options={barChartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Niveles de Satisfacción General</h3>
            <Star className="h-5 w-5 text-gray-400" />
          </div>
          <div style={{ height: '350px' }}>
            <Radar data={generalSatisfactionData} options={radarChartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actividad por Día de la Semana</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div style={{ height: '350px' }}>
            <Bar data={activityByDayData} options={barChartOptions} />
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nuevos Estudiantes Registrados</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div style={{ height: '300px' }}>
            <Line data={enrollmentTrendData} options={lineChartOptions} />
          </div>
        </div>

        {data.satisfactionTrend.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tendencia de Satisfacción General</h3>
              <Smile className="h-5 w-5 text-gray-400" />
            </div>
            <div style={{ height: '300px' }}>
              <Line data={satisfactionTrendData} options={lineChartOptions} />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Estudiantes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quizzes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talleres</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topStudents.map((student, index) => (
                <tr key={student.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                      {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                      {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.avg_grade >= 90 ? 'bg-green-100 text-green-800' :
                      student.avg_grade >= 80 ? 'bg-blue-100 text-blue-800' :
                      student.avg_grade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.avg_grade}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.quizzes_taken}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.workshops_taken}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasas de Completitud por Curso</h3>
        <div className="space-y-4">
          {data.completionRates.map((course) => (
            <div key={course.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">{course.title}</span>
                <span className="text-sm text-gray-500">
                  {course.students_with_progress} / {course.enrolled_students} estudiantes
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    course.completion_rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    course.completion_rate >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    course.completion_rate >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${course.completion_rate || 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1 block font-medium">{course.completion_rate || 0}% completado</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

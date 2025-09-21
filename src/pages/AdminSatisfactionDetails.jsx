import { useState, useEffect } from 'react';
import { satisfactionAPI, usersAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Filter,
  Search,
  Download,
  Eye,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AdminSatisfactionDetails = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    student: '',
    course: '',
    rating: '', // 'good' (4-5), 'bad' (1-3), 'all'
    recommendation: '', // 'yes', 'no', 'all'
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSurveys, setStudentSurveys] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [surveys, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, surveysRes] = await Promise.all([
        usersAPI.getAll(),
        coursesAPI.getAll(),
        satisfactionAPI.getAllSurveysWithDetails()
      ]);
      
      const allStudents = studentsRes.data.users.filter(user => user.role === 'estudiante');
      setStudents(allStudents);
      setCourses(coursesRes.data.courses);
      setSurveys(surveysRes.data.surveys || []);
      
      console.log('Loaded data:', {
        students: allStudents.length,
        courses: coursesRes.data.courses.length,
        surveys: surveysRes.data.surveys?.length || 0
      });
      
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...surveys];

    // Filter by student
    if (filters.student) {
      filtered = filtered.filter(survey => survey.student_id == filters.student);
    }

    // Filter by course
    if (filters.course) {
      filtered = filtered.filter(survey => survey.course_id == filters.course);
    }

    // Filter by rating quality
    if (filters.rating === 'good') {
      filtered = filtered.filter(survey => survey.overall_rating >= 4);
    } else if (filters.rating === 'bad') {
      filtered = filtered.filter(survey => survey.overall_rating <= 3);
    }

    // Filter by recommendation
    if (filters.recommendation === 'yes') {
      filtered = filtered.filter(survey => survey.would_recommend);
    } else if (filters.recommendation === 'no') {
      filtered = filtered.filter(survey => !survey.would_recommend);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(survey => 
        new Date(survey.submitted_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(survey => 
        new Date(survey.submitted_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(survey => 
        survey.student_name?.toLowerCase().includes(searchLower) ||
        survey.course_title?.toLowerCase().includes(searchLower) ||
        survey.comments?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSurveys(filtered);
  };

  const resetFilters = () => {
    setFilters({
      student: '',
      course: '',
      rating: '',
      recommendation: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  const handleViewStudentSurveys = async (student) => {
    try {
      setSelectedStudent(student);
      const studentId = student.student_id || student.id;
      const response = await satisfactionAPI.getStudentSurveys(studentId);
      setStudentSurveys(response.data.surveys || []);
      setShowStudentModal(true);
    } catch (error) {
      console.error('Error fetching student surveys:', error);
    }
  };

  // Group surveys by student
  const getStudentGroups = () => {
    const groups = {};
    filteredSurveys.forEach(survey => {
      const studentId = survey.student_id;
      if (!groups[studentId]) {
        groups[studentId] = {
          student_id: studentId,
          student_name: survey.student_name,
          student_email: survey.student_email,
          surveys: [],
          total_surveys: 0,
          avg_rating: 0
        };
      }
      groups[studentId].surveys.push(survey);
    });

    // Calculate averages
    Object.values(groups).forEach(group => {
      group.total_surveys = group.surveys.length;
      group.avg_rating = group.surveys.reduce((sum, survey) => sum + survey.overall_rating, 0) / group.surveys.length;
    });

    return Object.values(groups);
  };

  const exportToExcel = () => {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Preparar datos en formato horizontal
    const worksheetData = [];
    
    // ENCABEZADOS EN LA PRIMERA FILA (CON COLORES DE FONDO)
    const headers = [
      'ESTUDIANTE',
      'EMAIL',
      'TIPO ENCUESTA',
      'CURSO',
      'CALIFICACIÓN GENERAL',
      'CALIDAD CONTENIDO',
      'CALIFICACIÓN INSTRUCTOR',
      'NIVEL DIFICULTAD',
      'FACILIDAD PLATAFORMA',
      'SOPORTE FORMADORES',
      'GESTIÓN TIEMPO',
      'EXPERIENCIA GENERAL',
      'RECOMENDARÍA',
      'COMENTARIOS',
      'SUGERENCIAS',
      'FECHA ENVÍO'
    ];
    
    worksheetData.push(headers);
    
    // PROCESAR CADA ENCUESTA EN FILAS HORIZONTALES
    filteredSurveys.forEach(survey => {
      const row = [
        survey.student_name || 'N/A',
        survey.student_email || 'N/A',
        survey.survey_type === 'general' ? 'GENERAL' : 'POR CURSO',
        survey.course_title || 'N/A',
        // Para encuestas generales, usar overall_experience, para curso usar overall_rating
        survey.survey_type === 'general' ? (survey.overall_experience || 'N/A') : (survey.overall_rating || 'N/A'),
        survey.content_quality || 'N/A',
        survey.instructor_rating || 'N/A',
        survey.difficulty_level || 'N/A',
        survey.platform_usability || 'N/A', // Solo para encuestas generales
        survey.formador_support || 'N/A',    // Solo para encuestas generales
        survey.time_management || 'N/A',     // Solo para encuestas generales
        survey.overall_experience || 'N/A',  // Solo para encuestas generales
        survey.would_recommend ? 'SÍ' : 'NO',
        survey.comments || 'Sin comentarios',
        survey.suggestions || 'Sin sugerencias',
        survey.submitted_at ? new Date(survey.submitted_at).toLocaleDateString('es-ES') : 'N/A'
      ];
      
      worksheetData.push(row);
    });
    
    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // CONFIGURAR ANCHOS DE COLUMNA
    const colWidths = [
      { wch: 20 }, // ESTUDIANTE
      { wch: 30 }, // EMAIL
      { wch: 15 }, // TIPO ENCUESTA
      { wch: 25 }, // CURSO
      { wch: 18 }, // CALIFICACIÓN GENERAL
      { wch: 18 }, // CALIDAD CONTENIDO
      { wch: 20 }, // CALIFICACIÓN INSTRUCTOR
      { wch: 16 }, // NIVEL DIFICULTAD
      { wch: 18 }, // FACILIDAD PLATAFORMA
      { wch: 18 }, // SOPORTE FORMADORES
      { wch: 16 }, // GESTIÓN TIEMPO
      { wch: 18 }, // EXPERIENCIA GENERAL
      { wch: 12 }, // RECOMENDARÍA
      { wch: 40 }, // COMENTARIOS
      { wch: 40 }, // SUGERENCIAS
      { wch: 15 }  // FECHA ENVÍO
    ];
    worksheet['!cols'] = colWidths;
    
    // APLICAR COLORES DE FONDO A LOS TÍTULOS (FILA 1) - MÉTODO MEJORADO
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      
      // Definir colores según el tipo de columna
      let backgroundColor = 'FF1E3A8A'; // Azul por defecto con alpha
      
      if (header.includes('ESTUDIANTE') || header.includes('EMAIL')) {
        backgroundColor = 'FFDC2626'; // Rojo para datos del estudiante
      } else if (header.includes('TIPO') || header.includes('CURSO')) {
        backgroundColor = 'FF7C3AED'; // Púrpura para tipo y curso
      } else if (header.includes('CALIFICACIÓN') || header.includes('CALIDAD') || header.includes('NIVEL') || header.includes('FACILIDAD') || header.includes('SOPORTE') || header.includes('GESTIÓN') || header.includes('EXPERIENCIA')) {
        backgroundColor = 'FF0891B2'; // Cyan para calificaciones
      } else if (header.includes('RECOMENDARÍA')) {
        backgroundColor = 'FFEA580C'; // Naranja para recomendación
      } else if (header.includes('COMENTARIOS') || header.includes('SUGERENCIAS')) {
        backgroundColor = 'FF059669'; // Verde para comentarios y sugerencias
      } else if (header.includes('FECHA')) {
        backgroundColor = 'FF6B7280'; // Gris para fecha
      }
      
      // Crear o modificar la celda para asegurar que existe
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: 's', v: header };
      }
      
      // Aplicar estilo con método más directo
      worksheet[cellRef].s = {
        font: { 
          bold: true, 
          sz: 12, 
          color: { rgb: "FFFFFF" },
          name: "Arial"
        },
        fill: { 
          type: "pattern",
          pattern: "solid",
          fgColor: { rgb: backgroundColor.substring(2) }, // Remover FF del inicio
          bgColor: { rgb: backgroundColor.substring(2) }
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } }
        }
      };
    });
    
    // APLICAR ESTILOS A LAS FILAS DE DATOS
    for (let rowIndex = 1; rowIndex < worksheetData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { sz: 10 },
            alignment: { 
              horizontal: colIndex === 0 || colIndex === 1 || colIndex === 13 || colIndex === 14 ? "left" : "center", 
              vertical: "center",
              wrapText: colIndex === 13 || colIndex === 14 // Wrap text para comentarios y sugerencias
            },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            }
          };
          
          // Colorear filas alternas
          if (rowIndex % 2 === 0) {
            worksheet[cellRef].s.fill = { fgColor: { rgb: "F9FAFB" } };
          }
          
          // Colorear tipo de encuesta
          if (colIndex === 2) { // Columna TIPO ENCUESTA
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'GENERAL') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "7C3AED" }, bold: true };
            } else if (cellValue === 'POR CURSO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "0891B2" }, bold: true };
            }
          }
          
          // Colorear recomendación
          if (colIndex === 12) { // Columna RECOMENDARÍA
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'SÍ') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "059669" }, bold: true };
            } else if (cellValue === 'NO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "DC2626" }, bold: true };
            }
          }
        }
      }
    }
    
    // Establecer altura de la fila de encabezados
    worksheet['!rows'] = [{ hpt: 35 }]; // Altura de 35 puntos para la primera fila
    
    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Satisfacción');
    
    // Generar y descargar el archivo
    const fileName = `Reporte_Satisfaccion_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('📊 Reporte de satisfacción exportado exitosamente');
  };

  const renderStars = (rating, size = 'h-4 w-4') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating) => {
    if (rating >= 4) return 'bg-green-100';
    if (rating >= 3) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Acceso denegado. Solo administradores pueden ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Satisfacción por Estudiante</h1>
          <p className="text-gray-600 mt-2">Análisis detallado de satisfacción de cada estudiante</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            disabled={filteredSurveys.length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredSurveys.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Buenas (4-5★)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredSurveys.filter(s => s.overall_rating >= 4).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Malas (1-3★)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredSurveys.filter(s => s.overall_rating <= 3).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ThumbsUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recomendarían</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredSurveys.filter(s => s.would_recommend).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="form-label">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Estudiante, curso..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="form-input pl-10"
              />
            </div>
          </div>

          {/* Student Filter */}
          <div>
            <label className="form-label">Estudiante</label>
            <select
              value={filters.student}
              onChange={(e) => setFilters({...filters, student: e.target.value})}
              className="form-input"
            >
              <option value="">Todos los estudiantes</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="form-label">Curso</label>
            <select
              value={filters.course}
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              className="form-input"
            >
              <option value="">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="form-label">Calificación</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="form-input"
            >
              <option value="">Todas</option>
              <option value="good">Buenas (4-5★)</option>
              <option value="bad">Malas (1-3★)</option>
            </select>
          </div>

          {/* Recommendation Filter */}
          <div>
            <label className="form-label">Recomendación</label>
            <select
              value={filters.recommendation}
              onChange={(e) => setFilters({...filters, recommendation: e.target.value})}
              className="form-input"
            >
              <option value="">Todas</option>
              <option value="yes">Sí recomiendan</option>
              <option value="no">No recomiendan</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="form-label">Desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="form-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
          {/* Date To */}
          <div>
            <label className="form-label">Hasta</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="form-input"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="btn-secondary w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estudiantes por Satisfacción ({getStudentGroups().length} estudiantes)
          </h3>
        </div>

        {getStudentGroups().length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron estudiantes con evaluaciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Evaluaciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio General</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getStudentGroups().map((studentGroup) => (
                  <tr key={studentGroup.student_id} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewStudentSurveys(studentGroup)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{studentGroup.student_name}</div>
                          <div className="text-sm text-gray-500">{studentGroup.student_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {studentGroup.total_surveys} evaluaciones
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(Math.round(studentGroup.avg_rating))}
                        </div>
                        <span className={`text-sm font-medium ${getRatingColor(studentGroup.avg_rating)}`}>
                          {studentGroup.avg_rating.toFixed(1)}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStudentSurveys(studentGroup);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver todas las evaluaciones
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalle de Evaluación
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedSurvey.student_name} - {selectedSurvey.course_title}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {selectedSurvey.overall_rating}/5
                  </div>
                  <div className="text-sm text-gray-600">Calificación General</div>
                  <div className="flex justify-center mt-2">
                    {renderStars(selectedSurvey.overall_rating)}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {selectedSurvey.would_recommend ? 'Sí' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">Recomendaría</div>
                  <div className="flex justify-center mt-2">
                    {selectedSurvey.would_recommend ? (
                      <ThumbsUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Calificaciones Detalladas</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedSurvey.content_quality}/5
                    </div>
                    <div className="text-sm text-gray-600">Calidad del Contenido</div>
                    <div className="flex justify-center mt-1">
                      {renderStars(selectedSurvey.content_quality, 'h-3 w-3')}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedSurvey.instructor_rating}/5
                    </div>
                    <div className="text-sm text-gray-600">Calificación del Instructor</div>
                    <div className="flex justify-center mt-1">
                      {renderStars(selectedSurvey.instructor_rating, 'h-3 w-3')}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedSurvey.difficulty_level}/5
                    </div>
                    <div className="text-sm text-gray-600">Nivel de Dificultad</div>
                    <div className="flex justify-center mt-1">
                      {renderStars(selectedSurvey.difficulty_level, 'h-3 w-3')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {selectedSurvey.comments && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comentarios</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedSurvey.comments}</p>
                  </div>
                </div>
              )}

              {/* Submission Info */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Enviado el {new Date(selectedSurvey.submitted_at).toLocaleString('es-ES')}</span>
                  <span>ID: {selectedSurvey.id}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Surveys Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Evaluaciones de Satisfacción
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedStudent.student_name} ({selectedStudent.student_email})
                </p>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {studentSurveys.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Este estudiante no ha enviado evaluaciones aún</p>
              </div>
            ) : (
              <div className="space-y-6">
                {studentSurveys.map((survey, index) => (
                  <div key={survey.id} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{survey.course_title}</h4>
                        <p className="text-sm text-gray-500">
                          Enviado el {new Date(survey.submitted_at).toLocaleDateString('es-ES')}
                        </p>
                        {survey.survey_type === 'general' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Encuesta General
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {survey.survey_type === 'general' ? survey.overall_experience : survey.overall_rating}/5
                        </div>
                        <div className="flex">
                          {renderStars(survey.survey_type === 'general' ? survey.overall_experience : survey.overall_rating, 'h-4 w-4')}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Ratings Grid */}
                    {survey.survey_type === 'general' ? (
                      // General satisfaction survey layout
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.overall_experience}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Experiencia General</div>
                          <div className="flex justify-center">
                            {renderStars(survey.overall_experience, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.content_quality}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Contenido de Cursos</div>
                          <div className="flex justify-center">
                            {renderStars(survey.content_quality, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.platform_usability}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Facilidad de Uso</div>
                          <div className="flex justify-center">
                            {renderStars(survey.platform_usability, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.formador_support}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Soporte Formadores</div>
                          <div className="flex justify-center">
                            {renderStars(survey.formador_support, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.time_management}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Gestión del Tiempo</div>
                          <div className="flex justify-center">
                            {renderStars(survey.time_management, 'h-3 w-3')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Course satisfaction survey layout
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.overall_rating}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Calificación General</div>
                          <div className="flex justify-center">
                            {renderStars(survey.overall_rating, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.content_quality}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Calidad del Contenido</div>
                          <div className="flex justify-center">
                            {renderStars(survey.content_quality, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.instructor_rating}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Calificación del Instructor</div>
                          <div className="flex justify-center">
                            {renderStars(survey.instructor_rating, 'h-3 w-3')}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {survey.difficulty_level}/5
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Nivel de Dificultad</div>
                          <div className="flex justify-center">
                            {renderStars(survey.difficulty_level, 'h-3 w-3')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border">
                        {survey.would_recommend ? (
                          <>
                            <ThumbsUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {survey.survey_type === 'general' ? 'Recomendaría este proceso' : 'Recomendaría este curso'}
                            </span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              {survey.survey_type === 'general' ? 'No recomendaría este proceso' : 'No recomendaría este curso'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Comments and Suggestions */}
                    <div className="space-y-4">
                      {survey.comments && (
                        <div className="bg-white rounded-lg border p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Comentarios:</h5>
                          <p className="text-gray-700 text-sm">{survey.comments}</p>
                        </div>
                      )}
                      
                      {survey.survey_type === 'general' && survey.suggestions && (
                        <div className="bg-white rounded-lg border p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Sugerencias de Mejora:</h5>
                          <p className="text-gray-700 text-sm">{survey.suggestions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStudentModal(false)}
                className="btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSatisfactionDetails;
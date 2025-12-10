import { useState, useEffect } from 'react';
import { gradesAPI, coursesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StudentGrades from './StudentGrades';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Award,
  X,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Grades = () => {
  const { user, isAdmin, isFormador, isEstudiante } = useAuth();
  
  // If user is a student, show student-specific grades component
  if (isEstudiante()) {
    return <StudentGrades />;
  }
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterGrades();
  }, [grades, selectedCourse, selectedStudent, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin()) {
        const [coursesRes, studentsRes, gradesRes, summaryRes] = await Promise.all([
          coursesAPI.getAll(),
          usersAPI.getStudents(),
          gradesAPI.getAll(),
          gradesAPI.getOverallStats()
        ]);
        
        setCourses(coursesRes.data.courses);
        setStudents(studentsRes.data.students);
        setGrades(gradesRes.data.grades);
        setSummary(summaryRes.data);
        
        console.log('Loaded data for admin:', {
          courses: coursesRes.data.courses.length,
          students: studentsRes.data.students.length,
          grades: gradesRes.data.grades.length
        });
      } else if (isFormador()) {
        const [coursesRes, studentsRes, gradesRes] = await Promise.all([
          coursesAPI.getAll(),
          usersAPI.getStudents(),
          gradesAPI.getAll()
        ]);
        
        setCourses(coursesRes.data.courses);
        setStudents(studentsRes.data.students);
        setGrades(gradesRes.data.grades);
        
        console.log('Loaded data for formador:', {
          courses: coursesRes.data.courses.length,
          students: studentsRes.data.students.length,
          grades: gradesRes.data.grades.length
        });
      } else if (isEstudiante()) {
        const [gradesRes, summaryRes] = await Promise.all([
          gradesAPI.getByStudent(user.id),
          gradesAPI.getSummary(user.id)
        ]);
        
        setGrades(gradesRes.data.grades);
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast.error('Error al cargar calificaciones');
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };


  const filterGrades = () => {
    let filtered = grades;

    if (selectedCourse !== 'all') {
      filtered = filtered.filter(grade => grade.course_title === selectedCourse);
    }

    if (selectedStudent !== 'all') {
      filtered = filtered.filter(grade => grade.student_name === selectedStudent);
    }

    if (searchTerm) {
      filtered = filtered.filter(grade =>
        grade.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by student to show each student only once
    const studentGrades = filtered.reduce((acc, grade) => {
      const key = `${grade.student_name}_${grade.student_email}`;
      if (!acc[key]) {
        acc[key] = {
          ...grade,
          total_evaluations: 0,
          sum_percentage: 0, // Changed: use sum instead of average
          courses: new Set(),
          last_activity: grade.completed_at,
          all_percentages: [] // Store all percentages for correct calculation
        };
      }
      
      acc[key].courses.add(grade.course_title);
      acc[key].total_evaluations++;
      acc[key].sum_percentage += (grade.percentage || 0); // Add percentage to sum
      acc[key].all_percentages.push(grade.percentage || 0); // Store individual percentages
      
      // Keep the most recent activity date
      if (new Date(grade.completed_at) > new Date(acc[key].last_activity)) {
        acc[key].last_activity = grade.completed_at;
      }
      
      return acc;
    }, {});

    // Convert back to array and calculate correct average
    const uniqueStudents = Object.values(studentGrades).map(student => {
      const correctAverage = student.total_evaluations > 0 
        ? student.sum_percentage / student.total_evaluations 
        : 0;
        
      return {
        ...student,
        course_count: student.courses.size,
        avg_percentage: Math.round(correctAverage) // Use correct average
      };
    });

    setFilteredGrades(uniqueStudents);
  };

  const getGradeColor = (percentage, passingScore) => {
    if (percentage >= passingScore) {
      return 'text-green-600 bg-green-100';
    } else if (percentage >= passingScore * 0.7) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-red-600 bg-red-100';
    }
  };

  const getGradeIcon = (percentage, passingScore) => {
    if (percentage >= passingScore) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <XCircle className="h-4 w-4" />;
    }
  };

  const handleViewStudentDetails = async (studentName, studentId = null) => {
    try {
      // If we don't have studentId, find it from the student name
      const targetStudentId = studentId || students.find(s => s.name === studentName)?.id;
      
      if (!targetStudentId) {
        toast.error('No se pudo encontrar el estudiante');
        return;
      }

      // Get all grades for the student - both quiz and workshop grades will be included
      // by filtering from the main grades list that already has all data
      const studentGrades = grades.filter(grade => grade.student_name === studentName);

      const studentInfo = students.find(s => s.id == targetStudentId);
      
      // Also try to get summary data
      const summaryRes = await gradesAPI.getSummary(targetStudentId).catch(() => ({ data: null }));
      
      setSelectedStudentDetails({
        student: studentInfo,
        grades: studentGrades,
        summary: summaryRes.data
      });
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles del estudiante');
      console.error('Error fetching student details:', error);
    }
  };

  const handleViewAnswers = async (gradeId) => {
    try {
      setLoadingAudit(true);
      const response = await gradesAPI.auditGrade(gradeId);
      setAuditData(response.data);
      setShowAuditModal(true);
    } catch (error) {
      toast.error('Error al cargar las respuestas del estudiante');
      console.error('Error loading audit data:', error);
    } finally {
      setLoadingAudit(false);
    }
  };

  const exportToExcel = () => {
    if (!isAdmin() && !isFormador()) {
      toast.error('No tienes permisos para exportar datos');
      return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Preparar datos en formato horizontal
    const worksheetData = [];
    
    // ENCABEZADOS EN LA PRIMERA FILA (CON COLORES DE FONDO)
    const headers = [
      'ESTUDIANTE',
      'EMAIL',
      'CURSO',
      'ACTIVIDAD',
      'TIPO EVALUACIÓN',
      'TÍTULO EVALUACIÓN',
      'PUNTUACIÓN',
      'PUNTAJE MÁXIMO',
      'PORCENTAJE',
      'ESTADO',
      'INTENTO #',
      'FECHA COMPLETADO',
      'NOTA MÍNIMA REQUERIDA',
      'PROMEDIO ESTUDIANTE',
      'TOTAL EVALUACIONES'
    ];
    
    worksheetData.push(headers);
    
    // PROCESAR CADA CALIFICACIÓN EN FILAS HORIZONTALES
    grades.forEach(grade => {
      // Calcular datos del estudiante
      const studentGrades = grades.filter(g => g.student_name === grade.student_name);
      const studentAverage = studentGrades.length > 0 ? 
        Math.round(studentGrades.reduce((sum, g) => sum + (parseFloat(g.percentage) || 0), 0) / studentGrades.length) : 0;
      
      const row = [
        grade.student_name || 'N/A',
        grade.student_email || 'N/A',
        grade.course_title || 'N/A',
        grade.activity_title || 'N/A',
        grade.grade_type === 'quiz' ? 'QUIZ' : 'TALLER',
        grade.quiz_title || 'N/A',
        grade.score || 0,
        grade.max_score || 0,
        `${grade.percentage || 0}%`,
        parseFloat(grade.percentage || 0) >= (grade.passing_score || 70) ? 'APROBADO' : 'REPROBADO',
        grade.attempt_number || 1,
        grade.completed_at ? new Date(grade.completed_at).toLocaleDateString('es-ES') : 'N/A',
        `${grade.passing_score || 70}%`,
        `${studentAverage}%`,
        studentGrades.length
      ];
      
      worksheetData.push(row);
    });
    
    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // CONFIGURAR ANCHOS DE COLUMNA
    const colWidths = [
      { wch: 20 }, // ESTUDIANTE
      { wch: 25 }, // EMAIL
      { wch: 20 }, // CURSO
      { wch: 25 }, // ACTIVIDAD
      { wch: 15 }, // TIPO EVALUACIÓN
      { wch: 30 }, // TÍTULO EVALUACIÓN
      { wch: 12 }, // PUNTUACIÓN
      { wch: 15 }, // PUNTAJE MÁXIMO
      { wch: 12 }, // PORCENTAJE
      { wch: 12 }, // ESTADO
      { wch: 10 }, // INTENTO #
      { wch: 15 }, // FECHA COMPLETADO
      { wch: 18 }, // NOTA MÍNIMA
      { wch: 18 }, // PROMEDIO ESTUDIANTE
      { wch: 18 }  // TOTAL EVALUACIONES
    ];
    worksheet['!cols'] = colWidths;
    
    // APLICAR COLORES DE FONDO A LOS TÍTULOS (FILA 1) - MÉTODO MEJORADO
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      
      // Definir colores según el tipo de columna
      let backgroundColor = 'FF1E3A8A'; // Azul por defecto con alpha
      
      if (header.includes('ESTUDIANTE') || header.includes('EMAIL')) {
        backgroundColor = 'FFDC2626'; // Rojo para datos del estudiante
      } else if (header.includes('CURSO')) {
        backgroundColor = 'FF7C3AED'; // Púrpura para curso
      } else if (header.includes('ACTIVIDAD')) {
        backgroundColor = 'FFEA580C'; // Naranja para actividad
      } else if (header.includes('EVALUACIÓN') || header.includes('TÍTULO') || header.includes('PUNTUACIÓN') || header.includes('PUNTAJE') || header.includes('PORCENTAJE') || header.includes('ESTADO') || header.includes('INTENTO') || header.includes('FECHA') || header.includes('NOTA')) {
        backgroundColor = 'FF0891B2'; // Cyan para detalles de evaluación
      } else if (header.includes('PROMEDIO') || header.includes('TOTAL')) {
        backgroundColor = 'FF059669'; // Verde para estadísticas
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
              horizontal: colIndex === 0 || colIndex === 1 ? "left" : "center", 
              vertical: "center" 
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
          
          // Colorear estado según aprobación
          if (colIndex === 9) { // Columna ESTADO
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'APROBADO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "059669" }, bold: true };
            } else if (cellValue === 'REPROBADO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "DC2626" }, bold: true };
            }
          }
        }
      }
    }
    
    // Establecer altura de la fila de encabezados
    worksheet['!rows'] = [{ hpt: 30 }]; // Altura de 30 puntos para la primera fila
    
    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');
    
    // Generar y descargar el archivo
    const fileName = `Reporte_Calificaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('📊 Reporte de calificaciones exportado exitosamente');
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isEstudiante() ? 'Mis Calificaciones' : 'Gestión de Calificaciones'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEstudiante() 
              ? 'Revisa tu progreso académico' 
              : 'Monitorea el desempeño de los estudiantes'
            }
          </p>
        </div>
        {/* Export Button - Only for Admin and Formador */}
        {(isAdmin() || isFormador()) && (
          <div>
            <button
              onClick={exportToExcel}
              className="btn-primary flex items-center gap-2"
              disabled={filteredGrades.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar a Excel
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Quizzes Realizados' : 'Total Intentos'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.general?.total_quiz_attempts || summary.total_quizzes_taken || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio General</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(summary.general?.overall_average_score || summary.average_percentage || 0) || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Quizzes Aprobados' : 'Mejor Calificación'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isEstudiante() 
                    ? (summary.quizzes_passed || 0)
                    : Math.round(summary.general?.highest_percentage || summary.highest_percentage || 0) + '%'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Cursos Asignados' : 'Total Estudiantes'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isEstudiante() 
                    ? (summary.course_progress?.length || 0)
                    : (summary.general?.total_students || students.length || 0)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isEstudiante() && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 form-input"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="form-input"
              >
                <option value="all">Todos los cursos</option>
                {courses.map(course => (
                  <option key={course.id} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>

            {(isAdmin() || isFormador()) && (
              <div>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Todos los estudiantes</option>
                  {students.map(student => (
                    <option key={student.id} value={student.name}>{student.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredGrades.length} estudiante(s) con calificaciones
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!isEstudiante() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evaluaciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((student, index) => (
                <tr key={`${student.student_name}_${student.student_email}_${index}`} className="hover:bg-gray-50">
                  {!isEstudiante() && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleViewStudentDetails(student.student_name)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          {student.student_name}
                        </button>
                        <div className="text-sm text-gray-500">{student.student_email || 'N/A'}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.course_count} curso{student.course_count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Array.from(student.courses).slice(0, 2).join(', ')}
                      {student.course_count > 2 && ` +${student.course_count - 2} más`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.total_evaluations} evaluaciones
                    </div>
                    <div className="text-sm text-gray-500">
                      Quizzes y Talleres
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.avg_percentage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          student.avg_percentage >= 70 ? 'bg-green-500' : student.avg_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(student.avg_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.avg_percentage >= 70 ? 'text-green-600 bg-green-100' : 
                      student.avg_percentage >= 60 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {student.avg_percentage >= 70 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {student.avg_percentage >= 70 ? 'Satisfactorio' : student.avg_percentage >= 60 ? 'Regular' : 'Necesita Mejora'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.last_activity).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGrades.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedCourse !== 'all' || selectedStudent !== 'all' 
                  ? 'No se encontraron estudiantes con los filtros aplicados' 
                  : 'No hay estudiantes con calificaciones disponibles'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Course Progress (Only for students) */}
      {isEstudiante() && summary?.course_progress && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso por Curso</h2>
          <div className="space-y-4">
            {summary.course_progress.map((course) => (
              <div key={course.course_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900">{course.course_title}</h3>
                  <span className="text-sm text-gray-500">
                    {course.completed_activities}/{course.total_activities} actividades
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quizzes realizados:</span>
                    <span className="ml-2 font-medium">{course.quizzes_taken || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Promedio:</span>
                    <span className="ml-2 font-medium">
                      {course.average_quiz_score ? Math.round(course.average_quiz_score) + '%' : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso de actividades</span>
                    <span className="font-medium">
                      {Math.round((course.completed_activities / course.total_activities) * 100) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(course.completed_activities / course.total_activities) * 100 || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && auditData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Auditoría de Respuestas
                  </h3>
                  <p className="text-sm text-gray-600">
                    {auditData.grade.student_name} - {auditData.grade.quiz_title}
                  </p>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Resultado Almacenado</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {auditData.stored_results.score}/{auditData.stored_results.max_score}
                  </div>
                  <div className="text-sm text-blue-700">{auditData.stored_results.percentage}%</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Resultado Recalculado</div>
                  <div className="text-2xl font-bold text-green-900">
                    {auditData.calculated_results.score}/{auditData.calculated_results.max_score}
                  </div>
                  <div className="text-sm text-green-700">{auditData.calculated_results.percentage}%</div>
                </div>
                
                <div className={`p-4 rounded-lg ${auditData.is_calculation_correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-sm font-medium ${auditData.is_calculation_correct ? 'text-green-600' : 'text-red-600'}`}>
                    Estado de Verificación
                  </div>
                  <div className={`text-2xl font-bold ${auditData.is_calculation_correct ? 'text-green-900' : 'text-red-900'}`}>
                    {auditData.is_calculation_correct ? '✓' : '✗'}
                  </div>
                  <div className={`text-sm ${auditData.is_calculation_correct ? 'text-green-700' : 'text-red-700'}`}>
                    {auditData.is_calculation_correct ? 'Correcto' : 'Error de cálculo'}
                  </div>
                </div>
              </div>

              {/* Questions Audit */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-4">Detalle de Respuestas:</h4>
                {auditData.questions_audit.map((question, index) => (
                  <div key={question.question_id} className={`p-4 rounded-lg border ${question.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        Pregunta {index + 1}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {question.points_earned}/{question.points_possible} puntos
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">{question.question}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Opciones:</div>
                        {question.options && question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`p-2 rounded mb-1 ${
                            optIndex === question.correct_answer ? 'bg-green-100 text-green-800' :
                            optIndex === question.student_answer ? 'bg-red-100 text-red-800' : 'bg-gray-50'
                          }`}>
                            {optIndex}. {option}
                            {optIndex === question.correct_answer && ' ✓ (Correcta)'}
                            {optIndex === question.student_answer && optIndex !== question.correct_answer && ' ✗ (Seleccionada)'}
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-gray-600">Respuesta del estudiante:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {question.student_answer !== undefined ? question.student_answer : 'Sin respuesta'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Respuesta correcta:</span>
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {question.correct_answer}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Resumen:</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total:</span> {auditData.summary.total_questions}
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">Correctas:</span> {auditData.summary.correct_answers}
                  </div>
                  <div className="text-red-700">
                    <span className="font-medium">Incorrectas:</span> {auditData.summary.incorrect_answers}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Sin responder:</span> {auditData.summary.unanswered}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="btn-primary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Calificaciones de {selectedStudentDetails.student?.name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Student Summary */}
            {selectedStudentDetails.grades && (() => {
              const grades = selectedStudentDetails.grades;
              const quizGrades = grades.filter(g => g.grade_type === 'quiz');
              const workshopGrades = grades.filter(g => g.grade_type === 'workshop');
              
              const totalQuizzes = quizGrades.length;
              const totalWorkshops = workshopGrades.length;
              const totalEvaluations = totalQuizzes + totalWorkshops;
              
              // Safe calculation of averages with NaN protection
              const averageQuiz = totalQuizzes > 0 ? 
                quizGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / totalQuizzes : 0;
              const averageWorkshop = totalWorkshops > 0 ? 
                workshopGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / totalWorkshops : 0;
              
              // Calculate weighted overall average safely
              const overallAverage = totalEvaluations > 0 ? 
                grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / totalEvaluations : 0;
              
              // Safe calculation of highest grade
              const validPercentages = grades.map(g => g.percentage || 0).filter(p => !isNaN(p));
              const highestGrade = validPercentages.length > 0 ? Math.max(...validPercentages) : 0;
              
              const passedQuizzes = quizGrades.filter(g => (g.percentage || 0) >= (g.passing_score || 70)).length;
              const passedWorkshops = workshopGrades.filter(g => (g.percentage || 0) >= (g.passing_score || 70)).length;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalQuizzes}
                    </div>
                    <div className="text-sm text-gray-600">Quizzes Realizados</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalWorkshops}
                    </div>
                    <div className="text-sm text-gray-600">Talleres Realizados</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(overallAverage)}%
                    </div>
                    <div className="text-sm text-gray-600">Promedio General</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(highestGrade)}%
                    </div>
                    <div className="text-sm text-gray-600">Mejor Calificación</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {passedQuizzes + passedWorkshops}
                    </div>
                    <div className="text-sm text-gray-600">Evaluaciones Aprobadas</div>
                  </div>
                </div>
              );
            })()}

            {/* Grades organized by Course and Activity */}
            <div className="space-y-6">
              {selectedStudentDetails.grades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Este estudiante aún no tiene calificaciones registradas
                </div>
              ) : (() => {
                // Group grades by course, then by activity
                const gradesByCourse = selectedStudentDetails.grades.reduce((acc, grade) => {
                  if (!acc[grade.course_title]) {
                    acc[grade.course_title] = {};
                  }
                  if (!acc[grade.course_title][grade.activity_title]) {
                    acc[grade.course_title][grade.activity_title] = {
                      quizzes: [],
                      workshops: []
                    };
                  }
                  
                  if (grade.grade_type === 'quiz') {
                    acc[grade.course_title][grade.activity_title].quizzes.push(grade);
                  } else {
                    acc[grade.course_title][grade.activity_title].workshops.push(grade);
                  }
                  
                  return acc;
                }, {});

                return Object.entries(gradesByCourse).map(([courseName, activities]) => (
                  <div key={courseName} className="border rounded-lg overflow-hidden">
                    {/* Course Header */}
                    <div className="bg-gray-100 px-6 py-4 border-b">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {courseName}
                      </h4>
                    </div>

                    {/* Activities */}
                    <div className="divide-y divide-gray-200">
                      {Object.entries(activities).map(([activityName, evaluations]) => (
                        <div key={activityName} className="p-6">
                          <h5 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {activityName}
                          </h5>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Quizzes */}
                            <div>
                              <h6 className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Quizzes ({evaluations.quizzes.length})
                              </h6>
                              {evaluations.quizzes.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay quizzes realizados</p>
                              ) : (
                                <div className="space-y-3">
                                  {evaluations.quizzes.map((quiz) => (
                                    <div key={quiz.id} className="bg-blue-50 rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-gray-900">{quiz.quiz_title}</div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(quiz.percentage, quiz.passing_score)}`}>
                                          {getGradeIcon(quiz.percentage, quiz.passing_score)}
                                          <span className="ml-1">
                                            {quiz.percentage >= quiz.passing_score ? 'Aprobado' : 'Reprobado'}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        {quiz.score}/{quiz.max_score} puntos ({quiz.percentage}%)
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            quiz.percentage >= quiz.passing_score ? 'bg-blue-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(quiz.percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500">
                                          {new Date(quiz.completed_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })} • Intento #{quiz.attempt_number}
                                        </div>
                                        {(isAdmin() || isFormador()) && (
                                          <button
                                            onClick={() => handleViewAnswers(quiz.id)}
                                            disabled={loadingAudit}
                                            className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full transition-colors duration-200 flex items-center gap-1"
                                            title="Ver respuestas del estudiante"
                                          >
                                            <Eye className="h-3 w-3" />
                                            Ver Respuestas
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Workshops */}
                            <div>
                              <h6 className="text-sm font-medium text-purple-600 mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Talleres ({evaluations.workshops.length})
                              </h6>
                              {evaluations.workshops.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay talleres realizados</p>
                              ) : (
                                <div className="space-y-3">
                                  {evaluations.workshops.map((workshop) => (
                                    <div key={workshop.id} className="bg-purple-50 rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-gray-900">{workshop.quiz_title}</div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(workshop.percentage, workshop.passing_score)}`}>
                                          {getGradeIcon(workshop.percentage, workshop.passing_score)}
                                          <span className="ml-1">
                                            {workshop.percentage >= workshop.passing_score ? 'Aprobado' : 'Reprobado'}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        {workshop.score}/{workshop.max_score} puntos ({workshop.percentage}%)
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            workshop.percentage >= workshop.passing_score ? 'bg-purple-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(workshop.percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(workshop.completed_at).toLocaleDateString('es-ES', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} • Intento #{workshop.attempt_number}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
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

export default Grades;
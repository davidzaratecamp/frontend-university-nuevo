import { useState, useEffect } from 'react';
import { usersAPI, coursesAPI, assignmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  BookOpen,
  UserPlus,
  Mail,
  Calendar,
  GraduationCap,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Students = () => {
  const { user, isAdmin, isFormador } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [currentlyAssignedCourses, setCurrentlyAssignedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      toast.error('Error al cargar estudiantes');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: 'estudiante'
        };
        
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        
        await usersAPI.update(editingStudent.id, updateData);
        toast.success('Estudiante actualizado exitosamente');
      } else {
        await usersAPI.create({
          ...formData,
          role: 'estudiante'
        });
        toast.success('Estudiante creado exitosamente');
      }
      
      setShowModal(false);
      setEditingStudent(null);
      setFormData({ name: '', email: '', password: '' });
      fetchStudents();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar estudiante';
      toast.error(message);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
      try {
        await usersAPI.delete(studentId);
        toast.success('Estudiante eliminado exitosamente');
        fetchStudents();
      } catch (error) {
        toast.error('Error al eliminar estudiante');
      }
    }
  };

  const handleOpenAssignModal = async (student) => {
    try {
      setSelectedStudent(student);
      
      // Load current course assignments for this student
      const response = await assignmentsAPI.getStudentCourses(student.id);
      const assignedCourseIds = response.data.courseIds;
      
      setCurrentlyAssignedCourses(assignedCourseIds);
      setSelectedCourses(assignedCourseIds); // Pre-select currently assigned courses
      setShowAssignModal(true);
    } catch (error) {
      toast.error('Error al cargar asignaciones del estudiante');
      console.error('Error loading student assignments:', error);
    }
  };

  const handleAssignCourses = async () => {
    try {
      // Find courses to assign (newly selected)
      const coursesToAssign = selectedCourses.filter(courseId => 
        !currentlyAssignedCourses.includes(courseId)
      );
      
      // Find courses to unassign (previously selected but now unchecked)
      const coursesToUnassign = currentlyAssignedCourses.filter(courseId => 
        !selectedCourses.includes(courseId)
      );

      // Execute assignments and unassignments
      const assignPromises = coursesToAssign.map(courseId => 
        assignmentsAPI.create({
          course_id: courseId,
          student_id: selectedStudent.id
        })
      );
      
      const unassignPromises = coursesToUnassign.map(courseId => 
        assignmentsAPI.removeCourse(selectedStudent.id, courseId)
      );
      
      await Promise.all([...assignPromises, ...unassignPromises]);
      
      const totalChanges = coursesToAssign.length + coursesToUnassign.length;
      if (totalChanges > 0) {
        let message = '';
        if (coursesToAssign.length > 0 && coursesToUnassign.length > 0) {
          message = `${coursesToAssign.length} curso(s) asignado(s) y ${coursesToUnassign.length} desasignado(s)`;
        } else if (coursesToAssign.length > 0) {
          message = `${coursesToAssign.length} curso(s) asignado(s) exitosamente`;
        } else {
          message = `${coursesToUnassign.length} curso(s) desasignado(s) exitosamente`;
        }
        toast.success(message);
      } else {
        toast('No se realizaron cambios');
      }
      
      setShowAssignModal(false);
      setSelectedCourses([]);
      setCurrentlyAssignedCourses([]);
      setSelectedStudent(null);
      fetchStudents(); // Refresh to show updated assignments
    } catch (error) {
      toast.error('Error al actualizar asignaciones');
      console.error('Error updating assignments:', error);
    }
  };

  const handleCourseSelection = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleViewDetails = async (student) => {
    try {
      const response = await usersAPI.getStudentDetails(student.id);
      setStudentDetails(response.data.student);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles del estudiante');
      console.error('Error fetching student details:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin() ? 'Gestión de Estudiantes' : 'Mis Estudiantes'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin() ? 'Administra estudiantes del sistema' : 'Estudiantes bajo tu formación'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setFormData({ name: '', email: '', password: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Estudiante
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar estudiantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 form-input"
          />
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
              <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Asignados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.reduce((sum, student) => sum + (student.assigned_courses ? student.assigned_courses.split(',').length : 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="card hover:shadow-lg transition-all duration-200">
            {/* Profile Header */}
            <div className="text-center mb-4">
              {student.profile_image ? (
                <img 
                  src={student.profile_image} 
                  alt={student.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-4 ring-blue-100"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-white">
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {student.name}
              </h3>
              
              <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-medium">Estudiante</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 truncate">{student.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Registrado {new Date(student.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {student.assigned_courses ? student.assigned_courses.split(',').length : 0} curso(s)
                </span>
              </div>
            </div>

            {/* Assigned Courses */}
            {student.assigned_courses && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Cursos Asignados:</h4>
                <div className="flex flex-wrap gap-1">
                  {student.assigned_courses.split(',').slice(0, 2).map((course, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {course.trim()}
                    </span>
                  ))}
                  {student.assigned_courses.split(',').length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{student.assigned_courses.split(',').length - 2} más
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mb-3">
              <button
                onClick={() => handleViewDetails(student)}
                className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
                Ver Detalles
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenAssignModal(student)}
                  className="flex-1 btn-secondary text-center flex items-center justify-center gap-2 text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Asignar
                </button>
                
                <button
                  onClick={() => handleEdit(student)}
                  className="btn-outline flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              
                {isAdmin() && (
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="btn-outline text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600">Activo</span>
                </div>
                <span className="text-gray-500">ID: {student.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingStudent(null);
                setFormData({ name: '', email: '', password: '' });
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              Crear Primer Estudiante
            </button>
          )}
        </div>
      )}

      {/* Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="Nombre completo del estudiante"
                />
              </div>

              <div>
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  placeholder="correo@email.com"
                />
              </div>

              <div>
                <label className="form-label">
                  Contraseña {editingStudent && '(dejar vacío para mantener la actual)'}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-input"
                  placeholder={editingStudent ? "Nueva contraseña (opcional)" : "Contraseña del estudiante"}
                />
              </div>


              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingStudent ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Gestionar Cursos de {selectedStudent?.name}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {courses.map((course) => {
                const isCurrentlyAssigned = currentlyAssignedCourses.includes(course.id);
                const isSelected = selectedCourses.includes(course.id);
                
                return (
                  <label 
                    key={course.id} 
                    className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                      isCurrentlyAssigned ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCourseSelection(course.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        {isCurrentlyAssigned && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Asignado
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{course.description}</div>
                    </div>
                  </label>
                );
              })}
              
              {courses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay cursos disponibles para asignar</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignCourses}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-1"
              >
                Actualizar Asignaciones ({selectedCourses.length} seleccionados)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && studentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles de {studentDetails.name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="text-center">
                  {studentDetails.profile_image ? (
                    <img 
                      src={studentDetails.profile_image} 
                      alt={studentDetails.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-3 ring-4 ring-blue-100"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-white">
                        {studentDetails.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <h4 className="text-lg font-semibold text-gray-900">{studentDetails.name}</h4>
                  <p className="text-gray-600">{studentDetails.email}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Registrado: {new Date(studentDetails.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {studentDetails.assignments.length} curso(s) asignado(s)
                    </span>
                  </div>
                </div>

                {studentDetails.bio && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Biografía:</h5>
                    <p className="text-gray-600 text-sm">{studentDetails.bio}</p>
                  </div>
                )}
              </div>

              {/* Course Assignments */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cursos Asignados</h4>
                {studentDetails.assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No tiene cursos asignados
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {studentDetails.assignments.map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900 text-sm">
                            {assignment.course_title}
                          </h5>
                          <span className="text-xs text-gray-500">
                            {new Date(assignment.assigned_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        
                        {assignment.course_description && (
                          <p className="text-gray-600 text-xs mb-2">
                            {assignment.course_description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">
                            Asignado por: {assignment.assigned_by_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenAssignModal({
                    id: studentDetails.id,
                    name: studentDetails.name
                  });
                }}
                className="btn-primary flex-1"
              >
                Asignar Más Cursos
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary flex-1"
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

export default Students;
import { useState, useEffect } from 'react';
import { usersAPI, assignmentsAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  UserCheck,
  Filter,
  BookOpen,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedFormador, setSelectedFormador] = useState(null);
  const [courses, setCourses] = useState([]);
  const [formadorCourses, setFormadorCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'estudiante',
    profile_image: '',
    bio: ''
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchCourses();
    }
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error('Error fetching users:', error);
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

  const fetchFormadorCourses = async (formadorId) => {
    try {
      const response = await usersAPI.getFormadorCourses(formadorId);
      setFormadorCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching formador courses:', error);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourse || !selectedFormador) return;
    
    try {
      await usersAPI.assignCourseToFormador(selectedFormador.id, selectedCourse);
      toast.success('Curso asignado exitosamente');
      fetchFormadorCourses(selectedFormador.id);
      setSelectedCourse('');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al asignar curso';
      toast.error(message);
    }
  };

  const handleUnassignCourse = async (courseId) => {
    if (!selectedFormador) return;
    
    try {
      await usersAPI.unassignCourseFromFormador(selectedFormador.id, courseId);
      toast.success('Curso desasignado exitosamente');
      fetchFormadorCourses(selectedFormador.id);
    } catch (error) {
      toast.error('Error al desasignar curso');
    }
  };

  const handleManageCourses = (formador) => {
    setSelectedFormador(formador);
    setShowCourseModal(true);
    fetchFormadorCourses(formador.id);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          profile_image: formData.profile_image,
          bio: formData.bio
        };
        
        // Solo incluir contraseña si se proporcionó una nueva
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        
        await usersAPI.update(editingUser.id, updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usersAPI.create(formData);
        toast.success('Usuario creado exitosamente');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'estudiante', profile_image: '', bio: '' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar usuario';
      toast.error(message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      profile_image: user.profile_image || '',
      bio: user.bio || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await usersAPI.delete(userId);
        toast.success('Usuario eliminado exitosamente');
        fetchUsers();
      } catch (error) {
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      formador: 'bg-blue-100 text-blue-800',
      estudiante: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      admin: 'Administrador',
      formador: 'Formador',
      estudiante: 'Estudiante'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">Administra usuarios del sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'estudiante', profile_image: '', bio: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 form-input"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="formador">Formadores</option>
              <option value="estudiante">Estudiantes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Formadores</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'formador').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'estudiante').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.profile_image && (
                        <img 
                          src={user.profile_image} 
                          alt={user.name}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {user.role === 'formador' && (
                        <button
                          onClick={() => handleManageCourses(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Gestionar cursos"
                        >
                          <BookOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  placeholder="Nombre completo del usuario"
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
                  Contraseña {editingUser && '(dejar vacío para mantener la actual)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-input"
                  placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña del usuario"}
                />
              </div>

              <div>
                <label className="form-label">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="form-input"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="formador">Formador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.role === 'formador' && (
                <>
                  <div>
                    <label className="form-label">Foto de Perfil (URL)</label>
                    <input
                      type="url"
                      value={formData.profile_image}
                      onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
                      className="form-input"
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </div>

                  <div>
                    <label className="form-label">Biografía</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="form-input"
                      rows="3"
                      placeholder="Breve descripción del formador..."
                    />
                  </div>
                </>
              )}

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
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Management Modal */}
      {showCourseModal && selectedFormador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Gestionar Cursos - {selectedFormador.name}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Assign new course */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Asignar Nuevo Curso</h4>
              <div className="flex gap-2">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="form-input flex-1"
                >
                  <option value="">Seleccionar curso...</option>
                  {courses.filter(course => 
                    !formadorCourses.some(fc => fc.id === course.id)
                  ).map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignCourse}
                  disabled={!selectedCourse}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Assigned courses */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cursos Asignados</h4>
              {formadorCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay cursos asignados
                </p>
              ) : (
                <div className="space-y-2">
                  {formadorCourses.map(course => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">
                          Asignado por: {course.assigned_by_name} - {new Date(course.assigned_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignCourse(course.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Desasignar curso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
              <button
                onClick={() => setShowCourseModal(false)}
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

export default Users;
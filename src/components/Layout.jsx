import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForumNotifications } from '../hooks/useForumNotifications';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Home,
  Star,
  MessageSquare
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isFormador, isEstudiante } = useAuth();
  const { unreadCount } = useForumNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getMenuItems = () => {
    const commonItems = [
      { name: 'Dashboard', icon: Home, href: '/' },
    ];

    if (isAdmin()) {
      return [
        ...commonItems,
        { name: 'Usuarios', icon: Users, href: '/users' },
        { name: 'Cursos', icon: BookOpen, href: '/courses' },
        { name: 'Foro', icon: MessageSquare, href: '/forum' },
        { name: 'Calificaciones', icon: BarChart3, href: '/grades' },
        { name: 'Satisfacción', icon: Star, href: '/satisfaction-admin' },
      ];
    }

    if (isFormador()) {
      return [
        ...commonItems,
        { name: 'Estudiantes', icon: Users, href: '/students' },
        { name: 'Cursos', icon: BookOpen, href: '/courses' },
        { name: 'Foro', icon: MessageSquare, href: '/forum' },
        { name: 'Calificaciones', icon: BarChart3, href: '/grades' },
      ];
    }

    if (isEstudiante()) {
      return [
        ...commonItems,
        { name: 'Mis Cursos', icon: BookOpen, href: '/courses' },
        { name: 'Mis Notas', icon: BarChart3, href: '/grades' },
        { name: 'Foro', icon: MessageSquare, href: '/forum' },
        { name: 'Formadores', icon: Users, href: '/formadores' },
        { name: 'Satisfacción', icon: Star, href: '/satisfaction' },
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-20 transition-opacity bg-black opacity-50 lg:hidden`} onClick={() => setSidebarOpen(false)}></div>
      
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white border-r lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            <span className="text-2xl font-semibold text-gray-800">Asiste University</span>
          </div>
        </div>

        <nav className="mt-10">
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {user?.role === 'admin' && 'Administrador'}
              {user?.role === 'formador' && 'Formador'}
              {user?.role === 'estudiante' && 'Estudiante'}
            </p>
          </div>
          
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-2 mt-5 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700"
            >
              <item.icon className="w-5 h-5" />
              <span className="mx-4 font-medium flex items-center gap-2">
                {item.name}
                {/* Forum notification badge */}
                {item.name === 'Foro' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center px-4 py-2 text-gray-600">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name?.charAt(0)}</span>
            </div>
            <div className="mx-4">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 mt-2 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="mx-4 font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center">
            <span className="text-gray-600">Bienvenido, {user?.name}</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
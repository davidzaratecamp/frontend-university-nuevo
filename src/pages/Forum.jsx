import { useState, useEffect } from 'react';
import { forumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useForumNotifications } from '../hooks/useForumNotifications';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Trash2, 
  Calendar,
  User,
  MessageCircle,
  X,
  Reply,
  Bell,
  BellOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Forum = () => {
  const { user, isAdmin, isFormador, isEstudiante } = useAuth();
  const { unreadCount, refreshUnreadCount } = useForumNotifications();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getPosts();
      setPosts(response.data.posts);
    } catch (error) {
      toast.error('Error al cargar publicaciones del foro');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await forumAPI.createPost({
        title: newPost.title,
        content: newPost.content,
        image_url: null
      });

      toast.success('Publicación creada exitosamente');
      setShowCreateModal(false);
      setNewPost({ title: '', content: '' });
      fetchPosts();
      refreshUnreadCount();
    } catch (error) {
      toast.error('Error al crear la publicación');
      console.error('Error creating post:', error);
    }
  };

  const handleViewPost = async (post) => {
    try {
      const response = await forumAPI.getPost(post.id);
      setSelectedPost(response.data.post);
      setComments(response.data.comments);
      setShowPostModal(true);
    } catch (error) {
      toast.error('Error al cargar la publicación');
      console.error('Error fetching post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await forumAPI.addComment(selectedPost.id, { 
        content: newComment,
        parent_comment_id: replyingTo
      });
      toast.success(replyingTo ? 'Respuesta agregada exitosamente' : 'Comentario agregado exitosamente');
      setNewComment('');
      setReplyingTo(null);
      
      // Recargar comentarios
      const response = await forumAPI.getPost(selectedPost.id);
      setComments(response.data.comments);
    } catch (error) {
      toast.error('Error al agregar comentario');
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }

    try {
      await forumAPI.deletePost(postId);
      toast.success('Publicación eliminada exitosamente');
      setShowPostModal(false);
      fetchPosts();
    } catch (error) {
      toast.error('Error al eliminar la publicación');
      console.error('Error deleting post:', error);
    }
  };



  const fetchNotifications = async () => {
    try {
      const response = await forumAPI.getNotifications();
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await forumAPI.markNotificationRead(notification.id);
      refreshUnreadCount();
      fetchNotifications(); // Refresh notifications list
      if (notification.related_post_id) {
        handleViewPost({ id: notification.related_post_id });
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    document.querySelector('textarea[placeholder*="comentario"]')?.focus();
  };

  const renderComment = (comment, depth = 0) => {
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            {comment.author_image ? (
              <img 
                src={comment.author_image} 
                alt={comment.author_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="flex-1">
              <span className="font-medium text-gray-900">{comment.author_name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {new Date(comment.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
            <button
              onClick={() => handleReply(comment.id)}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Responder
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Foro</h1>
          <p className="text-gray-600 mt-2">
            {isFormador() || isAdmin() 
              ? 'Comparte información y mantente conectado con los estudiantes'
              : 'Mantente al día con las publicaciones de tus formadores'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b">
                  <h3 className="font-medium text-gray-900">Notificaciones</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {(isFormador() || isAdmin()) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nueva Publicación
            </button>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay publicaciones en el foro</p>
            {(isFormador() || isAdmin()) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary mt-4"
              >
                Crear Primera Publicación
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-all duration-200">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {post.author_image ? (
                    <img 
                      src={post.author_image} 
                      alt={post.author_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{post.author_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {((isAdmin()) || (user.id === post.author_id)) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-700 line-clamp-3">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4">
                  <img 
                    src={post.image_url} 
                    alt="Post image"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Post Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{post.comment_count || 0} comentarios</span>
                </div>
                
                <button
                  onClick={() => handleViewPost(post)}
                  className="btn-outline text-sm"
                >
                  Ver Completo
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Publicación</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="form-label">Título</label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="form-input"
                  placeholder="Título de la publicación"
                />
              </div>

              <div>
                <label className="form-label">Contenido</label>
                <textarea
                  required
                  rows={6}
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="form-input"
                  placeholder="Escribe el contenido de tu publicación..."
                />
              </div>


              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex-1"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Post Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Publicación</h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Post Content */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {selectedPost.author_image ? (
                  <img 
                    src={selectedPost.author_image} 
                    alt={selectedPost.author_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{selectedPost.author_name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedPost.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h2>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedPost.content}</p>
              
              {selectedPost.image_url && (
                <img 
                  src={selectedPost.image_url} 
                  alt="Post image"
                  className="w-full max-h-96 object-cover rounded-lg mb-6"
                />
              )}
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Comentarios ({comments.length})
              </h4>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                {replyingTo && (
                  <div className="mb-2 p-2 bg-blue-50 rounded text-sm text-blue-700 flex items-center justify-between">
                    <span>Respondiendo a comentario...</span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe un comentario..."}
                    className="form-input flex-1"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="btn-primary self-start disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                ) : (
                  comments.map((comment) => renderComment(comment))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
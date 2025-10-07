import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopsAPI, workshopQuestionsAPI, gradesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getFileUrl } from '../config/api.config';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  RotateCcw,
  Trophy,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const TakeWorkshop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [workshopStarted, setWorkshopStarted] = useState(false);
  const [workshopCompleted, setWorkshopCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkshopDetails();
  }, [id]);

  const fetchWorkshopDetails = async () => {
    try {
      setLoading(true);
      const [workshopRes, questionsRes] = await Promise.all([
        workshopsAPI.getById(id),
        workshopQuestionsAPI.getByWorkshop(id)
      ]);
      
      const workshopData = workshopRes.data.workshop;
      setWorkshop(workshopData);
      setQuestions(questionsRes.data.questions || []);

      // Check if already completed
      if (workshopData.is_completed) {
        setWorkshopCompleted(true);
        setResult({
          score: workshopData.completed_score || 0,
          percentage: workshopData.completed_score || 0,
          passed: (workshopData.completed_score || 0) >= 70,
          message: 'Ya has completado este taller anteriormente.'
        });
      }
    } catch (error) {
      toast.error('Error al cargar el taller');
      console.error('Error fetching workshop:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkshop = () => {
    setWorkshopStarted(true);
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitWorkshop = async () => {
    try {
      setSubmitting(true);
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      questions.forEach(question => {
        totalPoints += question.points;
        if (answers[question.id] === question.correct_answer) {
          correctAnswers += question.points;
        }
      });
      
      const percentage = Math.round((correctAnswers / totalPoints) * 100);
      
      // Submit grade for workshop
      const gradeData = {
        student_id: user.id,
        workshop_id: parseInt(id),
        score: correctAnswers,
        max_score: totalPoints,
        percentage: percentage,
        answers: answers
      };
      
      await gradesAPI.submitWorkshopGrade(gradeData);
      
      setResult({
        score: correctAnswers,
        maxScore: totalPoints,
        percentage: percentage,
        totalQuestions: questions.length,
        correctCount: Object.keys(answers).filter(qId => {
          const question = questions.find(q => q.id == qId);
          return question && answers[qId] === question.correct_answer;
        }).length
      });
      
      setWorkshopCompleted(true);
      toast.success('Taller enviado exitosamente');
    } catch (error) {
      toast.error('Error al enviar el taller');
      console.error('Error submitting workshop:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getOptionLabel = (option) => {
    const labels = { 'A': 'Opción A', 'B': 'Opción B', 'C': 'Opción C', 'D': 'Opción D' };
    return labels[option] || option;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!workshop || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {!workshop ? 'Taller no encontrado' : 'Este taller no tiene preguntas configuradas'}
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Volver
        </button>
      </div>
    );
  }

  // Workshop completed view
  if (workshopCompleted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Taller Completado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Has completado el taller práctico exitosamente
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.percentage}%</div>
              <div className="text-sm text-gray-600">Puntuación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
              <div className="text-sm text-gray-600">Correctas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{result.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{result.score}/{result.maxScore}</div>
              <div className="text-sm text-gray-600">Puntos</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Volver al Curso
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workshop start screen
  if (!workshopStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{workshop.title}</h1>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Taller Práctico</h2>
            
            {workshop.description && (
              <p className="text-gray-600 mb-4">{workshop.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">{questions.length}</div>
                <div className="text-sm text-gray-600">Preguntas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  <ImageIcon className="h-8 w-8 mx-auto" />
                </div>
                <div className="text-sm text-gray-600">Opciones Visuales</div>
              </div>
            </div>

            <div className="space-y-2 mb-6 text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
              <p className="font-medium text-yellow-800 mb-2">Instrucciones:</p>
              <p>• Este es un taller práctico con respuestas visuales</p>
              <p>• Observa cuidadosamente cada imagen antes de responder</p>
              <p>• Cada pregunta tiene 4 opciones (A, B, C, D) representadas por imágenes</p>
              <p>• Puedes navegar entre preguntas y cambiar tus respuestas</p>
              <p>• No hay límite de tiempo, tómate el tiempo que necesites</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startWorkshop}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Comenzar Taller
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workshop taking interface
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{workshop.title}</h1>
          <span className="text-gray-500">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          Respondidas: {getAnsweredCount()}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="card">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex-1">
              {currentQuestion.question}
            </h3>
            <span className="text-sm text-gray-500 ml-4">
              {currentQuestion.points} puntos
            </span>
          </div>

          {/* Visual options in grid */}
          <div className="grid grid-cols-2 gap-6">
            {['A', 'B', 'C', 'D'].map((option) => {
              const imageUrl = currentQuestion[`option_${option.toLowerCase()}_image`];
              if (!imageUrl) return null;
              
              return (
                <label 
                  key={option}
                  className={`block cursor-pointer transition-all duration-200 ${
                    answers[currentQuestion.id] === option 
                      ? 'ring-4 ring-primary-500 ring-opacity-50' 
                      : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswerChange(currentQuestion.id, option)}
                    className="sr-only"
                  />
                  
                  <div className={`border-2 rounded-lg overflow-hidden ${
                    answers[currentQuestion.id] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="aspect-square relative">
                      <img
                        src={getFileUrl(imageUrl)}
                        alt={`Opción ${option}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Option label overlay */}
                      <div className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        answers[currentQuestion.id] === option 
                          ? 'bg-primary-600' 
                          : 'bg-gray-600 bg-opacity-75'
                      }`}>
                        {option}
                      </div>
                      
                      {/* Selected indicator */}
                      {answers[currentQuestion.id] === option && (
                        <div className="absolute inset-0 bg-primary-600 bg-opacity-10 flex items-center justify-center">
                          <div className="bg-primary-600 rounded-full p-2">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 text-center">
                      <span className="font-medium text-gray-900">{getOptionLabel(option)}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitWorkshop}
                disabled={submitting || getAnsweredCount() === 0}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Taller'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="btn-primary"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question overview */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-3">Progreso del Taller</h4>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded text-xs font-medium ${
                answers[questions[index].id] !== undefined
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : index === currentQuestionIndex
                  ? 'bg-primary-100 text-primary-700 border-primary-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } border`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeWorkshop;
import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { ChatMode, UserLocation } from '../types';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const DailyHealthQuiz: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError('');
    setIsAnswered(false);
    setSelectedAnswer(null);
    setCurrentQuestionIdx(0);
    setScore(0);
    setQuestions([]);
    
    try {
      const prompt = `Generate a JSON array of exactly 3 simple medical/health trivia questions.
Format exactly like this (no markdown, just raw JSON):
[
  {
    "question": "What is the normal resting heart rate for adults?",
    "options": ["40-60 bpm", "60-100 bpm", "100-120 bpm", "120-140 bpm"],
    "correctAnswer": 1,
    "explanation": "A normal resting heart rate for adults ranges from 60 to 100 beats per minute."
  }
]`;
      const response = await generateResponse({
        prompt,
        history: [],
        mode: ChatMode.RESEARCH,
        location: undefined
      });
      
      const responseText = response.text || '';
      const text = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text) as QuizQuestion[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuestions(parsed);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error("Failed to fetch quiz", e);
      setError('Failed to load today\'s quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === questions[currentQuestionIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(c => c + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-indigo-800 dark:text-indigo-300 font-bold">Generating today's health quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-800 text-center">
        <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</p>
        <button onClick={fetchQuestions} className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl font-bold">Retry</button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentQuestionIdx];
  const isFinished = isAnswered && currentQuestionIdx === questions.length - 1;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-indigo-500" /> Daily Health Quiz
        </h3>
        <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
          {currentQuestionIdx + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">{currentQ.question}</h4>
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
            if (!isAnswered) {
              btnClass += "border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300";
            } else {
              if (idx === currentQ.correctAnswer) {
                btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm";
              } else if (idx === selectedAnswer) {
                btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300";
              } else {
                btnClass += "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{opt}</span>
                  {isAnswered && idx === currentQ.correctAnswer && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && idx === selectedAnswer && idx !== currentQ.correctAnswer && <XCircle className="w-5 h-5 text-rose-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">Explanation:</p>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80 mb-4">{currentQ.explanation}</p>
          
          {isFinished ? (
            <div className="flex items-center justify-between border-t border-indigo-100 dark:border-indigo-800 pt-4">
              <span className="font-bold text-indigo-800 dark:text-indigo-300">
                Final Score: {score} / {questions.length}
              </span>
              <button 
                onClick={fetchQuestions}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Play Again
              </button>
            </div>
          ) : (
            <button 
              onClick={handleNext}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20"
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
};

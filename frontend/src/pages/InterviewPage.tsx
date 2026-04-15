import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startInterview,
  sendMessage,
  generateFeedback,
} from '../api/interview';
import type {
  InterviewSession,
  InterviewProblem,
  ChatMessage,
  InterviewPhase,
  FeedbackReport,
} from '../api/interview';
import { InterviewLobby } from '../components/interview/InterviewLobby';
import { InterviewActive } from '../components/interview/InterviewActive';
import { InterviewReport } from '../components/interview/InterviewReport';

type PageState = 'lobby' | 'loading-start' | 'active' | 'loading-report' | 'report';

export default function InterviewPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('lobby');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [error, setError] = useState('');

  // Interview state — passed to InterviewActive
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [codeByProblem, setCodeByProblem] = useState<string[]>(['', '', '']);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(45 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  const handleStart = async () => {
    setError('');
    setPageState('loading-start');
    try {
      const s = await startInterview();
      setSession(s);
      setTimeRemainingSeconds(s.durationMinutes * 60);
      setCodeByProblem(new Array(s.problems.length).fill(''));
      setTranscript([]);
      setCurrentProblemIndex(0);
      setPhase('intro');
      sessionStartRef.current = Date.now();
      setPageState('active');
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.error || 'Failed to start interview. Try again.');
      setPageState('lobby');
    }
  };

  // Start timer when active
  useEffect(() => {
    if (pageState !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pageState]);

  const handleTimeUp = useCallback(() => {
    setPhase('complete');
  }, []);

  const handleEndInterview = useCallback(async (
    finalTranscript: ChatMessage[],
    finalCode: string[],
    finalProblems: InterviewProblem[]
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPageState('loading-report');
    const usedSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const totalSeconds = (session?.durationMinutes || 45) * 60;
    try {
      const fb = await generateFeedback({
        transcript: finalTranscript,
        problems: finalProblems,
        finalCode,
        durationUsedSeconds: Math.min(usedSeconds, totalSeconds),
        totalDurationSeconds: totalSeconds,
        weakTopics: session?.weakTopics || [],
      });
      setReport(fb);
      setPageState('report');
    } catch (e: unknown) {
      setError('Failed to generate feedback. Your interview data is preserved.');
      setPageState('report');
    }
  }, [session]);

  if (pageState === 'lobby' || pageState === 'loading-start') {
    return (
      <InterviewLobby
        onStart={handleStart}
        isLoading={pageState === 'loading-start'}
        error={error}
      />
    );
  }

  if ((pageState === 'active') && session) {
    return (
      <InterviewActive
        session={session}
        timeRemainingSeconds={timeRemainingSeconds}
        transcript={transcript}
        setTranscript={setTranscript}
        codeByProblem={codeByProblem}
        setCodeByProblem={setCodeByProblem}
        currentProblemIndex={currentProblemIndex}
        setCurrentProblemIndex={setCurrentProblemIndex}
        phase={phase}
        setPhase={setPhase}
        onEndInterview={handleEndInterview}
      />
    );
  }

  if (pageState === 'loading-report') {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '4px solid var(--border-default)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 1s linear infinite',
        }} />
        <p className="body" style={{ color: 'var(--text-secondary)' }}>
          Analyzing your performance...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pageState === 'report' && report) {
    return (
      <InterviewReport
        report={report}
        problems={session?.problems || []}
        onStartNew={() => {
          setReport(null);
          setSession(null);
          setTranscript([]);
          setCodeByProblem(['', '', '']);
          setError('');
          setPageState('lobby');
        }}
      />
    );
  }

  return null;
}

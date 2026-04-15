import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage } from '../../api/interview';
import type {
  InterviewSession, InterviewProblem, ChatMessage, InterviewPhase, FeedbackReport,
} from '../../api/interview';
import { InterviewTimer } from './InterviewTimer';
import { InterviewChat } from './InterviewChat';
import { InterviewCodeEditor } from './InterviewCodeEditor';
import { InterviewProblemPanel } from './InterviewProblemPanel';

interface Props {
  session: InterviewSession;
  timeRemainingSeconds: number;
  transcript: ChatMessage[];
  setTranscript: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  codeByProblem: string[];
  setCodeByProblem: React.Dispatch<React.SetStateAction<string[]>>;
  currentProblemIndex: number;
  setCurrentProblemIndex: React.Dispatch<React.SetStateAction<number>>;
  phase: InterviewPhase;
  setPhase: React.Dispatch<React.SetStateAction<InterviewPhase>>;
  onEndInterview: (transcript: ChatMessage[], code: string[], problems: InterviewProblem[]) => void;
}

export function InterviewActive({
  session, timeRemainingSeconds, transcript, setTranscript,
  codeByProblem, setCodeByProblem, currentProblemIndex, setCurrentProblemIndex,
  phase, setPhase, onEndInterview,
}: Props) {
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'code'>('problem');
  const hasInitialized = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentProblem = session.problems[currentProblemIndex];

  // Build message history for API (system context not stored in transcript)
  function buildApiMessages() {
    return transcript.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  // Send initial greeting from AI when interview starts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const greeting = async () => {
      setIsAiTyping(true);
      try {
        const { reply } = await sendMessage({
          messages: [{
            role: 'user',
            content: `I'm ready to start the interview.`,
          }],
          currentProblem,
          userCode: '',
          problemIndex: 0,
          timeRemainingSeconds,
          phase: 'intro',
        });
        const msg: ChatMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
        setTranscript([msg]);
        setPhase('solving');
      } catch {
        const fallback: ChatMessage = {
          role: 'assistant',
          content: `Welcome to your technical interview. I'm going to give you ${session.durationMinutes} minutes to solve two problems. Let's start with Problem 1: ${currentProblem.title}. Please read it carefully and tell me your initial thoughts on the approach.`,
          timestamp: new Date().toISOString(),
        };
        setTranscript([fallback]);
        setPhase('solving');
      } finally {
        setIsAiTyping(false);
      }
    };

    greeting();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAiTyping]);

  // When time runs out, send closing message
  useEffect(() => {
    if (timeRemainingSeconds === 0 && phase !== 'complete') {
      setPhase('complete');
      const timeUpMsg: ChatMessage = {
        role: 'assistant',
        content: "Time's up! That's the end of our interview. Thank you for your effort. I'll now generate your performance report.",
        timestamp: new Date().toISOString(),
      };
      setTranscript(prev => [...prev, timeUpMsg]);
    }
  }, [timeRemainingSeconds]);

  const handleSend = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isSending || phase === 'complete') return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const newTranscript = [...transcript, userMsg];
    setTranscript(newTranscript);
    setUserInput('');
    setIsSending(true);
    setIsAiTyping(true);

    try {
      const { reply } = await sendMessage({
        messages: buildApiMessages().concat([{ role: 'user', content: text }]),
        currentProblem,
        userCode: codeByProblem[currentProblemIndex],
        problemIndex: currentProblemIndex,
        timeRemainingSeconds,
        phase,
      });

      const aiMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
      setTranscript(prev => [...prev, aiMsg]);

      // Auto-advance phase based on message count
      if (phase === 'intro') setPhase('solving');
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Please continue — I had a connection issue.',
        timestamp: new Date().toISOString(),
      };
      setTranscript(prev => [...prev, errMsg]);
    } finally {
      setIsSending(false);
      setIsAiTyping(false);
    }
  }, [userInput, isSending, phase, transcript, currentProblem, codeByProblem, currentProblemIndex, timeRemainingSeconds]);

  const handleNextProblem = useCallback(async () => {
    if (currentProblemIndex >= session.problems.length - 1) return;
    const transitionMsg: ChatMessage = {
      role: 'user',
      content: `I'm done with problem 1 and ready to move to problem 2.`,
      timestamp: new Date().toISOString(),
    };
    const newTranscript = [...transcript, transitionMsg];
    setTranscript(newTranscript);
    setCurrentProblemIndex(1);
    setPhase('solving');
    setActiveTab('problem');

    setIsAiTyping(true);
    try {
      const nextProblem = session.problems[1];
      const { reply } = await sendMessage({
        messages: newTranscript.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        currentProblem: nextProblem,
        userCode: '',
        problemIndex: 1,
        timeRemainingSeconds,
        phase: 'transition',
      });
      const aiMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
      setTranscript(prev => [...prev, aiMsg]);
    } catch {
      const fallback: ChatMessage = {
        role: 'assistant',
        content: `Great work on Problem 1. Let's move to Problem 2: ${session.problems[1].title}. Take a moment to read it and share your initial approach.`,
        timestamp: new Date().toISOString(),
      };
      setTranscript(prev => [...prev, fallback]);
    } finally {
      setIsAiTyping(false);
    }
  }, [currentProblemIndex, session, transcript, timeRemainingSeconds]);

  const handleEnd = () => {
    onEndInterview(transcript, codeByProblem, session.problems);
  };

  const isLastProblem = currentProblemIndex === session.problems.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 0 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Problem {currentProblemIndex + 1} of {session.problems.length}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: currentProblem.difficulty === 'Easy' ? 'var(--easy-subtle)' : currentProblem.difficulty === 'Medium' ? 'var(--medium-subtle)' : 'var(--hard-subtle)',
            color: currentProblem.difficulty === 'Easy' ? 'var(--easy)' : currentProblem.difficulty === 'Medium' ? 'var(--medium)' : 'var(--hard)',
          }}>
            {currentProblem.difficulty}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {currentProblem.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <InterviewTimer seconds={timeRemainingSeconds} />
          {!isLastProblem && currentProblemIndex === 0 && (
            <button
              onClick={handleNextProblem}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent)', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#fff',
                transition: 'opacity var(--transition-fast)',
              }}
            >
              Next Problem →
            </button>
          )}
          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: '1px solid var(--border-default)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.color = 'var(--error)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main layout: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 380px', gap: 'var(--space-4)', flex: 1, minHeight: 0 }}>
        {/* Col 1: Problem statement */}
        <InterviewProblemPanel problem={currentProblem} />

        {/* Col 2: Code editor */}
        <InterviewCodeEditor
          code={codeByProblem[currentProblemIndex]}
          onChange={(val) => setCodeByProblem(prev => {
            const next = [...prev];
            next[currentProblemIndex] = val;
            return next;
          })}
          language="python"
          disabled={phase === 'complete'}
        />

        {/* Col 3: Chat with interviewer */}
        <InterviewChat
          transcript={transcript}
          isAiTyping={isAiTyping}
          userInput={userInput}
          setUserInput={setUserInput}
          onSend={handleSend}
          disabled={phase === 'complete' || isSending}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* End confirm modal */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', maxWidth: 400, width: '90%',
          }}>
            <h3 className="h3" style={{ marginBottom: 'var(--space-3)' }}>End interview?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Your performance report will be generated from everything submitted so far.
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                }}
              >
                Continue Interview
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); handleEnd(); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: 'var(--error)', border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff',
                }}
              >
                End & Get Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

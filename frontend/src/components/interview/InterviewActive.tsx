import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage, runCode } from '../../api/interview';
import type { InterviewSession, InterviewProblem, ChatMessage, InterviewPhase, RunResult } from '../../api/interview';
import { InterviewTimer } from './InterviewTimer';
import { InterviewChat } from './InterviewChat';
import { InterviewCodeEditor } from './InterviewCodeEditor';
import { InterviewProblemPanel } from './InterviewProblemPanel';
import { TestResultsPanel } from './TestResultsPanel';

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
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'results'>('problem');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProblems, setSubmittedProblems] = useState<Set<number>>(new Set());
  const hasInitialized = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentProblem = session.problems[currentProblemIndex];
  const totalProblems = session.problems.length;
  const progressPercent = (currentProblemIndex / totalProblems) * 100;

  function buildApiMessages(localTranscript: ChatMessage[]) {
    return localTranscript.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  // Opening message from AI
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const openInterview = async () => {
      setIsAiTyping(true);
      try {
        const { reply } = await sendMessage({
          messages: [{ role: 'user', content: "I'm ready to start the interview." }],
          currentProblem,
          userCode: '',
          problemIndex: 0,
          timeRemainingSeconds,
          phase: 'intro',
        });
        setTranscript([{
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        }]);
        setPhase('solving');
      } catch {
        setTranscript([{
          role: 'assistant',
          content: `Welcome! I'm your interviewer today. You have ${session.durationMinutes} minutes for ${totalProblems} problems. Let's begin with Problem 1: "${currentProblem.title}". Read it carefully and tell me your initial thoughts on the approach before writing any code.`,
          timestamp: new Date().toISOString(),
        }]);
        setPhase('solving');
      } finally {
        setIsAiTyping(false);
      }
    };

    openInterview();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAiTyping]);

  // Handle time up
  useEffect(() => {
    if (timeRemainingSeconds === 0 && phase !== 'complete') {
      setPhase('complete');
      setTranscript(prev => [...prev, {
        role: 'assistant',
        content: "Time's up! That concludes our interview. Click 'Get Report' to see your detailed performance analysis.",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [timeRemainingSeconds]);

  // Send chat message with smart retry
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || userInput).trim();
    if (!text || isSending || phase === 'complete') return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const newTranscript = [...transcript, userMsg];
    setTranscript(newTranscript);
    setUserInput('');
    setIsSending(true);
    setIsAiTyping(true);

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const { reply } = await sendMessage({
          messages: buildApiMessages(newTranscript),
          currentProblem,
          userCode: codeByProblem[currentProblemIndex],
          problemIndex: currentProblemIndex,
          timeRemainingSeconds,
          phase,
        });

        setTranscript(prev => [...prev, {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        }]);

        if (phase === 'intro') setPhase('solving');
        break;

      } catch (err: any) {
        retries++;
        if (retries > maxRetries) {
          const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
          const isRateLimit = err?.response?.status === 429;

          setTranscript(prev => [...prev, {
            role: 'assistant',
            content: isRateLimit
              ? "I'm receiving too many messages. Please wait 10 seconds before your next message."
              : isTimeout
              ? "The AI service is slow right now. Your message was received — I'm just taking longer to respond. Please try again."
              : "I had a brief connection issue. Please resend your last message.",
            timestamp: new Date().toISOString(),
          }]);
          setUserInput(text);
        } else {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    setIsSending(false);
    setIsAiTyping(false);
  }, [userInput, isSending, phase, transcript, currentProblem, codeByProblem, currentProblemIndex, timeRemainingSeconds]);

  // Run code against test cases
  const handleRun = useCallback(async () => {
    const code = codeByProblem[currentProblemIndex];
    if (!code.trim()) {
      setTranscript(prev => [...prev, {
        role: 'assistant',
        content: 'Write some code first before running it against the test cases.',
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setIsRunning(true);
    setActiveLeftTab('results');
    setRunResult(null);

    try {
      const result = await runCode({
        code,
        language: 'auto',
        problem: {
          title: currentProblem.title,
          content: currentProblem.content,
          topicTags: currentProblem.topicTags,
        },
        testCases: currentProblem.sampleTestCases?.slice(0, 3) || [
          { input: 'Example input', expected: 'Example output' },
        ],
      });

      setRunResult(result);

      const passCount = result.results.filter(r => r.passed).length;
      const total = result.results.length;

      setTimeout(() => {
        const statusMsg = result.allPassed
          ? `I ran my code against the test cases and all ${total}/${total} passed. Time complexity: ${result.timeComplexity}, Space: ${result.spaceComplexity}.`
          : `I ran my code against the test cases and ${passCount}/${total} passed. I need to debug the failing cases.`;
        handleSend(statusMsg);
      }, 500);

    } catch {
      setRunResult({
        results: [],
        allPassed: false,
        summary: 'Could not evaluate code. Check for syntax errors.',
        timeComplexity: 'O(?)',
        spaceComplexity: 'O(?)',
      });
    } finally {
      setIsRunning(false);
    }
  }, [codeByProblem, currentProblemIndex, currentProblem]);

  // Submit code and move to next problem
  const handleSubmit = useCallback(async () => {
    const code = codeByProblem[currentProblemIndex];
    if (!code.trim()) {
      setTranscript(prev => [...prev, {
        role: 'assistant',
        content: "Please write a solution before submitting. Even a partial solution is better than nothing.",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setIsSubmitting(true);
    const newSubmitted = new Set(submittedProblems).add(currentProblemIndex);
    setSubmittedProblems(newSubmitted);

    const submitMsg: ChatMessage = {
      role: 'user',
      content: `I'm submitting my solution for Problem ${currentProblemIndex + 1}. Final code:\n\n${code.slice(0, 800)}`,
      timestamp: new Date().toISOString(),
    };
    const newTranscript = [...transcript, submitMsg];
    setTranscript(newTranscript);

    const isLastProblem = currentProblemIndex >= totalProblems - 1;

    try {
      if (isLastProblem) {
        setIsAiTyping(true);
        const { reply } = await sendMessage({
          messages: buildApiMessages(newTranscript),
          currentProblem,
          userCode: code,
          problemIndex: currentProblemIndex,
          timeRemainingSeconds,
          phase: 'complete',
        });
        setTranscript(prev => [...prev, {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        }]);
        setIsAiTyping(false);
        setPhase('complete');
      } else {
        setIsAiTyping(true);
        const nextProblem = session.problems[currentProblemIndex + 1];
        const { reply } = await sendMessage({
          messages: buildApiMessages(newTranscript),
          currentProblem: nextProblem,
          userCode: '',
          problemIndex: currentProblemIndex + 1,
          timeRemainingSeconds,
          phase: 'transition',
        });

        setCurrentProblemIndex(prev => prev + 1);
        setRunResult(null);
        setActiveLeftTab('problem');
        setPhase('solving');
        setTranscript(prev => [...prev, {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        }]);
        setIsAiTyping(false);
      }
    } catch {
      setIsAiTyping(false);
      if (isLastProblem) {
        setPhase('complete');
      } else {
        setCurrentProblemIndex(prev => prev + 1);
        setRunResult(null);
        setActiveLeftTab('problem');
        setPhase('solving');
        setTranscript(prev => [...prev, {
          role: 'assistant',
          content: `Good effort on Problem ${currentProblemIndex + 1}. Let's move to Problem ${currentProblemIndex + 2}: "${session.problems[currentProblemIndex + 1]?.title}". Take a moment to read it carefully.`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [codeByProblem, currentProblemIndex, totalProblems, transcript, currentProblem, session, timeRemainingSeconds, submittedProblems]);

  const isLastProblem = currentProblemIndex >= totalProblems - 1;
  const currentCode = codeByProblem[currentProblemIndex];
  const isCurrentSubmitted = submittedProblems.has(currentProblemIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', minHeight: 600 }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--bg-tertiary)', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, var(--accent), #A78BFA)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-5)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-4)', flexShrink: 0,
        gap: 'var(--space-4)',
      }}>
        {/* Left: problem info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            Problem {currentProblemIndex + 1} / {totalProblems}
          </span>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', flexShrink: 0 }} />
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0,
            background: currentProblem.difficulty === 'Easy' ? 'var(--easy-subtle)' :
              currentProblem.difficulty === 'Medium' ? 'var(--medium-subtle)' : 'var(--hard-subtle)',
            color: currentProblem.difficulty === 'Easy' ? 'var(--easy)' :
              currentProblem.difficulty === 'Medium' ? 'var(--medium)' : 'var(--hard)',
          }}>
            {currentProblem.difficulty}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentProblem.title}
          </span>
          {isCurrentSubmitted && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'var(--success-subtle)', color: 'var(--success)',
              border: '1px solid rgba(16,185,129,0.2)', flexShrink: 0,
            }}>Submitted</span>
          )}
        </div>

        {/* Right: timer + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <InterviewTimer seconds={timeRemainingSeconds} />

          {/* Problem dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {session.problems.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: submittedProblems.has(i) ? 'var(--success)' :
                  i === currentProblemIndex ? 'var(--accent)' : 'var(--border-default)',
                transition: 'all 0.3s',
                boxShadow: i === currentProblemIndex ? '0 0 6px var(--accent)' : 'none',
              }} />
            ))}
          </div>

          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: '1px solid var(--border-default)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
              transition: 'all var(--transition-fast)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--error)';
              e.currentTarget.style.color = 'var(--error)';
              e.currentTarget.style.background = 'var(--error-subtle)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Time up / ended banner */}
      {phase === 'complete' && (
        <div style={{
          background: 'var(--warning-subtle)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-5)',
          marginBottom: 'var(--space-4)', fontSize: 14, color: 'var(--warning)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 500 }}>
            {timeRemainingSeconds === 0 ? "Time's up!" : "Interview ended."} Generate your performance report now.
          </span>
          <button
            onClick={() => onEndInterview(transcript, codeByProblem, session.problems)}
            style={{
              padding: '7px 18px', background: 'var(--warning)', border: 'none',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
            }}
          >
            Get My Report →
          </button>
        </div>
      )}

      {/* Main 3-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr) 360px',
        gap: 'var(--space-4)',
        flex: 1,
        minHeight: 0,
      }}>
        {/* Col 1: Problem + Test Results (tabbed) */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: 0,
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
            {[
              { key: 'problem', label: 'Problem' },
              { key: 'results', label: runResult ? `Results (${runResult.results.filter(r => r.passed).length}/${runResult.results.length})` : 'Test Results' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveLeftTab(tab.key as 'problem' | 'results')}
                style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  color: activeLeftTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: activeLeftTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {activeLeftTab === 'problem'
              ? <InterviewProblemPanel problem={currentProblem} />
              : <TestResultsPanel result={runResult} isLoading={isRunning} />
            }
          </div>
        </div>

        {/* Col 2: Code editor */}
        <InterviewCodeEditor
          code={currentCode}
          onChange={(val) => setCodeByProblem(prev => {
            const next = [...prev];
            next[currentProblemIndex] = val;
            return next;
          })}
          onRun={handleRun}
          onSubmit={handleSubmit}
          isRunning={isRunning}
          isSubmitting={isSubmitting}
          isSubmitted={isCurrentSubmitted}
          disabled={phase === 'complete'}
        />

        {/* Col 3: Chat */}
        <InterviewChat
          transcript={transcript}
          isAiTyping={isAiTyping}
          userInput={userInput}
          setUserInput={setUserInput}
          onSend={() => handleSend()}
          disabled={phase === 'complete' || isSending}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* End confirm modal */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
            maxWidth: 440, width: '90%', boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 className="h3" style={{ marginBottom: 'var(--space-3)' }}>End interview?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-2)' }}>
              Problems completed: <strong style={{ color: 'var(--text-primary)' }}>{submittedProblems.size} / {totalProblems}</strong>
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Your performance report will be generated from all submitted code and conversation.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                }}
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  onEndInterview(transcript, codeByProblem, session.problems);
                }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
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

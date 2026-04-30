import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
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
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'chat'>('problem');
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'output' | 'results'>('testcases');
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
    if (activeLeftTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isAiTyping, activeLeftTab]);

  // Handle time up
  useEffect(() => {
    if (timeRemainingSeconds === 0 && phase !== 'complete') {
      setPhase('complete');
      setTranscript(prev => [...prev, {
        role: 'assistant',
        content: "Time's up! That concludes our interview. Click 'Get Report' to see your detailed performance analysis.",
        timestamp: new Date().toISOString(),
      }]);
      setActiveLeftTab('chat');
    }
  }, [timeRemainingSeconds]);

  // Send chat message
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
    setActiveLeftTab('chat');

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
      setActiveLeftTab('chat');
      setTranscript(prev => [...prev, {
        role: 'assistant',
        content: 'Write some code first before running it against the test cases.',
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setIsRunning(true);
    setActiveBottomTab('results');
    setRunResult(null);

    try {
      const result = await runCode({
        code,
        language: 'cpp', // To be dynamic later, default cpp for now based on AlgoMaster styling
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
  }, [codeByProblem, currentProblemIndex, currentProblem, handleSend]);

  // Submit code and move to next problem
  const handleSubmit = useCallback(async () => {
    const code = codeByProblem[currentProblemIndex];
    if (!code.trim()) {
      setActiveLeftTab('chat');
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
        setActiveLeftTab('chat');
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
        // NEXT PROBLEM
        setCurrentProblemIndex(prev => prev + 1);
        setRunResult(null);
        setActiveLeftTab('problem');
        setActiveBottomTab('testcases');
        setPhase('solving');
      }
    } catch {
      setIsAiTyping(false);
      if (isLastProblem) {
        setPhase('complete');
      } else {
        setCurrentProblemIndex(prev => prev + 1);
        setRunResult(null);
        setActiveLeftTab('problem');
        setActiveBottomTab('testcases');
        setPhase('solving');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [codeByProblem, currentProblemIndex, totalProblems, transcript, currentProblem, session, timeRemainingSeconds, submittedProblems, buildApiMessages, setPhase, setCurrentProblemIndex, setTranscript]);

  const isCurrentSubmitted = submittedProblems.has(currentProblemIndex);
  const currentCode = codeByProblem[currentProblemIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0E12', color: '#fff' }}>
      {/* Top Nav (AlgoMaster style) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        height: 56, padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#12141A'
      }}>
        {/* Left: Logo & Problem nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: '#38BDF8' }} /> {/* Logo placeholder */}
            <span style={{ fontWeight: 700, fontSize: 16 }}>AlgoMaster</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>&lt;</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
              {currentProblem.title}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>&gt;</span>
          </div>
        </div>

        {/* Right: Timer, Progress, End Interview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏱ {Math.floor(timeRemainingSeconds / 60).toString().padStart(2, '0')}:{(timeRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10B981', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
              {currentProblemIndex + 1} / {totalProblems}
            </span>
          </div>

          <button 
            onClick={() => setShowEndConfirm(true)}
            style={{ 
              background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444',
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PanelGroup orientation="horizontal">
          
          {/* LEFT PANE */}
          <Panel defaultSize={40} minSize={25} style={{ background: '#161822', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 16px' }}>
              <button
                onClick={() => setActiveLeftTab('problem')}
                style={{
                  background: 'transparent', border: 'none', padding: '16px', color: activeLeftTab === 'problem' ? '#E2E8F0' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${activeLeftTab === 'problem' ? '#10B981' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                📝 Problem
              </button>
              <button
                onClick={() => setActiveLeftTab('chat')}
                style={{
                  background: 'transparent', border: 'none', padding: '16px', color: activeLeftTab === 'chat' ? '#E2E8F0' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${activeLeftTab === 'chat' ? '#10B981' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                💬 Interview Chat
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeLeftTab === 'problem' ? (
                <InterviewProblemPanel problem={currentProblem} />
              ) : (
                <div style={{ height: '100%', border: 'none', background: 'transparent' }}>
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
              )}
            </div>
          </Panel>

          {/* DRAG HANDLE */}
          <PanelResizeHandle style={{ width: 8, background: '#0D0E12', cursor: 'col-resize', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          </PanelResizeHandle>

          {/* RIGHT PANE */}
          <Panel style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelGroup orientation="vertical">
              
              {/* TOP: Code Editor */}
              <Panel defaultSize={65} minSize={20} style={{ background: '#1E2029', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
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
                </div>
              </Panel>

              {/* DRAG HANDLE */}
              <PanelResizeHandle style={{ height: 8, background: '#0D0E12', cursor: 'row-resize', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
              </PanelResizeHandle>

              {/* BOTTOM: Test Cases / Actions */}
              <Panel minSize={20} style={{ background: '#161822', display: 'flex', flexDirection: 'column' }}>
                {/* Actions & Tabs Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      onClick={() => setActiveBottomTab('testcases')}
                      style={{ background: 'none', border: 'none', color: activeBottomTab === 'testcases' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${activeBottomTab === 'testcases' ? '#10B981' : 'transparent'}`, paddingBottom: 6 }}
                    >
                      ✓ Test Cases
                    </button>
                    <button
                      onClick={() => setActiveBottomTab('results')}
                      style={{ background: 'none', border: 'none', color: activeBottomTab === 'results' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${activeBottomTab === 'results' ? '#10B981' : 'transparent'}`, paddingBottom: 6 }}
                    >
                      ▷ Output
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      💡 Hint
                    </button>
                    <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      📋 Review
                    </button>
                    <button style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.5)', color: '#F59E0B', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      📊 Evaluate
                    </button>
                    <button 
                      onClick={handleRun}
                      disabled={isRunning || phase === 'complete'}
                      style={{ background: '#10B981', border: 'none', color: '#fff', padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1 }}
                    >
                      {isRunning ? 'Running...' : '▶ Run'}
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || phase === 'complete' || isCurrentSubmitted}
                      style={{ background: '#3B82F6', border: 'none', color: '#fff', padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: (isSubmitting || isCurrentSubmitted) ? 0.7 : 1 }}
                    >
                      {isSubmitting ? 'Submitting...' : isCurrentSubmitted ? 'Submitted' : '✈ Submit'}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {activeBottomTab === 'testcases' ? (
                    <div>
                      {/* Show test cases exactly like AlgoMaster */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {currentProblem.sampleTestCases?.map((_, i) => (
                          <button key={i} style={{ background: i === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#10B981' : 'rgba(255,255,255,0.6)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.3)' : 'transparent'}`, padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>INPUT</div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: 13 }}>
                          {currentProblem.sampleTestCases?.[0]?.input || ''}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>EXPECTED OUTPUT</div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: 13 }}>
                          {currentProblem.sampleTestCases?.[0]?.expected || ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <TestResultsPanel result={runResult} isLoading={isRunning} />
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* End confirm modal */}
      {showEndConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#161822', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, maxWidth: 460, width: '90%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>End the Interview?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>You've completed {submittedProblems.size} of {totalProblems} problems. Generate report?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, color: '#fff', border: 'none', cursor: 'pointer' }}>Keep Going</button>
              <button onClick={() => { setShowEndConfirm(false); onEndInterview(transcript, codeByProblem, session.problems); }} style={{ flex: 1, padding: 12, background: '#EF4444', borderRadius: 6, color: '#fff', border: 'none', cursor: 'pointer' }}>End & Get Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

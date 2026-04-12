import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getMe, updatePreferences } from '../api/user';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

const LANGUAGES = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C', 'C#', 'Kotlin'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];

export default function SettingsPage() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    enabled: !!token,
    queryFn: getMe,
    staleTime: 60_000,
  });

  const [lang, setLang] = useState('Python');
  const [difficulty, setDifficulty] = useState('Medium');
  const [dailyGoal, setDailyGoal] = useState(3);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (me?.preferences) {
      setLang(me.preferences.preferredLanguage || 'Python');
      setDifficulty(me.preferences.targetDifficulty || 'Medium');
      setDailyGoal(me.preferences.dailyGoalCount || 3);
    }
  }, [me]);

  const mutation = useMutation({
    mutationFn: (prefs: any) => updatePreferences(prefs),
    onSuccess: () => {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    },
  });

  const handleSave = () => {
    mutation.mutate({
      preferredLanguage: lang,
      targetDifficulty: difficulty,
      dailyGoalCount: dailyGoal,
    });
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-8)' }}>
      {/* Internal Navigation (Sidebar-ish) */}
      <div style={{ gridColumn: 'span 12', lg: 'span 3' } as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SettingsNavLink label="Profile" active />
          <SettingsNavLink label="Preferences" />
          <SettingsNavLink label="Connected Accounts" />
          <SettingsNavLink label="Notifications" />
          <SettingsNavLink label="Appearance" />
          <div style={{ margin: 'var(--space-4) 0', borderTop: '1px solid var(--border-subtle)' }} />
          <SettingsNavLink label="Danger Zone" danger />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ gridColumn: 'span 12', lg: 'span 9' } as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          
          {/* Section: Profile */}
          <section>
            <h3 className="h3" style={{ marginBottom: 'var(--space-4)' }}>Profile Settings</h3>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #A78BFA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 700, color: '#fff',
                }}>
                  {(me?.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{me?.name}</h4>
                  <p className="body" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{me?.email}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {me?.leetcodeUsername ? (
                      <Badge variant="success">LeetCode: @{me.leetcodeUsername} ✓</Badge>
                    ) : (
                      <Badge variant="neutral">LeetCode not linked</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Display Name</p>
                  <input type="text" readOnly value={me?.name || ''} style={inputStyle} />
                </div>
                <div>
                  <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Email Address</p>
                  <input type="text" readOnly value={me?.email || ''} style={inputStyle} />
                </div>
              </div>
            </Card>
          </section>

          {/* Section: Preferences */}
          <section>
            <h3 className="h3" style={{ marginBottom: 'var(--space-4)' }}>Learning Preferences</h3>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div>
                  <p className="label" style={{ marginBottom: 'var(--space-3)' }}>Preferred Coding Language</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {LANGUAGES.map(l => (
                      <SelectButton 
                        key={l} 
                        label={l} 
                        selected={lang === l} 
                        onClick={() => setLang(l)} 
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="label" style={{ marginBottom: 'var(--space-3)' }}>Target Difficulty</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {DIFFICULTIES.map(d => (
                      <SelectButton 
                        key={d} 
                        label={d} 
                        selected={difficulty === d} 
                        onClick={() => setDifficulty(d)} 
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <p className="label">Daily Problem Goal</p>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{dailyGoal} problems</span>
                  </div>
                  <input 
                    type="range" 
                    min={1} 
                    max={10} 
                    value={dailyGoal} 
                    onChange={e => setDailyGoal(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <Button onClick={handleSave} isLoading={mutation.isPending}>
                    Save Preferences
                  </Button>
                  {showSaved && <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: 500 }}>✓ Changes saved successfully</span>}
                </div>
              </div>
            </Card>
          </section>

          {/* Section: Appearance */}
          <section id="appearance">
            <h3 className="h3" style={{ marginBottom: 'var(--space-4)' }}>Appearance</h3>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Theme Mode</h4>
                  <p className="body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Switch between light and dark mode for your dashboard.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {useThemeStore.getState().theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </Card>
          </section>

          {/* Section: Danger Zone */}
          <section>
            <h3 className="h3" style={{ marginBottom: 'var(--space-4)', color: 'var(--error)' }}>Danger Zone</h3>
            <Card style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
              <p className="body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                These actions are irreversible. Please proceed with caution.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <Button variant="ghost" style={{ border: '1px solid var(--error)', color: 'var(--error)' }}>
                  Unlink LeetCode
                </Button>
                <Button variant="ghost" onClick={logout} style={{ color: 'var(--text-muted)' }}>
                  Sign Out
                </Button>
              </div>
            </Card>
          </section>

        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .lg-span-3, .lg-span-9 { grid-column: span 12; }
        }
      `}</style>
    </div>
  );
}

function SettingsNavLink({ label, active = false, danger = false }: { label: string; active?: boolean; danger?: boolean }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderRadius: 'var(--radius-md)',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      background: active ? 'var(--accent-subtle)' : 'transparent',
      color: active ? 'var(--accent)' : danger ? 'var(--error)' : 'var(--text-secondary)',
      transition: 'all 0.2s ease',
    }}>
      {label}
    </div>
  );
}

function SelectButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}`,
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
        color: selected ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  color: 'var(--text-muted)',
  fontSize: '14px',
  outline: 'none',
  cursor: 'not-allowed',
};

function SettingsPageSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-8)' }}>
      <div style={{ gridColumn: 'span 3' }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} style={{ marginBottom: 8 }} />)}
      </div>
      <div style={{ gridColumn: 'span 9' }}>
        <Skeleton height={200} style={{ marginBottom: 40 }} />
        <Skeleton height={400} />
      </div>
    </div>
  );
}

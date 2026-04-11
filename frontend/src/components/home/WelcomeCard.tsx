import React from 'react'; export function WelcomeCard({ user }: any) { return <div className='p-4 bg-blue-50 dark:bg-blue-900 rounded-lg'>Welcome {user?.name || 'User'}!</div>; }

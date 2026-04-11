document.getElementById('hint-btn').addEventListener('click', () => callAi('hint'));
document.getElementById('solution-btn').addEventListener('click', () => callAi('solution'));

async function callAi(endpoint) {
    const box = document.getElementById('response-box');
    box.textContent = 'Thinking...';
    
    try {
        const { authToken } = await new Promise(r => chrome.storage.local.get(['authToken'], r));
        if (!authToken) {
            box.textContent = 'Please log in via the extension popup first.';
            return;
        }

        const title = 'Context extracted problem'; // Minimal fallback
        
        const res = await fetch(`http://localhost:3001/api/ai/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                problemDescription: title,
                userCode: 'Code extract not available from iframe due to cross-origin.',
                language: 'Python'
            })
        });
        
        const data = await res.json();
        if (data.hint) box.textContent = data.hint;
        else if (data.solution) box.textContent = data.solution;
        else box.textContent = JSON.stringify(data);
    } catch (e) {
        box.textContent = 'Error contacting AI: ' + e.message;
    }
}

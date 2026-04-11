// Widget script to get hints
document.getElementById('getHint').addEventListener('click', async () => {
  const hintDiv = document.getElementById('hint');
  hintDiv.textContent = 'Loading...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const title = document.querySelector('[data-cy="question-title"]')?.textContent || '';
        const description = document.querySelector('[data-cy="question-content"]')?.textContent || '';
        const code = document.querySelector('.monaco-editor')?.textContent || '';
        return { title, description, code };
      }
    });

    const token = await new Promise((resolve) => {
      chrome.storage.local.get('authToken', (result) => resolve(result.authToken));
    });

    const response = await fetch('http://localhost:3001/api/ai/hint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        problemDescription: result.description,
        userCode: result.code,
        language: 'javascript'
      })
    });

    const data = await response.json();
    hintDiv.textContent = data.hint;
  } catch (error) {
    hintDiv.textContent = 'Error: ' + error.message;
  }
});
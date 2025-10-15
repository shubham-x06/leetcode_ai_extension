(async () => {
  // Check if Chrome extension API is available
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Chrome extension API not available');
    return;
  }

  // Function to get code from the LeetCode editor
  function getCodeFromEditor() {
    const codeLineElements = document.querySelectorAll('.view-lines .view-line');
    if (codeLineElements.length === 0) {
      return "Error: Could not find any code lines. Is the editor visible?";
    }
    return Array.from(codeLineElements).map(line => line.textContent).join('\n');
  }

  // Create and inject the widget
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'ai-hint-widget-container';
  
  try {
    const widgetUrl = chrome.runtime.getURL('widget.html');
    const response = await fetch(widgetUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch widget.html. Status: ${response.status}`);
      return;
    }

    const widgetHtml = await response.text();
    widgetContainer.innerHTML = widgetHtml;
    document.body.appendChild(widgetContainer);

    // Setup button handlers
    const getHintBtn = widgetContainer.querySelector('#get-hint-btn');
    const getSolutionBtn = widgetContainer.querySelector('#get-solution-btn');
    const chatHistoryDiv = widgetContainer.querySelector('#ai-chat-history');
    const toggleBtn = widgetContainer.querySelector('#toggle-widget-body');
    const widgetBody = widgetContainer.querySelector('.ai-widget-body');

    // Toggle minimize/maximize
    if (toggleBtn && widgetBody) {
      toggleBtn.addEventListener('click', () => {
        if (widgetBody.style.display === 'none') {
          widgetBody.style.display = 'block';
          toggleBtn.textContent = '-';
        } else {
          widgetBody.style.display = 'none';
          toggleBtn.textContent = '+';
        }
      });
    }

    // Make widget draggable
    const header = widgetContainer.querySelector('.ai-widget-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target === toggleBtn) return;
      isDragging = true;
      initialX = e.clientX - widgetContainer.offsetLeft;
      initialY = e.clientY - widgetContainer.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        widgetContainer.style.left = currentX + 'px';
        widgetContainer.style.top = currentY + 'px';
        widgetContainer.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Get Hint button handler
    if (getHintBtn) {
      getHintBtn.addEventListener('click', async () => {
        console.log("Get Hint button clicked");

        // Get problem description
        const descriptionElement = document.querySelector('div[data-track-load="description_content"]');
        const problemDescription = descriptionElement ? descriptionElement.innerText : "Error: Could not find problem description.";

        // Get user code
        const userCode = getCodeFromEditor();

        console.log("--- Problem Description ---");
        console.log(problemDescription);
        console.log("\n--- User Code ---");
        console.log(userCode);

        // Show loading message
        if (chatHistoryDiv) {
          chatHistoryDiv.innerHTML = '<div class="hint-message">Getting hint from AI...</div>';
        }

        // Send to backend
        try {
          const response = await fetch('http://localhost:3001/api/get-hint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              problemDescription,
              userCode
            })
          });

          const data = await response.json();

          if (response.ok) {
            const hint = data.hint;
            if (chatHistoryDiv) {
              chatHistoryDiv.innerHTML = `<div class="hint-message"><strong>AI Hint:</strong><br>${hint}</div>`;
            }
          } else {
            if (chatHistoryDiv) {
              chatHistoryDiv.innerHTML = `<div class="hint-message" style="color: #fb4934;">Error: ${data.error || 'Failed to get hint'}</div>`;
            }
          }
        } catch (error) {
          console.error('Error fetching hint:', error);
          if (chatHistoryDiv) {
            chatHistoryDiv.innerHTML = '<div class="hint-message" style="color: #fb4934;">Error: Could not connect to backend server. Make sure it\'s running on http://localhost:3001</div>';
          }
        }
      });
    }

    // Get Solution button handler
    if (getSolutionBtn) {
      getSolutionBtn.addEventListener('click', async () => {
        console.log("Get Solution button clicked");

        // Get problem description
        const descriptionElement = document.querySelector('div[data-track-load="description_content"]');
        const problemDescription = descriptionElement ? descriptionElement.innerText : "Error: Could not find problem description.";

        // Get user code
        const userCode = getCodeFromEditor();

        console.log("--- Requesting Solution ---");

        // Show loading message
        if (chatHistoryDiv) {
          chatHistoryDiv.innerHTML = '<div class="hint-message">Getting solution from AI...</div>';
        }

        // Send to backend
        try {
          const response = await fetch('http://localhost:3001/api/get-solution', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              problemDescription,
              userCode
            })
          });

          const data = await response.json();

          if (response.ok) {
            const solution = data.solution;
            if (chatHistoryDiv) {
              // Format the solution with proper line breaks and code formatting
              const formattedSolution = solution.replace(/\n/g, '<br>');
              chatHistoryDiv.innerHTML = `<div class="hint-message"><strong>AI Solution:</strong><br><br>${formattedSolution}</div>`;
            }
          } else {
            if (chatHistoryDiv) {
              chatHistoryDiv.innerHTML = `<div class="hint-message" style="color: #fb4934;">Error: ${data.error || 'Failed to get solution'}</div>`;
            }
          }
        } catch (error) {
          console.error('Error fetching solution:', error);
          if (chatHistoryDiv) {
            chatHistoryDiv.innerHTML = '<div class="hint-message" style="color: #fb4934;">Error: Could not connect to backend server. Make sure it\'s running on http://localhost:3001</div>';
          }
        }
      });
    }

    console.log("Widget successfully loaded!");

  } catch (error) {
    console.error("Error loading widget:", error);
  }
})();
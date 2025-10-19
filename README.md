










##  Setup and Run

Here's how you can get the project running on your own computer.

### **Prerequisites**

You'll need to have **Node.js** and **npm** installed. You can download them from [nodejs.org](https://nodejs.org).

You'll also need a code editor, like **Visual Studio Code**.

---

### **Step 1: Clone the Repository**

First, you'll need to download the code from GitHub. You can do this by opening up a terminal (on Linux/macOS) or PowerShell (on Windows) and running the following command:

```bash
git clone https://github.com/shubham-x06/leetcode_ai_extension.git
```

---

### **Step 2: Install Dependencies**

Next, you'll need to install all the dependencies for both the frontend and the backend.

For the backend:

```bash
cd leetcode_ai_extension/backend
npm install
```

---

### **Step 3: Set Up Environment Variables**

The backend needs an API key to talk to the AI.
An API key is like a password that lets your code use someone else's service.
In this case, it's the `GROQ_API_KEY`.

You'll need to add to a file called `.env.example` in the **backend** folder your API key:

```
GROQ_API_KEY=YOUR_API_KEY_HERE
```

You can get an API key from [groq.com](https://groq.com).

---

### **Step 4: Build and Run the Backend**

Now you can build and run the backend server.

```bash
npm run dev
```

You should see a message in your terminal that says:

```
Server running at http://localhost:3001
```

---

### **Step 5: Load the Browser Extension**

Finally, you'll need to load the extension into your browser.

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the **frontend** folder from the project.

Now, when you go to a LeetCode problem page, you should see the AI hint widget!

---

### **Common Errors**

**Error:** `Could not connect to backend server`

* This means that the backend server isn't running.
  Make sure you've run `npm run dev` in the backend folder and that you see the "Server running" message.

**Error:** `Failed to get hint from AI`

* This could mean that your API key is incorrect or that there's a problem with the AI service.
  Double-check your `.env` file and make sure your API key is correct.

---



# 🌿 MemoryWalk — Look Up. Look Around.

**AI gives you something to notice. Then you put the phone away.**

MemoryWalk is a local-AI-powered experience designed to help people step away from their screens and pay attention to the world around them.

Choose how much time you have and what you want to notice. MemoryWalk generates a small observation mission using a locally running AI model. Put your phone away, go outside, observe the real world, and return to reflect on what you experienced. Turn that moment into a personal memory in your Memory Garden.

## ✨ What It Does

* **Personalized observation missions:** Generate a mission based on your available time and chosen focus.
* **Explore the real world:** Observe nature, listen to your surroundings, discover tiny details, or let curiosity choose.
* **Phone-down experience:** Encourages you to leave the screen behind while completing your mission.
* **AI-powered reflection:** Return and respond to reflection questions generated for your experience.
* **Personal feedback:** Receive AI-generated feedback, a score, and a takeaway from your reflection.
* **Memory Garden:** Save completed experiences and revisit the memories you've collected.
* **Local AI:** Uses Ollama and an open-weight language model for local inference.

## 🌱 Why MemoryWalk?

We spend a lot of time looking at screens, sometimes missing the small details happening around us. MemoryWalk explores a different use of AI: instead of keeping people engaged with a screen, it gives them a reason to put it down.

The AI provides the starting point. The real experience happens away from the device.

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python
* **Local AI runtime:** Ollama
* **Language model:** `qwen2.5-coder:3b`
* **Communication:** HTTP requests to a local Python server and Ollama API

## 🔄 How It Works

1. Choose your available time and observation focus.
2. MemoryWalk requests a mission from the local Python backend.
3. The backend uses Ollama to generate the mission.
4. Read the mission, put your phone away, and explore your surroundings.
5. Return to MemoryWalk and generate reflection questions.
6. Write about your experience and receive AI-generated feedback.
7. Save the experience to your Memory Garden.

## 🚀 Getting Started

### Prerequisites

* Python installed on your computer
* [Ollama](https://ollama.com/) installed and running
* The `qwen2.5-coder:3b` model downloaded

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd MemoryWalk
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Download the model

Open a terminal and run:

```bash
ollama pull qwen2.5-coder:3b
```

Make sure Ollama is running locally.

### 3. Start MemoryWalk

From the project folder, run:

```bash
python server.py
```

### 4. Open the application

Visit:

```text
http://localhost:8000
```

Choose a mission and start exploring!

## 🔓 Why Open Innovation Matters

MemoryWalk demonstrates how open-weight AI can support a personal, locally run experience.

* **Local inference:** AI requests can be processed through a model running on your own computer.
* **Privacy-conscious design:** The intended experience is local-first. Avoid entering sensitive personal information, and review the application's code and data handling before relying on it for privacy.
* **Experimentation:** Developers can explore different compatible models and adjust prompts to suit their needs.
* **Accessibility for builders:** Tools such as Ollama make local AI experimentation approachable without requiring a paid hosted-model API.

Local inference still requires a suitable device and model resources. This project does not claim that every feature works offline in every environment.

## 🎯 Built For

MemoryWalk was created for the **Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass**.

The project explores how AI can encourage people to spend less time on their screens and more time engaging with the world around them.

## 🗺️ Future Ideas

* Add more mission categories and accessibility options.
* Improve the Memory Garden with search and filtering.
* Let users export their saved memories.
* Explore additional locally runnable models.
* Improve the experience on mobile devices.

## 🤝 Contributing

Contributions, ideas, bug reports, and suggestions are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

A license has not yet been selected. Until one is added, please contact the repository owner for permission to reuse or redistribute the code.

---

**Look up. Look around. Keep the moments that matter.** 🌿

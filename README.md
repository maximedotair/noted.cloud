# 🚀 OpenRouter Notes


## The Story Behind This Project

I wanted an **ultra-minimalist tool to enrich my knowledge**, without graphs, without bullshit, without plugins, without Notion or equivalent heavy/paid tools.

My only requirement: **Being able to use my own OpenRouter models** (Google, OpenAI, Groq, Grok, Azure, etc.), easily through a single interface. Here I connected Kimi K2 (ultra fast and really performant!).

## 💡 The Core Idea

I can **highlight any word or phrase** and get a **1-click contextual explanation** to enrich my understanding, without limits.

It works everywhere:
- Copy a technical doc? I highlight a term, the tool explains it.
- A course, a complicated text? Same, no need to leave the page.

## ✨ Features

- **🎯 Ultra-minimalist interface** - No distractions, just pure writing and learning
- **🤖 AI-powered explanations** - Highlight any text and get instant contextual explanations
- **🔌 OpenRouter integration** - Use any AI model (Claude, GPT, Gemini, etc.) with your own API key
- **📝 Smart note-taking** - Create pages, organize your thoughts
- **🔗 Contextual citations** - Automatically link explanations to highlighted text
- **💾 Local storage** - Your data stays on your device (IndexedDB)
- **⚡ Lightning fast** - Built with Next.js 15 and optimized for speed
- **🎨 Clean design** - Tailwind CSS for a beautiful, responsive interface

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB)
- **AI**: OpenRouter API integration
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- An OpenRouter API key ([get one here](https://openrouter.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/maximedotair/openrouter-notes.git
   cd openrouter-notes
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

5. **Add your OpenRouter API key**
   - Enter your OpenRouter API key when prompted
   - The app will validate and save it locally

## 📖 How to Use

### Basic Writing
1. **Create a page** - Click the "+" button in the sidebar
2. **Start writing** - Use the editor with markdown support
3. **Switch between Edit/Preview** - Toggle to see formatted content

### AI-Powered Learning
1. **Highlight any text** - Select words or phrases you want to understand
2. **Click "Explain"** - Get instant AI explanations
3. **Contextual citations** - Explanations are automatically linked to your text
4. **Slash commands** - Type "/" to ask questions or get AI assistance

### AI Models
- **Default models**: Claude 4 Sonnet, Kimi K2
- **Add custom models** - Use any OpenRouter-supported model
- **Switch easily** - Change models in the AI modal

## 🎯 Use Cases

- **📚 Study notes** - Highlight complex terms while reading
- **📄 Technical documentation** - Get explanations for jargon and concepts
- **🔬 Research** - Build knowledge bases with AI-assisted understanding
- **📖 Learning** - Turn any text into an interactive learning experience
- **✍️ Writing** - Get help with ideas and explanations while writing

## 🏗️ Architecture

### Core Components
- **Editor** - Rich text editor with AI integration
- **AI Modal** - Interface for AI interactions and model selection
- **Sidebar** - Page management and navigation
- **Citation System** - Links highlighted text with AI explanations

### Data Flow
1. **Local-first** - All data stored in browser's IndexedDB
2. **State management** - Zustand for reactive updates
3. **AI integration** - OpenRouter API for model access
4. **Real-time** - Instant saves and updates

## 🔒 Privacy & Data

- **100% local storage** - Your notes never leave your device
- **No tracking** - No analytics, no data collection
- **API key security** - Keys stored locally, never transmitted to our servers
- **Open source** - Full transparency, audit the code yourself

## 🎨 Design Philosophy

- **Minimalism first** - Clean, distraction-free interface
- **Speed matters** - Optimized for instant interactions
- **User control** - You own your data and choose your AI models
- **Accessibility** - Keyboard shortcuts and screen reader support

## 🚧 Roadmap

### Planned Features
- [ ] Export capabilities (Markdown, PDF)
- [ ] Keyboard shortcuts customization
- [ ] Themes and customization
- [ ] Plugin system for extensions
- [ ] Collaboration features (optional)
- [ ] Mobile app version

### Ideas & Feedback
Have an idea? Found a bug? I'd love to hear from you!
- **Issues**: [GitHub Issues](https://github.com/maximedotair/openrouter-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maximedotair/openrouter-notes/discussions)
- **Twitter**: [@maximedotair](https://twitter.com/maximedotair)

## 🤝 Contributing

This is an open-source project and contributions are welcome!

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Submit a pull request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind for styling
- Write tests for new features
- Update documentation as needed

## 📝 License

MIT License - feel free to use this project as inspiration or foundation for your own tools.

## 🙏 Acknowledgments

- **OpenRouter** - For providing access to multiple AI models
- **Next.js team** - For the amazing framework
- **The open-source community** - For inspiration and tools

---

## 🔥 Build in Public Updates

This project is being built in public! Follow along:

- **Day 1** (July 21st): ✅ Core functionality, AI integration, citation system
- **Day 2**: 🚧 Polish, testing, documentation

### Why Build in Public?

I believe in **transparency and community-driven development**. This project started from a personal need and I'm sharing the entire journey - the good, the bad, and the lessons learned.

**Connect with me**:
- 🐦 Twitter: [@maximedotair](https://twitter.com/maximedotair) 

---

**⭐ If you find this project useful, please give it a star! It helps others discover it and motivates me to keep improving it.**

#buildinpublic #opensource #ai #productivity #minimalism

import React from 'react';
import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

// Global styles are now handled by the theme system in index.css

// --- SVG ICON COMPONENTS ---

const NotebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const QuizIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SummarizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TodoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const VoiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const PlannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);

const PdfIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


// --- DATA CONSTANTS ---

const features = [
  { icon: <NotebookIcon />, title: 'Notebook System', description: 'Create books and sub-topics for structured, organized note-taking.' },
  { icon: <ChatIcon />, title: 'AI Chatbot', description: 'Chat with an AI to clarify doubts using your personal notes as context.' },
  { icon: <QuizIcon />, title: 'Quiz Generator', description: 'Automatically generate Multiple Choice Questions from your notes to test your knowledge.' },
  { icon: <SummarizeIcon />, title: 'Summarizer', description: 'Condense long notes into concise bullet-point summaries for quick revision.' },
  { icon: <TodoIcon />, title: 'To-Do Manager', description: 'Create tasks, set deadlines, and track your study goals effortlessly.' },
  { icon: <DashboardIcon />, title: 'Personal Dashboard', description: 'Track notes created, quizzes taken, and topics covered at a glance.' },
];

const techStack = [
  { name: 'React', category: 'Frontend' },
  { name: 'Vite', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Gemini LLM', category: 'AI' },
  { name: 'ChromaDB', category: 'Vector Store' },
  { name: 'Vercel', category: 'Hosting' },
  { name: 'Render', category: 'Hosting' },
];

const futurePlans = [
    { icon: <VoiceIcon />, name: 'Voice Input', description: 'Dictate notes and commands for a hands-free experience.' },
    { icon: <PlannerIcon />, name: 'Revision Planner', description: 'AI-powered schedule generator for effective exam preparation.' },
    { icon: <AnalyticsIcon />, name: 'Advanced Analytics', description: 'Deeper insights into study habits and knowledge gaps.' },
    { icon: <PdfIcon />, name: 'Export as PDF', description: 'Save your notes and quizzes offline in a portable format.' },
];

// --- UI COMPONENTS ---

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-sm">
    <div className="container mx-auto px-6 py-4 flex items-center">
      
      {/* LEFT: Logo + Beta */}
      <div className="flex-1 flex items-center justify-start">
        <div className="flex items-center text-2xl font-bold text-amber-400">
          <Brain className="h-8 w-8 mr-2 text-amber-400" />
          StudySmart Pro
        </div>
        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-amber-600 text-black rounded">
          Beta
        </span>
      </div>

      {/* CENTER: Navigation Links */}
      <nav className="flex-1 hidden md:flex justify-center items-center space-x-8">
        <a href="#features" className="text-zinc-300 hover:text-amber-400 transition-colors">Features</a>
        <a href="#tech-stack" className="text-zinc-300 hover:text-amber-400 transition-colors">Tech Stack</a>
        <a href="#roadmap" className="text-zinc-300 hover:text-amber-400 transition-colors">Roadmap</a>
      </nav>

      {/* RIGHT: Button */}
      <div className="flex-1 flex justify-end">
        <Link
          to="/login"
          className="hidden md:block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition-transform duration-300 hover:scale-105"
        >
          Get Started
        </Link>
      </div>

    </div>
  </header>
);


const Hero = () => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center">
    <div className="absolute inset-0 -z-10 bg-grid-zinc-800/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 -z-20">
      <div className="absolute w-full h-full bg-amber-600/10 blur-3xl rounded-full"></div>
      <div className="absolute w-3/4 h-3/4 bg-orange-600/10 blur-3xl rounded-full animate-pulse top-10 right-0"></div>
      <div className="absolute w-1/2 h-1/2 bg-yellow-600/10 blur-3xl rounded-full animate-pulse bottom-0 left-10"></div>
    </div>
    <div className="container mx-auto px-6">
      <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
        AI-Powered Study Assistant
      </h1>
      <div className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
        Transform your notes into knowledge. StudySmart Pro helps you with intelligent note-taking, instant doubt clarification, quiz generation, and content summarization.
      </div>
      <div className="flex justify-center space-x-4">
        <a href="#features" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3 rounded-lg transition-transform duration-300 hover:scale-105">Explore Features</a>
        <a href="https://github.com/MRKrinetic" target="_blank" rel="noopener noreferrer" className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-lg transition-transform duration-300 hover:scale-105">View on GitHub</a>
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 hover:border-amber-500/50 hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-amber-500/10">
    {icon}
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-zinc-400">{description}</p>
  </div>
);

const Features = () => (
  <section id="features" className="py-20">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Everything You Need to Study Smarter</h2>
        <p className="text-zinc-400 mt-2 max-w-2xl mx-auto">From organized notes to AI-driven insights, we've got you covered.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(feature => <FeatureCard key={feature.title} {...feature} />)}
      </div>
    </div>
  </section>
);

const TechStack = () => (
  <section id="tech-stack" className="py-20 bg-zinc-900/70">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Powered By Modern Technology</h2>
        <p className="text-zinc-400 mt-2">Built with a robust and scalable stack to deliver a seamless experience.</p>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 max-w-4xl mx-auto">
        {techStack.map(tech => (
          <div key={tech.name} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-full transition-colors hover:text-white hover:border-amber-500">
            {tech.name}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FuturePlans = () => (
    <section id="roadmap" className="py-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white">The Road Ahead</h2>
                <p className="text-zinc-400 mt-2 max-w-2xl mx-auto">We're constantly innovating. Here's what's coming next.</p>
            </div>
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {futurePlans.map((plan) => (
                    <div key={plan.name} className="flex items-start p-4">
                        {plan.icon}
                        <div>
                            <h3 className="font-semibold text-white text-lg">{plan.name}</h3>
                            <p className="text-zinc-400">{plan.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);


const Footer = () => (
  <footer id="contact" className="border-t border-zinc-800">
    <div className="container mx-auto px-6 py-8 text-center text-zinc-400">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center text-lg font-bold text-amber-400">
          <Brain className="h-6 w-6 mr-2 text-amber-400" />
          StudySmart Pro
        </div>
        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-amber-600 text-black rounded">Beta</span>
      </div>
      <p>The ultimate AI-powered study companion.</p>
      <p className="mt-4 text-sm">&copy; {new Date().getFullYear()} StudySmart Pro. All rights reserved by Team PixAl.</p>
    </div>
  </footer>
);

export default function LandingPage() {

  return (
    <div className="bg-zinc-950 min-h-screen">
        <Header />
        <main>
            <Hero />
            <Features />
            <TechStack />
            <FuturePlans />
        </main>
        <Footer />
    </div>
  );
} 
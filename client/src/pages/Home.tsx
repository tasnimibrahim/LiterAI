import { Button } from "@/components/ui/button";
import { BookOpen, Zap, Shield, BarChart3, Moon, Sun, Monitor, Search, FileText, Mic, FolderOpen, Brain, Globe, ArrowRight, Star, Users, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, setTheme: setThemeContext } = useTheme();
  const setTheme = setThemeContext || (() => {});

  const themeIcon = theme === "dark" ? <Sun className="w-5 h-5" /> : theme === "system" ? <Monitor className="w-5 h-5" /> : <Moon className="w-5 h-5" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">LiterAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (theme === "light") setTheme("dark");
                else if (theme === "dark") setTheme("system");
                else setTheme("light");
              }}
              title={`Theme: ${theme}`}
              className="rounded-full"
            >
              {themeIcon}
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/login")}>Sign In</Button>
            <Button onClick={() => setLocation("/login")} className="font-semibold">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Research Assistant
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Accelerate Your
              <span className="text-primary block">Academic Research</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              LiterAI helps researchers find, analyze, and synthesize academic papers using advanced AI and retrieval-augmented generation technology.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => setLocation("/login")} className="h-13 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                Start Researching <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="h-13 px-8 text-base">
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Academic Databases", value: "6+", icon: Globe },
            { label: "Papers Indexed", value: "200M+", icon: FileText },
            { label: "AI Models", value: "5+", icon: Brain },
            { label: "Active Researchers", value: "10K+", icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary/70" />
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need for Research</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed for modern researchers
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Multi-Source Search", desc: "Search arXiv, PubMed, Semantic Scholar, IEEE, and more from one place instantly." },
              { icon: Brain, title: "RAG-Powered Analysis", desc: "Advanced retrieval-augmented generation for accurate, context-aware responses." },
              { icon: FileText, title: "Report Generation", desc: "Generate PDF reports with summaries, comparisons, gaps analysis, and citations." },
              { icon: Mic, title: "Voice Input", desc: "Ask questions using your voice with real-time speech recognition." },
              { icon: FolderOpen, title: "Project Organization", desc: "Organize chats into projects for easy access to topic-specific research." },
              { icon: BarChart3, title: "Model Evaluation", desc: "Evaluate and compare AI model responses with quality metrics and dashboards." },
              { icon: Star, title: "Citation Management", desc: "Automatically track and format citations across your research sessions." },
              { icon: Shield, title: "Secure & Private", desc: "Your research data is stored locally with encrypted authentication." },
              { icon: Zap, title: "Multiple AI Models", desc: "Choose from GPT-4, Gemini, Claude, and more for different research needs." },
            ].map((feature) => (
              <div key={feature.title} className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of researchers using LiterAI to accelerate their academic work.
          </p>
          <Button size="lg" onClick={() => setLocation("/login")} className="h-13 px-10 text-base font-semibold shadow-lg shadow-primary/25">
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LiterAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 LiterAI. AI-powered academic research assistant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

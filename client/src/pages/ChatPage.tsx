import { useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus, Send, BookOpen, PanelLeftClose, PanelLeft, Settings, Search,
  Moon, Sun, Monitor, Mic, Square, Loader2, Paperclip, Link, Image,
  FolderOpen, Pin, Trash2, MoreHorizontal, ChevronDown, X, FileText, LogOut, Check
} from "lucide-react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string | null;
  createdAt: Date | null;
}

interface Attachment {
  id: string;
  type: "file" | "url" | "image";
  name: string;
  content?: string;
}

interface PaperResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  year?: number;
  source: string;
  selected?: boolean;
}

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", speed: "Accurate" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", speed: "Fast" },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 Vision", speed: "Vision" },
  { id: "gpt-4o", name: "GPT-4o", speed: "Balanced" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", speed: "Creative" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Fast" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", speed: "Open Source" },
];

const SOURCES = [
  { id: "arxiv", name: "arXiv" },
  { id: "pubmed", name: "PubMed" },
  { id: "semantic_scholar", name: "Semantic Scholar" },
  { id: "ieee", name: "IEEE Xplore" },
  { id: "springer", name: "Springer" },
  { id: "sciencedirect", name: "ScienceDirect" },
  { id: "google_scholar", name: "Google Scholar" },
  { id: "core", name: "CORE" },
  { id: "doaj", name: "DOAJ" },
  { id: "plos", name: "PLOS" },
  { id: "europe_pmc", name: "Europe PMC" },
];

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, setTheme: setThemeCtx } = useTheme();
  const setTheme = setThemeCtx || (() => {});

  // State
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState("llama-3.1-70b-versatile");
  const [selectedSources, setSelectedSources] = useState<string[]>(["arxiv", "pubmed"]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showSourceSelect, setShowSourceSelect] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [retrievedPapers, setRetrievedPapers] = useState<PaperResult[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [showPapersPanel, setShowPapersPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // tRPC queries
  const chatListQuery = trpc.chat.list.useQuery(undefined, { enabled: isAuthenticated });
  const projectListQuery = trpc.project.list.useQuery(undefined, { enabled: isAuthenticated });
  const chatMessagesQuery = trpc.chat.messages.useQuery(
    { chatId: currentChatId! },
    { enabled: !!currentChatId && isAuthenticated }
  );
  const createChatMutation = trpc.chat.create.useMutation();
  const sendMessageMutation = trpc.chatLLM.sendMessage.useMutation();
  const deleteChatMutation = trpc.chat.delete.useMutation();
  const updateChatMutation = trpc.chat.update.useMutation();
  const createProjectMutation = trpc.project.create.useMutation();
  const addChatToProjectMutation = trpc.project.addChat.useMutation();
  const searchPapersMutation = trpc.chatLLM.searchPapers.useMutation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Load messages when chat changes
  useEffect(() => {
    if (chatMessagesQuery.data) {
      setMessages(chatMessagesQuery.data.map(m => ({
        ...m,
        role: m.role as "user" | "assistant",
      })));
    }
  }, [chatMessagesQuery.data]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + "px";
    }
  }, [inputValue]);

  const handleCreateChat = useCallback(async () => {
    try {
      const chat = await createChatMutation.mutateAsync({ title: "New Conversation", model: selectedModel });
      setCurrentChatId(chat.id);
      setMessages([]);
      chatListQuery.refetch();
    } catch (err) {
      toast.error("Failed to create chat");
    }
  }, [createChatMutation, selectedModel, chatListQuery]);

  const handleSelectChat = useCallback((chatId: number) => {
    setCurrentChatId(chatId);
  }, []);

  const handleDeleteChat = useCallback(async (chatId: number) => {
    try {
      await deleteChatMutation.mutateAsync({ chatId });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      chatListQuery.refetch();
      toast.success("Chat deleted");
    } catch { toast.error("Failed to delete chat"); }
  }, [deleteChatMutation, currentChatId, chatListQuery]);

  // Search papers from academic sources
  const handleSearchPapers = useCallback(async (query?: string) => {
    const searchQuery = query || inputValue.trim();
    if (!searchQuery || isSearching) return;
    setIsSearching(true);
    try {
      const result = await searchPapersMutation.mutateAsync({
        query: searchQuery,
        sources: selectedSources,
        limit: 5,
      });
      setRetrievedPapers(result.papers.map((p: any) => ({ ...p, selected: false })));
      setShowPapersPanel(true);
      toast.success(`Found ${result.papers.length} papers`);
    } catch {
      toast.error("Paper search failed");
    } finally {
      setIsSearching(false);
    }
  }, [inputValue, selectedSources, isSearching, searchPapersMutation]);

  const togglePaperSelection = (paperId: string) => {
    setSelectedPaperIds(prev => {
      const next = new Set(prev);
      if (next.has(paperId)) next.delete(paperId);
      else next.add(paperId);
      return next;
    });
  };

  const getSelectedPapers = () => retrievedPapers.filter(p => selectedPaperIds.has(p.id));

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isTyping) return;

    let chatId = currentChatId;

    // Auto-create chat if none
    if (!chatId) {
      try {
        const chat = await createChatMutation.mutateAsync({
          title: inputValue.slice(0, 50) + (inputValue.length > 50 ? "..." : ""),
          model: selectedModel,
        });
        chatId = chat.id;
        setCurrentChatId(chat.id);
        chatListQuery.refetch();
      } catch {
        toast.error("Failed to create chat");
        return;
      }
    }

    const userMsg: ChatMsg = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Pass selected papers to the backend
    const selPapers = getSelectedPapers().map(p => ({
      title: p.title,
      authors: p.authors,
      abstract: p.abstract,
      url: p.url,
      source: p.source,
      year: p.year,
    }));

    try {
      const result = await sendMessageMutation.mutateAsync({
        chatId,
        content: userMsg.content,
        model: selectedModel,
        sources: selectedSources,
        attachments: attachments.map(a => ({ name: a.name, type: a.type, content: a.content })),
        selectedPapers: selPapers.length > 0 ? selPapers : undefined,
      });

      const assistantMsg: ChatMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.response,
        modelUsed: selectedModel,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setAttachments([]);
      chatListQuery.refetch();
    } catch (err) {
      toast.error("Failed to get response");
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, currentChatId, selectedModel, selectedSources, isTyping, attachments, retrievedPapers, selectedPaperIds, createChatMutation, sendMessageMutation, chatListQuery]);

  // Voice recording using Web Speech API
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(prev => prev + transcript);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Speech recognition error");
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`File "${file.name}" attached`);
      
      const isImage = file.type.includes("image");
      
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        type: isImage ? "image" : "file",
        name: file.name,
      };
      
      if (isImage) {
        setSelectedModel("llama-3.2-11b-vision-preview");
        toast.info("Switched to Vision model for image analysis");
      }
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        newAttachment.content = e.target?.result as string;
        setAttachments(prev => [...prev, newAttachment]);
      };
      
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
    setShowAttachMenu(false);
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleGenerateReport = useCallback(async () => {
    if (isTyping) return;
    setIsTyping(true);
    toast.info("Generating PDF report... Please wait.");
    
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const chat = await createChatMutation.mutateAsync({
          title: "Research Report",
          model: selectedModel,
        });
        chatId = chat.id;
        setCurrentChatId(chat.id);
        chatListQuery.refetch();
      } catch {
        toast.error("Failed to initialize report chat");
        setIsTyping(false);
        return;
      }
    }

    try {
      const selPapers = getSelectedPapers().map(p => ({
        title: p.title,
        authors: p.authors,
        abstract: p.abstract,
        url: p.url,
        source: p.source,
        year: p.year,
      }));

      const result = await sendMessageMutation.mutateAsync({
        chatId,
        content: "Please generate a highly detailed, structured, and formal research report based strictly on the uploaded documents and retrieved context. Provide the final report directly without conversational filler.",
        model: selectedModel,
        sources: selectedSources,
        attachments: attachments.map(a => ({ name: a.name, type: a.type, content: a.content })),
        selectedPapers: selPapers.length > 0 ? selPapers : undefined,
      });
      
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>LiterAI Research Report</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; padding: 2rem; }
                h1, h2, h3 { color: #000; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3rem; margin-top: 2rem; }
                p { margin-bottom: 1rem; }
                ul, ol { margin-bottom: 1rem; }
                @media print {
                  @page { margin: 2cm; }
                }
              </style>
            </head>
            <body>
              <div id="content"></div>
              <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
              <script>
                document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(result.response)});
                setTimeout(function() { window.print(); }, 500);
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      toast.success("Report ready!");
    } catch(err) {
      toast.error("Failed to generate report");
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, currentChatId, selectedModel, selectedSources, attachments, sendMessageMutation, createChatMutation, chatListQuery]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chats = chatListQuery.data || [];
  const projects = projectListQuery.data || [];
  const themeIcon = theme === "dark" ? <Sun className="w-4 h-4" /> : theme === "system" ? <Monitor className="w-4 h-4" /> : <Moon className="w-4 h-4" />;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* ─── Sidebar ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="w-72 border-r border-border bg-card flex flex-col transition-theme">
          {/* Logo */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground text-lg">LiterAI</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-full h-8 w-8">
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat */}
          <div className="p-3">
            <Button 
              onClick={handleCreateChat} 
              className="w-full font-medium" 
              variant="outline"
              disabled={messages.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            {/* Projects */}
            {projects.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Projects</p>
                {projects.map((proj: any) => (
                  <div key={proj.id} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color || "#6366f1" }} />
                    <span className="truncate">{proj.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Chats */}
            {chats.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Recent Chats</p>
            )}
            {chats.map((chat: any) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-1 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors cursor-pointer ${
                  currentChatId === chat.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <span className="truncate flex-1">{chat.title || "New Conversation"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {chats.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8 px-4">
                No conversations yet. Start typing to begin!
              </p>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setLocation("/settings")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); setLocation("/login"); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* ─── Main Chat Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="rounded-full h-8 w-8">
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="font-semibold text-sm truncate">
              {currentChatId
                ? chats.find((c: any) => c.id === currentChatId)?.title || "Chat"
                : "LiterAI"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowModelSelect(!showModelSelect)} className="text-xs gap-1 h-8 font-medium text-muted-foreground">
                {MODELS.find(m => m.id === selectedModel)?.name || "Model"}
                <ChevronDown className={`w-3 h-3 transition-transform ${showModelSelect ? "rotate-180" : ""}`} />
              </Button>
              {showModelSelect && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowModelSelect(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-xl z-50 p-1.5">
                    {MODELS.map(model => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelSelect(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                          selectedModel === model.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.speed}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Source Selector */}
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowSourceSelect(!showSourceSelect)} className="text-xs gap-1 h-8 font-medium text-muted-foreground">
                Sources ({selectedSources.length})
                <ChevronDown className={`w-3 h-3 transition-transform ${showSourceSelect ? "rotate-180" : ""}`} />
              </Button>
              {showSourceSelect && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSourceSelect(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-popover border border-border rounded-lg shadow-xl z-50 p-2">
                    {SOURCES.map(source => (
                      <label key={source.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer text-sm transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.id)}
                          onChange={() => {
                            setSelectedSources(prev =>
                              prev.includes(source.id) ? prev.filter(s => s !== source.id) : [...prev, source.id]
                            );
                          }}
                          className="rounded accent-primary"
                        />
                        <span className="text-foreground">{source.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost" size="icon"
              onClick={() => {
                if (theme === "light") setTheme("dark");
                else if (theme === "dark") setTheme("system");
                else setTheme("light");
              }}
              title={`Theme: ${theme}`}
              className="rounded-full h-8 w-8"
            >
              {themeIcon}
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">How can I help you?</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Search papers, analyze findings, generate reports, or ask any research question.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`mb-6 ${msg.role === "user" ? "flex justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 prose prose-sm dark:prose-invert max-w-none text-foreground">
                      <Streamdown>{msg.content}</Streamdown>
                      {msg.modelUsed && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {MODELS.find(m => m.id === msg.modelUsed)?.name || msg.modelUsed}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {msg.role === "user" && (
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 py-3">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── Fixed Input Area (ChatGPT style) ──────────────────────── */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex flex-col gap-2">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* Generate Report Button - Standalone */}
            <div className="flex justify-between items-center mb-2">
              <div></div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleGenerateReport}
                disabled={messages.length === 0 && attachments.length === 0 && selectedSources.length === 0}
                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Generate Report
              </Button>
            </div>

            {/* Paper Search Results Panel */}
            {showPapersPanel && retrievedPapers.length > 0 && (
              <div className="mb-4 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    Retrieved Papers ({retrievedPapers.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedPaperIds.size} selected</span>
                    <Button variant="ghost" size="icon" onClick={() => setShowPapersPanel(false)} className="h-6 w-6 rounded-full">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {retrievedPapers.map((paper) => (
                    <div 
                      key={paper.id} 
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedPaperIds.has(paper.id) 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      onClick={() => togglePaperSelection(paper.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedPaperIds.has(paper.id)}
                          onChange={() => {}} // Handled by div onClick
                          className="mt-1 rounded accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium leading-tight mb-1">{paper.title}</h4>
                          <p className="text-xs text-muted-foreground mb-1">
                            {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""} • {paper.year || "N/A"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium uppercase">{paper.source}</span>
                            <a 
                              href={paper.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                            >
                              <Link className="w-2.5 h-2.5" /> View Original
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-border bg-muted/20 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => {
                      if (selectedPaperIds.size > 0) {
                        setInputValue(prev => prev + "\nAnalyze the selected papers.");
                        setShowPapersPanel(false);
                      } else {
                        toast.error("Select at least one paper");
                      }
                    }}
                    className="text-xs h-8"
                  >
                    Use Selected Papers
                  </Button>
                </div>
              </div>
            )}

            <div className="relative flex flex-col gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all">
              
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pt-1">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 bg-muted rounded-lg pl-2 pr-1 py-1 text-sm border border-border">
                      {att.type === "image" ? <Image className="w-4 h-4 text-blue-500" /> : <Paperclip className="w-4 h-4 text-orange-500" />}
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <button onClick={() => removeAttachment(att.id)} className="p-0.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 px-1 pb-1">
                {/* Search Papers Button */}
                <button
                  onClick={() => handleSearchPapers()}
                  disabled={isSearching || !inputValue.trim()}
                  className={`p-2 rounded-lg transition-colors ${
                    isSearching ? "animate-pulse text-primary" : "hover:bg-muted text-muted-foreground hover:text-primary"
                  }`}
                  title="Search academic papers for this query"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>

                {/* Attachment + button */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Attach files"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {showAttachMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                      <div className="absolute bottom-full left-0 mb-2 w-52 bg-popover border border-border rounded-xl shadow-xl z-50 p-1.5">
                        <button
                          onClick={() => { fileInputRef.current?.click(); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-foreground transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          Upload Document
                        </button>
                        <button
                          onClick={() => { 
                            const url = prompt("Enter URL:");
                            if (url) {
                              setInputValue(prev => prev ? `${prev}\n[URL: ${url}]` : `[URL: ${url}]`);
                            }
                            setShowAttachMenu(false); 
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-foreground transition-colors"
                        >
                          <Link className="w-4 h-4 text-muted-foreground" />
                          Paste URL
                        </button>
                        <button
                          onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-foreground transition-colors"
                        >
                          <Image className="w-4 h-4 text-muted-foreground" />
                          Upload Image
                        </button>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a research question..."
                  className="flex-1 bg-transparent resize-none text-sm py-2 px-1 placeholder:text-muted-foreground focus:outline-none text-foreground min-h-[40px] max-h-[150px]"
                  rows={1}
                  disabled={isTyping}
                />

                {/* Voice + Send */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-lg transition-all ${
                      isRecording
                        ? "bg-destructive text-destructive-foreground recording-pulse"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && attachments.length === 0) || isTyping}
                    className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
              LiterAI can make mistakes. Verify important research findings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

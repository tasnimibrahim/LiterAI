import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Moon, Sun, Monitor, Star, User, Bell, Palette, Shield, MessageSquare, BookOpen, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const { theme, setTheme: setThemeCtx } = useTheme();
  const setTheme = setThemeCtx || (() => {});

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<"general" | "bug" | "feature" | "praise">("general");

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const updateThemeMutation = trpc.settings.updateTheme.useMutation();
  const submitFeedbackMutation = trpc.feedback.submit.useMutation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setInstitution(user.institution || "");
      setFieldOfStudy(user.fieldOfStudy || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: name || undefined,
        email: email || undefined,
        institution: institution || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        bio: bio || undefined,
      });
      refreshUser();
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    try {
      await updateThemeMutation.mutateAsync({ theme: newTheme });
    } catch {}
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    try {
      await submitFeedbackMutation.mutateAsync({
        rating,
        comment: feedbackComment || undefined,
        feedbackType,
      });
      toast.success("Thank you for your feedback!");
      setRating(0);
      setFeedbackComment("");
      setShowFeedback(false);
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Light background with dark text" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Dark background with light text" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Follow device preference" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/chat")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Manage your personal information</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Username</label>
                <Input value={user?.username || ""} disabled className="bg-muted/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Institution</label>
                <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="University or organization" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Field of Study</label>
                <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="e.g. Computer Science" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your research interests..." className="min-h-[80px]" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-fit">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize how LiterAI looks</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  theme === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <opt.icon className={`w-6 h-6 mx-auto mb-2 ${theme === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Data & Privacy */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Data & Privacy</h2>
              <p className="text-sm text-muted-foreground">Control your data and privacy settings</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Auto-save conversations</p>
                <p className="text-xs text-muted-foreground">Automatically save all chat conversations</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-primary relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Usage analytics</p>
                <p className="text-xs text-muted-foreground">Help improve LiterAI with anonymous usage data</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-muted relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback & Rating */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Feedback & Rating</h2>
              <p className="text-sm text-muted-foreground">Help us improve LiterAI</p>
            </div>
          </div>

          {!showFeedback ? (
            <Button onClick={() => setShowFeedback(true)} variant="outline">
              <Star className="w-4 h-4 mr-2" /> Rate & Send Feedback
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">How would you rate LiterAI?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {(["general", "bug", "feature", "praise"] as const).map((cat) => (
                    <Button key={cat} variant={feedbackType === cat ? "default" : "outline"} size="sm" onClick={() => setFeedbackType(cat)} className="capitalize">
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Comments</label>
                <Textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Share your thoughts..." className="min-h-[100px]" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitFeedback} disabled={rating === 0}>Submit Feedback</Button>
                <Button variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>

        {/* About */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">About LiterAI</h2>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            LiterAI is an AI-powered academic research assistant that helps researchers find, analyze, and synthesize academic papers using advanced RAG technology. Built with React, TypeScript, and modern AI models.
          </p>
        </Card>
      </main>
    </div>
  );
}

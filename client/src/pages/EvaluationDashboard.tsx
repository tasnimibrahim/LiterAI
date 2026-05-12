import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Loader2, Brain, CheckCircle, Search, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function EvaluationDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: stats, isLoading, error } = trpc.evaluation.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-4 text-center">
        <p className="text-xl font-bold mb-2">Error loading dashboard</p>
        <p className="text-sm opacity-80 mb-4">{error.message}</p>
        <Button onClick={() => setLocation("/chat")}>Back to Chat</Button>
      </div>
    );
  }

  const modelData = stats?.map(stat => ({
    name: stat.modelId,
    Relevance: parseFloat(stat.avgRelevance.toFixed(2)) * 100,
    Accuracy: parseFloat(stat.avgAccuracy.toFixed(2)) * 100,
    Clarity: parseFloat(stat.avgClarity.toFixed(2)) * 100,
    Completeness: parseFloat(stat.avgCompleteness.toFixed(2)) * 100,
    Samples: stat.count,
  })) || [];

  // Default data if none exists
  const displayData = modelData.length > 0 ? modelData : [
    { name: "gpt-4", Relevance: 92, Accuracy: 95, Clarity: 88, Completeness: 90, Samples: 0 },
    { name: "gemini-2.5-flash", Relevance: 85, Accuracy: 82, Clarity: 90, Completeness: 80, Samples: 0 },
    { name: "claude-3.5-sonnet", Relevance: 90, Accuracy: 89, Clarity: 95, Completeness: 88, Samples: 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/chat")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Model Evaluation Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-border glass-card">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium text-sm text-muted-foreground">Avg Relevance</h3>
            </div>
            <p className="text-3xl font-bold">
              {displayData.length > 0 ? (displayData.reduce((acc, curr) => acc + curr.Relevance, 0) / displayData.length).toFixed(1) : 0}%
            </p>
          </Card>
          <Card className="p-4 border-border glass-card">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-sm text-muted-foreground">Avg Accuracy</h3>
            </div>
            <p className="text-3xl font-bold">
              {displayData.length > 0 ? (displayData.reduce((acc, curr) => acc + curr.Accuracy, 0) / displayData.length).toFixed(1) : 0}%
            </p>
          </Card>
          <Card className="p-4 border-border glass-card">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-5 h-5 text-amber-500" />
              <h3 className="font-medium text-sm text-muted-foreground">Avg Clarity</h3>
            </div>
            <p className="text-3xl font-bold">
              {displayData.length > 0 ? (displayData.reduce((acc, curr) => acc + curr.Clarity, 0) / displayData.length).toFixed(1) : 0}%
            </p>
          </Card>
          <Card className="p-4 border-border glass-card">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="font-medium text-sm text-muted-foreground">Total Samples Evaluated</h3>
            </div>
            <p className="text-3xl font-bold">
              {stats?.reduce((acc, curr) => acc + curr.count, 0) || 0}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <Card className="p-6 border-border glass-card flex flex-col">
            <h3 className="text-lg font-semibold mb-6">Metric Comparison by Model</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fill: "currentColor", opacity: 0.7 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "currentColor", opacity: 0.7 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Bar dataKey="Relevance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Radar Chart */}
          <Card className="p-6 border-border glass-card flex flex-col">
            <h3 className="text-lg font-semibold mb-6">Model Profiling</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayData}>
                  <PolarGrid opacity={0.3} />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "currentColor", opacity: 0.8 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} opacity={0.5} />
                  <Radar name="Relevance" dataKey="Relevance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Radar name="Accuracy" dataKey="Accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {modelData.length === 0 && (
          <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border mt-8">
            <p className="text-muted-foreground">
              No real evaluation data found in the database. 
              The charts above show simulated baseline data. Start chatting with different models to generate real evaluation metrics!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

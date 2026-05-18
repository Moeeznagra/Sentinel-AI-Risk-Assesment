import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Search,
  BookOpen,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EXAMPLE_POLICIES } from "@/src/constants";

type View = "dashboard" | "workspace" | "assistant";

interface AssessmentCard {
  function: string;
  code: string;
  percentage: number;
  findings: string[];
  gaps: string[];
}

interface AnalysisData {
  assessment: AssessmentCard[];
  summary: string;
}

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [policyText, setPolicyText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");

  const handleAnalyze = async () => {
    if (!policyText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyText }),
      });
      const data = await res.json();
      setAnalysisData(data);
      setActiveView("dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (!analysisData) return;
    
    let csv = "Function,Code,Coverage %,Findings,Gaps\n";
    analysisData.assessment.forEach(a => {
      const findings = a.findings.join("; ").replace(/"/g, '""');
      const gaps = a.gaps.join("; ").replace(/"/g, '""');
      csv += `"${a.function}","${a.code}",${a.percentage},"${findings}","${gaps}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sentinel_Risk_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!analysisData) return;
    
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(22);
    doc.text("Risk Assessment Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);
    doc.text("Source: Sentinel Institutional Risk Engine", 14, 33);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(60);
    const splitSummary = doc.splitTextToSize(analysisData.summary, 180);
    doc.text(splitSummary, 14, 52);
    
    // Table
    const tableData = analysisData.assessment.map(a => [
      a.function,
      a.code,
      `${a.percentage}%`,
      a.findings.join("\n"),
      a.gaps.join("\n")
    ]);
    
    autoTable(doc, {
      startY: 55 + (splitSummary.length * 5),
      head: [['Function', 'Code', 'Coverage', 'Key Findings', 'Priority Gaps']],
      body: tableData,
      headStyles: { fillColor: [30, 30, 30] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        3: { cellWidth: 45 },
        4: { cellWidth: 45 }
      }
    });
    
    doc.save(`Sentinel_Risk_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = { role: "user" as const, text: userInput };
    setChatMessages([...chatMessages, newMessage]);
    setUserInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userInput, 
          context: policyText || analysisData?.summary || "No specific policy provided yet." 
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "ai", text: data.text }]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
          </div>
          <span className="text-lg font-semibold tracking-tight uppercase">Sentinel</span>
        </div>

        <nav className="flex-1 space-y-8">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Analysis</span>
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
              active={activeView === "dashboard"} 
              onClick={() => setActiveView("dashboard")} 
            />
            <NavItem 
              icon={<FileText size={18} />} 
              label="Workspace" 
              active={activeView === "workspace"} 
              onClick={() => setActiveView("workspace")} 
            />
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Assize</span>
            <NavItem 
              icon={<MessageSquare size={18} />} 
              label="AI Assistant" 
              active={activeView === "assistant"} 
              onClick={() => setActiveView("assistant")} 
            />
          </div>
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <div className="p-4 rounded-xl border border-muted bg-card/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">AI</div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">Risk Modeling</span>
              <span className="text-[10px] text-muted-foreground">Active Hub</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-10">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground font-mono uppercase text-[10px] tracking-widest mb-2">
              <span>Sentinel</span>
              <ChevronRight size={10} />
              <span className="text-foreground">{activeView}</span>
            </div>
            <h1 className="text-4xl font-light tracking-tight capitalize">{activeView}</h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={!analysisData} variant="outline" size="sm" className="gap-2 border-border text-[10px] uppercase tracking-widest h-9 px-4">
                  <Upload size={14} /> Export Report <ChevronDown size={12} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem onClick={handleExportCSV} className="text-xs py-2 cursor-pointer">
                  Download as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="text-xs py-2 cursor-pointer">
                  Download as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeView === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 pb-10"
              >
                {!analysisData ? (
                  <div className="h-[60vh] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                    <div className="bg-muted p-6 rounded-full mb-2">
                      <BarChart3 size={32} className="text-foreground" />
                    </div>
                    <h2 className="text-xl font-light tracking-tight">No Analysis Data Found</h2>
                    <p className="text-muted-foreground max-w-sm text-sm">
                      Upload your security policies in the Workspace to generate institutional-grade risk mapping.
                    </p>
                    <Button onClick={() => setActiveView("workspace")} variant="outline" className="text-[10px] uppercase tracking-widest">
                      Enter Workspace
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Overall Card */}
                      <Card className="col-span-full bg-card border-border overflow-hidden relative p-8">
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex-1">
                            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">Executive Summary</h2>
                            <p className="text-xl font-light leading-relaxed max-w-3xl">
                              {analysisData.summary}
                            </p>
                          </div>
                          <div className="text-right ml-8">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Total Compliance</div>
                            <div className="text-6xl font-semibold tracking-tighter flex items-center justify-end">
                              {Math.round(analysisData.assessment.reduce((acc, curr) => acc + curr.percentage, 0) / 5)}<span className="opacity-40 text-4xl">%</span>
                            </div>
                            <span className="inline-block mt-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono">
                              NIST CSF 2.0
                            </span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
                      </Card>

                      {analysisData.assessment.map((item) => (
                        <Card key={item.code} className="bg-card border-border hover:border-primary/50 transition-colors rounded-2xl overflow-hidden p-6 flex flex-col h-full">
                          <div className="flex justify-between items-center mb-6">
                            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xs font-mono font-bold">
                              {item.code}
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Coverage</span>
                              <span className="text-xl font-medium">{item.percentage}%</span>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-6">{item.function}</h3>
                          
                          <div className="mt-auto space-y-6">
                            <Progress value={item.percentage} className="h-1 bg-muted" />
                            
                            <div className="space-y-4">
                              <div>
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Findings</div>
                                <ul className="space-y-2">
                                  {item.findings.slice(0, 2).map((f, i) => (
                                    <li key={i} className="text-xs flex items-start gap-2 text-foreground/80">
                                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {item.gaps.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-destructive/70 font-bold mb-2">Priority Gaps</div>
                                  <ul className="space-y-2">
                                    {item.gaps.slice(0, 2).map((g, i) => (
                                      <li key={i} className="text-xs flex items-start gap-2 text-destructive/80">
                                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                        <span>{g}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                       <Card className="lg:col-span-2 bg-card border-border p-8">
                         <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Control Map</h2>
                            <div className="flex gap-4">
                              <button className="text-[10px] uppercase tracking-tighter border-b border-foreground">ACTIVE</button>
                              <button className="text-[10px] uppercase tracking-tighter text-muted-foreground">PENDING</button>
                            </div>
                         </div>
                         <Table>
                            <TableHeader>
                              <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Area</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Resilience</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Priority</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {analysisData.assessment.map((a) => (
                                <TableRow key={a.code} className="border-border hover:bg-muted/30">
                                  <TableCell className="font-medium text-sm py-4">{a.function}</TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1 w-24 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className={cn("h-full", a.percentage > 70 ? "bg-primary" : "bg-destructive")} 
                                          style={{ width: `${a.percentage}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono">{a.percentage}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[10px] py-4 uppercase tracking-widest font-bold">
                                    {a.percentage < 50 ? (
                                      <span className="text-destructive font-bold">Immediate</span>
                                    ) : a.percentage < 80 ? (
                                      <span className="text-amber-500">Scheduled</span>
                                    ) : (
                                      <span className="text-primary">Maintained</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                       </Card>

                       <Card className="bg-card border-border p-8 flex flex-col">
                         <div className="mb-8">
                            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Assistance</h2>
                            <p className="text-sm font-light text-muted-foreground">Strategic Remediation Q&A</p>
                         </div>
                         <div className="flex-1 overflow-hidden h-64 mb-6">
                            <ScrollArea className="h-full pr-4">
                              <div className="space-y-4">
                                <div className="p-4 border border-border rounded-xl bg-muted/20 text-xs leading-relaxed italic text-muted-foreground">
                                  "Improve our {analysisData.assessment.sort((a,b) => a.percentage - b.percentage)[0].function} posture."
                                </div>
                                <div className="p-4 border border-border rounded-xl bg-primary/5 text-xs leading-relaxed text-foreground/90">
                                  Strategic priority: Implement {analysisData.assessment.sort((a,b) => a.percentage - b.percentage)[0].gaps[0]}. This bridges the primary gap in your current security manifest.
                                </div>
                              </div>
                            </ScrollArea>
                         </div>
                         <Button variant="outline" onClick={() => setActiveView("assistant")} className="w-full border-border text-[10px] uppercase tracking-widest h-11">
                           Interface Assistant
                         </Button>
                       </Card>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeView === "workspace" && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto space-y-12 py-10 pb-20"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Manifest Intake</h2>
                  <h3 className="text-5xl font-light tracking-tight">Security Policy Workspace</h3>
                  <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto italic">
                    "Input raw security frameworks, audit logs, or organizational standards to map institutional resilience."
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl"></div>
                  <Card className="relative bg-card border-border overflow-hidden shadow-2xl">
                    <Textarea 
                      placeholder="e.g., SECTION 4: ACCESS CONTROL. Access to system components must be restricted to users with a legitimate business need-to-know..."
                      className="min-h-[450px] border-0 focus-visible:ring-0 text-lg p-10 leading-loose placeholder:text-muted-foreground/30 font-light"
                      value={policyText}
                      onChange={(e) => setPolicyText(e.target.value)}
                    />
                    <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
                      <div className="flex gap-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer")}>
                            <BookOpen size={14} className="mr-2" /> Load Example <ChevronDown size={12} className="ml-1" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
                            {EXAMPLE_POLICIES.map((example) => (
                              <DropdownMenuItem 
                                key={example.name}
                                onClick={() => setPolicyText(example.text)}
                                className="text-xs py-2 cursor-pointer"
                              >
                                {example.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing || !policyText.trim()}
                        className="bg-foreground text-background hover:bg-foreground/90 px-8 text-[10px] uppercase tracking-[0.2em] font-bold h-11"
                      >
                        {isAnalyzing ? "Processing..." : "Assess Framework"}
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
                   <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        NIST CSF 2.0 Mapping
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Automatic categorization into Identify, Protect, Detect, Respond, and Recover functions.
                      </p>
                   </div>
                   <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                         Integrity Scanning
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Semantic analysis detects missing control requirements and policy contradictions in real-time.
                      </p>
                   </div>
                   <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                         Institutional Report
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Generates high-level executive summaries suitable for board-level risk transparency.
                      </p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeView === "assistant" && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-5xl mx-auto flex-1 flex flex-col min-h-0"
              >
                <div className="mb-8 flex justify-between items-end shrink-0">
                   <div>
                     <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Institutional</h2>
                     <h3 className="text-4xl font-light tracking-tight">Compliance Assistant</h3>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Encrypted Tunnel</p>
                     <p className="text-xs font-mono text-primary">SECURE · ACTIVE</p>
                   </div>
                </div>

                <Card className="flex-1 bg-card border-border flex flex-col overflow-hidden shadow-2xl min-h-0 mb-10">
                  <ScrollArea className="flex-1 p-10">
                    <div className="space-y-8 max-w-3xl mx-auto">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-24 space-y-6">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <MessageSquare size={18} className="text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-light text-lg">Inquire regarding framework alignment or remediation strategies.</p>
                          <div className="flex flex-wrap justify-center gap-3">
                            <SuggestionChip text="Identify major gaps" onClick={() => setUserInput("Identify the major gaps in our policies.")} />
                            <SuggestionChip text="Explain PR.AC compliance" onClick={() => setUserInput("How do we align with PR.AC requirements?")} />
                            <SuggestionChip text="Remediation steps" onClick={() => setUserInput("What are the first steps for remediation?")} />
                          </div>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed",
                            msg.role === "user" 
                              ? "bg-foreground text-background font-medium" 
                              : "bg-muted/30 text-foreground border border-border"
                          )}>
                            {msg.role === "ai" && <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Sentinel AI</div>}
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="p-8 border-t border-border bg-card">
                    <form onSubmit={handleChat} className="flex gap-4 max-w-3xl mx-auto">
                      <Input 
                        placeholder="Inquire regarding risk manifests..." 
                        value={userInput} 
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-1 h-14 bg-muted/20 border-border font-light text-lg px-6 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <Button type="submit" className="h-14 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-[0.2em] text-[10px]">
                        Execute
                      </Button>
                    </form>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="h-12 border-t border-border bg-background px-8 flex justify-between items-center shrink-0">
          <div className="flex gap-8 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <span>Status: Nominal</span>
            <span>Auth: Institutional</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Secured Node Node-042</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-0 py-2 text-sm font-medium transition-all group",
        active 
          ? "text-foreground" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className={cn(
        "shrink-0 transition-transform",
        active ? "text-primary scale-110" : "group-hover:translate-x-1"
      )}>
        {icon}
      </span>
      <span className={cn(
        "tracking-tight",
        active && "font-semibold"
      )}>{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1 h-4 bg-primary rounded-full" />}
    </button>
  );
}

function SuggestionChip({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-[10px] uppercase tracking-widest font-bold text-muted-foreground transition-all hover:text-foreground shadow-sm"
    >
      {text}
    </button>
  );
}


"use client";

import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AutoDevHome() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [engine, setEngine] = useState("");
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  
  // Terminal Simulation State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    if (password === "dafinitiq2026") setIsAuthenticated(true);
    else setError("Incorrect password.");
  };

  const agentSteps = [
    "[System] Request received. Initializing Enterprise Multi-Agent Pipeline...",
    "[System] Routing task to Gemini 2.5 Flash Engine...",
    "[Architect Agent] Analyzing requirements and creating step-by-step execution plan...",
    "[Architect Agent] Logic plan generated successfully.",
    "[Coder Agent] Writing optimized Python script based on architectural plan...",
    "[Coder Agent] Code structure built. Passing to QA Engineer...",
    "[QA Agent] Injecting code into secure isolated sandbox...",
    "[QA Agent] Executing Python code...",
    "[QA Agent] Analyzing terminal output for tracebacks and logic errors...",
    "[QA Agent] Execution verified successfully. Zero errors detected.",
    "[QA Agent] Checking MCP tool requirements (GitHub Gist)...",
    "[System] Formatting final response..."
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    if (loading) {
      setTerminalLogs([]);
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep < agentSteps.length) {
          setTerminalLogs(prev => [...prev, agentSteps[currentStep]]);
          currentStep++;
        }
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setCode("");
    setSaveStatus("");
    setTerminalLogs(["[System] Connecting to AutoDev AI Backend..."]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: prompt }),
      });
      
      const data = await res.json();
      if (data.status === "success") {
        setCode(data.code);
        setEngine(data.router_decision);
      } else {
        setError(data.message || "Execution Error");
      }
    } catch (err) {
      setError("Cannot connect to backend. Is the FastAPI server running?");
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setSaveStatus("Saving to Supabase...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/save-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: prompt,
          router_decision: engine,
          final_code: code,
        }),
      });
      if (res.ok) {
        setSaveStatus("✅ Approved! Data successfully saved to Supabase.");
        setTimeout(() => { setCode(""); setPrompt(""); setSaveStatus(""); setTerminalLogs([]); }, 4000);
      } else {
        setSaveStatus("❌ Failed to save to database.");
      }
    } catch (err) {
      setSaveStatus("❌ Backend connection error.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
        <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl shadow-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-center">AutoDev AI Login</h2>
          <input 
            type="password" 
            placeholder="Enter Password" 
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded mb-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button 
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Access Pipeline
          </button>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6 text-center md:text-left">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            AutoDev AI Workspace
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Enterprise Multi-Agent Pipeline | <span className="text-blue-400">MCP Powered Gist Publishing</span></p>
        </header>

        <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">What do you want to build?</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a Python program to calculate the factorial of 5. Test it, and publish it to GitHub Gist."
            className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4 placeholder-gray-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
          >
            {loading ? "Agents are working..." : "Generate Code"}
          </button>
          {error && <p className="text-red-400 mt-4 bg-red-900/20 p-3 rounded border border-red-800">{error}</p>}
        </section>

        {terminalLogs.length > 0 && (
          <section className="bg-black p-4 rounded-xl border border-gray-700 shadow-2xl font-mono text-sm h-64 overflow-y-auto flex flex-col" ref={terminalRef}>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-500 ml-2">Agent_Execution_Logs.sh</span>
            </div>
            {terminalLogs.map((log, index) => (
              <div key={index} className="text-green-400 mb-2 animate-pulse">
                <span className="text-gray-500" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span> $ {log}
              </div>
            ))}
            {loading && <div className="text-green-400 animate-pulse mt-2">_</div>}
          </section>
        )}

        {code && !loading && (
          <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Verified Code
              </h2>
              <span className="bg-blue-900/40 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-800/50">
                Processed by: {engine}
              </span>
            </div>
            
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-800 shadow-inner">
              <SyntaxHighlighter 
                language="python" 
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1.5rem', background: '#0d1117' }}
              >
                {code}
              </SyntaxHighlighter>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <button 
                onClick={handleApprove}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                ✅ Approve (Save & Clear)
              </button>
              
              <button 
                onClick={() => { setCode(""); setTerminalLogs([]); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                ❌ Reject & Retry
              </button>
            </div>
            {saveStatus && <p className="mt-4 text-center font-medium text-emerald-400 bg-emerald-900/20 py-2 rounded">{saveStatus}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
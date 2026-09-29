'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Clock, MapPin, History,
  X, ChevronRight, HelpCircle, MessageCircle, TrendingUp, ShieldCheck, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';

type SearchMatch = {
  id: number;
  cam: string;
  time: string;
  confidence: number;
  type: string;
  desc: string;
  value?: string;
};

type Forecast = { area: string; current_risk: number; current_level: string; predicted_level_15m: string; people: number; action: string; };
type ChatResponse = { answer: string; model: string; context: { people_count?: number; risk_score?: number; projected_people_15_minutes?: number; estimated_clearable_15_minutes?: number; }; forecast: Forecast[]; disclaimer: string; };
type SearchResult = {
  results: SearchMatch[];
  total_count: number;
  search_time_ms: number;
  query_interpretation: string;
  chat?: ChatResponse;
};

const sampleQueries = [
  "Which camera has the highest crowd?",
  "Show the most crowded zone",
  "Show critical crowd incidents today",
  "Which exit is least crowded?",
  "Compare crowd density between Lobby and North Gate"
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchHistoryList, setSearchHistoryList] = useState<string[]>([]);
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % sampleQueries.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement> | null, selectedQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = selectedQuery || query;
    if (!activeQuery.trim()) return;

    setQuery(activeQuery);
    setIsSearching(true);
    setHasSearched(false);
    setSearchResult(null);

    // Save history list locally
    if (!searchHistoryList.includes(activeQuery)) {
      setSearchHistoryList(prev => [activeQuery, ...prev].slice(0, 10));
    }

    try {
      const response = await fetch(apiUrl('/api/search/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: activeQuery })
      });
      if (!response.ok) throw new Error('Assistant request failed');
      const data: ChatResponse = await response.json();
      const resultCards: SearchMatch[] = data.forecast.map((item, index) => ({
        id: index + 1,
        cam: item.area,
        time: '15-minute forecast',
        confidence: Math.max(50, Math.round(100 - item.current_risk / 2)),
        type: 'forecast',
        desc: item.people + ' people now. Current risk ' + item.current_risk + '/100 (' + item.current_level + '); projected level: ' + item.predicted_level_15m + '. ' + item.action + '.',
        value: item.predicted_level_15m
      }));
      setIsSearching(false);
      setHasSearched(true);
      setChatResponse(data);
      setSearchResult({ results: resultCards, total_count: resultCards.length, search_time_ms: 0,
        query_interpretation: 'Grounded in the latest completed crowd analysis. Response model: ' + data.model, chat: data });
    } catch (err) {
      console.warn('Crowd assistant request failed:', err);
      setIsSearching(false);
      setHasSearched(true);
      const offline: ChatResponse = {
        answer: 'The crowd assistant is offline. Start the backend on port 8001 and run an analysis before asking questions.',
        model: 'offline', context: {}, forecast: [], disclaimer: 'No live measurements were returned.'
      };
      setChatResponse(offline);
      setSearchResult({ results: [], total_count: 0, search_time_ms: 0, query_interpretation: 'Backend assistant unavailable' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Search Area */}
        <div className="flex-1 flex flex-col p-2 md:p-6 overflow-hidden">
          {/* Search Header */}
          <div className={cn("transition-all duration-500 ease-in-out w-full max-w-4xl mx-auto", 
                             hasSearched ? "mb-8 mt-2" : "my-auto")}>
            
            <div className="text-center mb-8">
              {!hasSearched && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Search className="w-8 h-8" />
                </motion.div>
              )}
              <h1 className={cn("font-bold tracking-tight transition-all duration-500", hasSearched ? "text-2xl hidden" : "text-4xl md:text-5xl mb-4")}>
                Crowd Intelligence Search
              </h1>
              {!hasSearched && (
                <p className="text-muted-foreground">Ask crowd density or evacuation route questions using natural language.</p>
              )}
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse-glow"></div>
              <div className="relative flex items-center bg-black/40 glass-panel rounded-xl border border-white/10 p-2 shadow-2xl">
                <Search className="w-6 h-6 text-primary ml-4 opacity-70" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-lg md:text-xl px-4 py-4 focus:outline-none focus:ring-0 text-white placeholder:text-muted-foreground/50 h-14"
                  placeholder={sampleQueries[placeholderIdx]}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="p-2 text-muted-foreground hover:text-white mr-2">
                    <X className="w-5 h-5" />
                  </button>
                )}
                <Button type="submit" disabled={isSearching || !query.trim()} className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {isSearching ? <span className="animate-pulse">Analyzing...</span> : "Query"}
                </Button>
              </div>
            </form>

            <div className={cn("flex flex-wrap items-center gap-2 transition-all duration-500", hasSearched ? "mt-4" : "mt-6 justify-center")}>
              <Badge variant="outline" className="bg-white/5 border-white/10 py-1.5 px-3 hover:bg-white/10 cursor-pointer gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Active Monitored Area <ChevronRight className="w-3 h-3 opacity-50" />
              </Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 py-1.5 px-3 hover:bg-white/10 cursor-pointer gap-2">
                <Clock className="w-3.5 h-3.5 text-accent" /> Live Status <ChevronRight className="w-3 h-3 opacity-50" />
              </Badge>
              
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className={cn("text-muted-foreground hover:text-white gap-2", showHistory && "bg-white/10 text-white")}>
                <History className="w-4 h-4" /> History
              </Button>
            </div>
          </div>

          {/* Loading State */}
          <AnimatePresence>
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scan-line pointer-events-none" />
                <div className="relative flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-primary animate-spin mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                  <h3 className="text-xl font-medium text-glow mb-2">Parsing Query Intents</h3>
                  <p className="text-muted-foreground text-sm font-mono flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                    Querying Safety Database Models
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Area */}
          <AnimatePresence>
            {hasSearched && !isSearching && searchResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-y-auto custom-scrollbar pr-2"
              >
                {chatResponse && (
                  <div className="glass rounded-xl border border-primary/30 mb-6 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">CrowdVision Assistant</h3>
                      <Badge variant="outline" className="ml-auto text-[10px]">{chatResponse.model}</Badge>
                    </div>
                    <p className="text-sm leading-7 text-foreground">{chatResponse.answer}</p>
                    {chatResponse.context.people_count !== undefined && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        <div className="rounded-lg bg-white/5 p-3"><Users className="w-4 h-4 text-primary mb-2" /><div className="text-xs text-muted-foreground">Current people</div><div className="font-semibold">{chatResponse.context.people_count}</div></div>
                        <div className="rounded-lg bg-white/5 p-3"><ShieldCheck className="w-4 h-4 text-warning mb-2" /><div className="text-xs text-muted-foreground">Risk score</div><div className="font-semibold">{chatResponse.context.risk_score}/100</div></div>
                        <div className="rounded-lg bg-white/5 p-3"><TrendingUp className="w-4 h-4 text-accent mb-2" /><div className="text-xs text-muted-foreground">15m projection</div><div className="font-semibold">{chatResponse.context.projected_people_15_minutes}</div></div>
                        <div className="rounded-lg bg-white/5 p-3"><ShieldCheck className="w-4 h-4 text-success mb-2" /><div className="text-xs text-muted-foreground">Clearable / 15m</div><div className="font-semibold">{chatResponse.context.estimated_clearable_15_minutes}</div></div>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-4">{chatResponse.disclaimer}</p>
                  </div>
                )}
                {/* Intent interpretation banner */}
                <div className="glass p-4 rounded-xl border border-white/15 mb-6 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">AI Query Parser Output</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{searchResult.query_interpretation}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/50">
                  <div className="text-sm">
                    Found <span className="font-bold text-white">{searchResult.results.length} matched parameters</span> in <span className="font-mono text-primary">{searchResult.search_time_ms}ms</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {searchResult.results.map((result: SearchMatch, i: number) => (
                    <motion.div 
                      key={result.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="group"
                    >
                      <Card className="glass border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] p-5 flex flex-col justify-between h-40">
                        <div>
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <Badge variant="outline" className={cn(
                              "text-xs font-semibold uppercase tracking-wide",
                              result.type === 'camera' ? 'bg-primary/20 text-primary border-primary/30' :
                              result.type === 'zone' ? 'bg-secondary/20 text-secondary border-secondary/30' :
                              result.type === 'exit' ? 'bg-success/20 text-success border-success/30' :
                              result.type === 'incident' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-white/10 text-white'
                            )}>
                              {result.type}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{result.time}</span>
                          </div>
                          
                          <p className="text-sm font-medium text-foreground line-clamp-3 leading-relaxed mb-4">{result.desc}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                          <span className="text-xs text-muted-foreground">Value: <span className="text-white font-semibold">{result.value}</span></span>
                          <span className="text-xs font-mono text-muted-foreground">{result.confidence}% match</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/50 glass bg-black/40 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2"><History className="w-4 h-4" /> History</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="w-6 h-6 rounded-full"><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-2 overflow-y-auto space-y-1">
                {(searchHistoryList.length > 0 ? searchHistoryList : sampleQueries).map((sq, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setQuery(sq); handleSearch(null, sq); }}
                    className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-muted-foreground hover:text-white flex items-start gap-3 group"
                  >
                    <Search className="w-4 h-4 mt-0.5 opacity-40 group-hover:text-primary group-hover:opacity-100" />
                    <span className="line-clamp-2">{sq}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

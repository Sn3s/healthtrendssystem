import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HealthTrendsLayout } from '@/components/healthtrends/HealthTrendsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Sparkles } from 'lucide-react';

type SearchRow = {
  id: string;
  exam_code: string;
  name: string;
  exam_date: string;
  company_code: string;
  match_rank?: number;
  match_label?: string;
};

const LABEL_DISPLAY: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  code_match: { text: 'Code match', variant: 'default' },
  exact_name: { text: 'Name match', variant: 'default' },
  recommended: { text: 'Recommended', variant: 'secondary' },
  similar: { text: 'Similar', variant: 'outline' },
  match: { text: 'Match', variant: 'outline' },
};

function useDebouncedCallback(fn: (arg: string) => void, ms: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (arg: string) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => fn(arg), ms);
    },
    [fn, ms]
  );
}

export default function PEEncoding({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRoles } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'fuzzy' | 'legacy'>('fuzzy');
  const [companies, setCompanies] = useState<{ company_code: string; name: string }[]>([]);

  const canAccess = userRoles.includes('encoder') || userRoles.includes('admin');

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!embedded && !canAccess) navigate('/');
    }
  }, [user, authLoading, canAccess, navigate, embedded]);

  useEffect(() => {
    if (!user || !canAccess) return;
    (async () => {
      const { data, error } = await supabase.from('ape_companies').select('company_code, name').order('company_code');
      if (!error && data) setCompanies(data);
    })();
  }, [user, canAccess]);

  const runSearch = useCallback(
    async (termRaw: string) => {
      const term = termRaw.trim();
      if (!term) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_ape_employees', {
          p_query: term,
        });

        if (!rpcError && rpcData && Array.isArray(rpcData)) {
          setSearchMode('fuzzy');
          setResults(
            rpcData.map((r: Record<string, unknown>) => ({
              id: String(r.id),
              exam_code: String(r.exam_code),
              name: String(r.name),
              exam_date: String(r.exam_date),
              company_code: String(r.company_code),
              match_rank: typeof r.match_rank === 'number' ? r.match_rank : Number(r.match_rank),
              match_label: r.match_label != null ? String(r.match_label) : undefined,
            }))
          );
          return;
        }

        const codePattern = term.replace(/\s/g, '');
        const { data, error } = await supabase
          .from('ape_employees')
          .select('id, exam_code, name, exam_date, company_code')
          .or(`exam_code.ilike.%${codePattern}%,name.ilike.%${term}%`)
          .order('exam_code', { ascending: true })
          .limit(20);

        if (error) throw error;
        setSearchMode('legacy');
        setResults((data ?? []) as SearchRow[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  const debouncedSearch = useDebouncedCallback(runSearch, 320);

  useEffect(() => {
    debouncedSearch(q);
  }, [q, debouncedSearch]);

  const handleSubmitSearch = () => {
    runSearch(q);
  };

  if (authLoading || !user || !canAccess) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-screen'}`}>Loading…</div>
    );
  }

  const companyLabel = (code: string) => companies.find((c) => c.company_code === code)?.name?.trim() ?? '';

  const body = (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PE Encoding</h2>
          <p className="text-sm text-muted-foreground">
            Search by exam code (e.g. <span className="font-mono">001-005</span> or <span className="font-mono">001005</span>) or
            patient name. Results update as you type; names use fuzzy matching for typos and close spellings.
          </p>
        </div>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Search</CardTitle>
            <CardDescription className="text-xs">
              Open the physical examination form for a match. Stronger matches and suggested names appear first.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex gap-2">
              <Input
                className="h-9 text-sm"
                placeholder="Exam code or name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitSearch()}
                autoComplete="off"
              />
              <Button type="button" size="sm" className="h-9 shrink-0" onClick={handleSubmitSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>

            {searching && q.trim() && <p className="text-xs text-muted-foreground">Searching…</p>}

            {!searching && q.trim() && searchMode === 'fuzzy' && results.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Ranked by relevance (code, exact name, then fuzzy similarity).
              </p>
            )}

            {results.length > 0 && (
              <ul className="rounded-md border divide-y text-sm">
                {results.map((r) => {
                  const label = r.match_label ? LABEL_DISPLAY[r.match_label] : null;
                  const coName = companyLabel(r.company_code);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/80 flex flex-wrap items-start justify-between gap-2"
                        onClick={() => navigate(`/pe/${encodeURIComponent(r.exam_code)}`)}
                      >
                        <div className="min-w-0">
                          <div>
                            <span className="font-mono font-medium">{r.exam_code}</span>
                            <span className="text-muted-foreground"> — {r.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{r.company_code}</span>
                            {coName ? <span> — {coName}</span> : null}
                          </div>
                        </div>
                        <span className="flex items-center gap-2 shrink-0">
                          {label && (
                            <Badge variant={label.variant} className="text-[10px] px-1.5 py-0 font-normal">
                              {label.text}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{r.exam_date}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {q.trim() && !searching && results.length === 0 && (
              <p className="text-xs text-muted-foreground">No matches. Try another code, spelling, or partial name.</p>
            )}
          </CardContent>
        </Card>
      </div>
  );

  if (embedded) return body;

  return <HealthTrendsLayout>{body}</HealthTrendsLayout>;
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchQuery {
  id: string;
  query_text: string | null;
  canton: string | null;
  results_count: number | null;
  created_at: string;
}

export interface SearchAnalytics {
  recentQueries: SearchQuery[];
  topKeywords: { keyword: string; count: number }[];
  topCantons: { canton: string; count: number }[];
  avgResultsCount: number;
}

export const useSearchQueries = (limit: number = 50) => {
  return useQuery({
    queryKey: ['search-queries', limit],
    queryFn: async (): Promise<SearchAnalytics> => {
      const { data, error } = await supabase
        .from('search_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Top keywords
      const keywordMap = new Map<string, number>();
      data?.forEach((query) => {
        if (query.query_text) {
          const words = query.query_text.toLowerCase().split(/\s+/);
          words.forEach((word) => {
            if (word.length > 3) {
              keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
            }
          });
        }
      });

      const topKeywords = Array.from(keywordMap.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top cantons
      const cantonMap = new Map<string, number>();
      data?.forEach((query) => {
        if (query.canton) {
          cantonMap.set(query.canton, (cantonMap.get(query.canton) || 0) + 1);
        }
      });

      const topCantons = Array.from(cantonMap.entries())
        .map(([canton, count]) => ({ canton, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Average results count
      const validResults = data?.filter((q) => q.results_count !== null) || [];
      const avgResultsCount =
        validResults.length > 0
          ? validResults.reduce((sum, q) => sum + (q.results_count || 0), 0) / validResults.length
          : 0;

      return {
        recentQueries: data || [],
        topKeywords,
        topCantons,
        avgResultsCount: Math.round(avgResultsCount * 10) / 10,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

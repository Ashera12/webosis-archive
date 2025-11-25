export function createSupabaseMock(overrides: any = {}) {
  const { tables = {}, rpc = async () => ({ data: null, error: { message: 'rpc not found' } }) } = overrides;

  function tableChain(table: string) {
    const chain: any = {
      select: (..._a: any[]) => chain,
      eq: (_c: string, _v: any) => chain,
      ilike: (_c: string, _v: any) => chain,
      // limit returns the same chain so callers can do .limit(...).single()
      limit: (_n: number) => chain,
      single: async () => {
        const tb = tables[table];
        if (tb && tb.singleData !== undefined) return { data: tb.singleData };
        return { data: null };
      },
    };

    // make the chain awaitable: await chain (or await chain.limit(...)) -> { data: limitData }
    Object.defineProperty(chain, 'then', {
      configurable: true,
      value: function (resolve: any) {
        const tb = tables[table];
        const data = tb && tb.limitData !== undefined ? tb.limitData : [];
        // resolve with an object shaped like supabase-js result
        resolve({ data });
        return Promise.resolve({ data });
      },
    });

    // convenience: support insert(...).select().single()
  chain.insert = (payload: any) => ({ select: () => ({ single: async () => ({ data: { id: 'att-mock', ...payload } }) }) });

    return chain;
  }

  return {
    supabaseAdmin: {
      from: (table: string) => tableChain(table),
      rpc: rpc,
    },
    // Also export safeRpc at module top-level for consumers that import it directly.
    safeRpc: async (name: string, payload?: any) => rpc(name, payload),
  };
}

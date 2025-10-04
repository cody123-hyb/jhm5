// Minimal Worker: serve static assets via env.ASSETS, and /api/todos via KV
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    // API for todo2.html
    if (url.pathname.startsWith('/api/todos')) {
      const kv = env.TODOS;
      if (!kv) return new Response('KV not bound', { status: 500 });
      if (request.method === 'GET' && url.pathname === '/api/todos') {
        const list = await kv.get('list', 'json') || [];
        return Response.json(list);
      }
      if (request.method === 'POST' && url.pathname === '/api/todos') {
        const { text } = await request.json();
        const list = await kv.get('list', 'json') || [];
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        list.push({ id, text });
        await kv.put('list', JSON.stringify(list));
        return Response.json({ ok: true });
      }
      if (request.method === 'DELETE' && url.pathname.startsWith('/api/todos/')) {
        const id = url.pathname.split('/').pop();
        let list = await kv.get('list', 'json') || [];
        list = list.filter((t: any) => t.id !== id);
        await kv.put('list', JSON.stringify(list));
        return Response.json({ ok: true });
      }
      return new Response('Not found', { status: 404 });
    }
    // 靜態資產交給 ASSETS binding 處理
    return env.ASSETS.fetch(request);
  }
};
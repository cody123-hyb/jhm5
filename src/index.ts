// Minimal Worker: serve static assets via env.ASSETS, and /api/todos via KV
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    // API for todo2.html
    if (url.pathname.startsWith('/api/todos')) {
      const kv = env.JHM5_TODOS;
      if (!kv) return new Response('伺服器未綁定 KV 命名空間', { status: 500 });

      try {
        // GET /api/todos -> 列表
        if (request.method === 'GET' && url.pathname === '/api/todos') {
          const list = await kv.get('list', 'json') || [];
          return Response.json(list.map((t: any) => ({ id: t.id, text: t.text })), { status: 200 });
        }

        // POST /api/todos -> 新增
        if (request.method === 'POST' && url.pathname === '/api/todos') {
          const body = await request.json();
          const text = (body && body.text) ? String(body.text).trim() : '';
          if (!text) return Response.json({ error: '內容不得為空' }, { status: 400 });
          const list = await kv.get('list', 'json') || [];
          const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          const item = { id, text };
          list.push(item);
          await kv.put('list', JSON.stringify(list));
          return Response.json({ ok: true, id }, { status: 201 });
        }

        // DELETE /api/todos/:id -> 刪除
        if (request.method === 'DELETE') {
          const parts = url.pathname.split('/').filter(Boolean);
          const id = parts[parts.length - 1];
          if (!id) return Response.json({ error: '缺少 id' }, { status: 400 });
          let list = await kv.get('list', 'json') || [];
          const origLen = list.length;
          list = list.filter((t: any) => t.id !== id);
          if (list.length === origLen) {
            return Response.json({ error: '找不到此待辦事項' }, { status: 404 });
          }
          await kv.put('list', JSON.stringify(list));
          return Response.json({ ok: true }, { status: 200 });
        }

        return new Response('找不到資源', { status: 404 });
      } catch (err: any) {
        return Response.json({ error: '內部伺服器錯誤', detail: String(err) }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
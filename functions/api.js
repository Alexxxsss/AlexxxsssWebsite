// functions/api.js
import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 👈 IMPORT the cors middleware


// The 'Bindings' generic type will give us type-safety for our environment variables.
// 'DB' is the binding we defined in wrangler.toml
const app = new Hono().basePath('/api');
app.use('*', cors());

// Endpoint to get all people for the dropdown
app.get('/all-people', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT name FROM all_people ORDER BY name').all();
    return c.json({ success: true, people: results });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Endpoint to draw a person
app.post('/draw', async (c) => {
  try {
    const { drawerName } = await c.req.json();

    if (!drawerName) {
      return c.json({ success: false, error: 'drawerName is required' }, 400);
    }

    // Find a random person from people_left who is NOT the person drawing.
    // This prevents someone from drawing their own name.
    const stmt = c.env.DB.prepare(
      'SELECT name FROM people_left WHERE name != ? ORDER BY RANDOM() LIMIT 1'
    );
    const { results } = await stmt.bind(drawerName).all();

    if (results.length === 0) {
      return c.json({ success: false, error: 'No one is left to draw!' }, 404);
    }

    const drawnPerson = results[0];

    // IMPORTANT: Remove the drawn person from the pool
    const deleteStmt = c.env.DB.prepare('DELETE FROM people_left WHERE name = ?');
    await deleteStmt.bind(drawnPerson.name).run();

    return c.json({ success: true, drawnPerson: drawnPerson.name });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;
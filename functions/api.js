// functions/api.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';

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

    // 1. Check if this person has already drawn someone
    const existingEntry = await c.env.DB.prepare(
      'SELECT persongot FROM person_got WHERE person = ?'
    ).bind(drawerName).first();

    if (existingEntry) {
      return c.json({
        success: true,
        alreadyDrawn: true,
        drawnPerson: existingEntry.persongot,
        message: `${drawerName} has already drawn!`
      });
    }

    // 2. Find a random person from people_left who is NOT the person drawing
    const stmt = c.env.DB.prepare(
      'SELECT name FROM people_left WHERE name != ? ORDER BY RANDOM() LIMIT 1'
    );
    const { results } = await stmt.bind(drawerName).all();

    if (results.length === 0) {
      return c.json({ success: false, error: 'No one is left to draw!' }, 404);
    }

    const drawnPerson = results[0].name;

    // 3. Run DELETE and INSERT together inside a transaction/batch
    await c.env.DB.batch([
      // Remove drawn person from the pool
      c.env.DB.prepare('DELETE FROM people_left WHERE name = ?').bind(drawnPerson),
      // Save the match in person_got
      c.env.DB.prepare('INSERT INTO person_got (person, persongot) VALUES (?, ?)').bind(drawerName, drawnPerson)
    ]);

    return c.json({ success: true, drawnPerson: drawnPerson });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// (Optional) Endpoint to view all pairings
app.get('/pairs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT person, persongot FROM person_got').all();
    return c.json({ success: true, pairs: results });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store contexts with timestamps
const contexts = [
  {
    id: 1,
    title: 'Context 1',
    content: `This is the first context

    This is the first context

    This is the first context

    This is the first context`,
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Context 2',
    content: `This is the first context

    This is the first context

    This is the first context

    This is the first context

    This is the second context

    This is the second context

    This is the second context

    This is the second context`,
    timestamp: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Context 3',
    content: `This is the first context
    Foobar
    This is the first context

    This is the first context

    This is the first context

    This is the third context

    This is the third context

    This is the third context

    This is the third context
    
    This is the second context

    This is the second context

    This is the second context

    This is the second context`,
    timestamp: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Context 4',
    content: `This is the fourth context
    Foobar
    This is the fourth context

    This is the fourth context

    This is the fourth context`,
    timestamp: new Date().toISOString()
  },
];
let clients = [];

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial data
  res.write(`data: ${JSON.stringify(contexts)}\n\n`);

  // Add client to list
  clients.push(res);

  // Remove client when connection closes
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// POST endpoint to receive contexts
app.post('/v1/context', (req, res) => {
  const { context, title } = req.body;
  
  if (!context || typeof context !== 'string') {
    return res.status(400).json({ error: 'Context must be a string' });
  }

  const newContext = {
    id: Date.now().toString(),
    content: context,
    title: title || `Context ${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  contexts.push(newContext);

  // Send update to all connected clients
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(contexts)}\n\n`);
  });

  res.json({ 
    success: true, 
    id: newContext.id,
    title: newContext.title,
    timestamp: newContext.timestamp 
  });
});

// GET endpoint to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET endpoint to retrieve all contexts
app.get('/v1/contexts', (req, res) => {
  res.json(contexts);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

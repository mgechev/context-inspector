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
const contexts = [];
const clients = [];

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify(contexts)}\n\n`);

  clients.push(res);

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
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

// DELETE endpoint to clear all contexts
app.delete('/v1/contexts', (req, res) => {
  contexts.length = 0;
  
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(contexts)}\n\n`);
  });

  res.json({ success: true, message: 'All contexts cleared' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

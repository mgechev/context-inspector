# Context Inspector

A real-time web application for receiving, storing, and comparing context strings with a modern diff interface.

## Features

- **HTTP POST API**: Receive context strings via POST requests to `/v1/context`
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push new contexts to connected clients
- **Modern UI**: Split-panel interface with contexts list on the left and diff comparison on the right
- **Git-like Diffing**: Uses the `diff` library for accurate line-by-line comparison
- **Title Support**: Optional title field for better context organization
- **Timestamp Tracking**: Each context is automatically timestamped when received

## API Endpoints

### POST `/v1/context`

Receive a new context string.

**Request Body:**

```json
{
  "context": "Your context string here",
  "title": "Optional title for the context"
}
```

**Response:**

```json
{
  "success": true,
  "id": "1754679343625",
  "timestamp": "2025-08-08T18:55:43.625Z"
}
```

### GET `/v1/contexts`

Retrieve all stored contexts.

**Response:**

```json
[
  {
    "id": "1754679343625",
    "content": "Your context string here",
    "title": "Test Title",
    "timestamp": "2025-08-08T18:55:43.625Z"
  }
]
```

### GET `/events`

Server-Sent Events endpoint for real-time updates.

### GET `/`

Serves the main web interface.

## Usage

1. **Start the server:**

   ```bash
   npm start
   ```

2. **Send contexts via API:**

   ```bash
   curl -X POST http://localhost:3000/v1/context \
     -H "Content-Type: application/json" \
     -d '{"context": "Your context here", "title": "Optional title"}'
   ```

   Alternatively, in your JavaScript you can use `fetch`:

   ```js
   fetch('http://localhost:3000/v1/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context: summary})
    });
   ```

3. **Open the web interface:**
   Navigate to `http://localhost:3000` in your browser

4. **Compare contexts:**
   - Select two contexts from the left panel
   - View the diff comparison on the right panel
   - The diff shows added lines in green, removed lines in red, and unchanged lines in gray

## License

MIT

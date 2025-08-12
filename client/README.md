# Context Inspector

A real-time web application for receiving, storing, and comparing context strings with a modern diff interface.

**Works with contexts up to 25MBs**.

## Demo

![Context Inspector Demo](demo.gif)

## Features

- **HTTP POST API**: Receive context strings via POST requests to `/context`
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push new contexts to connected clients
- **Modern UI**: Split-panel interface with contexts list on the left and diff comparison on the right
- **Git-like Diffing**: Uses the `diff` library for accurate line-by-line comparison
- **Title Support**: Optional title field for better context organization
- **Timestamp Tracking**: Each context is automatically timestamped when received

## Usage

1. **Start the server:**

   ```bash
   git clone git@github.com:mgechev/context-inspector && cd context-inspector && npm i
   npm start
   ```

2. [Optional] **Install the logger:**

    ```bash
    npm i context-inspector --save-dev
    ```

3. **Send contexts via API:**

    If you're using the logger log events with:

    ```js
    import { createContextLogger } from 'context-inspector';

    const logger = createContextLogger();
    logger(context);
    ```

    Optionally you can specify a custom URL and title:

    ```js
    import { createContextLogger } from 'context-inspector';

    const logger = createContextLogger('https://example.com/context');
    logger(context, title);
    ```

    Alternatively, you can send plain HTTP requests:

    ```bash
    curl -X POST http://localhost:4242/context \
      -H "Content-Type: application/json" \
      -d '{"context": "Your context here", "title": "Optional title"}'
    ```

    Alternatively, in your JavaScript you can use `fetch`:

    ```js
    fetch('http://localhost:4242/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: summary})
      });
    ```

4. **Open the web interface:**
   Navigate to `http://localhost:4242` in your browser

5. **Compare contexts:**
   - Select two contexts from the left panel
   - View the diff comparison on the right panel
   - The diff shows added lines in green, removed lines in red, and unchanged lines in gray

## API Endpoints

### POST `/context`

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

### GET `/contexts`

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

## License

MIT

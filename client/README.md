# context-inspector

A client library for sending context data to a [context inspector](https://github.com/mgechev/context-inspector) server for debugging and comparison.

## Installation

```bash
npm install context-inspector
```

## Usage

### Basic Usage

```javascript
import { createContextLogger } from 'context-inspector';

const logger = createContextLogger();

// Send a simple string context
await logger('Hello, world!', 'My first context');

// Send an object context (will be JSON.stringify'd)
await logger({ data: 'some data', timestamp: Date.now() }, 'Object context');
```

### Custom Server URL

```javascript
import { createContextLogger } from 'context-inspector';

const logger = createContextLogger('http://my-server:4242/context');
await logger('Custom context', 'From custom server');
```

### Error Handling

```javascript
import { createContextLogger } from 'context-inspector';

const logger = createContextLogger();

try {
  await logger('Important context', 'Error handling example');
} catch (error) {
  console.error('Failed to send context:', error);
}
```

## API Reference

### `createContextLogger(url?)`

Creates a context logger function.

**Parameters:**

- `url` (string, optional): The URL of the context inspector server. Defaults to `http://localhost:4242/context`.

**Returns:**

- A function that accepts `context` and `title` parameters and returns a Promise.

### Logger Function

The returned logger function has the following signature:

```javascript
async function(context, title?)
```

**Parameters:**

- `context` (any): The context data to send. Can be a string, object, or any JSON-serializable value.
- `title` (string, optional): An optional title for the context.

**Returns:**

- Promise that resolves to the server response.

## Server Setup

To use this client, you need to run a context inspector server. See the [main repository](https://github.com/mgechev/context-inspector) for server setup instructions.

## License

MIT

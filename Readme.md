# Ninja Reverse Proxy

A custom reverse proxy server built with Node.js that implements core NGINX-like functionalities. This server handles HTTP requests, routes them to appropriate upstream servers, and performs load balancing using a cluster of worker processes.

## Features

- **Reverse Proxy**: Forward client requests to appropriate upstream servers
- **Load Balancing**: Distribute requests among multiple worker processes
- **Configurable Rules**: Define routing rules and upstream servers in a YAML configuration file
- **Error Handling**: Return descriptive error responses for invalid or missing configurations
- **Scalable Design**: Uses clustering to spawn worker processes equivalent to available CPU cores
- **Example Upstream**: Uses [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com) as an example upstream
- **Functional Routes**: Routes `/`, `/posts`, `/comments`, `/todos`, and `/posts/1` to `jsonplaceholder.typicode.com`

## Installation

### Prerequisites

- Node.js (>=16.0.0)
- npm (>=7.0.0)
- TypeScript (installed globally)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo url>
   cd ninja-reverse-proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile TypeScript files:
   ```bash
   npm run dev
   ```

## Configuration

### config.yaml Structure

```yaml
server:
  listen: 8080                     # Port on which the server listens
  workers: 4                       # Number of worker processes
  upstreams:
    - id: upstream1
      url: jsonplaceholder.typicode.com
    - id: upstream2
      url: localhost:8001
  headers:
    - key: x-forward-for
      value: '$ip'
    - key: Authorization
      value: 'Bearer xyz'
  rules:
    - path: /
      upstreams:
        - upstream1
```

- **listen**: Port number for the server
- **workers**: Number of worker processes (defaults to CPU core count)
- **upstreams**: Define backend servers to which requests are proxied
- **headers**: Custom headers added to proxied requests
- **rules**: Routing rules based on URL paths

## Usage

1. Start the server with configuration:
   ```bash
   npm start -- --config config.yaml
   ```

2. Test with HTTP requests:
   ```bash
   curl http://localhost:8080/
   curl http://localhost:8080/posts
   curl http://localhost:8080/comments
   curl http://localhost:8080/todos
   curl http://localhost:8080/posts/1
   ```

## Architecture

### Master and Worker Nodes

#### Master Node
- Creates and manages worker processes using cluster
- Distributes incoming HTTP requests to workers
- Uses a pool of workers to handle requests and ensures scalability

#### Worker Node
- Parses the configuration using Zod schemas
- Routes requests to appropriate upstream servers based on defined rules
- Handles error scenarios when no matching rule or upstream is found

### Routing Requests
- Matches incoming requests against rules defined in config.yaml
- Forwards requests to `/`, `/posts`, `/comments`, `/todos`, and `/posts/1` to `jsonplaceholder.typicode.com`

### Error Handling
- **404 - Rule Not Found**: When no matching rule exists for a request
- **500 - Upstream Not Found**: When the specified upstream server is not defined

### Scalability
- Utilizes Node.js's cluster module for worker processes
- Number of workers defaults to CPU core count for optimal resource utilization

## Testing

After starting the server, test using curl or API testing tools like Postman:

```bash
curl http://localhost:8080/posts
```

Expected response: JSON data from jsonplaceholder.typicode.com

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests for improvements or bug fixes.

## Contact

For queries or feedback, contact [ayushneo45@gmail.com]
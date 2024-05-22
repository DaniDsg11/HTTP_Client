import net from 'net';
import { URL } from 'url';
import readline from 'readline';

interface RequestOptions {
  hostname: string;
  port?: number;
  path: string;
  method: string;
  headers?: { [key: string]: string };
  data?: string;
}

function httpRequest(options: RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, `http://${options.hostname}`);
    const port = options.port || 80;

    const client = net.createConnection({ host: options.hostname, port: port }, () => {
      let requestData = `${options.method} ${url.pathname + url.search} HTTP/1.1\r\n`;
      requestData += `Host: ${options.hostname}\r\n`;

      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          requestData += `${key}: ${value}\r\n`;
        }
      }

      if (options.data) {
        requestData += `Content-Length: ${Buffer.byteLength(options.data)}\r\n`;
      }

      requestData += `\r\n`;

      if (options.data) {
        requestData += options.data;
      }

      client.write(requestData);
      console.log('Request:', requestData);
    });

    client.setEncoding('utf-8');

    let response = '';
    client.on('data', (chunk) => {
      response += chunk;
    });

    client.on('end', () => {
      resolve(response);
    });

    client.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
  }

  while (true) {
    try {
      const hostname = await askQuestion('Enter hostname: ');
      const port = parseInt(await askQuestion('Enter port (default 80): '), 10) || 80;
      const path = await askQuestion('Enter path: ');
      const method = await askQuestion('Enter method (GET, POST, etc.): ');

      const headers: { [key: string]: string } = {};
      while (true) {
        const addHeader = await askQuestion('Do you want to add a header? (y/n): ');
        if (addHeader.toLowerCase() !== 'y') break;

        const headerName = await askQuestion('Enter header name: ');
        const headerValue = await askQuestion('Enter header value: ');
        headers[headerName] = headerValue;
      }

      const data = await askQuestion('Enter data (for POST/PUT requests): ');

      const response = await httpRequest({
        hostname,
        port,
        path,
        method,
        headers,
        data: data ? data : undefined,
      });

      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }

    const again = await askQuestion('Do you want to make another request? (y/n): ');
    if (again.toLowerCase() !== 'y') {
      rl.close();
      break;
    }
  }
}

main();

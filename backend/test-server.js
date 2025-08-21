const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is working!');
});

server.listen(5000, () => {
  console.log('✅ Test server is running on port 5000');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
}); 
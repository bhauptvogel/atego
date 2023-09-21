const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files for all routes that don't have custom handlers
app.use(express.static('public'));

// Custom handler for a specific route
app.get('/api/highscores', (req, res) => {
  // Return highscores
  res.json({ highscores: [100, 90, 80] });
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
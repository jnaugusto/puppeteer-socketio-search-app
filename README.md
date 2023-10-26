# Puppeteer and Socket.IO Search App

This Node.js application allows you to accept search requests through Socket.IO, automatically perform Google searches, and find the correct URL that matches the hashed URL. It leverages Puppeteer for web scraping and Socket.IO for real-time communication.

## Dependencies

To run this application, you'll need the following dependencies:

- [Puppeteer](https://github.com/puppeteer/puppeteer): A Node library that provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol. Puppeteer is used for web scraping and automated browsing.

- [Socket.IO](https://github.com/socketio/socket.io): A real-time engine that enables real-time, bidirectional communication between the server and clients using WebSockets. Socket.IO is used for accepting search requests and providing search results in real time.

- [MD5](https://github.com/pvorb/node-md5): A widely-used JavaScript library for generating MD5 hashes, which are used in this application to match URLs.

## Getting Started

To set up and run the application, follow these steps:

1. Clone the repository to your local machine.

   ```bash
   git clone https://github.com/your-username/your-repo.git

## Usage
To use the application, connect to the server through a Socket.IO client and send search requests. The application will automatically perform Google searches for these requests and provide the matching URLs in real time.

## Example Code

Here's an example of how to connect to the Socket.IO server and send a search request in JavaScript:

```javascript
const socket = io('http://localhost:yourPort'); // Connect to the Socket.IO server.

socket.emit('searchRequest', { query: 'Your Search Query' }); // Send a search request.

socket.on('searchResult', (result) => {
  // Handle the search result.
  console.log('Matching URL:', result.url);
});

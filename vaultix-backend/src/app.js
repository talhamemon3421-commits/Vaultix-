//Entry point for the Express application. Sets up middleware, routes, and health check endpoint.
const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', routes);

module.exports = app;
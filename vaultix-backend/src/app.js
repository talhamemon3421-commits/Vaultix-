//Entry point for the Express application. Sets up middleware, routes, and health check endpoint.
const express = require('express');
const routes = require('./routes');
const dbErrorHandler = require('./middleware/dbErrorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', routes);

// DB error-handling middleware (must be AFTER routes)
app.use(dbErrorHandler);

module.exports = app;
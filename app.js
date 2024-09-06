// ## With sessions
const express = require('express');
const session = require('express-session');
const appInsights = require('applicationinsights');
const os = require('os');
const dns = require('dns');

// Get the server-host name
const ServerHostName = os.hostname();

// Initialize Application Insights
appInsights.setup('<app-insights-connection-string>>')
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoDependencyCorrelation(true)
    .start();

const app = express();
const port = process.env.PORT || 8011;

// Define App Insights client
const client = appInsights.defaultClient;

// ## Middlewares...
// Session middleware configuration
app.use(session({
    secret: ServerHostName, // Using client-host name as the secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to set the authenticated user context
app.use((req, res, next) => {
  let ipAddress = req.ip; //req.connection.remoteAddress
  if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.split(':').pop();
  }
  const userId = `User-${ipAddress}` //ServerHostName //req.sessionID; // Example: using session ID as user ID
  client.context.tags[client.context.keys.userId] = userId;
  client.trackEvent({ name: "in_middleware", properties: { event: "setting user", method: req.method, url: req.url, sessionID: req.sessionID } });
  next();
});

// Middleware to track custom events in Insights
app.use((req, res, next) => {
    //const client = appInsights.defaultClient;
    client.trackEvent({ name: "in_middleware", properties: { event: "testing custom events", method: req.method, url: req.url, sessionID: req.sessionID } });
    next();
});

// Sample route
app.get('/', (req, res) => {
    //const client = appInsights.defaultClient;
    client.trackEvent({ name: "endpoint_route", properties: { event: "home page", path: req.url, method: req.method,  sessionID: req.sessionID, userIP: req.connection.remoteAddress } });
    res.send('Hello, Application Insights!');
});

// New route /me
app.get('/me', (req, res) => {
    //const client = appInsights.defaultClient;
    client.trackEvent({ name: "endpoint_route", properties: { event: "user details", path: req.url, method: req.method,  sessionID: req.sessionID, userIP: req.connection.remoteAddress } });
    res.send(`Hey, ${req.connection.remoteAddress}. Welcome`);
});

// Error handling
app.use((err, req, res, next) => {
    //const client = appInsights.defaultClient;
    client.trackEvent({ name: "error_occurred", properties: { errorMessage: err.message, stack: err.stack } });
    client.trackException({ exception: err });
    res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
    const client = appInsights.defaultClient;
    client.trackEvent({ name: "server_related", properties: { event: "Starting Server", serverHost: ServerHostName } });
    console.log(`Server is running on port ${port}`);
});

// // APP.JS
// const express = require('express');
// const appInsights = require('applicationinsights');

// // Initialize Application Insights #appInsights.setup('<connectionstring>')
// appInsights.setup('InstrumentationKey=dd7f4c65-47e9-471d-9b7c-3ae899d7d915;IngestionEndpoint=https://eastus-3.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=06eb695a-61e8-44d4-a5e2-fdb055f920e4')
//     .setAutoCollectRequests(true)
//     .setAutoCollectPerformance(true)
//     .setAutoCollectExceptions(true)
//     .setAutoCollectDependencies(true)
//     .setAutoDependencyCorrelation(true)
//     .start();

// const app = express();
// const port = process.env.PORT || 8011;

// // Middleware to track custom events in Insights
// app.use((req, res, next) => {
//     const client = appInsights.defaultClient;
//     client.trackEvent({ name: "custom_event", properties: { method: req.method, url: req.url } });
//     next();
// });

// // Sample route
// app.get('/', (req, res) => {
//     res.send('Hello, Application Insights!');
// });

// // Error handling
// app.use((err, req, res, next) => {
//     const client = appInsights.defaultClient;
//     client.trackException({ exception: err });
//     res.status(500).send('Something went wrong!');
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });



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

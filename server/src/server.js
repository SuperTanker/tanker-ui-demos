// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const bodyParser = require('body-parser');
const express = require('express');
const emailValidator = require('email-validator');
const fs = require('fs');
const morgan = require('morgan');
const uuid = require('uuid/v4');
const userToken = require('@tanker/user-token');
const debugMiddleware = require('debug-error-middleware').express;
const sodium = require('libsodium-wrappers-sumo');

const { authMiddlewareBuilder, hashPassword, verifyPassword } = require('./middlewares/auth');
const corsMiddleware = require('./middlewares/cors');

const log = require('./log');
const home = require('./home');
const Storage = require('./storage');

// Build express application
const app = express();

// Setup server
let serverConfig;
let clientConfig;

const makeClientConfig = (fullConfig) => {
  // WARNING: the Trustchain private key MUST never be sent to the client
  const { dataPath, trustchainPrivateKey, ...config } = fullConfig;
  return config;
};

const setup = async (config) => {
  serverConfig = config;
  clientConfig = makeClientConfig(config);

  const { dataPath, trustchainId } = config;
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  app.storage = new Storage(dataPath, trustchainId);

  // Libsodium loads asynchronously (Wasm module)
  await sodium.ready;

  return app;
};

const sanitizeUser = (user) => {
  const { hashed_password, token, ...safeUser } = user; // eslint-disable-line camelcase
  return safeUser;
};

const reviveUsers = ids => ids.map(id => sanitizeUser(app.storage.get(id)));

app.use(corsMiddleware); // enable CORS
app.use(bodyParser.text());
app.use(bodyParser.json());
app.options('*', corsMiddleware); // enable pre-flight CORS requests

// Show helpful error messages. In a production server,
// remove this as it could leak sensitive information.
app.use(debugMiddleware());


// Add routes for the server's home page (readmes...)
app.use(home);


// Add middlewares to log requests on routes defined below
app.use(morgan('dev'));
app.use((req, res, next) => {
  const { email } = req.query;
  const maybeFrom = email ? ` from ${email}:` : ':';
  log(`New ${req.path} request${maybeFrom}`);
  next();
});

// Add config route (non authenticated)
app.get('/config', (req, res) => {
  log('Serve the client Tanker config', 1);
  res.set('Content-Type', 'application/json');
  res.status(200).send(clientConfig);
});

// Add signup route (non authenticated)
app.get('/signup', (req, res) => {
  const { email, password } = req.query;
  const { trustchainId, trustchainPrivateKey } = serverConfig;

  if (!email || !emailValidator.validate(email)) {
    res.status(400).send('Invalid email address');
    return;
  }

  if (!password) {
    res.status(400).send('Missing password');
    return;
  }

  const existingUserId = app.storage.emailToId(email);

  if (existingUserId) {
    log(`Email ${email} already taken`, 1);
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  log('Generate the user id', 1);
  const userId = uuid();

  log('Hash the password', 1);
  const hashedPassword = hashPassword(password);

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(
    trustchainId,
    trustchainPrivateKey,
    userId,
  );

  log('Save the user to storage', 1);
  const user = {
    id: userId, email, hashed_password: hashedPassword, token,
  };
  app.storage.save(user);

  log('Return the user id and token', 1);
  res.set('Content-Type', 'application/json');
  res.status(201).json({ id: userId, token });
});


// Add authentication middleware for all routes below
//   - check valid "email" and "password" query params
//   - set res.locals.user for the request handlers
const authMiddleware = authMiddlewareBuilder(app);
app.use(authMiddleware);


// Add authenticated routes
app.get('/login', (req, res) => {
  log('Retrieve token from storage', 1);
  const { user } = res.locals;

  log('Serve the token', 1);
  res.set('Content-Type', 'application/json');
  res.json({ id: user.id, token: user.token });
});

app.get('/me', (req, res) => {
  // res.locals.user is set by the auth middleware
  const me = res.locals.user;
  const safeMe = sanitizeUser(me);
  safeMe.accessibleNotes = reviveUsers(safeMe.accessibleNotes || []);
  safeMe.noteRecipients = reviveUsers(safeMe.noteRecipients || []);
  res.json(safeMe);
});

app.put('/me/password', (req, res) => {
  const { user } = res.locals;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    log('Invalid arguments', 1);
    res.sendStatus(400);
    return;
  }

  log('Verify old password', 1);
  const passwordOk = verifyPassword(user, oldPassword);
  if (!passwordOk) {
    log('Wrong old password', 1);
    res.sendStatus(400, 1);
    return;
  }

  log('Change password', 1);
  user.hashed_password = hashPassword(newPassword);
  app.storage.save(user);
  res.sendStatus(200);
});

app.put('/me/email', async (req, res) => {
  const { user } = res.locals;
  const { email } = req.body;

  if (!email || !emailValidator.validate(email)) {
    log('Invalid new email address', 1);
    res.sendStatus(400);
    return;
  }

  const otherUser = app.storage.emailToId(email);
  if (otherUser) {
    log(`Email ${email} already taken`, 1);
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  log('Change email', 1);
  user.email = email;
  app.storage.save(user);
  res.sendStatus(200);
});

app.put('/data', (req, res) => {
  const { user } = res.locals;

  log('Save data on storage', 1);
  try {
    user.data = req.body;
    app.storage.save(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.delete('/data', (req, res) => {
  const { user } = res.locals;

  log('Clear user data', 1);
  app.storage.clearData(user.id);
  res.sendStatus(200);
});

app.get('/data/:userId', (req, res) => {
  const { userId } = req.params;
  log('Retrieve data from storage', 1);

  if (!app.storage.exists(userId)) {
    log(`User ${userId} does not exist`);
    res.sendStatus(404);
    return;
  }
  const user = app.storage.get(userId);

  if (!user.data) {
    log('User has no stored data', 1);
    res.sendStatus(404);
    return;
  }

  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});


app.get('/users', (req, res) => {
  const allUsers = app.storage.getAll();
  const safeUsers = allUsers.map(sanitizeUser);

  res.set('Content-Type', 'application/json');
  res.json(safeUsers);
});

// Register a new share
app.post('/share', (req, res) => {
  const { from, to } = req.body;
  // ensure only the current user can share their note with others
  if (from !== res.locals.user.id) {
    res.sendStatus(401);
    return;
  }

  app.storage.share(from, to);
  res.sendStatus('201');
});

// Return nice 500 message when an exception is thrown
const errorHandler = (err, req, res, next) => { // eslint-disable-line  no-unused-vars
  res.status(500);
  res.json({ error: err.message });
  // Note: we don't call next() because we don't want the request to continue
};
app.use(errorHandler);


const listen = port => app.listen(port);

module.exports = {
  listen,
  setup,
};

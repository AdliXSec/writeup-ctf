const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const path = require('path');

const PORT = process.env.PORT || 8170;
const FLAG = process.env.FLAG || "LEEXY{d21683da-5051-46d1-bc2f-6055320421fe}";

// Initialize in-memory SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  // Create tables for the CTF Challenge
  db.run(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    created_by TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    secret TEXT NOT NULL
  )`);

  // Create table for Portal Authentication (so players don't pollute the target table)
  db.run(`CREATE TABLE portal_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);

  // Insert dummy audit logs
  db.run(`INSERT INTO audit_log (event, created_by) VALUES ('directory service deployed', 'admin')`);
  db.run(`INSERT INTO audit_log (event, created_by) VALUES ('public GraphQL endpoint enabled', 'mira')`);
  db.run(`INSERT INTO audit_log (event, created_by) VALUES ('search resolver patched quickly before launch', 'rakan')`);

  // Insert vulnerable directory users
  const stmt = db.prepare(`INSERT INTO users (username, display_name, role, bio, secret) VALUES (?, ?, ?, ?, ?)`);
  stmt.run('mira', 'Mira Stone', 'analyst', 'Maintains onboarding notes for new operators.', 'debug token rotated last quarter');
  stmt.run('rakan', 'Rakan Vale', 'engineer', 'Keeps legacy services alive during migrations.', 'favorite report: weekly-metrics');
  stmt.run('admin', 'Directory Admin', 'admin', 'Private administrative account.', FLAG); // Admin has the flag!
  stmt.run('guest', 'Guest User', 'viewer', 'Temporary guest access.', 'no secrets here');
  stmt.finalize();
});

// GraphQL Schema (Notice: `secret` is explicitly missing from User type!)
const schema = buildSchema(`
  type User {
    id: ID
    username: String
    displayName: String
    role: String
    bio: String
  }

  type Mutation {
    register(username: String!, password: String!): String
    login(username: String!, password: String!): String
  }

  type Query {
    users(search: String): [User]
    about(role: String, username: String, id: String): String
  }
`);

// GraphQL Resolvers
const root = {
  register: ({username, password}) => {
    return new Promise((resolve, reject) => {
      if (!username || !password) return resolve("Missing fields");
      db.run(`INSERT INTO portal_users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) resolve("Username exists");
        else resolve("Success");
      });
    });
  },
  login: ({username, password}, req) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM portal_users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (row) {
          req.session.userId = row.id;
          resolve("Success");
        } else {
          resolve("Invalid credentials");
        }
      });
    });
  },
  about: (args, req) => {
    if (!req.session.userId) throw new Error("Unauthorized: Please login first.");
    return "Shadow Directory exposes a small public employee search API.";
  },
  users: (args, req) => {
    return new Promise((resolve, reject) => {
      if (!req.session.userId) {
        return reject(new Error("Unauthorized: Please login first."));
      }

      // VULNERABILITY: Raw SQL concatenation leading to SQL Injection!
      const search = args.search !== undefined ? args.search : '';
      
      const query = `SELECT id, username, display_name as displayName, role, bio FROM users WHERE username LIKE '%${search}%' OR display_name LIKE '%${search}%'`;
      
      db.all(query, (err, rows) => {
        if (err) {
          // Send error to client so they can see database errors (e.g. SQLite syntax error)
          reject(new Error(err.message));
        } else {
          resolve(rows);
        }
      });
    });
  }
};

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'silent-oracle-secret-key-super-secure',
    resave: false,
    saveUninitialized: false
}));

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ========================
// Authentication Routes
// ========================
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ========================
// Protected Routes
// ========================

// Serve static frontend UI
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// GraphQL Endpoint (Public, auth checked inside resolvers)
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: false // No GUI, they have to use our frontend or intercept via Burp
}));

app.listen(PORT, () => {
  console.log(`Silent Oracle server listening on port ${PORT}`);
});

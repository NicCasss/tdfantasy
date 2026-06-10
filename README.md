# FantaBasket MERN Starter

Struttura base MERN con auth sicura:

- Backend Node.js + Express + MongoDB
- Frontend React + Vite
- Login/register/logout
- JWT in cookie httpOnly
- Reset password con token hashato nel database
- Rate limit, Helmet, CORS whitelist, anti NoSQL injection

## Avvio rapido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Controlla:

```bash
http://localhost:8000/health
```

### 2. Frontend

Apri un altro terminale:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Apri:

```bash
http://localhost:5173
```

## MongoDB

In locale puoi usare:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/fantabasket
```

Oppure MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://utente:password@cluster.mongodb.net/fantabasket
```

## Password

La password deve avere almeno:

- 8 caratteri
- una maiuscola
- una minuscola
- un numero

## Produzione

Nel backend imposta:

```env
NODE_ENV=production
FRONTEND_URL=https://tuodominio.it
CORS_ORIGIN=https://tuodominio.it
ACCESS_TOKEN_SECRET=una_stringa_random_molto_lunga
```

Con `NODE_ENV=production`, il cookie diventa `secure: true` e `sameSite: none`.

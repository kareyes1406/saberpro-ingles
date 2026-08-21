/**
 * app.js
 * Archivo principal de la plataforma gamificada SaberPro Inglés
 * Patrón MVC — Express + EJS + Azure SQL Server
 * 
 * Arquitectura de vistas: Sistema de partials (header/footer)
 * Las vistas de estudiante incluyen partials/header.ejs y partials/footer.ejs
 * Las vistas admin incluyen partials/admin-header.ejs y partials/admin-footer.ejs
 * Las vistas de auth (login/register) son páginas standalone con su propio HTML
 */
require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

// Importar rutas
const authRoutes    = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const gameRoutes    = require('./routes/gameRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const examRoutes    = require('./routes/examRoutes');

// Conexión a Azure SQL Server
const { testConnection, executeQuery } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Motor de Vistas ──────────────────────────────────────────────────
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ── Middleware de Seguridad ──────────────────────────────────────────
// Redirigir a HTTPS en producción
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Helmet con CSP relajada, HSTS y mitigaciones adicionales
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://p.typekit.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://use.typekit.net"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' }, // X-Frame-Options
    hidePoweredBy: true
}));

// Restringir subida de archivos (bloquear multipart/form-data ya que no se usa)
app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        return res.status(415).send('Unsupported Media Type');
    }
    next();
});

// ── Middleware General ───────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

// ── Sesiones ─────────────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'saberpro_session_secret_dev',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // No usar el default connect.sid
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// ── Flash Messages ───────────────────────────────────────────────────
app.use(flash());

// ── Middleware de Autenticación ──────────────────────────────────────
/**
 * requireAuth - Verifica que el usuario tenga sesión activa
 * Se aplica a rutas /student y /game
 */
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'Debes iniciar sesión para acceder a esta sección.');
    res.redirect('/auth/login');
};

/**
 * requireAdmin - Verifica que el usuario sea administrador
 * Se aplica a rutas /admin
 */
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Acceso restringido a administradores.');
    res.redirect('/auth/login');
};

// ── Variables Globales para Vistas ───────────────────────────────────
// Estas variables están disponibles en TODAS las vistas EJS
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    next();
});

// ── Rutas ────────────────────────────────────────────────────────────
// Ruta raíz redirige al login
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        // Si ya tiene sesión, redirigir según rol
        if (req.session.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        return res.redirect('/student');
    }
    res.redirect('/auth/login');
});

// Montar rutas por módulo
app.use('/auth', authRoutes);
app.use('/student', requireAuth, studentRoutes);
app.use('/game', requireAuth, gameRoutes);
app.use('/admin', requireAdmin, adminRoutes);
app.use('/exam', requireAuth, examRoutes);

// ── 404 — Página No Encontrada ──────────────────────────────────────
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><title>404 | SaberPro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>body{background:#0a0e1a;color:#fff;font-family:Inter,sans-serif;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100vh;gap:16px;margin:0;} a{color:#7c3aed;text-decoration:none;font-weight:600;}
        a:hover{text-decoration:underline;} h1{font-size:6rem;margin:0;
        background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;
        -webkit-text-fill-color:transparent;} p{color:#94a3b8;}</style></head>
        <body><h1>404</h1><p>Página no encontrada</p>
        <a href="/auth/login">← Volver al inicio</a></body></html>
    `);
});

// ── 500 — Error del Servidor ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR 500]', err.stack);
    res.status(500).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><title>500 | SaberPro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>body{background:#0a0e1a;color:#fff;font-family:Inter,sans-serif;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100vh;gap:16px;margin:0;} a{color:#7c3aed;text-decoration:none;font-weight:600;}
        h1{font-size:6rem;margin:0;color:#ef4444;} p{color:#94a3b8;}</style></head>
        <body><h1>500</h1><p>Error interno del servidor</p>
        <a href="/auth/login">← Volver al inicio</a></body></html>
    `);
});

// ── Iniciar Servidor ─────────────────────────────────────────────────
// El servidor arranca siempre, incluso si la BD no responde al inicio
testConnection()
    .then(async () => {
        console.log('✅ Connected to Azure SQL Server successfully.');
        try {
            await executeQuery(`
                UPDATE UserGamification 
                SET 
                    TotalXP = ISNULL(TotalXP, 0),
                    Level = ISNULL(Level, 1),
                    TotalCoins = ISNULL(TotalCoins, 0),
                    CoinsSpent = ISNULL(CoinsSpent, 0),
                    CurrentStreak = ISNULL(CurrentStreak, 0),
                    LongestStreak = ISNULL(LongestStreak, 0)
            `);
            console.log('✅ Default values for UserGamification repaired/checked.');
        } catch (e) {
            console.error('⚠️ Could not repair UserGamification values on startup:', e.message);
        }
    })
    .catch(err => {
        console.error('⚠️  Database connection failed:', err.message);
        console.log('   Server will start anyway. DB features may not work until connection is restored.');
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    });

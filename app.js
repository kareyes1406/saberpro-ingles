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
const authRoutes      = require('./routes/authRoutes');
const studentRoutes   = require('./routes/studentRoutes');
const gameRoutes      = require('./routes/gameRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const examRoutes      = require('./routes/examRoutes');
const shopRoutes      = require('./routes/shopRoutes');
const messageRoutes   = require('./routes/messageRoutes');
const professorRoutes = require('./routes/professorRoutes');

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

/**
 * requireProfessor - Verifica que el usuario sea profesor
 * Se aplica a rutas /professor
 */
const requireProfessor = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'professor') {
        return next();
    }
    req.flash('error', 'Acceso restringido a profesores.');
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
        if (req.session.role === 'professor') {
            return res.redirect('/professor/dashboard');
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
app.use('/shop', requireAuth, shopRoutes);
app.use('/messages', requireAuth, messageRoutes);
app.use('/professor', requireProfessor, professorRoutes);

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

            // Safe auto-initialization with IF NOT EXISTS
            await executeQuery(`
                IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'professor')
                BEGIN
                    INSERT INTO Roles (RoleName, Description) VALUES ('professor', 'Profesor - Lectura de estadísticas estudiantiles');
                END

                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ShopItems' AND xtype='U')
                BEGIN
                    CREATE TABLE ShopItems (
                        ItemID INT IDENTITY(1,1) PRIMARY KEY,
                        ItemName NVARCHAR(100) NOT NULL,
                        Description NVARCHAR(500) NOT NULL,
                        IconEmoji NVARCHAR(10) NOT NULL,
                        ItemType NVARCHAR(50) CHECK (ItemType IN ('xp_booster','streak_shield','hint_token','cosmetic')),
                        Price INT NOT NULL,
                        DurationMinutes INT NULL,
                        BoostMultiplier DECIMAL(3,1) DEFAULT 1.0,
                        IsActive BIT DEFAULT 1,
                        CreatedAt DATETIME DEFAULT GETDATE()
                    );

                    INSERT INTO ShopItems (ItemName, Description, IconEmoji, ItemType, Price, DurationMinutes, BoostMultiplier)
                    VALUES 
                    ('Poción de XP Doble', '¡Duplica tu XP durante 1 hora! Perfecta para sesiones intensivas.', '🧪', 'xp_booster', 50, 60, 2.0),
                    ('Escudo de Racha', 'Protege tu racha por 24 horas. ¡No pierdas tu progreso!', '🛡️', 'streak_shield', 100, 1440, 1.0),
                    ('Pista del Sabio', 'Elimina una opción incorrecta en Boss Battle. Úsala sabiamente.', '💡', 'hint_token', 30, NULL, 1.0),
                    ('Super XP Triple', '¡Triple XP durante 30 minutos! Para los más ambiciosos.', '⚡', 'xp_booster', 150, 30, 3.0);
                END

                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserInventory' AND xtype='U')
                BEGIN
                    CREATE TABLE UserInventory (
                        InventoryID INT IDENTITY(1,1) PRIMARY KEY,
                        UserID INT FOREIGN KEY REFERENCES Users(UserID),
                        ItemID INT FOREIGN KEY REFERENCES ShopItems(ItemID),
                        PurchasedAt DATETIME DEFAULT GETDATE(),
                        ExpiresAt DATETIME NULL,
                        IsUsed BIT DEFAULT 0,
                        UsedAt DATETIME NULL
                    );
                END

                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Messages' AND xtype='U')
                BEGIN
                    CREATE TABLE Messages (
                        MessageID INT IDENTITY(1,1) PRIMARY KEY,
                        SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                        ReceiverID INT NULL FOREIGN KEY REFERENCES Users(UserID),
                        Subject NVARCHAR(200),
                        MessageText NVARCHAR(MAX) NOT NULL,
                        IsRead BIT DEFAULT 0,
                        ParentMessageID INT NULL FOREIGN KEY REFERENCES Messages(MessageID),
                        CreatedAt DATETIME DEFAULT GETDATE()
                    );

                    CREATE INDEX IX_Messages_SenderID ON Messages(SenderID);
                    CREATE INDEX IX_Messages_ReceiverID ON Messages(ReceiverID);
                END
            `);
            console.log('✅ Safe schema check completed (Professor role, Shop, Messages).');
        } catch (e) {
            console.error('⚠️ Could not repair UserGamification or initialize schema on startup:', e.message);
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

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function createShopTables() {
    try {
        const query = `
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

            IF NOT EXISTS (SELECT 1 FROM ShopItems)
            BEGIN
                INSERT INTO ShopItems (ItemName, Description, IconEmoji, ItemType, Price, DurationMinutes, BoostMultiplier)
                VALUES 
                ('Poción de XP Doble', '¡Duplica tu XP durante 1 hora! Perfecta para sesiones intensivas.', '🧪', 'xp_booster', 50, 60, 2.0),
                ('Escudo de Racha', 'Protege tu racha por 24 horas. ¡No pierdas tu progreso!', '🛡️', 'streak_shield', 100, 1440, 1.0),
                ('Pista del Sabio', 'Elimina una opción incorrecta en Boss Battle. Úsala sabiamente.', '💡', 'hint_token', 30, NULL, 1.0),
                ('Super XP Triple', '¡Triple XP durante 30 minutos! Para los más ambiciosos.', '⚡', 'xp_booster', 150, 30, 3.0);
            END
        `;
        await executeQuery(query);
        console.log('Shop tables created successfully.');
    } catch (error) {
        console.error('Error creating shop tables:', error);
    }
}

createShopTables();

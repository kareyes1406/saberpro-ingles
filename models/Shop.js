const { executeQuery, sql } = require('../config/database');

class Shop {
    static async getActiveItems() {
        const query = `
            SELECT * FROM ShopItems 
            WHERE IsActive = 1 
            ORDER BY Price ASC
        `;
        const result = await executeQuery(query);
        return result.recordset || [];
    }

    static async purchaseItem(userId, itemId) {
        const query = `
            DECLARE @Price INT, @DurationMinutes INT, @Balance INT;
            
            SELECT @Price = Price, @DurationMinutes = DurationMinutes 
            FROM ShopItems WHERE ItemID = @ItemID AND IsActive = 1;
            
            IF @Price IS NULL THROW 50001, 'Ítem no encontrado o inactivo.', 1;

            SELECT @Balance = TotalCoins FROM UserGamification WHERE UserID = @UserID;
            
            IF @Balance IS NULL OR @Balance < @Price THROW 50002, 'Fondos insuficientes.', 1;

            BEGIN TRY
                BEGIN TRANSACTION;
                
                UPDATE UserGamification 
                SET TotalCoins = TotalCoins - @Price,
                    CoinsSpent = CoinsSpent + @Price
                WHERE UserID = @UserID;

                DECLARE @ExpiresAt DATETIME = NULL;
                IF @DurationMinutes IS NOT NULL
                    SET @ExpiresAt = DATEADD(minute, @DurationMinutes, GETDATE());

                INSERT INTO UserInventory (UserID, ItemID, ExpiresAt)
                VALUES (@UserID, @ItemID, @ExpiresAt);
                
                COMMIT TRANSACTION;
            END TRY
            BEGIN CATCH
                ROLLBACK TRANSACTION;
                THROW;
            END CATCH
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'ItemID', type: sql.Int, value: itemId }
        ];
        await executeQuery(query, params);
        return true;
    }

    static async getUserInventory(userId) {
        const query = `
            SELECT ui.*, si.ItemName, si.Description, si.IconEmoji, si.ItemType
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID
            ORDER BY ui.PurchasedAt DESC
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset || [];
    }

    static async getActiveBooster(userId) {
        const query = `
            SELECT TOP 1 si.BoostMultiplier
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID 
              AND si.ItemType = 'xp_booster'
              AND ui.IsUsed = 1 
              AND ui.ExpiresAt > GETDATE()
            ORDER BY ui.UsedAt DESC
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset && result.recordset.length > 0 ? result.recordset[0].BoostMultiplier : 1.0;
    }

    static async useItem(inventoryId, userId) {
        const query = `
            UPDATE UserInventory
            SET IsUsed = 1, UsedAt = GETDATE()
            WHERE InventoryID = @InventoryID AND UserID = @UserID AND IsUsed = 0
        `;
        const params = [
            { name: 'InventoryID', type: sql.Int, value: inventoryId },
            { name: 'UserID', type: sql.Int, value: userId }
        ];
        await executeQuery(query, params);
        return true;
    }

    static async hasActiveStreakShield(userId) {
        const query = `
            SELECT TOP 1 1 AS HasShield
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID 
              AND si.ItemType = 'streak_shield'
              AND ui.IsUsed = 1 
              AND ui.ExpiresAt > GETDATE()
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset && result.recordset.length > 0;
    }
}

module.exports = Shop;

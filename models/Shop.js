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
            DECLARE @Price INT, @Balance INT;
            
            SELECT @Price = Price 
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

                -- Se inserta como no usado (IsUsed = 0) para que el estudiante decida cuándo activarlo
                INSERT INTO UserInventory (UserID, ItemID, IsUsed, PurchasedAt, ExpiresAt)
                VALUES (@UserID, @ItemID, 0, GETDATE(), NULL);
                
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
            SELECT ui.*, si.ItemName, si.Description, si.IconEmoji, si.ItemType,
                   si.DurationMinutes, si.BoostMultiplier
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
              AND (ui.ExpiresAt IS NULL OR ui.ExpiresAt > GETDATE())
            ORDER BY si.BoostMultiplier DESC
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset && result.recordset.length > 0 ? parseFloat(result.recordset[0].BoostMultiplier) : 1.0;
    }

    static async useItem(inventoryId, userId) {
        const query = `
            DECLARE @DurationMinutes INT, @ItemType NVARCHAR(50);
            
            SELECT @DurationMinutes = si.DurationMinutes, @ItemType = si.ItemType
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.InventoryID = @InventoryID AND ui.UserID = @UserID AND ui.IsUsed = 0;

            IF @ItemType IS NULL THROW 50003, 'Ítem no encontrado o ya utilizado.', 1;

            DECLARE @ExpiresAt DATETIME = NULL;
            IF @DurationMinutes IS NOT NULL
                SET @ExpiresAt = DATEADD(minute, @DurationMinutes, GETDATE());

            UPDATE UserInventory
            SET IsUsed = 1, UsedAt = GETDATE(), ExpiresAt = @ExpiresAt
            WHERE InventoryID = @InventoryID AND UserID = @UserID;
        `;
        const params = [
            { name: 'InventoryID', type: sql.Int, value: inventoryId },
            { name: 'UserID', type: sql.Int, value: userId }
        ];
        await executeQuery(query, params);
        return true;
    }

    static async getAvailableHints(userId) {
        const query = `
            SELECT COUNT(*) as HintCount
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID 
              AND si.ItemType = 'hint_token' 
              AND ui.IsUsed = 0
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset[0]?.HintCount || 0;
    }

    static async useHint(userId) {
        const query = `
            DECLARE @InvID INT;
            SELECT TOP 1 @InvID = ui.InventoryID
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID 
              AND si.ItemType = 'hint_token' 
              AND ui.IsUsed = 0
            ORDER BY ui.PurchasedAt ASC;

            IF @InvID IS NOT NULL
            BEGIN
                UPDATE UserInventory 
                SET IsUsed = 1, UsedAt = GETDATE()
                WHERE InventoryID = @InvID;
                SELECT 1 as Success;
            END
            ELSE
            BEGIN
                SELECT 0 as Success;
            END
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset[0]?.Success === 1;
    }

    static async hasActiveStreakShield(userId) {
        const query = `
            SELECT TOP 1 1 AS HasShield
            FROM UserInventory ui
            JOIN ShopItems si ON ui.ItemID = si.ItemID
            WHERE ui.UserID = @UserID 
              AND si.ItemType = 'streak_shield'
              AND ui.IsUsed = 1 
              AND (ui.ExpiresAt IS NULL OR ui.ExpiresAt > GETDATE())
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset && result.recordset.length > 0;
    }
}

module.exports = Shop;

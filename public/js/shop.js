// public/js/shop.js
document.addEventListener('DOMContentLoaded', () => {
    const buyButtons = document.querySelectorAll('.btn-buy');
    const coinDisplay = document.getElementById('userCoins');

    buyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = btn.dataset.itemId;
            const price = parseInt(btn.dataset.price);
            const currentCoins = parseInt(coinDisplay.textContent);

            if (currentCoins < price) {
                alert('No tienes suficientes monedas.');
                return;
            }

            if (!confirm('¿Estás seguro de que deseas comprar este artículo?')) {
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Procesando...';

            try {
                const response = await fetch('/shop/purchase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ itemId })
                });

                const result = await response.json();

                if (response.ok) {
                    // Update coins
                    const newCoins = currentCoins - price;
                    coinDisplay.textContent = newCoins;

                    // Update all buttons based on new balance
                    document.querySelectorAll('.btn-buy').forEach(b => {
                        const itemPrice = parseInt(b.dataset.price);
                        if (newCoins < itemPrice) {
                            b.disabled = true;
                        }
                    });

                    alert('¡Compra exitosa! Revisa tu inventario.');
                    // Reload to update inventory view (could be done via DOM manipulation for better UX)
                    window.location.reload(); 
                } else {
                    alert(result.error || 'Error al procesar la compra.');
                    btn.disabled = false;
                    btn.textContent = 'Comprar';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error en la conexión.');
                btn.disabled = false;
                btn.textContent = 'Comprar';
            }
        });
    });

    // Handle use buttons (Activar Potenciadores)
    const useButtons = document.querySelectorAll('.btn-use');
    useButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const invId = btn.dataset.invId;
            if (!invId) return;

            btn.disabled = true;
            btn.textContent = 'Activando...';

            try {
                const response = await fetch('/shop/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inventoryId: invId })
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    if (typeof triggerMascota === 'function') {
                        triggerMascota('exito', '¡Potenciador activado con éxito! ⚡');
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    alert(result.error || 'No se pudo activar el potenciador.');
                    btn.disabled = false;
                    btn.textContent = 'Activar';
                }
            } catch (err) {
                console.error(err);
                alert('Error de conexión al activar el potenciador.');
                btn.disabled = false;
                btn.textContent = 'Activar';
            }
        });
    });
});

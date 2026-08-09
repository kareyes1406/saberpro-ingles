/**
 * public/js/admin.js
 * Lógica del Dashboard Administrativo
 * Charts con Chart.js (CDN), CRUD de usuarios
 */
document.addEventListener('DOMContentLoaded', () => {
    loadCharts();
    setupSearch();
    animateKPIs();
});

// ── Chart.js Initialization ────────────────────────────────
async function loadCharts() {
    try {
        const response = await fetch('/admin/kpis/data');
        const data = await response.json();
        
        // 1. Completion Rate per Week (Line Chart)
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            new Chart(completionCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 12}, (_, i) => `Sem ${i + 1}`),
                    datasets: [{
                        label: 'Tasa de Finalización (%)',
                        data: Array.from({length: 12}, (_, i) => {
                            const week = data.weeklyCompletion.find(w => w.WeekNumber === i + 1);
                            if (!week || !week.TotalStudents) return 0;
                            return Math.round((week.CompletedUsers / week.TotalStudents) * 100);
                        }),
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#f8fafc' } } }
                }
            });
        }
        
        // 2. Average Time per Week (Bar Chart)
        const timeCtx = document.getElementById('timeChart');
        if (timeCtx) {
            new Chart(timeCtx, {
                type: 'bar',
                data: {
                    labels: data.weeklyTime.map(w => `Sem ${w.WeekNumber}`),
                    datasets: [{
                        label: 'Tiempo Promedio (seg)',
                        data: data.weeklyTime.map(w => Math.round(w.AvgTime || 0)),
                        backgroundColor: 'rgba(6, 182, 212, 0.6)',
                        borderColor: '#06b6d4',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#f8fafc' } } }
                }
            });
        }
        
        // 3. Module Effectiveness (Doughnut Chart)
        const effCtx = document.getElementById('effectivenessChart');
        if (effCtx) {
            new Chart(effCtx, {
                type: 'doughnut',
                data: {
                    labels: data.effectiveness.map(e => e.TypeName),
                    datasets: [{
                        data: data.effectiveness.map(e => Math.round(e.AvgScore || 0)),
                        backgroundColor: ['#7c3aed', '#06b6d4', '#ef4444'],
                        borderColor: '#0a0e1a',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#f8fafc' }, position: 'bottom' } }
                }
            });
        }
        
        // 4. Daily Activity (Bar Chart)
        const actCtx = document.getElementById('activityChart');
        if (actCtx) {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            new Chart(actCtx, {
                type: 'bar',
                data: {
                    labels: data.dailyActivity.map(d => {
                        const date = new Date(d.ActivityDate);
                        return days[date.getDay()] + ' ' + date.getDate();
                    }),
                    datasets: [{
                        label: 'Actividades Completadas',
                        data: data.dailyActivity.map(d => d.ActivityCount),
                        backgroundColor: 'rgba(245, 158, 11, 0.6)',
                        borderColor: '#f59e0b',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#f8fafc' } } }
                }
            });
        }
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// ── KPI Count-Up Animation ──────────────────────────────────
function animateKPIs() {
    document.querySelectorAll('.kpi-value').forEach(el => {
        const text = el.textContent.trim();
        const num = parseInt(text);
        if (isNaN(num) || num === 0) return;
        const suffix = text.replace(String(num), '');
        let current = 0;
        const increment = Math.ceil(num / 30);
        const timer = setInterval(() => {
            current += increment;
            if (current >= num) { current = num; clearInterval(timer); }
            el.textContent = current + suffix;
        }, 30);
    });
}

// ── Search Filter ──────────────────────────────────────────
function setupSearch() {
    const searchInput = document.getElementById('searchUsers');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#usersTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ── CRUD Modal Functions ───────────────────────────────────
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Estudiante';
    document.getElementById('formUserId').value = '';
    document.getElementById('formFirstName').value = '';
    document.getElementById('formLastName').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formPassword').value = '';
    document.getElementById('formActive').value = '1';
    document.getElementById('passwordGroup').style.display = 'block';
    const modal = document.getElementById('userModal');
    modal.classList.add('active');
}

function openEditModal(userData) {
    document.getElementById('modalTitle').textContent = 'Editar Estudiante';
    document.getElementById('formUserId').value = userData.UserID;
    document.getElementById('formFirstName').value = userData.FirstName;
    document.getElementById('formLastName').value = userData.LastName;
    document.getElementById('formEmail').value = userData.Email;
    document.getElementById('formActive').value = userData.IsActive ? '1' : '0';
    document.getElementById('passwordGroup').style.display = 'none';
    const modal = document.getElementById('userModal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('userModal');
    modal.classList.remove('active');
}

async function submitUserForm() {
    const btn = document.querySelector('.modal-footer .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    const userId = document.getElementById('formUserId').value;
    const data = {
        firstName: document.getElementById('formFirstName').value,
        lastName: document.getElementById('formLastName').value,
        email: document.getElementById('formEmail').value,
        password: document.getElementById('formPassword').value,
        isActive: document.getElementById('formActive').value
    };
    
    try {
        const url = userId ? `/admin/users/${userId}` : '/admin/users';
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        let result;
        try {
            result = await response.json();
        } catch(e) {
            btn.textContent = 'Error: 500 Server Crash';
            btn.style.backgroundColor = 'red';
            setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 4000);
            return;
        }

        if (result.success) {
            btn.textContent = '¡Guardado!';
            btn.style.backgroundColor = 'green';
            setTimeout(() => { location.reload(); }, 500);
        } else {
            btn.textContent = 'Error: ' + (result.error || 'Desconocido');
            btn.style.backgroundColor = 'red';
            setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 4000);
        }
    } catch (error) {
        console.error('Submit error:', error);
        btn.textContent = 'Error: Red/Desconexión';
        btn.style.backgroundColor = 'red';
        setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 4000);
    }
}

async function deleteUser(userId) {
    if (!confirm('🚨 ATENCIÓN: ¿Estás seguro de que deseas ELIMINAR permanentemente este estudiante y todo su progreso? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch(`/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            location.reload();
        } else {
            alert('Error: ' + (result.error || 'Desconocido'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error de conexión');
    }
}

function exportToCSV() {
    const table = document.getElementById('usersTable');
    if (!table) return;
    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = Array.from(row.querySelectorAll('td, th'));
        // Excluir la última columna (Acciones)
        if (cols.length > 0) {
            cols.pop(); 
        }
        const rowData = cols.map(col => '"' + col.textContent.trim().replace(/"/g, '""') + '"');
        csv.push(rowData.join(','));
    });
    
    // Fallback compatible y directo
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join('\n'));
    const link = document.createElement('a');
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `estudiantes_saberpro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function exportDashboardPDF() {
    const btn = document.querySelector('button[onclick="exportDashboardPDF()"]');
    const originalText = btn.textContent;
    btn.textContent = 'Generando...';
    btn.disabled = true;

    // Seleccionamos todo el layout principal
    const element = document.getElementById('pdf-content');
    
    // Opciones para la librería html2pdf
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `SaberPro_Informe_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          windowHeight: element.scrollHeight 
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch(e) {
        console.error('Error PDF:', e);
        alert('Hubo un error generando el PDF');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

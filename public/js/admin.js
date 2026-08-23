/**
 * public/js/admin.js
 * Lógica del Dashboard Administrativo
 * Charts con Chart.js (CDN), CRUD de usuarios
 */
document.addEventListener('DOMContentLoaded', () => {
    // Forzar renderizado de gráficas en alta resolución (3x) para que el PDF se vea ultra nítido
    if (window.Chart) {
        Chart.defaults.devicePixelRatio = 3;
    }
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
        const rows = document.querySelectorAll('#usersList .user-accordion');
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
    const firstName = document.getElementById('formFirstName').value;
    const lastName = document.getElementById('formLastName').value;
    const email = document.getElementById('formEmail').value;
    const isActive = document.getElementById('formActive').value;
    const password = document.getElementById('formPassword').value;

    const data = { firstName, lastName, email, isActive };
    if (!userId) {
        if (!password) {
            btn.textContent = 'Error: Contraseña obligatoria';
            btn.style.backgroundColor = 'red';
            setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 3000);
            return;
        }
        data.password = password;
    }
    
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
    const accordions = document.querySelectorAll('#usersList .user-accordion');
    if (accordions.length === 0) return;
    
    let csv = [];
    // Cabecera
    csv.push('"ID","Nombre Completo","Email","Estado","Semana - Actividad","XP Total","Racha"');
    
    accordions.forEach(acc => {
        const id = acc.querySelector('.user-stats div:nth-child(1)').textContent.replace('ID: ', '').trim();
        const xp = acc.querySelector('.user-stats div:nth-child(2)').textContent.replace('XP Total: ', '').replace(' XP', '').trim();
        const streak = acc.querySelector('.user-stats div:nth-child(3)').textContent.replace('Racha: 🔥 ', '').replace(' días', '').trim();
        
        const name = acc.querySelector('.user-main-info strong').textContent.trim();
        const status = acc.querySelector('.user-main-info .badge-pill').textContent.trim();
        
        const email = acc.querySelector('.user-sub-info small:nth-child(1)').textContent.trim();
        const activity = acc.querySelector('.user-sub-info small:nth-child(2)').textContent.trim();
        
        const rowData = [
            `"${id}"`,
            `"${name}"`,
            `"${email}"`,
            `"${status}"`,
            `"${activity}"`,
            `"${xp}"`,
            `"${streak}"`
        ];
        csv.push(rowData.join(','));
    });
    
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
    btn.textContent = 'Construyendo Documento...';
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPos = 20;

        // Título del documento
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("INFORME DE RENDIMIENTO ACADÉMICO", pageWidth/2, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Plataforma SaberPro Inglés", pageWidth/2, yPos, { align: 'center' });
        yPos += 8;

        doc.setFontSize(10);
        doc.text("Fecha: " + new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth/2, yPos, { align: 'center' });
        yPos += 20;

        // Sección 1: Resumen Ejecutivo
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(124, 58, 237); // Color primario
        doc.text("1. Resumen Ejecutivo", margin, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        const totalU = document.getElementById('totalUsers').textContent;
        const compRate = document.getElementById('completionRate').textContent;
        const abandRate = document.getElementById('abandonRate').textContent;
        const timeRate = document.getElementById('avgTime').textContent;

        doc.text(`Total de Estudiantes Activos: ${totalU}`, margin, yPos);
        yPos += 7;
        doc.text(`Tasa Promedio de Finalización: ${compRate}`, margin, yPos);
        yPos += 7;
        doc.text(`Tasa de Abandono (riesgo): ${abandRate}`, margin, yPos);
        yPos += 7;
        doc.text(`Tiempo Promedio por Módulo: ${timeRate}`, margin, yPos);
        yPos += 15;

        // Función auxiliar para agregar gráficas si existen
        const addChartToPDF = (canvasId, title, color, height = 80) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            // Check si hay espacio en la página
            if (yPos + height + 10 > 280) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...color);
            doc.text(title, margin, yPos);
            yPos += 8;

            const imgData = canvas.toDataURL('image/png', 1.0);
            doc.addImage(imgData, 'PNG', margin, yPos, 170, height);
            yPos += height + 15;
        };

        // Sección 2: Análisis de Competencias (Pre-test vs Módulos)
        addChartToPDF('preVsModuleChart', '2. Evolución de Competencias (Pre-Test vs Actual)', [6, 182, 212]);

        // Sección 3: K-Means Clustering (Inteligencia Artificial)
        addChartToPDF('clusterChart', '3. Clasificación K-Means (Grupos de Rendimiento)', [245, 158, 11], 100);

        // Sección 4: Distribución y Ranking
        addChartToPDF('levelDistChart', '4. Distribución de Niveles de XP (Gamificación)', [124, 58, 237], 100);
        addChartToPDF('topStudentsChart', '5. Top 10 Estudiantes (Ranking General)', [236, 72, 153], 90);

        // Sección 5: Tasa de Finalización Histórica y Tiempos
        addChartToPDF('completionChart', '6. Histórico de Efectividad (Semana a Semana)', [16, 185, 129]);
        addChartToPDF('timeChart', '7. Tiempo Promedio de Resolución por Semana', [6, 182, 212]);
        
        // Sección 6: Efectividad y Actividad
        addChartToPDF('effectivenessChart', '8. Efectividad Histórica por Módulo', [239, 68, 68], 100);
        addChartToPDF('activityChart', '9. Actividad en la Plataforma (Últimos 7 Días)', [245, 158, 11]);

        // Pie de página oficial
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Generado por IA - SaberPro Inglés - Página ${i} de ${pageCount}`, pageWidth/2, 290, { align: 'center' });
        }

        // Descargar el documento
        doc.save(`Reporte_SaberPro_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch(e) {
        console.error('Error PDF:', e);
        alert('Hubo un error construyendo el PDF: ' + e.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

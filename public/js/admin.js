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
        const kpiUrl = window.location.pathname.startsWith('/professor') ? '/professor/kpis/data' : '/admin/kpis/data';
        const response = await fetch(kpiUrl);
        const data = await response.json();
        
        // 1. Completion Rate per Week (Line Chart) - Limitado a 4 semanas activas
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            const activeWeeks = 4;
            new Chart(completionCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: activeWeeks}, (_, i) => `Sem ${i + 1}`),
                    datasets: [{
                        label: 'Tasa de Finalización (%)',
                        data: Array.from({length: activeWeeks}, (_, i) => {
                            const week = (data.weeklyCompletion || []).find(w => w.WeekNumber === i + 1);
                            if (!week || !week.TotalStudents) return 0;
                            return Math.round((week.CompletedUsers / week.TotalStudents) * 100);
                        }),
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#f8fafc' } } }
                }
            });
        }
        
        // 2. Average Time per Week (Bar Chart) - Limitado a 4 semanas activas
        const timeCtx = document.getElementById('timeChart');
        if (timeCtx) {
            const filteredWeeklyTime = (data.weeklyTime || []).filter(w => w.WeekNumber <= 4);
            new Chart(timeCtx, {
                type: 'bar',
                data: {
                    labels: filteredWeeklyTime.map(w => `Sem ${w.WeekNumber}`),
                    datasets: [{
                        label: 'Tiempo Promedio (seg)',
                        data: filteredWeeklyTime.map(w => Math.round(w.AvgTime || 0)),
                        backgroundColor: 'rgba(6, 182, 212, 0.6)',
                        borderColor: '#06b6d4',
                        borderWidth: 1,
                        borderRadius: 6
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

        // 5. Pre-Test vs Post-Test — Comparativo de Competencias (Grouped Bar Chart)
        const preVsCtx = document.getElementById('preVsModuleChart');
        if (preVsCtx) {
            const preAvgs = data.preTestAvgs || {};
            const postAvgs = data.postTestAvgs || {};

            new Chart(preVsCtx, {
                type: 'bar',
                data: {
                    labels: ['Vocabulario', 'Comprensión Lectora', 'Avisos y Diálogos', 'Gramática', 'Promedio General'],
                    datasets: [
                        {
                            label: `Pre-Test (${preAvgs.TotalExams || 0} est.)`,
                            data: [
                                Math.round(preAvgs.AvgVocab || 0),
                                Math.round(preAvgs.AvgReading || 0),
                                Math.round(preAvgs.AvgPragmatics || 0),
                                Math.round(preAvgs.AvgGrammar || 0),
                                Math.round(preAvgs.AvgTotal || 0)
                            ],
                            backgroundColor: 'rgba(6, 182, 212, 0.75)',
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: `Post-Test (${postAvgs.TotalExams || 0} est.)`,
                            data: [
                                Math.round(postAvgs.AvgVocab || 0),
                                Math.round(postAvgs.AvgReading || 0),
                                Math.round(postAvgs.AvgPragmatics || 0),
                                Math.round(postAvgs.AvgGrammar || 0),
                                Math.round(postAvgs.AvgTotal || 0)
                            ],
                            backgroundColor: 'rgba(168, 85, 247, 0.75)',
                            borderColor: '#a855f7',
                            borderWidth: 2,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#f8fafc', font: { weight: 'bold' } } },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { min: 0, max: 100, ticks: { color: '#94a3b8', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // 6. XP Level Distribution (Doughnut Chart)
        const lvlCtx = document.getElementById('levelDistChart');
        if (lvlCtx && data.xpDistribution) {
            const xpDist = data.xpDistribution || [];
            const COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#0ea5e9'];
            new Chart(lvlCtx, {
                type: 'doughnut',
                data: {
                    labels: xpDist.map(l => `Nivel ${l.Level}`),
                    datasets: [{
                        data: xpDist.map(l => l.StudentCount),
                        backgroundColor: xpDist.map((_, i) => COLORS[i % COLORS.length]),
                        borderWidth: 2,
                        borderColor: '#0f1628'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } }
                    }
                }
            });
        }

        // 7. Top 10 Students by XP (Horizontal Bar Chart)
        const topCtx = document.getElementById('topStudentsChart');
        if (topCtx && data.topStudents) {
            const topS = data.topStudents || [];
            new Chart(topCtx, {
                type: 'bar',
                data: {
                    labels: topS.map(s => s.FullName),
                    datasets: [{
                        label: 'XP Total',
                        data: topS.map(s => s.TotalXP),
                        backgroundColor: topS.map((_, i) => i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'rgba(124, 58, 237, 0.6)'),
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }

        // 8. K-Means Cluster (Pie Chart)
        const clCtx = document.getElementById('clusterChart');
        if (clCtx && data.clusterSummary) {
            const clusters = data.clusterSummary || [];
            new Chart(clCtx, {
                type: 'pie',
                data: {
                    labels: clusters.map(c => c.name),
                    datasets: [{
                        data: clusters.map(c => c.count),
                        backgroundColor: clusters.map(c => (c.color || '#6b7280') + 'cc'),
                        borderColor: clusters.map(c => c.color || '#6b7280'),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } } }
                }
            });

            // Cluster legend cards
            const clusterLegend = document.getElementById('clusterLegend');
            if (clusterLegend && clusters.length > 0) {
                clusterLegend.innerHTML = clusters.map(c => `
                    <div style="display:inline-block; margin:0.25rem; padding:0.5rem 0.75rem; background:${c.color}22; border:1px solid ${c.color}; border-radius:8px; font-size:0.8rem;">
                        <span style="color:${c.color}; font-weight:700;">${c.name}</span>
                        <span style="color:#94a3b8; margin-left:0.5rem;">${c.count} est. (${c.avgScore}% prom. | ${c.avgXP} XP)</span>
                    </div>
                `).join('');
            }
        }

        // 9. Scatter Plot: Pre-Test vs Post-Test (MCER Level Distribution e Interactivo con Trayectorias)
        const scatterCtx = document.getElementById('scatterLevelsChart');
        if (scatterCtx && data.scatterData) {
            const preData = data.scatterData.preTest || [];
            const postData = data.scatterData.postTest || [];
            const studentsList = data.scatterData.students || [];

            const scatterChart = new Chart(scatterCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Primera Prueba (Pre-Test)',
                            data: preData,
                            backgroundColor: 'rgba(6, 182, 212, 0.75)',
                            borderColor: '#06b6d4',
                            borderWidth: 1.5,
                            pointRadius: 6,
                            pointHoverRadius: 9
                        },
                        {
                            label: 'Última Prueba (Post-Test)',
                            data: postData,
                            backgroundColor: 'rgba(168, 85, 247, 0.85)',
                            borderColor: '#a855f7',
                            borderWidth: 1.5,
                            pointRadius: 7,
                            pointHoverRadius: 10
                        },
                        {
                            label: 'Trayectoria de Evolución',
                            data: [],
                            showLine: true,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            borderWidth: 3,
                            borderDash: [6, 4],
                            pointRadius: 8,
                            pointHoverRadius: 11,
                            pointBackgroundColor: '#f59e0b',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (evt, elements) => {
                        if (elements && elements.length > 0) {
                            const first = elements[0];
                            const dataset = scatterChart.data.datasets[first.datasetIndex];
                            const point = dataset.data[first.index];
                            if (point && point.userId) {
                                selectStudent(point.userId);
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#f8fafc', padding: 12, font: { weight: 'bold' } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#38bdf8',
                            bodyColor: '#f8fafc',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                label: function(context) {
                                    const raw = context.raw;
                                    if (context.datasetIndex === 2) {
                                        return [
                                            `📈 Trayectoria: ${raw.name || 'Estudiante'}`,
                                            `🎯 Etapa: ${raw.stage || ''}`,
                                            `📊 Puntaje: ${raw.score}%`,
                                            `🏅 Nivel MCER: ${raw.level}`
                                        ];
                                    }
                                    return [
                                        `👤 ${raw.name || 'Estudiante'}`,
                                        `📊 Puntaje: ${raw.score}%`,
                                        `🎯 Nivel MCER: ${raw.level}`,
                                        `📝 Etapa: ${raw.stage || (context.datasetIndex === 0 ? 'Pre-Test' : 'Post-Test')}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Puntaje Obtenido (%)',
                                color: '#94a3b8',
                                font: { size: 12, weight: 'bold' }
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: v => v + '%'
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.06)' }
                        },
                        y: {
                            min: 0.5,
                            max: 5.5,
                            title: {
                                display: true,
                                text: 'Nivel MCER Clasificado',
                                color: '#94a3b8',
                                font: { size: 12, weight: 'bold' }
                            },
                            ticks: {
                                stepSize: 1,
                                color: '#94a3b8',
                                callback: function(val) {
                                    const map = {
                                        1: 'A1 (Principiante)',
                                        2: 'A2 (Básico)',
                                        3: 'B1 (Intermedio)',
                                        4: 'B2 (Intermedio Alto)',
                                        5: 'C1 (Avanzado)'
                                    };
                                    return map[Math.round(val)] || '';
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.06)' }
                        }
                    }
                }
            });

            // Poblar dropdown de selección y eventos
            const studentSelect = document.getElementById('scatterStudentFilter');
            const studentCard = document.getElementById('scatterStudentCard');
            const btnReset = document.getElementById('btnResetScatter');

            if (studentSelect && studentsList.length > 0) {
                const sorted = [...studentsList].sort((a, b) => a.name.localeCompare(b.name));
                sorted.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.userId;
                    let extra = '';
                    if (s.hasBoth) {
                        const sign = s.diffScore >= 0 ? '+' : '';
                        extra = `(Pre: ${s.pre.score}% → Post: ${s.post.score}% | Δ ${sign}${s.diffScore}%)`;
                    } else if (s.pre) {
                        extra = `(Pre: ${s.pre.score}% | Pendiente Post-Test)`;
                    } else if (s.post) {
                        extra = `(Post: ${s.post.score}% | Sin Pre-Test)`;
                    }
                    opt.textContent = `${s.name} ${extra}`;
                    studentSelect.appendChild(opt);
                });
            }

            function selectStudent(userId) {
                if (!userId) {
                    scatterChart.data.datasets[2].data = [];
                    scatterChart.update();
                    if (studentSelect) studentSelect.value = '';
                    if (studentCard) studentCard.style.display = 'none';
                    return;
                }

                const s = studentsList.find(item => String(item.userId) === String(userId));
                if (!s) return;

                if (studentSelect) studentSelect.value = String(userId);

                const trajectoryPoints = [];
                if (s.pre) trajectoryPoints.push(s.pre);
                if (s.post) trajectoryPoints.push(s.post);

                scatterChart.data.datasets[2].data = trajectoryPoints;
                scatterChart.update();

                if (studentCard) {
                    studentCard.style.display = 'block';
                    if (s.hasBoth) {
                        const isGain = s.diffScore >= 0;
                        const badgeColor = isGain ? '#10b981' : '#ef4444';
                        const badgeBg = isGain ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
                        const icon = isGain ? '📈 +' : '📉 ';
                        studentCard.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                <div>
                                    <span style="font-size:1.05rem; font-weight:700; color:#f8fafc;">👤 ${s.name}</span>
                                    <span style="font-size:0.8rem; color:#94a3b8; margin-left:0.5rem;">(ID #${s.userId})</span>
                                </div>
                                <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                                    <span style="background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); padding:0.3rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                        📝 Pre-Test: <strong>${s.pre.score}%</strong> (${s.pre.level})
                                    </span>
                                    <span style="color:#f59e0b; font-weight:800; font-size:1.1rem;">➔</span>
                                    <span style="background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3); padding:0.3rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                        🎓 Post-Test: <strong>${s.post.score}%</strong> (${s.post.level})
                                    </span>
                                    <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}; padding:0.3rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:700;">
                                        ${icon}${s.diffScore}% Evolución
                                    </span>
                                </div>
                            </div>
                        `;
                    } else if (s.pre) {
                        studentCard.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                                <div>
                                    <span style="font-size:1.05rem; font-weight:700; color:#f8fafc;">👤 ${s.name}</span>
                                    <span style="font-size:0.8rem; color:#94a3b8; margin-left:0.5rem;">(ID #${s.userId})</span>
                                </div>
                                <div style="display:flex; gap:0.75rem; align-items:center;">
                                    <span style="background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); padding:0.3rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                        📝 Pre-Test: <strong>${s.pre.score}%</strong> (${s.pre.level})
                                    </span>
                                    <span style="color:#94a3b8; font-size:0.85rem; font-style:italic;">
                                        ⏳ Aún no presenta la evaluación final (Post-Test)
                                    </span>
                                </div>
                            </div>
                        `;
                    } else if (s.post) {
                        studentCard.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                                <div>
                                    <span style="font-size:1.05rem; font-weight:700; color:#f8fafc;">👤 ${s.name}</span>
                                    <span style="font-size:0.8rem; color:#94a3b8; margin-left:0.5rem;">(ID #${s.userId})</span>
                                </div>
                                <div style="display:flex; gap:0.75rem; align-items:center;">
                                    <span style="background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3); padding:0.3rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                        🎓 Post-Test: <strong>${s.post.score}%</strong> (${s.post.level})
                                    </span>
                                    <span style="color:#94a3b8; font-size:0.85rem; font-style:italic;">
                                        ℹ️ No cuenta con registro de Pre-Test inicial
                                    </span>
                                </div>
                            </div>
                        `;
                    }
                }
            }

            if (studentSelect) {
                studentSelect.addEventListener('change', (e) => selectStudent(e.target.value));
            }
            if (btnReset) {
                btnReset.addEventListener('click', () => selectStudent(''));
            }
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
    const roleInput = document.getElementById('formRole');
    if (roleInput) {
        data.role = roleInput.value;
    }
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
            if (response.status === 401) {
                alert('⚠️ Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
                window.location.href = '/auth/login';
                return;
            }
            alert(`⚠️ El servidor respondió con estado ${response.status}. Si la aplicación se está actualizando, espera unos segundos.`);
            btn.textContent = 'Error al procesar';
            btn.style.backgroundColor = '#ef4444';
            setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 4000);
            return;
        }

        if (response.status === 401 || result.sessionExpired) {
            alert('⚠️ Tu sesión de administrador ha expirado. Redirigiendo al login...');
            window.location.href = '/auth/login';
            return;
        }

        if (result.success) {
            btn.textContent = '¡Guardado!';
            btn.style.backgroundColor = '#10b981';
            if (result.message && result.message.includes('activada')) {
                alert('✅ ' + result.message);
            }
            setTimeout(() => { location.reload(); }, 600);
        } else {
            const errorMsg = result.error || 'Error al guardar usuario.';
            alert('⚠️ ' + errorMsg);
            btn.textContent = 'Error al guardar';
            btn.style.backgroundColor = '#ef4444';
            setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 3000);
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('⚠️ Error de conexión con el servidor. Revisa tu conexión a internet.');
        btn.textContent = 'Error: Red/Desconexión';
        btn.style.backgroundColor = '#ef4444';
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

        // Sección 2: Análisis de Competencias (Pre-Test vs Post-Test)
        addChartToPDF('preVsModuleChart', '2. Evolución de Competencias (Pre-Test vs Post-Test)', [6, 182, 212]);

        // Sección 2.1: Diagrama de Dispersión MCER
        addChartToPDF('scatterLevelsChart', '2.1 Dispersión de Niveles MCER (Pre-Test vs Post-Test)', [168, 85, 247], 90);

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

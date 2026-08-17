/**
 * services/mlService.js
 * Servicio de Machine Learning — Implementación pura en JavaScript
 * Modelos: Regresión Lineal, Regresión Logística, K-Means Clustering
 */

class MLService {

    // =========================================================
    // MODELO 1: REGRESIÓN LINEAL
    // Predice el puntaje final (Post-Test) basado en la tendencia
    // histórica de calificaciones del estudiante.
    // Usa Mínimos Cuadrados Ordinarios (OLS).
    // =========================================================
    static linearRegression(dataPoints) {
        // dataPoints: [{x: weekNumber, y: score}, ...]
        const n = dataPoints.length;
        if (n < 2) {
            return { slope: 0, intercept: dataPoints[0]?.y || 0, projectedScore: dataPoints[0]?.y || 0, r2: 0 };
        }

        const sumX = dataPoints.reduce((s, p) => s + p.x, 0);
        const sumY = dataPoints.reduce((s, p) => s + p.y, 0);
        const sumXY = dataPoints.reduce((s, p) => s + p.x * p.y, 0);
        const sumX2 = dataPoints.reduce((s, p) => s + p.x * p.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Proyectar a la semana 12 (Post-Test)
        const projectedScore = Math.min(100, Math.max(0, Math.round(slope * 12 + intercept)));

        // Calcular R² (coeficiente de determinación)
        const meanY = sumY / n;
        const ssTot = dataPoints.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
        const ssRes = dataPoints.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
        const r2 = ssTot > 0 ? Math.round((1 - ssRes / ssTot) * 100) / 100 : 0;

        // Generar puntos de la línea de tendencia para graficar (semanas 1-12)
        const trendLine = Array.from({ length: 12 }, (_, i) => ({
            x: i + 1,
            y: Math.min(100, Math.max(0, Math.round((slope * (i + 1) + intercept) * 10) / 10))
        }));

        return { slope: Math.round(slope * 100) / 100, intercept: Math.round(intercept * 100) / 100, projectedScore, r2, trendLine };
    }

    // =========================================================
    // MODELO 2: REGRESIÓN LOGÍSTICA (Simplificada / Heurística)
    // Calcula la probabilidad de que el estudiante apruebe
    // la prueba Saber Pro (umbral: 60%).
    // Variables: puntaje actual, intentos, tiempo, racha, pre-test
    // =========================================================
    static logisticRegression(features) {
        // features: { avgScore, avgAttempts, avgTimeSeconds, currentStreak, preTestScore, completedWeeks }
        // Pesos calibrados heurísticamente (β coefficients)
        const WEIGHTS = {
            avgScore:       0.045,   // +4.5% por cada punto de score
            preTestScore:   0.025,   // +2.5% por cada punto del pre-test
            completedWeeks: 0.060,   // +6% por semana completada
            currentStreak:  0.015,   // +1.5% por día de racha
            avgAttempts:   -0.080,   // -8% por cada intento extra promedio
            avgTimeBonus:   0.010    // +1% si dedica tiempo adecuado
        };

        const BIAS = -3.5; // Umbral base (sesgo negativo para ser conservador)

        // Calcular bonus de tiempo (penalizar tanto muy rápido como muy lento)
        const idealTime = 120; // 2 minutos ideales por actividad
        const timeDeviation = Math.abs((features.avgTimeSeconds || 0) - idealTime) / idealTime;
        const timeBonus = Math.max(0, 1 - timeDeviation);

        // Calcular z (combinación lineal)
        const z = BIAS
            + WEIGHTS.avgScore * (features.avgScore || 0)
            + WEIGHTS.preTestScore * (features.preTestScore || 0)
            + WEIGHTS.completedWeeks * (features.completedWeeks || 0)
            + WEIGHTS.currentStreak * Math.min(features.currentStreak || 0, 30)
            + WEIGHTS.avgAttempts * Math.max(0, (features.avgAttempts || 1) - 1)
            + WEIGHTS.avgTimeBonus * timeBonus * 100;

        // Función sigmoide: P(éxito) = 1 / (1 + e^-z)
        const probability = Math.round((1 / (1 + Math.exp(-z))) * 100);
        const clampedProbability = Math.min(99, Math.max(1, probability));

        // Identificar factores de riesgo principales
        const riskFactors = [];
        if ((features.avgScore || 0) < 60) riskFactors.push({ factor: 'Puntaje Promedio Bajo', impact: 'Alto' });
        if ((features.avgAttempts || 1) > 2) riskFactors.push({ factor: 'Muchos Reintentos', impact: 'Medio' });
        if ((features.completedWeeks || 0) < 4) riskFactors.push({ factor: 'Pocas Semanas Completadas', impact: 'Alto' });
        if ((features.currentStreak || 0) < 3) riskFactors.push({ factor: 'Baja Constancia (Racha)', impact: 'Medio' });

        const recommendation = clampedProbability >= 80
            ? '✅ Excelente trayectoria. Mantén el ritmo actual.'
            : clampedProbability >= 60
            ? '⚠️ En buen camino, pero hay áreas de mejora identificadas.'
            : '🚨 Requiere atención. Se recomienda intervención docente.';

        return {
            probability: clampedProbability,
            z: Math.round(z * 100) / 100,
            classification: clampedProbability >= 60 ? 'Aprueba' : 'En Riesgo',
            riskFactors,
            recommendation
        };
    }

    // =========================================================
    // MODELO 3: K-MEANS CLUSTERING
    // Agrupa automáticamente a todos los estudiantes en k grupos
    // sin necesidad de etiquetas previas.
    // Variables: avgScore, totalXP, completedWeeks, avgAttempts
    // =========================================================
    static kMeansClustering(students, k = 3, maxIterations = 50) {
        if (students.length < k) {
            // Si hay menos estudiantes que clusters, asignar uno por uno
            return students.map((s, i) => ({ ...s, cluster: i % k, clusterName: ['En Riesgo', 'En Progreso', 'Alto Rendimiento'][i % k] }));
        }

        // Normalizar features (min-max scaling)
        const features = ['avgScore', 'totalXP', 'completedWeeks', 'avgAttempts'];
        const minMax = {};
        features.forEach(f => {
            const vals = students.map(s => s[f] || 0);
            minMax[f] = { min: Math.min(...vals), max: Math.max(...vals) };
        });

        const normalize = (val, f) => {
            const { min, max } = minMax[f];
            return max === min ? 0 : (val - min) / (max - min);
        };

        const getVector = (s) => features.map(f => normalize(s[f] || 0, f));

        const distance = (v1, v2) => Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));

        // Inicializar centroides con k estudiantes aleatorios distintos (K-Means++)
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        let centroids = shuffled.slice(0, k).map(s => getVector(s));

        let assignments = new Array(students.length).fill(0);

        for (let iter = 0; iter < maxIterations; iter++) {
            // Asignar cada estudiante al centroide más cercano
            const newAssignments = students.map((s) => {
                const vec = getVector(s);
                let minDist = Infinity;
                let closestCluster = 0;
                centroids.forEach((c, ci) => {
                    const dist = distance(vec, c);
                    if (dist < minDist) { minDist = dist; closestCluster = ci; }
                });
                return closestCluster;
            });

            // Verificar convergencia
            if (newAssignments.every((a, i) => a === assignments[i])) break;
            assignments = newAssignments;

            // Recalcular centroides
            centroids = Array.from({ length: k }, (_, ci) => {
                const clusterStudents = students.filter((_, i) => assignments[i] === ci);
                if (clusterStudents.length === 0) return centroids[ci]; // Centroide vacío
                const dim = features.length;
                return Array.from({ length: dim }, (_, fi) => {
                    const vecs = clusterStudents.map(s => normalize(s[features[fi]] || 0, features[fi]));
                    return vecs.reduce((a, b) => a + b, 0) / vecs.length;
                });
            });
        }

        // Etiquetar clusters según el puntaje promedio de cada cluster
        const clusterScores = Array.from({ length: k }, (_, ci) => {
            const members = students.filter((_, i) => assignments[i] === ci);
            const avgScore = members.length > 0 ? members.reduce((s, m) => s + (m.avgScore || 0), 0) / members.length : 0;
            return { ci, avgScore };
        }).sort((a, b) => a.avgScore - b.avgScore); // Ordenar de menor a mayor score

        const CLUSTER_NAMES = ['En Riesgo 🚨', 'En Progreso ⚠️', 'Alto Rendimiento ✅'];
        const CLUSTER_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

        const clusterMap = {};
        clusterScores.forEach(({ ci }, rank) => {
            clusterMap[ci] = { name: CLUSTER_NAMES[rank] || `Cluster ${rank}`, color: CLUSTER_COLORS[rank] };
        });

        // Calcular métricas por cluster (inercia, tamaño)
        const clusterMetrics = {};
        Array.from({ length: k }, (_, ci) => {
            const members = students.filter((_, i) => assignments[i] === ci);
            clusterMetrics[ci] = {
                size: members.length,
                avgScore: members.length > 0 ? Math.round(members.reduce((s, m) => s + (m.avgScore || 0), 0) / members.length) : 0,
                avgXP: members.length > 0 ? Math.round(members.reduce((s, m) => s + (m.totalXP || 0), 0) / members.length) : 0
            };
        });

        return students.map((s, i) => ({
            ...s,
            cluster: assignments[i],
            clusterName: clusterMap[assignments[i]]?.name || 'Desconocido',
            clusterColor: clusterMap[assignments[i]]?.color || '#6b7280',
            clusterMetrics: clusterMetrics[assignments[i]]
        }));
    }
}

module.exports = MLService;

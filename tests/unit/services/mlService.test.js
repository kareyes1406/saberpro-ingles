const mlService = require('../../../services/mlService');

describe('ML Service', () => {
    describe('linearRegression', () => {
        it('debe retornar todos los valores en cero si el arreglo está vacío', () => {
            const result = mlService.linearRegression([]);
            expect(result.slope).toBe(0);
            expect(result.intercept).toBe(0);
            expect(result.projectedScore).toBe(0);
            expect(result.r2).toBe(0);
            expect(result.trendLine).toHaveLength(12);
        });

        it('debe retornar una línea plana (pendiente 0) para un solo punto', () => {
            const result = mlService.linearRegression([{x: 1, y: 50}]);
            expect(result.slope).toBe(0);
            expect(result.intercept).toBe(50);
            expect(result.projectedScore).toBe(50);
        });

        it('debe calcular una pendiente positiva para dos puntos ascendentes con amortiguación', () => {
            const result = mlService.linearRegression([{x: 1, y: 40}, {x: 2, y: 50}]);
            expect(result.slope).toBeGreaterThan(0);
        });

        it('debe calcular correctamente el R2 para múltiples puntos (r2 cercano a 1 para datos perfectos)', () => {
            const result = mlService.linearRegression([
                {x: 1, y: 10}, {x: 2, y: 20}, {x: 3, y: 30}, {x: 4, y: 40}, {x: 5, y: 50}, {x: 6, y: 60}
            ]);
            expect(result.r2).toBeCloseTo(1.0);
            expect(result.slope).toBeGreaterThan(0);
        });

        it('debe limitar (clamp) el puntaje proyectado entre 0 y 100', () => {
            const resultHigh = mlService.linearRegression([
                {x: 1, y: 80}, {x: 2, y: 90}, {x: 3, y: 100}, {x: 4, y: 110}, {x: 5, y: 120}, {x: 6, y: 130}
            ]);
            expect(resultHigh.projectedScore).toBeLessThanOrEqual(100);

            const resultLow = mlService.linearRegression([
                {x: 1, y: 30}, {x: 2, y: 20}, {x: 3, y: 10}, {x: 4, y: 0}, {x: 5, y: -10}, {x: 6, y: -20}
            ]);
            expect(resultLow.projectedScore).toBeGreaterThanOrEqual(0);
        });

        it('debe generar exactamente 12 puntos en el trendLine', () => {
            const result = mlService.linearRegression([{x: 1, y: 50}, {x: 2, y: 60}]);
            expect(result.trendLine).toHaveLength(12);
        });
    });

    describe('logisticRegression', () => {
        it('debe retornar probabilidad > 80 y clasificación "Aprueba" para puntajes altos', () => {
            const result = mlService.logisticRegression({
                avgScore: 90, preTestScore: 85, completedWeeks: 10, currentStreak: 5, avgAttempts: 1, avgTimeSeconds: 300
            });
            expect(result.probability).toBeGreaterThan(80);
            expect(result.classification).toBe('Aprueba');
        });

        it('debe retornar probabilidad < 60 y clasificación "En Riesgo" para puntajes bajos', () => {
            const result = mlService.logisticRegression({
                avgScore: 40, preTestScore: 30, completedWeeks: 2, currentStreak: 0, avgAttempts: 3, avgTimeSeconds: 120
            });
            expect(result.probability).toBeLessThan(60);
            expect(result.classification).toBe('En Riesgo');
        });

        it('debe mantener la probabilidad siempre entre 1 y 99', () => {
            const resultLow = mlService.logisticRegression({
                avgScore: 0, preTestScore: 0, completedWeeks: 0, currentStreak: 0, avgAttempts: 10, avgTimeSeconds: 0
            });
            expect(resultLow.probability).toBeGreaterThanOrEqual(1);
            expect(resultLow.probability).toBeLessThanOrEqual(99);

            const resultHigh = mlService.logisticRegression({
                avgScore: 100, preTestScore: 100, completedWeeks: 12, currentStreak: 12, avgAttempts: 1, avgTimeSeconds: 100
            });
            expect(resultHigh.probability).toBeGreaterThanOrEqual(1);
            expect(resultHigh.probability).toBeLessThanOrEqual(99);
        });

        it('debe generar factor de riesgo "Puntaje Promedio Bajo" si avgScore < 60', () => {
            const result = mlService.logisticRegression({
                avgScore: 55, preTestScore: 60, completedWeeks: 5, currentStreak: 1, avgAttempts: 1, avgTimeSeconds: 300
            });
            expect(result.riskFactors.some(rf => rf.factor.includes('Puntaje Promedio Bajo'))).toBe(true);
        });

        it('debe generar factor de riesgo "Múltiples Reintentos" si avgAttempts > 2.5', () => {
            const result = mlService.logisticRegression({
                avgScore: 70, preTestScore: 60, completedWeeks: 5, currentStreak: 1, avgAttempts: 3, avgTimeSeconds: 300
            });
            expect(result.riskFactors.some(rf => rf.factor.includes('Múltiples Reintentos'))).toBe(true);
        });

        it('debe generar factor de riesgo "Inactividad Reciente" si currentStreak = 0 y completedWeeks > 0', () => {
            const result = mlService.logisticRegression({
                avgScore: 70, preTestScore: 60, completedWeeks: 5, currentStreak: 0, avgAttempts: 1, avgTimeSeconds: 300
            });
            expect(result.riskFactors.some(rf => rf.factor.includes('Inactividad Reciente'))).toBe(true);
        });
    });

    describe('kMeansClustering', () => {
        it('debe clasificar individualmente por puntaje si hay menos de k estudiantes', () => {
            const students = [{ UserID: 1, avgScore: 90, totalXP: 100, completedWeeks: 2, avgAttempts: 1 }];
            const result = mlService.kMeansClustering(students, 3, 10);
            expect(result[0].clusterName).toBeDefined();
            expect(result[0].clusterColor).toBeDefined();
        });

        it('debe agrupar correctamente a 3 grupos claramente separados', () => {
            const students = [
                { UserID: 1, avgScore: 95, totalXP: 1000, completedWeeks: 10, avgAttempts: 1 },
                { UserID: 2, avgScore: 90, totalXP: 950, completedWeeks: 10, avgAttempts: 1 },
                { UserID: 3, avgScore: 65, totalXP: 500, completedWeeks: 5, avgAttempts: 2 },
                { UserID: 4, avgScore: 60, totalXP: 450, completedWeeks: 5, avgAttempts: 2 },
                { UserID: 5, avgScore: 30, totalXP: 100, completedWeeks: 1, avgAttempts: 4 },
                { UserID: 6, avgScore: 25, totalXP: 50, completedWeeks: 1, avgAttempts: 4 },
            ];
            const result = mlService.kMeansClustering(students, 3, 10);
            
            // Los clústeres pueden ser asignados de forma aleatoria, pero los estudiantes similares
            // deben tener el mismo clusterName.
            expect(result[0].clusterName).toBe(result[1].clusterName);
            expect(result[2].clusterName).toBe(result[3].clusterName);
            expect(result[4].clusterName).toBe(result[5].clusterName);
        });

        it('debe asignar nombres de clúster (Alto Rendimiento, En Progreso, En Riesgo) y colores esperados a cada estudiante', () => {
            const students = [{ UserID: 1, avgScore: 90, totalXP: 100, completedWeeks: 2, avgAttempts: 1 }];
            const result = mlService.kMeansClustering(students, 3, 10);
            expect(['Alto Rendimiento ✅', 'En Progreso ⚠️', 'En Riesgo 🚨']).toContain(result[0].clusterName);
            expect(result[0].clusterColor).toBeDefined();
        });

        it('debe retornar un arreglo vacío si se le pasa un arreglo vacío', () => {
            const result = mlService.kMeansClustering([], 3, 10);
            expect(result).toEqual([]);
        });
    });
});

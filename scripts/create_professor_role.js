require('dotenv').config();
const { executeQuery } = require('../config/database');

async function createProfessorRole() {
    try {
        const query = `
            IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'professor')
            BEGIN
                INSERT INTO Roles (RoleName, Description) VALUES ('professor', 'Profesor - Lectura de estadísticas estudiantiles');
            END
        `;
        await executeQuery(query);
        console.log('Professor role created successfully.');
    } catch (error) {
        console.error('Error creating professor role:', error);
    }
}

createProfessorRole();

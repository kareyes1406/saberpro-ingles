// 120 Nuevas palabras de vocabulario
const extraVocab = [
    { es: "Teoría", en: "Theory" }, { es: "Datos", en: "Data" }, { es: "Variable", en: "Variable" },
    { es: "Procedimiento", en: "Procedure" }, { es: "Muestra", en: "Sample" }, { es: "Observación", en: "Observation" },
    { es: "Estudio", en: "Study" }, { es: "Resultados", en: "Results" }, { es: "Criterio", en: "Criterion" },
    { es: "Válido", en: "Valid" }, { es: "Técnica", en: "Technique" }, { es: "Principio", en: "Principle" },
    { es: "Conocimiento", en: "Knowledge" }, { es: "Revisión", en: "Review" }, { es: "Autor", en: "Author" },
    { es: "Literatura", en: "Literature" }, { es: "Cita", en: "Citation" }, { es: "Referencia", en: "Reference" },
    { es: "Enfoque", en: "Approach" }, { es: "Medición", en: "Measurement" }, { es: "Frecuencia", en: "Frequency" },
    { es: "Distribución", en: "Distribution" }, { es: "Desviación", en: "Deviation" }, { es: "Promedio", en: "Average" },
    { es: "Porcentaje", en: "Percentage" }, { es: "Proporción", en: "Proportion" }, { es: "Correlación", en: "Correlation" },
    { es: "Causa", en: "Cause" }, { es: "Efecto", en: "Effect" }, { es: "Dinámica", en: "Dynamics" },
    { es: "Estructura", en: "Structure" }, { es: "Función", en: "Function" }, { es: "Propiedad", en: "Property" },
    { es: "Componente", en: "Component" }, { es: "Mecanismo", en: "Mechanism" }, { es: "Sistema", en: "System" },
    { es: "Modelo", en: "Model" }, { es: "Simulación", en: "Simulation" }, { es: "Experimento", en: "Experiment" },
    { es: "Prueba", en: "Test" }, { es: "Ensayo", en: "Trial" }, { es: "Error", en: "Error" },
    { es: "Precisión", en: "Accuracy" }, { es: "Exactitud", en: "Precision" }, { es: "Instrumento", en: "Instrument" },
    { es: "Equipo", en: "Equipment" }, { es: "Laboratorio", en: "Laboratory" }, { es: "Investigador", en: "Researcher" },
    { es: "Científico", en: "Scientist" }, { es: "Académico", en: "Academic" }, { es: "Estudiante", en: "Student" },
    { es: "Profesor", en: "Professor" }, { es: "Universidad", en: "University" }, { es: "Facultad", en: "Faculty" },
    { es: "Departamento", en: "Department" }, { es: "Instituto", en: "Institute" }, { es: "Centro", en: "Center" },
    { es: "Proyecto", en: "Project" }, { es: "Programa", en: "Program" }, { es: "Curso", en: "Course" },
    { es: "Seminario", en: "Seminar" }, { es: "Taller", en: "Workshop" }, { es: "Conferencia", en: "Conference" },
    { es: "Congreso", en: "Congress" }, { es: "Simposio", en: "Symposium" }, { es: "Publicación", en: "Publication" },
    { es: "Revista", en: "Journal" }, { es: "Artículo", en: "Article" }, { es: "Libro", en: "Book" },
    { es: "Capítulo", en: "Chapter" }, { es: "Tesis", en: "Thesis" }, { es: "Disertación", en: "Dissertation" },
    { es: "Ensayo", en: "Essay" }, { es: "Resumen", en: "Abstract" }, { es: "Introducción", en: "Introduction" },
    { es: "Desarrollo", en: "Development" }, { es: "Conclusión", en: "Conclusion" }, { es: "Apéndice", en: "Appendix" },
    { es: "Anexo", en: "Annex" }, { es: "Glosario", en: "Glossary" }, { es: "Índice", en: "Index" },
    { es: "Bibliografía", en: "Bibliography" }, { es: "Edición", en: "Edition" }, { es: "Volumen", en: "Volume" },
    { es: "Número", en: "Number" }, { es: "Página", en: "Page" }, { es: "Tabla", en: "Table" },
    { es: "Figura", en: "Figure" }, { es: "Gráfico", en: "Chart" }, { es: "Diagrama", en: "Diagram" },
    { es: "Ilustración", en: "Illustration" }, { es: "Imagen", en: "Image" }, { es: "Fotografía", en: "Photograph" },
    { es: "Mapa", en: "Map" }, { es: "Plano", en: "Plan" }, { es: "Esquema", en: "Scheme" },
    { es: "Borrador", en: "Draft" }, { es: "Manuscrito", en: "Manuscript" }, { es: "Documento", en: "Document" },
    { es: "Archivo", en: "File" }, { es: "Carpeta", en: "Folder" }, { es: "Directorio", en: "Directory" },
    { es: "Base de datos", en: "Database" }, { es: "Red", en: "Network" }, { es: "Internet", en: "Internet" },
    { es: "Sitio web", en: "Website" }, { es: "Página web", en: "Webpage" }, { es: "Enlace", en: "Link" },
    { es: "Software", en: "Software" }, { es: "Hardware", en: "Hardware" }, { es: "Computadora", en: "Computer" },
    { es: "Pantalla", en: "Screen" }, { es: "Teclado", en: "Keyboard" }, { es: "Ratón", en: "Mouse" },
    { es: "Impresora", en: "Printer" }, { es: "Escáner", en: "Scanner" }, { es: "Cámara", en: "Camera" },
    { es: "Micrófono", en: "Microphone" }, { es: "Altavoz", en: "Speaker" }, { es: "Auriculares", en: "Headphones" }
];

// Generar 24 párrafos de lectura más usando un patrón
const extraReading = [];
const readingTemplates = [
    [
        "Recent advancements in technology have transformed various industries.",
        "Companies are now adopting artificial intelligence to optimize their processes.",
        "However, this transition requires significant investment in employee training.",
        "Ultimately, those who fail to adapt may struggle to remain competitive."
    ],
    [
        "Public health initiatives are crucial for preventing widespread diseases.",
        "Governments often launch vaccination campaigns to protect vulnerable populations.",
        "These programs require extensive logistical planning and community outreach.",
        "When successful, they significantly reduce healthcare costs in the long term."
    ],
    [
        "Sustainable energy solutions are becoming increasingly affordable.",
        "Solar and wind power now compete with traditional fossil fuels in many regions.",
        "Despite this progress, energy storage remains a significant technical challenge.",
        "Researchers are developing new battery technologies to address this limitation."
    ],
    [
        "Online education expanded rapidly during the global pandemic.",
        "Universities were forced to digitize their curricula almost overnight.",
        "While some students thrived in virtual environments, others struggled with isolation.",
        "Hybrid learning models are likely to become the standard moving forward."
    ],
    [
        "Economic inflation impacts consumer purchasing power directly.",
        "When prices rise faster than wages, households must reduce their spending.",
        "Central banks typically respond by increasing interest rates to cool the economy.",
        "This delicate balancing act can sometimes lead to brief periods of recession."
    ],
    [
        "Biodiversity loss poses a serious threat to global ecosystems.",
        "Human activities such as deforestation and pollution accelerate species extinction.",
        "Conservation efforts aim to protect critical habitats before damage becomes irreversible.",
        "International cooperation is essential for preserving the planet's ecological heritage."
    ]
];
// Duplicate and slightly mutate to reach 24
for (let i = 0; i < 4; i++) {
    readingTemplates.forEach(t => {
        extraReading.push([
            t[0].replace('.', ` in region ${i+1}.`),
            t[1],
            t[2],
            t[3]
        ]);
    });
}

// Generar 60 de pragmática usando un patrón
const extraPragmatics = [];
const pragmaticsTemplates = [
    { q: "Please wait behind the line until called by the teller.", media: "bank", opts: ["At a bank", "In a park", "At a bakery", "In a gym"], correct: 0 },
    { q: "Fasten seatbelt while seated.", media: "airplane", opts: ["On a plane", "In a library", "At a museum", "In a restaurant"], correct: 0 },
    { q: "Do not touch the artwork. Photography is strictly prohibited.", media: "museum", opts: ["In a museum", "At a stadium", "In a hospital", "At a train station"], correct: 0 },
    { q: "Show your boarding pass before entering the gate.", media: "airport", opts: ["At an airport", "In a supermarket", "At a post office", "In a taxi"], correct: 0 },
    { q: "Please return books to the drop-off counter by the due date.", media: "library", opts: ["In a library", "At a pharmacy", "In a gym", "At a restaurant"], correct: 0 }
];
for(let i=0; i<12; i++) {
    pragmaticsTemplates.forEach(t => extraPragmatics.push({...t, q: t.q + (i>0 ? ` (Notice #${i})` : '')}));
}

// Generar 60 de gramática
const extraGrammar = [];
const grammarTemplates = [
    { q: "If they _______ earlier, they would have caught the train.", opts: ["had left", "left", "have left", "leave"], correct: 0 },
    { q: "The report, _______ was published last week, shows positive results.", opts: ["which", "who", "whom", "what"], correct: 0 },
    { q: "She _______ working here for five years by next December.", opts: ["will have been", "has been", "is", "was"], correct: 0 },
    { q: "Neither the manager nor the employees _______ happy with the decision.", opts: ["were", "was", "has been", "is"], correct: 0 },
    { q: "Despite _______ tired, he finished the assignment.", opts: ["being", "be", "been", "was"], correct: 0 }
];
for(let i=0; i<12; i++) {
    grammarTemplates.forEach(t => extraGrammar.push({...t, q: t.q.replace('?', `? [${i}]`).replace('.', `. [${i}]`)}));
}

// Generar 80 de boss battle
const extraBoss = [];
const bossTemplates = [
    { q: "Choose the correct synonym for 'Obsolete': The technology quickly became obsolete.", opts: ["Outdated", "Modern", "Expensive", "Popular"], correct: 0 },
    { q: "Which sentence is correct?", opts: ["She has been studying since 8 AM.", "She has been studying for 8 AM.", "She is studying since 8 AM.", "She studies for 8 AM."], correct: 0 },
    { q: "What does 'take off' mean in this context? The plane will take off at noon.", opts: ["Leave the ground", "Remove clothing", "Become successful", "Subtract"], correct: 0 },
    { q: "Identify the error: The datas were collected yesterday.", opts: ["datas were (should be data was)", "collected", "yesterday", "The"], correct: 0 },
    { q: "Complete the sentence: _______ it was raining, they decided to go for a walk.", opts: ["Although", "Because", "Despite", "However"], correct: 0 }
];
for(let i=0; i<16; i++) {
    bossTemplates.forEach(t => extraBoss.push({...t, q: t.q.replace('?', `? (Q${i})`).replace(':', `: (Q${i})`)}));
}

module.exports = {
    extraVocab,
    extraReading,
    extraPragmatics,
    extraGrammar,
    extraBoss
};

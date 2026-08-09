const { executeQuery, sql } = require('./config/database');
const expanded = require('./content-expansion');

// ── Vocabulario nivel A2-B1 para Saber Pro ──────────────────
const vocabPool = [
    // Academic vocabulary
    { es: "Investigación", en: "Research" },
    { es: "Hipótesis", en: "Hypothesis" },
    { es: "Evidencia", en: "Evidence" },
    { es: "Metodología", en: "Methodology" },
    { es: "Conclusión", en: "Conclusion" },
    { es: "Argumento", en: "Argument" },
    { es: "Perspectiva", en: "Perspective" },
    { es: "Fenómeno", en: "Phenomenon" },
    { es: "Consecuencia", en: "Consequence" },
    { es: "Análisis", en: "Analysis" },
    { es: "Tendencia", en: "Trend" },
    { es: "Impacto", en: "Impact" },
    { es: "Contexto", en: "Context" },
    { es: "Concepto", en: "Concept" },
    { es: "Estrategia", en: "Strategy" },
    { es: "Evaluación", en: "Assessment" },
    { es: "Recurso", en: "Resource" },
    { es: "Propósito", en: "Purpose" },
    { es: "Desafío", en: "Challenge" },
    { es: "Innovación", en: "Innovation" },
    // Social sciences
    { es: "Democracia", en: "Democracy" },
    { es: "Economía", en: "Economy" },
    { es: "Desigualdad", en: "Inequality" },
    { es: "Sostenibilidad", en: "Sustainability" },
    { es: "Globalización", en: "Globalization" },
    { es: "Diversidad", en: "Diversity" },
    { es: "Brechas sociales", en: "Social gaps" },
    { es: "Rendimiento", en: "Performance" },
    { es: "Competencia", en: "Competence" },
    { es: "Infraestructura", en: "Infrastructure" },
];
vocabPool.push(...expanded.extraVocab);

// ── Lecturas de comprensión nivel A2-B1 (orden correcto) ────
const readingPool = [
    [
        "Urban migration has significantly altered demographic patterns in developing countries.",
        "Millions of people relocate from rural to urban areas seeking better economic opportunities.",
        "However, rapid urbanization often outpaces the development of essential infrastructure.",
        "Consequently, many cities struggle to provide adequate housing, sanitation and public services."
    ],
    [
        "The scientific method requires researchers to formulate a clear and testable hypothesis.",
        "Data must be collected systematically through controlled experiments or structured observations.",
        "Results are then analyzed to determine whether the evidence supports or refutes the hypothesis.",
        "Finally, findings are published and subjected to peer review before being accepted as valid."
    ],
    [
        "Access to quality education remains one of the most persistent inequalities in Latin America.",
        "Socioeconomic status strongly determines the type of institution a student can attend.",
        "Public universities attempt to bridge this gap through merit-based scholarship programs.",
        "Nevertheless, structural barriers such as transportation costs and opportunity costs persist."
    ],
    [
        "Climate change represents one of the most complex challenges facing modern societies today.",
        "Rising global temperatures are directly linked to increased concentrations of greenhouse gases.",
        "Governments must implement comprehensive policies that balance economic growth with environmental protection.",
        "Without coordinated international action, the long-term consequences could prove irreversible."
    ],
    [
        "Critical thinking is considered an essential competency for university graduates in the 21st century.",
        "It involves the ability to analyze information objectively and evaluate arguments based on evidence.",
        "Students who develop this skill are better equipped to solve complex problems in their professional lives.",
        "Higher education institutions are increasingly redesigning curricula to foster these analytical abilities."
    ],
    [
        "Artificial intelligence is transforming labor markets across multiple economic sectors worldwide.",
        "Routine cognitive tasks that were previously performed by humans are being automated at a rapid pace.",
        "This displacement requires workers to acquire new skills in order to remain competitive in the job market.",
        "Educational systems must therefore adapt to prepare graduates for roles that do not yet exist today."
    ],
];
readingPool.push(...expanded.extraReading);

// ── Preguntas múltiple opción nivel A2-B1 (Boss Battle) ─────
const mcfPool = [
    {
        q: "Choose the correct sentence: The researchers _______ their findings at the conference last week.",
        opts: ["has presented", "presented", "will present", "are presenting"],
        correct: 1
    },
    {
        q: "Select the word closest in meaning to 'substantial': The study produced _______ evidence in favor of the theory.",
        opts: ["minimal", "considerable", "vague", "irrelevant"],
        correct: 1
    },
    {
        q: "Which connector best completes the sentence? The policy was well-designed; _______, its implementation proved problematic.",
        opts: ["furthermore", "because", "however", "therefore"],
        correct: 2
    },
    {
        q: "Identify the main idea of this excerpt: 'Rapid technological change demands continuous learning. Professionals who fail to update their skills risk becoming obsolete.'",
        opts: [
            "Technology is difficult to understand",
            "Lifelong learning is essential in a changing world",
            "Professionals are not interested in learning",
            "Technology makes work easier"
        ],
        correct: 1
    },
    {
        q: "Which sentence is grammatically correct?",
        opts: [
            "The data was collected during three months of observation",
            "The data were collect during three months of observation",
            "The data has been collecting during three months",
            "The data is collect during three months of observation"
        ],
        correct: 0
    },
    {
        q: "In academic writing, which expression is most appropriate to introduce a counterargument?",
        opts: [
            "I think that...",
            "On the other hand, critics argue that...",
            "Obviously everyone knows that...",
            "In my opinion the best idea is..."
        ],
        correct: 1
    },
    {
        q: "Select the correct form: By 2030, scientists _______ a vaccine for that disease.",
        opts: ["will have developed", "developed", "are developing", "have developed"],
        correct: 0
    },
    {
        q: "Which word correctly completes the sentence? The _______ of the experiment were inconclusive, requiring further investigation.",
        opts: ["outcomes", "incomes", "welcomes", "handouts"],
        correct: 0
    },
    {
        q: "Choose the best paraphrase of: 'The correlation between poverty and academic underperformance has been extensively documented.'",
        opts: [
            "Poor students always fail in school",
            "Multiple studies have shown a link between low income and poor school results",
            "Poverty causes bad behavior in classrooms",
            "Academic success depends only on intelligence"
        ],
        correct: 1
    },
    {
        q: "Which sentence uses the passive voice correctly?",
        opts: [
            "The report was written by the research team",
            "The research team was write the report",
            "The report has write by the research team",
            "The research team written the report"
        ],
        correct: 0
    },
    {
        q: "Choose the option that best completes the text: Although the initial budget was limited, the team _______ to complete the project on schedule.",
        opts: ["managed", "failed", "refused", "delayed"],
        correct: 0
    },
    {
        q: "What is the synonym of 'fundamental' in the phrase 'a fundamental principle of economics'?",
        opts: ["minor", "essential", "secondary", "accidental"],
        correct: 1
    },
    {
        q: "Select the correct conditional sentence: If higher education institutions _______ more in digital infrastructure, student learning would improve.",
        opts: ["invested", "will invest", "invest", "had invest"],
        correct: 0
    },
    {
        q: "Which word best fits: 'The author suggests that renewable energy is _______ to reducing global pollution.'",
        opts: ["crucial", "irrelevant", "optional", "destructive"],
        correct: 0
    },
    {
        q: "Identify the grammatically correct option: Neither the students nor the professor _______ satisfied with the exam results.",
        opts: ["was", "were", "are", "have"],
        correct: 0
    },
    {
        q: "Choose the correct preposition: The academic paper focuses _______ the effects of social media on mental health.",
        opts: ["on", "in", "at", "about"],
        correct: 0
    },
    {
        q: "Select the best paraphrase: 'The hypothesis requires empirical validation before conclusions can be drawn.'",
        opts: [
            "The idea must be tested with real data before accepting any conclusions",
            "Conclusions can be made immediately without testing",
            "Empirical validation is not necessary for scientific research",
            "The hypothesis has already been proven true by scientists"
        ],
        correct: 0
    },
    {
        q: "Which connector indicates a cause-and-effect relationship?",
        opts: ["As a result", "In contrast", "On the other hand", "Similarly"],
        correct: 0
    },
    {
        q: "Complete the sentence: If the government _______ strict environmental laws, pollution levels would decrease significantly.",
        opts: ["enforced", "will enforce", "enforces", "had enforce"],
        correct: 0
    },
    {
        q: "What is the primary function of an abstract in a research paper?",
        opts: [
            "To provide a concise summary of the entire study",
            "To list all the bibliographical references used",
            "To present raw unanalyzed survey data",
            "To criticize previous literature in the field"
        ],
        correct: 0
    }
];
mcfPool.push(...expanded.extraBoss);

// ── Pragmática ("El Coordinador Urbano") ────────────────────
const pragmaticsPool = [
    { q: "Please keep off the grass and do not pick the flowers. Enjoy the nature responsibly.", media: "park", opts: ["In a public park", "In a hospital", "At a train station", "In a library"], correct: 0 },
    { q: "Please maintain absolute silence at all times. No food or drinks are allowed in the study areas.", media: "library", opts: ["In a stadium", "In a library", "At a restaurant", "In a shopping mall"], correct: 1 },
    { q: "Mind the gap between the train and the platform. Stand behind the yellow line for your own safety.", media: "train_station", opts: ["At a bus stop", "At a train station", "At an airport", "In a taxi rank"], correct: 1 },
    { q: "Staff only beyond this point. All visitors must report to the main reception desk before entering.", media: "office", opts: ["In a public restroom", "In a corporate office", "At a public park entrance", "On a highway"], correct: 1 },
    { q: "Emergency Room entrance. Do not block the driveway. For urgent medical attention only.", media: "hospital", opts: ["At a school", "In a hospital", "In a supermarket", "At a cinema"], correct: 1 },
    { q: "Passengers must fasten their seatbelts while seated and stow their tray tables during takeoff.", media: "airplane", opts: ["In an airplane", "In a train", "On a bicycle", "In an elevator"], correct: 0 },
    { q: "Danger: High Voltage. Authorized personnel only. Protective equipment must be worn.", media: "power_plant", opts: ["Near an electrical facility", "At a swimming pool", "In a kindergarten", "At a bakery"], correct: 0 },
    { q: "Please do not tap on the glass or feed the animals, as they are on strict diets.", media: "zoo", opts: ["In a zoo", "At a restaurant", "In a pet shop", "At a concert"], correct: 0 },
    { q: "This machine is currently out of order. We apologize for the inconvenience. Please use the counter.", media: "vending_machine", opts: ["On a broken ATM or machine", "On a new product", "At a theater entrance", "In a meeting room"], correct: 0 },
    { q: "Check-out time is 11:00 AM. Please leave your room keys at the front desk before departing.", media: "hotel", opts: ["In a hotel lobby", "In a parking lot", "At a bus station", "In a supermarket"], correct: 0 },
    { q: "Caution: Wet floor. Cleaning in progress. Please walk slowly to avoid slipping.", media: "corridor", opts: ["In a freshly cleaned hallway", "On a sandy beach", "In a dry desert", "At a soccer field"], correct: 0 },
    { q: "No parking at any time. Violators will be towed at the vehicle owner's expense.", media: "street", opts: ["On a restricted street", "In a private garage", "In a living room", "At a swimming pool"], correct: 0 },
    { q: "Handle with extreme care. Fragile contents inside. Keep this side up during transit.", media: "package", opts: ["On a shipping box", "On a sturdy iron gate", "In a digital email", "On a highway billboard"], correct: 0 },
    { q: "No running, diving, or rough play around the edges. Children must be supervised at all times.", media: "swimming_pool", opts: ["At a public swimming pool", "On a marathon track", "In a shopping mall", "In a hospital"], correct: 0 },
    { q: "Insert coin to start playing. Maximum two players per game session.", media: "arcade", opts: ["On an arcade game machine", "On a modern smartphone", "In a public library", "At a restaurant table"], correct: 0 }
];
pragmaticsPool.push(...expanded.extraPragmatics);

// ── Gramática ("Circuitos y Ensamblaje") ────────────────────
const grammarPool = [
    { q: "The experiment _______ successful if we had controlled the temperature correctly.", opts: ["would have been", "will be", "had been", "is"], correct: 0 },
    { q: "Despite _______ a limited budget, the team managed to deliver high-quality results.", opts: ["having", "have", "had", "to have"], correct: 0 },
    { q: "The data _______ analyzed by the research team last week.", opts: ["were", "was", "is", "have been"], correct: 0 },
    { q: "By the time the project ends, we _______ all our objectives.", opts: ["will have achieved", "have achieved", "are achieving", "achieve"], correct: 0 },
    { q: "The professor recommended that the student _______ more peer-reviewed articles.", opts: ["read", "reads", "to read", "reading"], correct: 0 },
    { q: "Not only _______ the new software improve efficiency, but it also reduces costs.", opts: ["does", "do", "did", "doing"], correct: 0 },
    { q: "If the company _______ more in marketing, their sales would increase.", opts: ["invested", "invests", "will invest", "had invested"], correct: 0 },
    { q: "The manager asked the team whether they _______ the report yet.", opts: ["had finished", "finished", "have finished", "finish"], correct: 0 },
    { q: "Hardly _______ entered the room when the meeting began.", opts: ["had I", "I had", "did I", "I did"], correct: 0 },
    { q: "The researchers found that the new material is highly _______ to heat.", opts: ["resistant", "resistance", "resisted", "resist"], correct: 0 },
    { q: "_______ the bad weather, the event was a great success.", opts: ["In spite of", "Although", "However", "Because"], correct: 0 },
    { q: "The new policy will be implemented _______ January 1st.", opts: ["on", "in", "at", "by"], correct: 0 },
    { q: "She has been working on this project _______ three months.", opts: ["for", "since", "during", "in"], correct: 0 },
    { q: "The CEO, _______ vision transformed the company, is retiring next year.", opts: ["whose", "who", "whom", "which"], correct: 0 },
    { q: "I would rather you _______ mention this to anyone else.", opts: ["didn't", "don't", "won't", "shouldn't"], correct: 0 }
];
grammarPool.push(...expanded.extraGrammar);


async function run() {
    try {
        console.log("=== REEMPLAZANDO CONTENIDO CON PREGUNTAS NIVEL SABER PRO (A2-B1) ===");

        await executeQuery('DELETE FROM UserProgress');
        await executeQuery('DELETE FROM EvaluationResults');
        await executeQuery('DELETE FROM QuestionOptions');
        await executeQuery('DELETE FROM Questions');
        await executeQuery('DELETE FROM Activities');
        await executeQuery('DELETE FROM ModuleWeeks');
        await executeQuery('UPDATE UserGamification SET TotalXP = 0, Level = 1, CurrentStreak = 0, TotalCoins = 0');
        console.log("Tablas limpiadas y progreso reiniciado.");

        const moduleId = 1;

        // Fetch correct ActivityType IDs from database
        const typeRes = await executeQuery('SELECT TypeName, ActivityTypeID FROM ActivityTypes');
        const typesMap = {};
        typeRes.recordset.forEach(row => { typesMap[row.TypeName] = row.ActivityTypeID; });
        
        const vocabTypeId = typesMap['Vocabulary'] || 1;
        const readingTypeId = typesMap['Reading'] || 2;
        const bossTypeId = typesMap['BossBattle'] || 3;
        const pragmaticsTypeId = typesMap['Pragmatics'] || 4;
        const grammarTypeId = typesMap['Grammar'] || 5;

        const weekTitles = [
            "Vocabulario Académico y Científico",
            "Tiempos Verbales en Contexto Formal",
            "Comprensión de Textos Sociales",
            "Corte 1: Evaluación Diagnóstica",
            "Conectores y Cohesión Textual",
            "Lectura Crítica — Nivel Intermedio",
            "Vocabulario de Ciencias Sociales",
            "Corte 2: El Dragón de la Gramática",
            "Voz Pasiva y Estilo Académico",
            "Inferencia y Paráfrasis",
            "Argumentación y Contraargumentación",
            "Corte 3: Evaluación Final Saber Pro"
        ];

        console.log("Creando 12 semanas...");
        const weekPromises = weekTitles.map((title, idx) => {
            const w = idx + 1;
            const isBoss = (w === 4 || w === 8 || w === 12) ? 1 : 0;
            return executeQuery(`
                INSERT INTO ModuleWeeks (ModuleID, WeekNumber, Title, Description, IsEvaluationWeek, IsBossWeek, UnlockXPRequired)
                OUTPUT INSERTED.WeekID, INSERTED.WeekNumber
                VALUES (@ModuleID, @WeekNumber, @Title, @Description, @IsEvaluationWeek, @IsBossWeek, @UnlockXP)
            `, [
                { name: 'ModuleID', type: sql.Int, value: moduleId },
                { name: 'WeekNumber', type: sql.Int, value: w },
                { name: 'Title', type: sql.NVarChar, value: title },
                { name: 'Description', type: sql.NVarChar, value: `Actividades de la semana ${w} — Nivel A2-B1 Saber Pro` },
                { name: 'IsEvaluationWeek', type: sql.Bit, value: isBoss },
                { name: 'IsBossWeek', type: sql.Bit, value: isBoss },
                { name: 'UnlockXP', type: sql.Int, value: (w - 1) * 200 }
            ]);
        });

        const weekResults = await Promise.all(weekPromises);
        const weekMap = {};
        weekResults.forEach(res => {
            const row = res.recordset[0];
            weekMap[row.WeekNumber] = row.WeekID;
        });
        console.log("12 semanas creadas.");

        for (let w = 1; w <= 12; w++) {
            console.log(`Sembrando semana ${w}...`);
            const weekId = weekMap[w];
            const isBossWeek = (w === 4 || w === 8 || w === 12);

            const weekActivityPromises = [];
            for (let a = 1; a <= 20; a++) {
                let typeId = vocabTypeId;
                let mechanic = 'vocabulary_match';
                let title = `Sub-módulo ${a}: Vocabulario Académico`;
                let desc = `Empareja los términos clave del inglés universitario.`;

                if (a === 20) {
                    typeId = bossTypeId;
                    mechanic = 'boss_multiple_choice';
                    title = isBossWeek
                        ? `Jefe de Corte ${Math.ceil(w / 4)}: Evaluación Saber Pro`
                        : `Sub-módulo ${a}: Mini-Evaluación`;
                    desc = `Demuestra tu nivel de inglés frente al Evaluador.`;
                } else if (a % 4 === 2) {
                    typeId = readingTypeId;
                    mechanic = 'drag_drop';
                    title = `Sub-módulo ${a}: Comprensión de Lectura`;
                    desc = `Organiza las oraciones del texto académico en el orden correcto.`;
                } else if (a % 4 === 3) {
                    typeId = pragmaticsTypeId;
                    mechanic = 'pragmatics_map';
                    title = `Sub-módulo ${a}: El Coordinador Urbano`;
                    desc = `Ubica los avisos públicos en los lugares correctos del mapa.`;
                } else if (a % 4 === 0) {
                    typeId = grammarTypeId;
                    mechanic = 'grammar_circuit';
                    title = `Sub-módulo ${a}: Circuitos y Ensamblaje`;
                    desc = `Completa las oraciones correctamente para reactivar los circuitos.`;
                }

                const promise = (async () => {
                    const actRes = await executeQuery(`
                        INSERT INTO Activities (WeekID, ActivityTypeID, Title, Description, XPReward, CoinReward, DifficultyLevel, SortOrder, IsActive)
                        OUTPUT INSERTED.ActivityID
                        VALUES (@WeekID, @ActivityTypeID, @Title, @Description, @XP, @Coins, 2, @SortOrder, 1)
                    `, [
                        { name: 'WeekID', type: sql.Int, value: weekId },
                        { name: 'ActivityTypeID', type: sql.Int, value: typeId },
                        { name: 'Title', type: sql.NVarChar, value: title },
                        { name: 'Description', type: sql.NVarChar, value: desc },
                        { name: 'XP', type: sql.Int, value: a === 20 ? 150 : 40 },
                        { name: 'Coins', type: sql.Int, value: a === 20 ? 35 : 12 },
                        { name: 'SortOrder', type: sql.Int, value: a }
                    ]);
                    const activityId = actRes.recordset[0].ActivityID;

                    if (mechanic === 'vocabulary_match') {
                        const shuffled = [...vocabPool].sort(() => 0.5 - Math.random());
                        const words = shuffled.slice(0, 5);
                        for (let qIdx = 0; qIdx < words.length; qIdx++) {
                            const pair = words[qIdx];
                            const qRes = await executeQuery(`
                                INSERT INTO Questions (ActivityID, QuestionText, QuestionType, SortOrder)
                                OUTPUT INSERTED.QuestionID
                                VALUES (@ActivityID, @QuestionText, 'vocabulary_match', @SortOrder)
                            `, [
                                { name: 'ActivityID', type: sql.Int, value: activityId },
                                { name: 'QuestionText', type: sql.NVarChar, value: pair.es },
                                { name: 'SortOrder', type: sql.Int, value: qIdx + 1 }
                            ]);
                            const questionId = qRes.recordset[0].QuestionID;
                            await executeQuery(`
                                INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                                VALUES (@QuestionID, @OptionText, 1, 1)
                            `, [
                                { name: 'QuestionID', type: sql.Int, value: questionId },
                                { name: 'OptionText', type: sql.NVarChar, value: pair.en }
                            ]);
                        }
                    } else if (mechanic === 'drag_drop') {
                        const paragraph = readingPool[Math.floor(Math.random() * readingPool.length)];
                        const qRes = await executeQuery(`
                            INSERT INTO Questions (ActivityID, QuestionText, QuestionType, SortOrder)
                            OUTPUT INSERTED.QuestionID
                            VALUES (@ActivityID, 'Organiza las oraciones en el orden lógico del texto académico.', 'drag_drop', 1)
                        `, [
                            { name: 'ActivityID', type: sql.Int, value: activityId }
                        ]);
                        const questionId = qRes.recordset[0].QuestionID;
                        for (let oIdx = 0; oIdx < paragraph.length; oIdx++) {
                            await executeQuery(`
                                INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                                VALUES (@QuestionID, @OptionText, 0, @SortOrder)
                            `, [
                                { name: 'QuestionID', type: sql.Int, value: questionId },
                                { name: 'OptionText', type: sql.NVarChar, value: paragraph[oIdx] },
                                { name: 'SortOrder', type: sql.Int, value: oIdx + 1 }
                            ]);
                        }
                    } else if (mechanic === 'boss_multiple_choice') {
                        const selected = [...mcfPool].sort(() => 0.5 - Math.random()).slice(0, 15);
                        for (let qIdx = 0; qIdx < selected.length; qIdx++) {
                            const item = selected[qIdx];
                            const qRes = await executeQuery(`
                                INSERT INTO Questions (ActivityID, QuestionText, QuestionType, SortOrder)
                                OUTPUT INSERTED.QuestionID
                                VALUES (@ActivityID, @QuestionText, 'boss_multiple_choice', @SortOrder)
                            `, [
                                { name: 'ActivityID', type: sql.Int, value: activityId },
                                { name: 'QuestionText', type: sql.NVarChar, value: item.q },
                                { name: 'SortOrder', type: sql.Int, value: qIdx + 1 }
                            ]);
                            const questionId = qRes.recordset[0].QuestionID;
                            for (let oIdx = 0; oIdx < item.opts.length; oIdx++) {
                                await executeQuery(`
                                    INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                                    VALUES (@QuestionID, @OptionText, @IsCorrect, @SortOrder)
                                `, [
                                    { name: 'QuestionID', type: sql.Int, value: questionId },
                                    { name: 'OptionText', type: sql.NVarChar, value: item.opts[oIdx] },
                                    { name: 'IsCorrect', type: sql.Bit, value: oIdx === item.correct },
                                    { name: 'SortOrder', type: sql.Int, value: oIdx + 1 }
                                ]);
                            }
                        }
                    } else if (mechanic === 'pragmatics_map') {
                        const selected = [...pragmaticsPool].sort(() => 0.5 - Math.random()).slice(0, 5);
                        for (let qIdx = 0; qIdx < selected.length; qIdx++) {
                            const item = selected[qIdx];
                            const qRes = await executeQuery(`
                                INSERT INTO Questions (ActivityID, QuestionText, QuestionType, MediaUrl, SortOrder)
                                OUTPUT INSERTED.QuestionID
                                VALUES (@ActivityID, @QuestionText, 'pragmatics_map', @MediaUrl, @SortOrder)
                            `, [
                                { name: 'ActivityID', type: sql.Int, value: activityId },
                                { name: 'QuestionText', type: sql.NVarChar, value: item.q },
                                { name: 'MediaUrl', type: sql.NVarChar, value: item.media },
                                { name: 'SortOrder', type: sql.Int, value: qIdx + 1 }
                            ]);
                            const questionId = qRes.recordset[0].QuestionID;
                            for (let oIdx = 0; oIdx < item.opts.length; oIdx++) {
                                await executeQuery(`
                                    INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                                    VALUES (@QuestionID, @OptionText, @IsCorrect, @SortOrder)
                                `, [
                                    { name: 'QuestionID', type: sql.Int, value: questionId },
                                    { name: 'OptionText', type: sql.NVarChar, value: item.opts[oIdx] },
                                    { name: 'IsCorrect', type: sql.Bit, value: oIdx === item.correct },
                                    { name: 'SortOrder', type: sql.Int, value: oIdx + 1 }
                                ]);
                            }
                        }
                    } else if (mechanic === 'grammar_circuit') {
                        const selected = [...grammarPool].sort(() => 0.5 - Math.random()).slice(0, 5);
                        for (let qIdx = 0; qIdx < selected.length; qIdx++) {
                            const item = selected[qIdx];
                            const qRes = await executeQuery(`
                                INSERT INTO Questions (ActivityID, QuestionText, QuestionType, SortOrder)
                                OUTPUT INSERTED.QuestionID
                                VALUES (@ActivityID, @QuestionText, 'grammar_circuit', @SortOrder)
                            `, [
                                { name: 'ActivityID', type: sql.Int, value: activityId },
                                { name: 'QuestionText', type: sql.NVarChar, value: item.q },
                                { name: 'SortOrder', type: sql.Int, value: qIdx + 1 }
                            ]);
                            const questionId = qRes.recordset[0].QuestionID;
                            for (let oIdx = 0; oIdx < item.opts.length; oIdx++) {
                                await executeQuery(`
                                    INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                                    VALUES (@QuestionID, @OptionText, @IsCorrect, @SortOrder)
                                `, [
                                    { name: 'QuestionID', type: sql.Int, value: questionId },
                                    { name: 'OptionText', type: sql.NVarChar, value: item.opts[oIdx] },
                                    { name: 'IsCorrect', type: sql.Bit, value: oIdx === item.correct },
                                    { name: 'SortOrder', type: sql.Int, value: oIdx + 1 }
                                ]);
                            }
                        }
                    }
                })();
                weekActivityPromises.push(promise);
            }

            await Promise.all(weekActivityPromises);
            console.log(`  Semana ${w} lista.`);
        }

        console.log("=== ✅ CONTENIDO NIVEL A2-B1 SABER PRO INSERTADO EXITOSAMENTE ===");
    } catch (e) {
        console.error("Error sembrando contenido:", e);
    } finally {
        process.exit();
    }
}

run();

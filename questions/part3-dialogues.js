const part3Dialogues = [
    {
        id: 'Q071',
        speaker: 'Would you like another cup of tea?',
        options: [
            'Yes, please. That\'s very kind.',
            'No, I am playing soccer.',
            'It is next to the bank.'
        ],
        correct: 0,
        explanation: 'La fórmula \'Would you like...?\' es una oferta de cortesía. La respuesta pragmáticamente adecuada para aceptar es \'Yes, please\' acompañada de una expresión cortés. Las opciones B y C son incoherentes con la situación.'
    },
    {
        id: 'Q072',
        speaker: 'How often do you go to the gym?',
        options: [
            'Twice a week.',
            'Since last Friday.',
            'About two miles.'
        ],
        correct: 0,
        explanation: '\'How often...?\' indaga sobre frecuencia temporal. \'Twice a week\' (dos veces por semana) responde exactamente a la frecuencia.'
    },
    {
        id: 'Q073',
        speaker: 'I\'m sorry, I forgot to bring your notes today.',
        options: [
            'Don\'t worry about it. Tomorrow is fine.',
            'Yes, I am happy.',
            'You are welcome.'
        ],
        correct: 0,
        explanation: 'Ante una disculpa (\'I\'m sorry...\'), la convención social adecuada es restar importancia al error de manera comprensiva (\'Don\'t worry about it\').'
    },
    {
        id: 'Q074',
        speaker: 'Shall we go to the cinema tonight?',
        options: [
            'Great idea! What movie is on?',
            'I am 20 years old.',
            'It was very expensive yesterday.'
        ],
        correct: 0,
        explanation: '\'Shall we...?\' es una sugerencia o invitación para realizar una actividad conjunta. \'Great idea!\' acepta con entusiasmo y formula una pregunta relevante sobre la cartelera.'
    },
    {
        id: 'Q075',
        speaker: 'How much does this blue jacket cost?',
        options: [
            'It\'s $45 dollars.',
            'It is made in Italy.',
            'Size medium, please.'
        ],
        correct: 0,
        explanation: '\'How much does it cost?\' pregunta por el precio de una mercancía. \'It\'s $45 dollars\' responde con el valor monetario.'
    },
    {
        id: 'Q076',
        speaker: 'Can you lend me your dictionary for five minutes?',
        options: [
            'Sure, here you go.',
            'I have two sisters.',
            'No, it is sunny.'
        ],
        correct: 0,
        explanation: 'A una petición de préstamo cortés (\'Can you lend me...?\'), la respuesta natural afirmativa es \'Sure, here you go\' (Claro, aquí tienes).'
    },
    {
        id: 'Q077',
        speaker: 'Have a great weekend!',
        options: [
            'Thanks, you too!',
            'I went by train.',
            'It is on Monday.'
        ],
        correct: 0,
        explanation: 'Al recibir un deseo de buen fin de semana, la fórmula recíproca de cortesía es \'Thanks, you too!\' (Gracias, ¡tú también!).'
    },
    {
        id: 'Q078',
        speaker: 'What is your new English teacher like?',
        options: [
            'She is very patient and friendly.',
            'She likes drinking coffee.',
            'She is teaching right now.'
        ],
        correct: 0,
        explanation: '\'What is [person] like?\' indaga por la personalidad o descripción de alguien (\'patient and friendly\'), a diferencia de \'What does she like?\' que preguntaría por gustos.'
    },
    {
        id: 'Q079',
        speaker: 'Is it okay if I open the window?',
        options: [
            'Not at all, go ahead.',
            'Because it was raining.',
            'At three o\'clock.'
        ],
        correct: 0,
        explanation: 'Al pedir permiso (\'Is it okay if...?\'), \'Not at all, go ahead\' expresa que no causa molestia alguna y autoriza la acción.'
    },
    {
        id: 'Q080',
        speaker: 'Where is the nearest metro station?',
        options: [
            'Just two blocks down this street on your right.',
            'The train leaves at noon.',
            'I bought a ticket.'
        ],
        correct: 0,
        explanation: '\'Where is...?\' solicita indicaciones de ubicación espacial. \'Just two blocks down...\' proporciona la dirección exacta.'
    },
    {
        id: 'Q081',
        speaker: 'Did you manage to finish the quarterly budget report?',
        options: [
            'Almost, I just need thirty more minutes.',
            'It costs ten dollars.',
            'I usually travel by car.'
        ],
        correct: 0,
        explanation: '\'Did you manage to finish...?\' indaga por el estado de culminación de una tarea laboral. \'Almost, I just need thirty more minutes\' responde informando el progreso.'
    },
    {
        id: 'Q082',
        speaker: 'I think we should postpone the team meeting until next Tuesday.',
        options: [
            'I agree, several colleagues are out of the office today.',
            'Yes, I like meeting new people.',
            'It is raining outside.'
        ],
        correct: 0,
        explanation: 'Ante una propuesta de aplazamiento (\'we should postpone...\'), \'I agree\' valida la idea sustentándola con un motivo laboral congruente.'
    },
    {
        id: 'Q083',
        speaker: 'Could you please send me the presentation slides before the call?',
        options: [
            'I will email them to you right away.',
            'The call was yesterday.',
            'I prefer taking the stairs.'
        ],
        correct: 0,
        explanation: '\'Could you please send me...?\' es una solicitud de archivo. \'I will email them to you right away\' confirma el envío inmediato por correo.'
    },
    {
        id: 'Q084',
        speaker: 'What do you think about the candidate\'s interview performance?',
        options: [
            'Her technical knowledge was really impressive.',
            'She wore blue shoes.',
            'The building has ten floors.'
        ],
        correct: 0,
        explanation: '\'What do you think about...?\' solicita una opinión evaluativa sobre un candidato laboral. La respuesta destaca sus conocimientos técnicos.'
    },
    {
        id: 'Q085',
        speaker: 'I\'m not sure which software license we should purchase.',
        options: [
            'Let\'s compare their technical features first.',
            'I bought a sandwich for lunch.',
            'The printer is out of paper.'
        ],
        correct: 0,
        explanation: 'Ante una duda de decisión técnica, sugerir comparar características (\'Let\'s compare their technical features first\') es el curso de acción colaborativo y lógico.'
    },
    {
        id: 'Q086',
        speaker: 'Has the client approved the final project contract yet?',
        options: [
            'Not yet, they are still reviewing the legal terms.',
            'The contract is printed in black ink.',
            'He is thirty years old.'
        ],
        correct: 0,
        explanation: '\'Has the client approved... yet?\' es una pregunta de verificación de estado. \'Not yet, they are still reviewing...\' responde con el estado actual del proceso.'
    },
    {
        id: 'Q087',
        speaker: 'How was the international engineering conference in Boston?',
        options: [
            'Very productive. We made several useful professional contacts.',
            'Boston is in the United States.',
            'I bought two suitcases.'
        ],
        correct: 0,
        explanation: 'Al evaluar la experiencia en un evento profesional (\'How was...?\'), se califica la utilidad y los contactos obtenidos (\'Very productive...\').'
    },
    {
        id: 'Q088',
        speaker: 'Excuse me, is this seat taken?',
        options: [
            'No, it\'s free. Feel free to sit down.',
            'I took it yesterday.',
            'The chair is made of wood.'
        ],
        correct: 0,
        explanation: 'La pregunta cotidiana \'is this seat taken?\' (¿está ocupado este asiento?) se responde aclarando si está disponible (\'No, it\'s free\').'
    },
    {
        id: 'Q089',
        speaker: 'We have exceeded our monthly cloud storage capacity.',
        options: [
            'We should upgrade to a business plan or archive old files.',
            'The weather is very cloudy today.',
            'I like listening to music.'
        ],
        correct: 0,
        explanation: 'Ante el problema de almacenamiento en la nube (\'exceeded cloud storage\'), se propone una solución técnica y operativa inmediata.'
    },
    {
        id: 'Q090',
        speaker: 'Thank you so much for mentoring me during my internship.',
        options: [
            'It was my pleasure. You did a fantastic job!',
            'You must finish your work.',
            'Tomorrow is a holiday.'
        ],
        correct: 0,
        explanation: 'Ante un agradecimiento profesional por tutoría (\'Thank you for mentoring me\'), la respuesta protocolaria y cordial es \'It was my pleasure\'.'
    },
    {
        id: 'Q091',
        speaker: 'Can you check the tire pressure before we start the trip?',
        options: [
            'Sure, I\'ll do that right away.',
            'The car is blue.',
            'We left at five.'
        ],
        correct: 0,
        explanation: 'A la solicitud técnica de revisar la presión de neumáticos, la confirmación afirmativa e inmediata es \'Sure, I\'ll do that right away\'.'
    },
    {
        id: 'Q092',
        speaker: 'Why is the office internet connection so slow this morning?',
        options: [
            'The technicians are upgrading the main router.',
            'Because it is Friday.',
            'I have three computers.'
        ],
        correct: 0,
        explanation: '\'Why is...?\' solicita una causa o motivo del fallo técnico. La explicación técnica coherente es que los técnicos están actualizando el enrutador.'
    },
    {
        id: 'Q093',
        speaker: 'Do you prefer working individually or in a team?',
        options: [
            'I enjoy collaborating in a team because we share ideas.',
            'I work from 8 AM to 5 PM.',
            'My team won the football match.'
        ],
        correct: 0,
        explanation: '\'Do you prefer A or B?\' es una pregunta de opción de preferencia laboral. Se responde eligiendo una modalidad y justificándola.'
    },
    {
        id: 'Q094',
        speaker: 'Where should we store the new inventory boxes?',
        options: [
            'Place them in warehouse aisle number 4.',
            'The boxes were expensive.',
            'There are ten boxes.'
        ],
        correct: 0,
        explanation: '\'Where should we store...?\' requiere una ubicación física precisa en la bodega o almacén (\'warehouse aisle number 4\').'
    },
    {
        id: 'Q095',
        speaker: 'I didn\'t understand the safety instructions for operating this machine.',
        options: [
            'Let me demonstrate how it works step by step.',
            'The machine is made in Japan.',
            'Safety is spelled with six letters.'
        ],
        correct: 0,
        explanation: 'Al expresar incomprensión de normas operativas de maquinaria, la ayuda adecuada es una demostración práctica paso a paso.'
    },
    {
        id: 'Q096',
        speaker: 'What time does the courier service pick up outgoing packages?',
        options: [
            'Every afternoon around 4:30 PM.',
            'The package is heavy.',
            'To the customer\'s address.'
        ],
        correct: 0,
        explanation: '\'What time...?\' pregunta por la hora programada de recolección de paquetes en logística (\'Every afternoon around 4:30 PM\').'
    },
    {
        id: 'Q097',
        speaker: 'Are you ready to present your technical proposal?',
        options: [
            'Yes, everything is set up and loaded.',
            'I like presenting gifts.',
            'The projector is black.'
        ],
        correct: 0,
        explanation: '\'Are you ready...?\' pregunta por el estado de preparación para exponer. \'Yes, everything is set up\' confirma la disposición técnica completa.'
    },
    {
        id: 'Q098',
        speaker: 'How long will it take to repair the water pump?',
        options: [
            'It should be running again by tomorrow morning.',
            'The pipe is two meters long.',
            'Water is clear.'
        ],
        correct: 0,
        explanation: '\'How long will it take...?\' pregunta por la duración temporal estimada de una reparación. \'It should be running again by tomorrow morning\' da el tiempo previsto.'
    },
    {
        id: 'Q099',
        speaker: 'Could you print five extra copies of this manual?',
        options: [
            'No problem, I\'ll bring them to your desk shortly.',
            'I can read books.',
            'The manual is in English.'
        ],
        correct: 0,
        explanation: 'A la solicitud de copias impresas adicionales, responder con disposición servicial (\'No problem, I\'ll bring them...\') es pragmáticamente idóneo.'
    },
    {
        id: 'Q100',
        speaker: 'Who is in charge of quality control in this section?',
        options: [
            'Engineer Martinez oversees all inspections here.',
            'The product has high quality.',
            'In the main office.'
        ],
        correct: 0,
        explanation: '\'Who is in charge...?\' pregunta por la persona responsable de un área. Se responde identificando al supervisor encargado (\'Engineer Martinez...\').'
    },
    {
        id: 'Q101',
        speaker: 'Do you think we will meet the project deadline?',
        options: [
            'Yes, as long as we finish the testing phase on time.',
            'The calendar is on the wall.',
            'I bought a new watch.'
        ],
        correct: 0,
        explanation: 'Al evaluar el cumplimiento de una fecha límite (\'project deadline\'), se emite un juicio condicionado al avance de la fase crítica de pruebas.'
    },
    {
        id: 'Q102',
        speaker: 'Would you mind reviewing this draft before I submit it?',
        options: [
            'Not at all, send it over and I\'ll take a look.',
            'Yes, I mind a lot.',
            'The paper is white.'
        ],
        correct: 0,
        explanation: 'A la pregunta cortés \'Would you mind...?\' (¿te importaría/te molestaría...?), responder \'Not at all\' significa que con gusto se realizará la revisión.'
    },
    {
        id: 'Q103',
        speaker: 'Did the spare parts arrive from the supplier?',
        options: [
            'Yes, they arrived this morning and are in the storeroom.',
            'The supplier lives in another city.',
            'Parts are made of plastic.'
        ],
        correct: 0,
        explanation: 'Se pregunta si llegaron los repuestos (\'Did the spare parts arrive?\'). La respuesta confirma su llegada y su ubicación actual.'
    },
    {
        id: 'Q104',
        speaker: 'What would you like to order for dessert?',
        options: [
            'I\'ll have the chocolate cake and an espresso, please.',
            'The waiter was friendly.',
            'I already paid the bill.'
        ],
        correct: 0,
        explanation: 'Al preguntar qué desea pedir de postre (\'order for dessert\'), se responde seleccionando el ítem de comida (\'chocolate cake\') con cortesía.'
    },
    {
        id: 'Q105',
        speaker: 'We need someone to lead the workshop on artificial intelligence.',
        options: [
            'Dr. Ramirez has extensive research experience in that field.',
            'Computers use electricity.',
            'The workshop room has twenty chairs.'
        ],
        correct: 0,
        explanation: 'Al plantear la necesidad de un líder para un taller de IA, se propone un candidato calificado con experiencia investigativa pertinente.'
    }
];

module.exports = part3Dialogues;

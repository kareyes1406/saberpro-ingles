const part2Matching = [
    {
        setId: 1,
        theme: 'Food and Kitchen',
        source: 'Saber 11 (ICFES)',
        words: ['Apple', 'Bread', 'Fork', 'Knife', 'Milk', 'Soup', 'Sugar', 'Water'],
        questions: [
            {
                id: 'Q036',
                definition: 'You use this sharp metal tool to cut meat, bread, or fruit.',
                correctIndex: 3,
                correctWord: 'Knife',
                explanation: '\'Knife\' (cuchillo) es el instrumento afilado de metal (\'sharp metal tool\') utilizado para cortar alimentos (\'cut meat, bread, or fruit\').'
            },
            {
                id: 'Q037',
                definition: 'A white liquid produced by cows that people drink or use to make cheese.',
                correctIndex: 4,
                correctWord: 'Milk',
                explanation: '\'Milk\' (leche) es el líquido blanco producido por las vacas (\'white liquid produced by cows\') base para elaborar queso (\'make cheese\').'
            },
            {
                id: 'Q038',
                definition: 'A round sweet fruit with red, green, or yellow skin that grows on trees.',
                correctIndex: 0,
                correctWord: 'Apple',
                explanation: '\'Apple\' (manzana) es una fruta dulce y redonda (\'round sweet fruit\') con cáscara roja, verde o amarilla que crece en árboles.'
            },
            {
                id: 'Q039',
                definition: 'A hot liquid food usually made by boiling vegetables, meat, or fish in water.',
                correctIndex: 5,
                correctWord: 'Soup',
                explanation: '\'Soup\' (sopa) es un alimento líquido caliente (\'hot liquid food\') preparado hirviendo verduras, carne o pescado en agua.'
            },
            {
                id: 'Q040',
                definition: 'A sweet white or brown substance added to coffee, tea, and desserts.',
                correctIndex: 6,
                correctWord: 'Sugar',
                explanation: '\'Sugar\' (azúcar) es la sustancia dulce blanca o morena (\'sweet white or brown substance\') utilizada para endulzar bebidas y postres.'
            }
        ]
    },
    {
        setId: 2,
        theme: 'Places in a Town / City',
        source: 'Saber 11 (ICFES)',
        words: ['Bank', 'Cinema', 'Hospital', 'Hotel', 'Library', 'Museum', 'Park', 'Pharmacy'],
        questions: [
            {
                id: 'Q041',
                definition: 'A place where you can borrow books or study in a quiet environment.',
                correctIndex: 4,
                correctWord: 'Library',
                explanation: '\'Library\' (biblioteca) es el lugar destinado al préstamo de libros (\'borrow books\') y estudio en silencio.'
            },
            {
                id: 'Q042',
                definition: 'You go to this building to see doctors and nurses when you are seriously ill or injured.',
                correctIndex: 2,
                correctWord: 'Hospital',
                explanation: '\'Hospital\' (hospital) es el centro de atención médica donde laboran médicos y enfermeros para personas enfermas (\'seriously ill\').'
            },
            {
                id: 'Q043',
                definition: 'An open green public area where children play and people walk their dogs.',
                correctIndex: 6,
                correctWord: 'Park',
                explanation: '\'Park\' (parque) es un área verde pública abierta (\'open green public area\') de recreación y paseo.'
            },
            {
                id: 'Q044',
                definition: 'A financial institution where people keep their savings and withdraw cash.',
                correctIndex: 0,
                correctWord: 'Bank',
                explanation: '\'Bank\' (banco) es la entidad financiera donde se custodia dinero (\'savings\') y se retira efectivo (\'withdraw cash\').'
            },
            {
                id: 'Q045',
                definition: 'A large building where historical artifacts, ancient art, and scientific objects are displayed.',
                correctIndex: 5,
                correctWord: 'Museum',
                explanation: '\'Museum\' (museo) es el espacio cultural donde se exhiben piezas históricas, arte y objetos científicos (\'artifacts displayed\').'
            }
        ]
    },
    {
        setId: 3,
        theme: 'Professions and Occupations',
        source: 'Saber Pro (ICFES)',
        words: ['Architect', 'Chef', 'Dentist', 'Engineer', 'Journalist', 'Mechanic', 'Pilot', 'Teacher'],
        questions: [
            {
                id: 'Q046',
                definition: 'A qualified professional who designs and constructs buildings and houses.',
                correctIndex: 0,
                correctWord: 'Architect',
                explanation: '\'Architect\' (arquitecto) es el profesional especializado en el diseño y planos de edificaciones (\'designs buildings\').'
            },
            {
                id: 'Q047',
                definition: 'A person whose job is to repair vehicle engines, brakes, and electrical systems.',
                correctIndex: 5,
                correctWord: 'Mechanic',
                explanation: '\'Mechanic\' (mecánico) es la persona encargada de reparar motores y sistemas mecánicos automotrices (\'repair engines\').'
            },
            {
                id: 'Q048',
                definition: 'A medical specialist who checks, cleans, and repairs your teeth.',
                correctIndex: 2,
                correctWord: 'Dentist',
                explanation: '\'Dentist\' (odontólogo/dentista) es el profesional de la salud dedicado al cuidado y tratamiento de los dientes (\'repairs your teeth\').'
            },
            {
                id: 'Q049',
                definition: 'This professional flies aeroplanes and helicopters to transport passengers or cargo.',
                correctIndex: 6,
                correctWord: 'Pilot',
                explanation: '\'Pilot\' (piloto) es quien comanda aeronaves (\'flies aeroplanes\') para transportar pasajeros o carga.'
            },
            {
                id: 'Q050',
                definition: 'A person who investigates news stories and writes articles for newspapers, websites, or TV.',
                correctIndex: 4,
                correctWord: 'Journalist',
                explanation: '\'Journalist\' (periodista) es quien investiga noticias y redacta artículos informativos (\'investigates news stories\').'
            }
        ]
    },
    {
        setId: 4,
        theme: 'Technology and Computing',
        source: 'Saber Pro (ICFES)',
        words: ['Headphones', 'Keyboard', 'Laptop', 'Microphone', 'Monitor', 'Mouse', 'Printer', 'Router'],
        questions: [
            {
                id: 'Q051',
                definition: 'A portable computer with an integrated screen and battery that you can carry easily.',
                correctIndex: 2,
                correctWord: 'Laptop',
                explanation: '\'Laptop\' (computador portátil) es una computadora compacta con pantalla y batería integradas para fácil transporte.'
            },
            {
                id: 'Q052',
                definition: 'A hardware device with keys and letters used to type text and commands into a computer.',
                correctIndex: 1,
                correctWord: 'Keyboard',
                explanation: '\'Keyboard\' (teclado) es el periférico de entrada con teclas alfanuméricas (\'keys and letters\') para escribir texto.'
            },
            {
                id: 'Q053',
                definition: 'An output machine that transfers digital text and images onto physical sheets of paper.',
                correctIndex: 6,
                correctWord: 'Printer',
                explanation: '\'Printer\' (impresora) es el dispositivo que plasma documentos digitales en papel físico (\'transfers onto sheets of paper\').'
            },
            {
                id: 'Q054',
                definition: 'An audio device worn over or inside your ears to listen to music privately.',
                correctIndex: 0,
                correctWord: 'Headphones',
                explanation: '\'Headphones\' (audífonos/auriculares) son dispositivos auditivos individuales que se colocan sobre o dentro de los oídos.'
            },
            {
                id: 'Q055',
                definition: 'A network device that forwards data packets between computer networks and provides Wi-Fi.',
                correctIndex: 7,
                correctWord: 'Router',
                explanation: '\'Router\' (enrutador) es el equipo de red que distribuye paquetes de datos y emite señal de internet inalámbrico (Wi-Fi).'
            }
        ]
    },
    {
        setId: 5,
        theme: 'Sports and Free Time',
        source: 'Saber TyT (ICFES)',
        words: ['Basketball', 'Cycling', 'Gymnastics', 'Running', 'Skiing', 'Swimming', 'Tennis', 'Volleyball'],
        questions: [
            {
                id: 'Q056',
                definition: 'A water sport where you move your arms and legs to propel yourself through a pool or lake.',
                correctIndex: 5,
                correctWord: 'Swimming',
                explanation: '\'Swimming\' (natación) es la disciplina acuática que consiste en desplazarse en el agua mediante movimientos coordinados de brazos y piernas.'
            },
            {
                id: 'Q057',
                definition: 'A racket sport played by two or four players hitting a yellow felt ball over a central net.',
                correctIndex: 6,
                correctWord: 'Tennis',
                explanation: '\'Tennis\' (tenis) es el deporte de raqueta donde se golpea una pelota sobre una red divisoria.'
            },
            {
                id: 'Q058',
                definition: 'An outdoor winter activity where you glide across snow using long narrow boards attached to boots.',
                correctIndex: 4,
                correctWord: 'Skiing',
                explanation: '\'Skiing\' (esquí) es el deporte invernal de deslizamiento sobre nieve mediante tablas alargadas (\'boards attached to boots\').'
            },
            {
                id: 'Q059',
                definition: 'The activity or sport of riding a bicycle on roads, trails, or velodromes.',
                correctIndex: 1,
                correctWord: 'Cycling',
                explanation: '\'Cycling\' (ciclismo) es la práctica de montar y desplazarse en bicicleta (\'riding a bicycle\').'
            },
            {
                id: 'Q060',
                definition: 'A team sport where players score points by throwing an orange ball through an elevated hoop and net.',
                correctIndex: 0,
                correctWord: 'Basketball',
                explanation: '\'Basketball\' (baloncesto) es el deporte colectivo donde se encesta un balón naranja en un aro con red elevado.'
            }
        ]
    },
    {
        setId: 6,
        theme: 'Health, Body and Wellness',
        source: 'Saber TyT (ICFES)',
        words: ['Bandage', 'Brain', 'Fever', 'Heart', 'Lungs', 'Pill', 'Stomach', 'Thermometer'],
        questions: [
            {
                id: 'Q061',
                definition: 'The organ inside your chest that continuously pumps blood throughout your whole body.',
                correctIndex: 3,
                correctWord: 'Heart',
                explanation: '\'Heart\' (corazón) es el órgano muscular vital que bombea sangre a todo el organismo (\'pumps blood\').'
            },
            {
                id: 'Q062',
                definition: 'An instrument used to measure a patient\'s internal body temperature.',
                correctIndex: 7,
                correctWord: 'Thermometer',
                explanation: '\'Thermometer\' (termómetro) es el dispositivo médico empleado para medir la temperatura corporal.'
            },
            {
                id: 'Q063',
                definition: 'A condition where your body temperature rises higher than normal, usually due to an infection.',
                correctIndex: 2,
                correctWord: 'Fever',
                explanation: '\'Fever\' (fiebre) es el aumento de la temperatura corporal por encima de los valores fisiológicos normales.'
            },
            {
                id: 'Q064',
                definition: 'A strip of fabric or elastic material wrapped around a wound or joint to protect it.',
                correctIndex: 0,
                correctWord: 'Bandage',
                explanation: '\'Bandage\' (venda) es la tira de tela o material compresivo que sujeta o protege heridas y articulaciones.'
            },
            {
                id: 'Q065',
                definition: 'The pair of organs in your chest responsible for taking in oxygen and expelling carbon dioxide.',
                correctIndex: 4,
                correctWord: 'Lungs',
                explanation: '\'Lungs\' (pulmones) son el par de órganos respiratorios encargados del intercambio de oxígeno y dióxido de carbono.'
            }
        ]
    },
    {
        setId: 7,
        theme: 'Travel and Tourism',
        source: 'Saber Pro (ICFES)',
        words: ['Backpack', 'Guidebook', 'Passport', 'Souvenir', 'Suitcase', 'Ticket', 'Train', 'Visa'],
        questions: [
            {
                id: 'Q066',
                definition: 'An official government document containing your photo and identity details required for international travel.',
                correctIndex: 2,
                correctWord: 'Passport',
                explanation: '\'Passport\' (pasaporte) es el documento oficial de identidad internacional emitido por un gobierno para salir e ingresar a países.'
            },
            {
                id: 'Q067',
                definition: 'A large rectangular bag with wheels and a handle used for carrying clothes on trips.',
                correctIndex: 4,
                correctWord: 'Suitcase',
                explanation: '\'Suitcase\' (maleta) es el equipaje rígido o semirrígido con ruedas y asa para transportar ropa en viajes.'
            },
            {
                id: 'Q068',
                definition: 'A small object bought or kept to remind you of a holiday or visit to a special place.',
                correctIndex: 3,
                correctWord: 'Souvenir',
                explanation: '\'Souvenir\' (recuerdo/suvenir) es un objeto representativo que se compra durante un viaje como memoria del lugar.'
            },
            {
                id: 'Q069',
                definition: 'A printed or digital voucher that gives you the right to travel on a bus, train, or airplane.',
                correctIndex: 5,
                correctWord: 'Ticket',
                explanation: '\'Ticket\' (boleto/pasaje) es el comprobante que autoriza el embarque o acceso a un medio de transporte.'
            },
            {
                id: 'Q070',
                definition: 'An official stamp or endorsement placed in a passport permitting entry into a specific foreign country.',
                correctIndex: 7,
                correctWord: 'Visa',
                explanation: '\'Visa\' (visa) es la autorización consular estampada en el pasaporte que permite la entrada y permanencia temporal en un país extranjero.'
            }
        ]
    }
];

module.exports = part2Matching;

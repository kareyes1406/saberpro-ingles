const part1Notices = [
    {
        id: 'Q001',
        notice: 'PLEASE DO NOT FEED THE ANIMALS IN THE CAGES',
        question: 'Where can you see this notice?',
        options: ['In a zoo', 'In a bank', 'In a library'],
        correct: 0,
        explanation: 'El aviso hace referencia explícita a \'animals in the cages\' (animales en las jaulas) y la prohibición de alimentarlos (\'do not feed\'), lo cual es una instrucción normativa típica de un zoológico (\'zoo\').'
    },
    {
        id: 'Q002',
        notice: 'SILENCE PLEASE\nEXAMS IN PROGRESS',
        question: 'Where can you see this notice?',
        options: ['In a supermarket', 'In a school', 'In a park'],
        correct: 1,
        explanation: 'El aviso solicita silencio debido a exámenes en curso (\'exams in progress\'). Este contexto es propio de una institución educativa como una escuela o colegio (\'school\').'
    },
    {
        id: 'Q003',
        notice: 'BUY 2 T-SHIRTS AND GET 1 FREE TODAY ONLY!',
        question: 'Where can you see this notice?',
        options: ['In a clothes store', 'In a train station', 'In a hospital'],
        correct: 0,
        explanation: 'El aviso promociona una oferta comercial de camisetas (\'T-shirts: buy 2 get 1 free\'), lo cual ocurre en una tienda de ropa (\'clothes store\').'
    },
    {
        id: 'Q004',
        notice: 'PLEASE FASTEN YOUR SEATBELT WHILE SEATED',
        question: 'Where can you see this notice?',
        options: ['On a plane', 'In an elevator', 'In a museum'],
        correct: 0,
        explanation: 'La indicación \'fasten your seatbelt\' (abrocharse el cinturón de seguridad) mientras se está sentado es una medida de seguridad aeronáutica estándar que se encuentra a bordo de un avión (\'plane\').'
    },
    {
        id: 'Q005',
        notice: 'TODAY\'S SPECIAL: GRILLED CHICKEN WITH RICE AND SALAD - $12',
        question: 'Where can you see this notice?',
        options: ['In a restaurant', 'In a bookstore', 'In a pharmacy'],
        correct: 0,
        explanation: '\'Today\\\'s special\' describe el plato del día en un menú de comidas (\'grilled chicken with rice and salad\'), característico de un restaurante (\'restaurant\').'
    },
    {
        id: 'Q006',
        notice: 'CHILDREN UNDER 12 MUST BE ACCOMPANIED BY AN ADULT IN THE POOL',
        question: 'Where can you see this notice?',
        options: ['In a swimming center', 'In a cinema', 'In a shoe shop'],
        correct: 0,
        explanation: 'La palabra clave \'pool\' (piscina) y la norma de supervisión de menores (\'accompanied by an adult\') sitúan este aviso directamente en un centro de natación o piscina pública (\'swimming center\').'
    },
    {
        id: 'Q007',
        notice: 'RETURN ALL BORROWED BOOKS TO THE FRONT DESK BEFORE LEAVING',
        question: 'Where can you see this notice?',
        options: ['In a bakery', 'In a library', 'In a gym'],
        correct: 1,
        explanation: '\'Borrowed books\' (libros prestados) y \'front desk\' corresponden a las normas de devolución de material bibliográfico en una biblioteca (\'library\').'
    },
    {
        id: 'Q008',
        notice: 'TICKETS FOR PLATFORM 4 MUST BE PURCHASED AT MACHINE 2',
        question: 'Where can you see this notice?',
        options: ['In a train station', 'In a hospital', 'In a garden'],
        correct: 0,
        explanation: 'Los términos \'platform\' (andén/plataforma) y \'tickets\' (boletos/billetes) son elementos propios del sistema de transporte férreo en una estación de tren (\'train station\').'
    },
    {
        id: 'Q009',
        notice: 'NO FLASH PHOTOGRAPHY ALLOWED NEAR THE OIL PAINTINGS',
        question: 'Where can you see this notice?',
        options: ['In an art gallery', 'In a garage', 'In a stadium'],
        correct: 0,
        explanation: 'La restricción de fotografía con flash cerca de pinturas al óleo (\'oil paintings\') tiene como propósito proteger las obras de arte en una galería o museo de arte (\'art gallery\').'
    },
    {
        id: 'Q010',
        notice: 'PLEASE WIPE DOWN FITNESS MACHINES AFTER USE',
        question: 'Where can you see this notice?',
        options: ['In a gym', 'In a post office', 'In a bank'],
        correct: 0,
        explanation: 'Las \'fitness machines\' (máquinas de ejercicio) y la norma de higiene de limpiarlas (\'wipe down\') tras el uso corresponden exclusivamente a un gimnasio (\'gym\').'
    },
    {
        id: 'Q011',
        notice: 'ALL VISITORS MUST SIGN IN AND WEAR A SAFETY HELMET BEYOND THIS POINT',
        question: 'Where can you see this notice?',
        options: ['On a construction site', 'In a dining room', 'In a hotel lobby'],
        correct: 0,
        explanation: 'El uso obligatorio de casco de seguridad (\'safety helmet\') y el registro de visitantes son protocolos estrictos de seguridad industrial en una obra en construcción (\'construction site\').'
    },
    {
        id: 'Q012',
        notice: 'CHECK-OUT TIME IS 11:00 AM. PLEASE LEAVE YOUR KEY CARD AT RECEPTION',
        question: 'Where can you see this notice?',
        options: ['In a hotel', 'In a stadium', 'In an airport tarmac'],
        correct: 0,
        explanation: 'El término \'check-out time\' (hora de salida) y la entrega de la \'key card\' (tarjeta llave) en recepción son trámites hoteleros (\'hotel\').'
    },
    {
        id: 'Q013',
        notice: 'DOCTOR ON CALL: EMERGENCY ROOM ENTRANCE TO THE LEFT',
        question: 'Where can you see this notice?',
        options: ['In a hospital', 'In a music store', 'In a supermarket'],
        correct: 0,
        explanation: '\'Doctor on call\' (médico de turno) y \'Emergency Room\' (sala de urgencias) señalan claramente la señalización de un hospital (\'hospital\').'
    },
    {
        id: 'Q014',
        notice: 'WASH HANDS THOROUGHLY BEFORE RETURNING TO FOOD PREPARATION AREA',
        question: 'Where can you see this notice?',
        options: ['In a restaurant kitchen', 'In a bookstore', 'In an office supply shop'],
        correct: 0,
        explanation: 'La norma sanitaria de lavado de manos antes de ingresar a la \'food preparation area\' (área de preparación de alimentos) pertenece a la cocina de un restaurante (\'restaurant kitchen\').'
    },
    {
        id: 'Q015',
        notice: 'PASSPORT CONTROL: HAVE YOUR BOARDING PASS READY',
        question: 'Where can you see this notice?',
        options: ['At an airport', 'At a tennis court', 'In a church'],
        correct: 0,
        explanation: '\'Passport control\' (control migratorio/pasaportes) y \'boarding pass\' (pase de abordar) son elementos e instrucciones exclusivas de un aeropuerto (\'airport\').'
    },
    {
        id: 'Q016',
        notice: 'STUDENTS: SUBMIT YOUR ESSAYS ONLINE THROUGH THE CAMPUS PORTAL BY MIDNIGHT',
        question: 'Where can you see this notice?',
        options: ['In a university announcement board', 'In a petrol station', 'In a barber shop'],
        correct: 0,
        explanation: 'La entrega de ensayos académicos (\'essays\') por medio de la plataforma \'campus portal\' se orienta a estudiantes de educación superior en un tablero de anuncios universitario (\'university announcement board\').'
    },
    {
        id: 'Q017',
        notice: 'MAXIMUM LOAD: 8 PERSONS OR 650 KG',
        question: 'Where can you see this notice?',
        options: ['Inside an elevator', 'On a computer screen', 'On a classroom blackboard'],
        correct: 0,
        explanation: 'La capacidad máxima de carga en personas o peso (\'maximum load: 8 persons or 650 kg\') es la placa técnica de seguridad de un ascensor (\'elevator\').'
    },
    {
        id: 'Q018',
        notice: 'CAUTION: WET FLOOR. CLEANING IN PROGRESS',
        question: 'Where can you see this notice?',
        options: ['In a hallway', 'On a tree', 'In a dictionary'],
        correct: 0,
        explanation: 'El aviso temporal \'caution: wet floor\' (piso mojado) se ubica en pasillos, corredores o zonas de tránsito peatonal durante labores de aseo (\'hallway\').'
    },
    {
        id: 'Q019',
        notice: 'AUTOMATIC CAR WASH: REMOVE ANTENNA AND CLOSE ALL WINDOWS',
        question: 'Where can you see this notice?',
        options: ['At a service station', 'In a dental clinic', 'In a shoe repair shop'],
        correct: 0,
        explanation: 'Las instrucciones de preparación del vehículo para el autolavado (\'automatic car wash\') se encuentran en una estación de servicio o gasolinera (\'service station\').'
    },
    {
        id: 'Q020',
        notice: 'PARKING FOR CUSTOMERS ONLY. MAXIMUM STAY 2 HOURS',
        question: 'Where can you see this notice?',
        options: ['Outside a supermarket', 'Inside a bedroom', 'On a boat deck'],
        correct: 0,
        explanation: 'El estacionamiento reservado para clientes (\'parking for customers only\') con límite de tiempo se sitúa en la entrada o parqueadero exterior de un establecimiento comercial como un supermercado (\'supermarket\').'
    },
    {
        id: 'Q021',
        notice: 'INSERT EXACT COINS ONLY. NO CHANGE GIVEN',
        question: 'Where can you see this notice?',
        options: ['On a vending machine', 'In an art gallery', 'On a soccer pitch'],
        correct: 0,
        explanation: '\'Insert exact coins\' y \'no change given\' (no da cambio) es el mensaje típico en máquinas expendedoras (\'vending machine\') automáticas.'
    },
    {
        id: 'Q022',
        notice: 'PRESCRIPTIONS DISPENSED AT COUNTER 3',
        question: 'Where can you see this notice?',
        options: ['In a pharmacy', 'In a clothing boutique', 'In a garage'],
        correct: 0,
        explanation: '\'Prescriptions\' (recetas/fórmulas médicas) y su dispensación en mostrador pertenecen exclusivamente al ámbito farmacéutico (\'pharmacy\').'
    },
    {
        id: 'Q023',
        notice: 'KEEP OFF THE GRASS. PLANTING IN PROGRESS',
        question: 'Where can you see this notice?',
        options: ['In a public park', 'In an airport hangar', 'Inside a bank vault'],
        correct: 0,
        explanation: 'La advertencia \'keep off the grass\' (no pisar el césped) se ubica en jardines y zonas verdes de parques públicos (\'public park\').'
    },
    {
        id: 'Q024',
        notice: 'FIRE EXIT ONLY. ALARM WILL SOUND IF OPENED',
        question: 'Where can you see this notice?',
        options: ['On an emergency door', 'On a kitchen toaster', 'In a newspaper page'],
        correct: 0,
        explanation: 'La señalización de salida de incendios con alarma integrada se encuentra instalada directamente en puertas de emergencia (\'emergency door\').'
    },
    {
        id: 'Q025',
        notice: 'SPEED LIMIT 30 KM/H. SCHOOL ZONE',
        question: 'Where can you see this notice?',
        options: ['On a street road', 'Inside a cinema room', 'In a swimming pool'],
        correct: 0,
        explanation: 'El límite de velocidad de tráfico vehicular por zona escolar es una señal de tránsito vial instalada en una calle o carretera (\'street road\').'
    },
    {
        id: 'Q026',
        notice: 'PLEASE TURN OFF MOBILE PHONES DURING THE PERFORMANCE',
        question: 'Where can you see this notice?',
        options: ['In a theatre', 'At a bus stop', 'In a car park'],
        correct: 0,
        explanation: 'La solicitud de apagar los celulares durante la función o representación artística (\'performance\') se hace en una sala de teatro o concierto (\'theatre\').'
    },
    {
        id: 'Q027',
        notice: 'FRESH BREAD AND CROISSANTS BAKED EVERY MORNING AT 6:00 AM',
        question: 'Where can you see this notice?',
        options: ['In a bakery', 'In a flower shop', 'In a shoe repair shop'],
        correct: 0,
        explanation: '\'Fresh bread and croissants\' (pan fresco y cruasanes horneados) es la oferta emblemática de una panadería (\'bakery\').'
    },
    {
        id: 'Q028',
        notice: 'FITTING ROOMS: MAXIMUM 3 ITEMS PER PERSON',
        question: 'Where can you see this notice?',
        options: ['In a clothing department store', 'In a bus station', 'In a post office'],
        correct: 0,
        explanation: 'Los \'fitting rooms\' (probadores/vestidores de ropa) y el control de prendas ingresadas se hallan en tiendas de ropa (\'clothing department store\').'
    },
    {
        id: 'Q029',
        notice: 'NO SMOKING NEAR FUEL PUMPS',
        question: 'Where can you see this notice?',
        options: ['At a gas station', 'In a tennis club', 'In a library'],
        correct: 0,
        explanation: 'La prohibición de fumar cerca de los surtidores de combustible (\'fuel pumps\') es una advertencia crítica de seguridad en una gasolinera (\'gas station\').'
    },
    {
        id: 'Q030',
        notice: 'LUGGAGE DROP-OFF: PASSENGERS WITH PRINTED TAGS ONLY',
        question: 'Where can you see this notice?',
        options: ['At an airline check-in counter', 'At a supermarket cashier', 'In a school playground'],
        correct: 0,
        explanation: 'El área de entrega de equipaje etiquetado (\'luggage drop-off\') para pasajeros es un servicio característico del mostrador de aerolíneas en aeropuertos (\'airline check-in counter\').'
    },
    {
        id: 'Q031',
        notice: 'STAFF ONLY BEYOND THIS DOOR',
        question: 'Where can you see this notice?',
        options: ['On an office door leading to a private area', 'On a public park bench', 'On a bus ticket'],
        correct: 0,
        explanation: '\'Staff only\' (solo personal autorizado) es una restricción de acceso para áreas privadas de empleados en una oficina o establecimiento comercial (\'office door leading to a private area\').'
    },
    {
        id: 'Q032',
        notice: 'BUY ONE COFFEE, GET A DONUT FOR HALF PRICE',
        question: 'Where can you see this notice?',
        options: ['In a café', 'In a library', 'In a car mechanic workshop'],
        correct: 0,
        explanation: 'La promoción combinada de café y dona (\'coffee and donut\') corresponde a una cafetería (\'café\').'
    },
    {
        id: 'Q033',
        notice: 'DO NOT LEAVE YOUR BAGS UNATTENDED AT ANY TIME',
        question: 'Where can you see this notice?',
        options: ['In a train terminal', 'In a private garden', 'In a home bathroom'],
        correct: 0,
        explanation: 'La advertencia antiterrorista o de seguridad de no descuidar el equipaje (\'unattended bags\') es estándar en terminales de tren y aeropuertos (\'train terminal\').'
    },
    {
        id: 'Q034',
        notice: 'QUIET ZONE: NO CELL PHONE CONVERSATIONS IN THIS CARRIAGE',
        question: 'Where can you see this notice?',
        options: ['On an intercity train', 'In a bustling market', 'In a sports stadium'],
        correct: 0,
        explanation: 'El concepto de \'carriage\' (vagón de tren) y la zona de silencio (\'quiet zone\') se aplican a servicios de trenes de pasajeros de media y larga distancia (\'intercity train\').'
    },
    {
        id: 'Q035',
        notice: 'APPOINTMENTS ONLY: PLEASE RING THE BELL AND WAIT FOR ASSISTANCE',
        question: 'Where can you see this notice?',
        options: ['Outside a specialized medical clinic', 'On a highway billboard', 'In a fast food drive-thru'],
        correct: 0,
        explanation: 'El requerimiento de cita previa (\'appointments only\') y la instrucción de tocar el timbre para ser atendido es típica del ingreso a un consultorio o clínica especializada privada (\'specialized medical clinic\').'
    }
];

module.exports = part1Notices;

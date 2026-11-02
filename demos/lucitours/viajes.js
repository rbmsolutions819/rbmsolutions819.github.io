// Lucitours (propuesta de RBM Solutions CR): catálogo de viajes, cupos, solicitudes y lista de espera.
// En la demo todo se guarda en este navegador. En la versión real se guarda en la nube y el panel lo ve al instante.
window.Luci = (() => {
  const WA = "";   // número de WhatsApp de Lucitours (ej.: "50688887777"). Vacío en la demo: abre WhatsApp para escoger el chat.
  const BF_FIN = "2026-11-30T23:59:00-06:00";   // fin de los precios Black Friday

  // precio: en dólares. porPareja: el precio es por 2 personas (2x1).
  const VIAJES = [
    { id: "cusco", destacados: ["Machu Picchu con guía", "Laguna Humantay", "Semana Santa en Cusco", "Tren panorámico"], destino: "Cusco y Machu Picchu", pais: "Perú", region: "Suramérica", foto: "f/cusco.jpg", etiqueta: "Black Friday",
      salidas: [{ id: "s1", ini: "2027-03-18", fin: "2027-03-25", nombre: "Semana Santa · 18 al 25 de marzo" }],
      precio: 999, reserva: 150, cupos: 8, vendidos: 5,
      resumen: "Semana Santa en los Andes: Cusco, Valle Sagrado, Machu Picchu y la Laguna Humantay.",
      dias: [["Llegada a Cusco", "Traslado al hotel, mate de coca y tarde libre para aclimatarse."],
        ["City tour", "Plaza de Armas, Qorikancha y Sacsayhuamán."],
        ["Valle Sagrado", "Pisac, almuerzo buffet, Ollantaytambo y tren a Aguas Calientes."],
        ["Machu Picchu", "Subida temprano con guía. Regreso en tren a Cusco."],
        ["Laguna Humantay", "Caminata a la laguna turquesa al pie del nevado Salkantay."],
        ["Montaña de 7 Colores", "Opcional. O día libre para compras en San Pedro."],
        ["Día libre", "Procesión de Semana Santa en el centro histórico."],
        ["Regreso", "Traslado al aeropuerto y vuelo a Costa Rica."]],
      incluye: ["Boleto aéreo SJO–CUZ ida y vuelta", "7 noches de hotel con desayuno", "Tren a Machu Picchu y entradas", "Tours con guía en español", "Traslados", "Acompañamiento de Lucitours todo el viaje"],
      noIncluye: ["Almuerzos y cenas (salvo el del Valle Sagrado)", "Seguro de viaje", "Propinas"],
      requisitos: ["Pasaporte con 6 meses de vigencia", "No se necesita visa", "Condición física para caminatas a 4.200 m"] },
    { id: "medellin", destacados: ["Viajan 2 por el precio de 1", "Comuna 13", "Guatapé y El Peñol", "4 fechas para escoger"], destino: "Medellín 2x1", pais: "Colombia", region: "Suramérica", foto: "f/medellin.jpg", etiqueta: "2x1",
      salidas: [{ id: "feb", ini: "2027-02-11", fin: "2027-02-15", nombre: "11 al 15 de febrero" }, { id: "mar", ini: "2027-03-11", fin: "2027-03-15", nombre: "11 al 15 de marzo" },
        { id: "abr", ini: "2027-04-15", fin: "2027-04-19", nombre: "15 al 19 de abril" }, { id: "may", ini: "2027-05-13", fin: "2027-05-17", nombre: "13 al 17 de mayo" }],
      precio: 899, porPareja: true, reserva: 200, cupos: 40, vendidos: 26,
      resumen: "Viajen dos por el precio de uno: Medellín, Comuna 13 y Guatapé, con salidas de febrero a mayo.",
      dias: [["Llegada", "Traslado al hotel en El Poblado y noche libre en el Parque Lleras."],
        ["Comuna 13", "Graffitour con guía local, escaleras eléctricas y café colombiano."],
        ["Guatapé y El Peñol", "Subida a la piedra (740 escalones), paseo en lancha y almuerzo típico."],
        ["Parque Arví", "Metrocable sobre la ciudad y tarde de compras."],
        ["Regreso", "Traslado al aeropuerto."]],
      incluye: ["Boleto aéreo para 2 personas", "4 noches de hotel con desayuno", "Tour Comuna 13 y tour a Guatapé", "Traslados aeropuerto–hotel"],
      noIncluye: ["Almuerzos y cenas", "Seguro de viaje", "Gastos personales"],
      requisitos: ["Pasaporte vigente", "Registro Check-MIG en línea antes de viajar"] },
    { id: "estambul", destacados: ["Crucero por el Bósforo", "Globos en Capadocia", "Pamukkale y Éfeso", "Vuelo interno incluido"], destino: "Estambul y Capadocia", pais: "Turquía", region: "Europa y Asia", foto: "f/estambul.jpg", etiqueta: "Black Friday",
      salidas: [{ id: "s1", ini: "2027-05-20", fin: "2027-05-31", nombre: "20 al 31 de mayo" }],
      precio: 1999, reserva: 300, cupos: 20, vendidos: 14,
      resumen: "Doce días entre mezquitas, bazares y los globos de Capadocia al amanecer.",
      dias: [["Llegada a Estambul", "Traslado y cena de bienvenida."], ["Estambul clásico", "Santa Sofía, Mezquita Azul y Gran Bazar."],
        ["Bósforo", "Crucero entre Europa y Asia y Bazar de las Especias."], ["Vuelo a Capadocia", "Valle de Göreme y ciudad subterránea."],
        ["Globos al amanecer", "Vuelo en globo (opcional) y valle del amor."], ["Pamukkale", "Piscinas de travertino y ruinas de Hierápolis."],
        ["Éfeso", "La ciudad romana mejor conservada de Turquía."], ["Regreso a Estambul", "Tarde libre y noche turca."], ["Regreso", "Vuelo a Costa Rica."]],
      incluye: ["Boleto aéreo y vuelo interno", "11 noches de hotel con desayuno", "Crucero por el Bósforo", "Tours con guía en español", "Traslados"],
      noIncluye: ["Vuelo en globo (≈ $250)", "Seguro de viaje", "Propinas"],
      requisitos: ["Pasaporte con 6 meses de vigencia", "Visa electrónica de Turquía (se tramita en línea)"] },
    { id: "japon", destacados: ["Cerezos en flor", "Monte Fuji", "Tren bala", "Kioto y Nara"], destino: "Japón en primavera", pais: "Japón", region: "Europa y Asia", arte: "japon", ic: "🌸", etiqueta: "Agotado",
      salidas: [{ id: "s1", ini: "2027-04-01", fin: "2027-04-12", nombre: "1 al 12 de abril" }],
      precio: 3490, reserva: 500, cupos: 12, vendidos: 12,
      resumen: "Los cerezos en flor de Tokio, Kioto y el monte Fuji.",
      dias: [["Tokio", "Shibuya, Asakusa y parque Ueno con cerezos."], ["Monte Fuji", "Lago Kawaguchi y pagoda Chureito."], ["Kioto", "Tren bala, Fushimi Inari y Gion."], ["Nara y Osaka", "Ciervos de Nara y comida callejera en Dotonbori."]],
      incluye: ["Boleto aéreo", "10 noches de hotel", "Japan Rail Pass", "Guía en español"], noIncluye: ["Comidas", "Seguro de viaje"],
      requisitos: ["Pasaporte vigente", "No se necesita visa para costarricenses"] },
    { id: "noruega", destacados: ["Auroras boreales", "Trineo con perros", "Fiordos árticos", "Ropa térmica incluida"], destino: "Auroras en Noruega", pais: "Noruega", region: "Europa y Asia", arte: "noruega", ic: "🌌", etiqueta: "Nuevo",
      salidas: [{ id: "s1", ini: "2027-02-08", fin: "2027-02-16", nombre: "8 al 16 de febrero" }],
      precio: 3190, reserva: 400, cupos: 10, vendidos: 7,
      resumen: "Cacería de auroras boreales en Tromsø, trineo con perros y fiordos nevados.",
      dias: [["Oslo", "Llegada y paseo por la ópera."], ["Tromsø", "Vuelo al Ártico y primera noche de auroras."], ["Trineo con perros", "Paseo por la tundra y cena sami."], ["Fiordos", "Crucero ártico y avistamiento de ballenas."]],
      incluye: ["Boleto aéreo", "8 noches de hotel", "2 salidas a cazar auroras", "Ropa térmica para las salidas"], noIncluye: ["Comidas", "Seguro de viaje"],
      requisitos: ["Pasaporte vigente", "No se necesita visa (zona Schengen)"] },
    { id: "egipto", destacados: ["Pirámides de Giza", "Crucero por el Nilo", "Abu Simbel", "Guía egiptólogo"], destino: "Egipto y crucero por el Nilo", pais: "Egipto", region: "África", arte: "egipto", ic: "🐪", etiqueta: "",
      salidas: [{ id: "s1", ini: "2027-09-09", fin: "2027-09-19", nombre: "9 al 19 de setiembre" }],
      precio: 2690, reserva: 350, cupos: 16, vendidos: 4,
      resumen: "Pirámides de Giza, crucero de 4 noches por el Nilo y Abu Simbel.",
      dias: [["El Cairo", "Pirámides, Esfinge y Gran Museo Egipcio."], ["Asuán", "Inicio del crucero y templo de Filae."], ["Abu Simbel", "Los templos de Ramsés II."], ["Luxor", "Valle de los Reyes y templo de Karnak."]],
      incluye: ["Boleto aéreo", "Crucero de 4 noches con comidas", "6 noches de hotel", "Guía egiptólogo en español"], noIncluye: ["Visa de Egipto (≈ $25)", "Seguro de viaje", "Propinas"],
      requisitos: ["Pasaporte con 6 meses de vigencia", "Visa a la llegada"] }
  ];

  const K = "luci-demo-v1";
  const leer = () => { try { return { cambios: {}, solicitudes: [], espera: [], ...JSON.parse(localStorage.getItem(K)) }; } catch { return { cambios: {}, solicitudes: [], espera: [] }; } };
  const guardar = d => { try { localStorage.setItem(K, JSON.stringify(d)); } catch {} };
  const viajes = () => { const c = leer().cambios; return VIAJES.map(v => ({ ...v, ...(c[v.id] || {}) })); };
  const viaje = id => viajes().find(v => v.id === id);
  const libres = v => Math.max(0, v.cupos - v.vendidos);
  const cambiar = (id, x) => { const d = leer(); d.cambios[id] = { ...(d.cambios[id] || {}), ...x }; guardar(d); };
  const solicitar = s => { const d = leer(); const n = { id: "S" + Date.now().toString(36).toUpperCase(), t: Date.now(), estado: "nueva", ...s }; d.solicitudes.unshift(n); guardar(d); return n; };
  const esperar = s => { const d = leer(); d.espera.unshift({ id: "E" + Date.now(), t: Date.now(), ...s }); guardar(d); };
  const cambiarSolicitud = (id, x) => { const d = leer(); d.solicitudes = d.solicitudes.map(s => s.id === id ? { ...s, ...x } : s); guardar(d); };
  const borrarEspera = id => { const d = leer(); d.espera = d.espera.filter(e => e.id !== id); guardar(d); };
  const reiniciar = () => { try { localStorage.removeItem(K); } catch {} };

  const usd = n => "$" + Math.round(n).toLocaleString("en-US");
  const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","setiembre","octubre","noviembre","diciembre"];
  const deIso = f => { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d); };
  // Plan de pagos: la reserva hoy y el resto en cuotas mensuales que terminan 30 días antes de salir.
  function plan(v, salida, personas){
    const unidades = v.porPareja ? Math.ceil(personas / 2) : personas;
    const total = v.precio * unidades, reserva = v.reserva * unidades;
    const limite = deIso(salida.ini); limite.setDate(limite.getDate() - 30);
    const hoy = new Date(); let meses = (limite.getFullYear() - hoy.getFullYear()) * 12 + limite.getMonth() - hoy.getMonth(); if (limite.getDate() < hoy.getDate()) meses--;
    meses = Math.max(1, Math.min(18, meses));
    return { total, reserva, meses, cuota: (total - reserva) / meses, unidades, ultimo: `${limite.getDate()} de ${MES[limite.getMonth()]}` };
  }
  return { WA, BF_FIN, viajes, viaje, libres, cambiar, solicitar, esperar, cambiarSolicitud, borrarEspera, reiniciar, leer, usd, plan, MES, deIso };
})();

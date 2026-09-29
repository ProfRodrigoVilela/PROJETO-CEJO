// ======================================================
// CONFIGURAÇÕES DE LOCALIZAÇÃO (Jardim Oriente / CEJO)
// ======================================================

// Coordenada final: Colégio Estadual Jardim Oriente (CEJO)
const CEJO_COORDS = [-16.0742, -47.9628];

// Ponto do Aluno (Rua 12 - Jardim Oriente)
const SEU_PONTO_COORDS = [-16.0685, -47.9660];

// Rota simulada percorrida pelo ônibus pelas ruas do bairro
const rotaSimulada = [
  { lat: -16.0620, lng: -47.9710, nome: "Saída da Garagem", eta: 8, dist: "1.2 km", progress: 10 },
  { lat: -16.0645, lng: -47.9690, nome: "Av. Principal", eta: 6, dist: "900m", progress: 30 },
  { lat: -16.0665, lng: -47.9675, nome: "Aproximando do Ponto", eta: 3, dist: "450m", progress: 55 },
  { lat: -16.0685, lng: -47.9660, nome: "Chegando no Seu Ponto!", eta: 1, dist: "100m", progress: 75 },
  { lat: -16.0715, lng: -47.9642, nome: "A caminho da Escola", eta: 3, dist: "500m", progress: 90 },
  { lat: -16.0742, lng: -47.9628, nome: "Chegada ao CEJO", eta: 0, dist: "0m", progress: 100 }
];

let indiceAtual = 0;
let emMovimento = true;
let timerSimulacao = null;

// ======================================================
// 1. INICIALIZAÇÃO DO MAPA (Sem bloqueios no navegador)
// ======================================================
const map = L.map('map', { zoomControl: false }).setView(SEU_PONTO_COORDS, 15);

// Adiciona os botões de Zoom no canto superior direito
L.control.zoom({ position: 'topright' }).addTo(map);

// Provedor CartoDB Voyager (Limpos, sem erros e funcionam via arquivo local)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// ======================================================
// 2. ÍCONES PERSONALIZADOS ESTILO UBER/99
// ======================================================

// Ícone do Ônibus (Azul com brilho)
const busIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(37,99,235,0.8);border:3px solid white;"><i class="fa-solid fa-bus" style="font-size:18px;"></i></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Ícone da Parada do Aluno (Ponto)
const stopIcon = L.divIcon({
  html: `<div style="background:#ef4444;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(239,68,68,0.6);border:2px solid white;"><i class="fa-solid fa-person-shelter" style="font-size:15px;"></i></div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

// Ícone do Colégio CEJO
const schoolIcon = L.divIcon({
  html: `<div style="background:#0f172a;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(15,23,42,0.6);border:2px solid white;"><i class="fa-solid fa-graduation-cap" style="font-size:16px;"></i></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// Marcadores Fixos no Mapa
L.marker(SEU_PONTO_COORDS, { icon: stopIcon }).addTo(map)
  .bindPopup("<b>Seu Ponto de Embarque</b><br>Rua 12 - Jardim Oriente");

L.marker(CEJO_COORDS, { icon: schoolIcon }).addTo(map)
  .bindPopup("<b>CEJO</b><br>Colégio Estadual Jardim Oriente");

// Marcador Móvel do Ônibus
let busMarker = L.marker([rotaSimulada[0].lat, rotaSimulada[0].lng], { icon: busIcon }).addTo(map);

// Linha traçada da Rota
const coordenadasLinha = rotaSimulada.map(p => [p.lat, p.lng]);
L.polyline(coordenadasLinha, {
  color: '#2563eb',
  weight: 5,
  opacity: 0.8,
  dashArray: '6, 10'
}).addTo(map);

// ======================================================
// 3. LÓGICA DE SIMULAÇÃO E ATUALIZAÇÃO DA TELA
// ======================================================

function atualizarPosicao() {
  if (!emMovimento) return;

  if (indiceAtual < rotaSimulada.length) {
    const ponto = rotaSimulada[indiceAtual];

    // Mover o ônibus suavemente para o novo ponto no mapa
    busMarker.setLatLng([ponto.lat, ponto.lng]);
    map.panTo([ponto.lat, ponto.lng]);

    // Atualizar textos no Cartão Flutuante (ETA, Distância e Progresso)
    document.getElementById('status-title').innerText = ponto.nome;
    document.getElementById('eta-minutes').innerText = ponto.eta > 0 ? ponto.eta + " min" : "Chegou!";
    document.getElementById('distance-meters').innerText = ponto.dist;
    document.getElementById('progress-fill').style.width = ponto.progress + "%";

    // Notificação / Toast de Alerta estilo Uber quando estiver muito perto
    const toast = document.getElementById('alert-toast');
    if (ponto.eta <= 3 && ponto.eta > 0) {
      toast.classList.remove('hidden');
      document.getElementById('toast-title').innerText = "🚌 O ônibus está chegando!";
      document.getElementById('toast-desc').innerText = `Apenas ${ponto.dist} de você. Prepare seus pertences!`;
    } else if (ponto.eta === 0) {
      toast.classList.remove('hidden');
      document.getElementById('toast-title').innerText = "🏫 Chegamos ao CEJO!";
      document.getElementById('toast-desc').innerText = "Tenha uma excelente aula no Colégio Jardim Oriente!";
      clearInterval(timerSimulacao);
    } else {
      toast.classList.add('hidden');
    }

    indiceAtual++;
  }
}

// Inicia o ônibus andando a cada 3.5 segundos
timerSimulacao = setInterval(atualizarPosicao, 3500);

// ======================================================
// 4. INTERAÇÕES E BOTÕES DA TELA
// ======================================================

function alternarSimulacao() {
  emMovimento = !emMovimento;
  const btn = document.getElementById('btn-toggle');
  
  if (emMovimento) {
    btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pausar`;
  } else {
    btn.innerHTML = `<i class="fa-solid fa-play"></i> Retomar`;
  }
}

function confirmarPresenca() {
  alert("📍 Notificação enviada para o motorista Sr. Cláudio!\nEle já sabe que você está aguardando no ponto da Rua 12.");
}
const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let image = new Image(); // Imagem carregada
let history = []; // Histórico de edições
let redoStack = []; // Ações para refazer
let currentFilter = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    sepia: 0,
    grayscale: 0
};

let scale = 1; // Fator de zoom
let rotation = 0; // Ângulo de rotação

// Seletores dos controles
const brightnessRange = document.getElementById("brightness-range");
const contrastRange = document.getElementById("contrast-range");
const saturationRange = document.getElementById("saturation-range");
const sepiaRange = document.getElementById("sepia-range");

// Adiciona um listener para o upload de imagens
upload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Garante que a imagem seja carregada antes de renderizar no canvas
image.onload = () => {
    const maxWidth = 1000;
    const maxHeight = 1000;
    const scaleFactor = Math.min(maxWidth / image.width, maxHeight / image.height, 1);

    canvas.width = image.width * scaleFactor;
    canvas.height = image.height * scaleFactor;

    redraw();
};

// Atualiza os filtros e redesenha a imagem
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `
        brightness(${currentFilter.brightness}) 
        contrast(${currentFilter.contrast}) 
        saturate(${currentFilter.saturation}) 
        sepia(${currentFilter.sepia}) 
        grayscale(${currentFilter.grayscale})
    `;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Centraliza a rotação
    ctx.rotate(rotation * Math.PI / 180); // Aplica a rotação
    ctx.scale(scale, scale); // Aplica o zoom
    ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height); // Desenha a imagem no canvas
    ctx.restore();
}

// Atualiza o brilho
brightnessRange.addEventListener("input", (e) => {
    currentFilter.brightness = e.target.value;
    redraw();
});

// Atualiza o contraste
contrastRange.addEventListener("input", (e) => {
    currentFilter.contrast = e.target.value;
    redraw();
});

// Atualiza a saturação
saturationRange.addEventListener("input", (e) => {
    currentFilter.saturation = e.target.value;
    redraw();
});

// Atualiza o sepia
sepiaRange.addEventListener("input", (e) => {
    currentFilter.sepia = e.target.value;
    redraw();
});

// Função para adicionar a escala de cinza
document.getElementById("grayscale").addEventListener("click", () => {
    currentFilter.grayscale = currentFilter.grayscale === 0 ? 1 : 0;
    redraw();
});

// Função para rotacionar a imagem
document.getElementById("rotate").addEventListener("click", () => {
    rotation += 90; // A cada clique, a imagem gira 90 graus
    if (rotation === 360) {
        rotation = 0; // Reseta a rotação após 360 graus
    }
    redraw();
});

// Função de zoom in
document.getElementById("zoom-in").addEventListener("click", () => {
    scale += 0.1;
    redraw();
});

// Função de zoom out
document.getElementById("zoom-out").addEventListener("click", () => {
    scale = Math.max(0.1, scale - 0.1); // Impede o zoom de ficar negativo ou muito pequeno
    redraw();
});

// Restaura os filtros
document.getElementById("reset").addEventListener("click", () => {
    currentFilter = {
        brightness: 1,
        contrast: 1,
        saturation: 1,
        sepia: 0,
        grayscale: 0
    };
    brightnessRange.value = 1;
    contrastRange.value = 1;
    saturationRange.value = 1;
    sepiaRange.value = 0;
    scale = 1;
    rotation = 0;
    redraw();
});

// Função de desfazer alterações
document.getElementById("undo").addEventListener("click", () => {
    if (history.length > 1) {
        redoStack.push(history.pop());
        const imgData = history[history.length - 1];
        loadCanvasFromData(imgData);
    }
});

// Função de refazer alterações
document.getElementById("redo").addEventListener("click", () => {
    if (redoStack.length > 0) {
        const imgData = redoStack.pop();
        history.push(imgData);
        loadCanvasFromData(imgData);
    }
});

// Carrega o canvas a partir de dados de imagem
function loadCanvasFromData(data) {
    const img = new Image();
    img.src = data;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

// Download da imagem
document.getElementById("download").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Obter o botão de alternância e o body
const toggleButton = document.getElementById("toggle-theme");
const body = document.body;

// Verificar se o modo noturno está ativo ou não
toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    // Alterar o ícone do botão dependendo do tema
    if (body.classList.contains("dark-mode")) {
        toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Função para salvar o estado atual da imagem no histórico
function saveState() {
    history.push(canvas.toDataURL());
    // Limpa o redoStack sempre que uma nova ação for realizada
    redoStack = [];
}

// Chama a função saveState após cada alteração
upload.addEventListener("change", saveState);
brightnessRange.addEventListener("input", saveState);
contrastRange.addEventListener("input", saveState);
saturationRange.addEventListener("input", saveState);
sepiaRange.addEventListener("input", saveState);
document.getElementById("grayscale").addEventListener("click", saveState);
document.getElementById("rotate").addEventListener("click", saveState);
document.getElementById("zoom-in").addEventListener("click", saveState);
document.getElementById("zoom-out").addEventListener("click", saveState);
document.getElementById("reset").addEventListener("click", saveState);
// Controle para adicionar camada
document.getElementById("add-layer").addEventListener("click", () => {
    // Função para adicionar uma camada ao canvas (exemplo de camada simples)
    const newLayer = new Image();
    newLayer.src = image.src; // Adiciona a imagem original como nova camada
    newLayer.onload = () => {
        ctx.drawImage(newLayer, 0, 0, canvas.width, canvas.height);
        saveState(); // Salva o estado após adicionar a camada
    };
});

// Controle para remover fundo
document.getElementById("remove-background").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas
    saveState(); // Salva o estado após remover o fundo
});

// Controle para distorção
document.getElementById("distortion-range").addEventListener("input", (e) => {
    const distortionValue = e.target.value;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa a imagem anterior
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Centraliza a imagem
    ctx.rotate(rotation * Math.PI / 180); // Aplica rotação
    ctx.scale(scale + distortionValue / 10, scale); // Aplica distorção no eixo X (alterando a escala)
    ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height); // Desenha a imagem distorcida
    ctx.restore();
    saveState(); // Salva o estado após aplicar a distorção
});

// Controle para mudar a cor do fundo
document.getElementById("background-color").addEventListener("input", (e) => {
    const newBackgroundColor = e.target.value;
    canvas.style.backgroundColor = newBackgroundColor; // Muda a cor de fundo do canvas
    saveState(); // Salva o estado após mudar a cor de fundo
});

// Função de salvar o estado atual da imagem no histórico (já implementada no seu código)
function saveState() {
    history.push(canvas.toDataURL());
    redoStack = []; // Limpa o redoStack
}

// Adiciona um listener para o upload de imagens (já presente no seu código)
upload.addEventListener("change", saveState);

// Função para realizar outras interações de zoom, rotação e filtros (já presentes no seu código)

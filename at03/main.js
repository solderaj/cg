const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,

         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0);

        vertices.push(
            radius * Math.cos(theta1),
            radius * Math.sin(theta1)
        );

        vertices.push(
            radius * Math.cos(theta2),
            radius * Math.sin(theta2)
        );
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);

    gl_Position = vec4(
        position.xy,
        0.0,
        1.0
    );
}
`;

// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}
`;

// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}

const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);

// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}

// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(
    0.1,
    0.1,
    0.1,
    1.0
);

gl.clear(gl.COLOR_BUFFER_BIT);

// --------------------------------------------------
// PARÂMETROS DO JOGO
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;

let txBola = 0.0;
let tyBola = 0.0;

let txBola_offset = 0.005;
let tyBola_offset = 0.005;

// Velocidade das barras
const velocidadeBarra = 0.015;

// Tamanho da barra
const alturaBarra = 0.2;

// Raio da bola
const raioBola = 0.05;

// Limites verticais
const limiteBarra = 1.0 - alturaBarra;
const limiteBola = 1.0 - raioBola;

// Pontuação
let pontosEsquerda = 0;
let pontosDireita = 0;

// Estado do jogo
let jogoPausado = false;

// Teclas pressionadas
let teclas = {};

// --------------------------------------------------
// CONTROLE DO TECLADO
// --------------------------------------------------

document.addEventListener("keydown", function(event) {

    teclas[event.key] = true;

    // Espaço pausa/despausa
    if (event.key === " ") {

        event.preventDefault();

        jogoPausado = !jogoPausado;
    }

    // R reinicia o jogo
    if (
        event.key === "r" ||
        event.key === "R"
    ) {
        reiniciarJogo();
    }
});

document.addEventListener("keyup", function(event) {

    teclas[event.key] = false;
});

// --------------------------------------------------
// MOVIMENTO DAS BARRAS
// --------------------------------------------------

function atualizaBarras() {

    // ----------------------------------------------
    // BARRA ESQUERDA
    // W sobe
    // S desce
    // ----------------------------------------------

    if (teclas["w"] || teclas["W"]) {

        tyBE += velocidadeBarra;
    }

    if (teclas["s"] || teclas["S"]) {

        tyBE -= velocidadeBarra;
    }

    // ----------------------------------------------
    // BARRA DIREITA
    // Seta para cima
    // Seta para baixo
    // ----------------------------------------------

    if (teclas["ArrowUp"]) {

        tyBD += velocidadeBarra;
    }

    if (teclas["ArrowDown"]) {

        tyBD -= velocidadeBarra;
    }

    // Impede sair da tela

    if (tyBE > limiteBarra) {
        tyBE = limiteBarra;
    }

    if (tyBE < -limiteBarra) {
        tyBE = -limiteBarra;
    }

    if (tyBD > limiteBarra) {
        tyBD = limiteBarra;
    }

    if (tyBD < -limiteBarra) {
        tyBD = -limiteBarra;
    }

    // Atualiza as matrizes

    MbarraEsquerda =
        m3.translation(-0.9, tyBE);

    MbarraDireita =
        m3.translation(0.9, tyBD);
}

// --------------------------------------------------
// COLISÃO COM AS BARRAS
// --------------------------------------------------

function verificaColisaoBarras() {

    // ----------------------------------------------
    // BARRA ESQUERDA
    // ----------------------------------------------

    if (txBola - raioBola <= -0.85) {

        // Bola está na altura da barra?
        if (
            tyBola + raioBola >= tyBE - alturaBarra &&
            tyBola - raioBola <= tyBE + alturaBarra
        ) {

            txBola = -0.85 + raioBola;

            txBola_offset =
                Math.abs(txBola_offset);

            // Dá um pequeno efeito dependendo
            // de onde a bola bateu na barra
            let diferenca =
                tyBola - tyBE;

            tyBola_offset += diferenca * 0.002;

            // Limita a velocidade vertical
            if (tyBola_offset > 0.02) {
                tyBola_offset = 0.02;
            }

            if (tyBola_offset < -0.02) {
                tyBola_offset = -0.02;
            }
        }
    }

    // ----------------------------------------------
    // BARRA DIREITA
    // ----------------------------------------------

    if (txBola + raioBola >= 0.85) {

        if (
            tyBola + raioBola >= tyBD - alturaBarra &&
            tyBola - raioBola <= tyBD + alturaBarra
        ) {

            txBola = 0.85 - raioBola;

            txBola_offset =
                -Math.abs(txBola_offset);

            let diferenca =
                tyBola - tyBD;

            tyBola_offset += diferenca * 0.002;

            if (tyBola_offset > 0.02) {
                tyBola_offset = 0.02;
            }

            if (tyBola_offset < -0.02) {
                tyBola_offset = -0.02;
            }
        }
    }
}

// --------------------------------------------------
// PONTUAÇÃO
// --------------------------------------------------

function verificaPontuacao() {

    // Bola passou pela esquerda
    if (txBola < -1.05) {

        pontosDireita++;

        atualizaPlacar();

        reiniciarBola(1);
    }

    // Bola passou pela direita
    if (txBola > 1.05) {

        pontosEsquerda++;

        atualizaPlacar();

        reiniciarBola(-1);
    }
}

// --------------------------------------------------
// ATUALIZAR PLACAR
// --------------------------------------------------

function atualizaPlacar() {

    const placar =
        document.getElementById("placar");

    placar.textContent =
        pontosEsquerda +
        " × " +
        pontosDireita;
}

// --------------------------------------------------
// REINICIAR BOLA
// --------------------------------------------------

function reiniciarBola(direcao) {

    txBola = 0.0;
    tyBola = 0.0;

    // Direção horizontal
    txBola_offset =
        0.005 * direcao;

    // Direção vertical aleatória
    let direcaoVertical =
        Math.random() < 0.5 ? -1 : 1;

    tyBola_offset =
        0.005 * direcaoVertical;

    MbolaCentro =
        m3.translation(
            txBola,
            tyBola
        );
}

// --------------------------------------------------
// REINICIAR JOGO
// --------------------------------------------------

function reiniciarJogo() {

    pontosEsquerda = 0;
    pontosDireita = 0;

    tyBE = 0.0;
    tyBD = 0.0;

    atualizaPlacar();

    reiniciarBola(
        Math.random() < 0.5 ? -1 : 1
    );
}

// --------------------------------------------------
// ATUALIZAÇÃO DA ANIMAÇÃO
// --------------------------------------------------

function atualizaAnimacao() {

    if (jogoPausado) {
        return;
    }

    // Atualiza barras
    atualizaBarras();

    // ----------------------------------------------
    // MOVIMENTO DA BOLA
    // ----------------------------------------------

    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // ----------------------------------------------
    // COLISÃO COM TOPO
    // ----------------------------------------------

    if (tyBola >= limiteBola) {

        tyBola = limiteBola;

        tyBola_offset =
            -Math.abs(tyBola_offset);
    }

    // ----------------------------------------------
    // COLISÃO COM FUNDO
    // ----------------------------------------------

    if (tyBola <= -limiteBola) {

        tyBola = -limiteBola;

        tyBola_offset =
            Math.abs(tyBola_offset);
    }

    // ----------------------------------------------
    // COLISÃO COM AS BARRAS
    // ----------------------------------------------

    verificaColisaoBarras();

    // ----------------------------------------------
    // VERIFICA PONTUAÇÃO
    // ----------------------------------------------

    verificaPontuacao();

    // ----------------------------------------------
    // MATRIZ DA BOLA
    // ----------------------------------------------

    MbolaCentro =
        m3.translation(
            txBola,
            tyBola
        );
}

// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){

    atualizaAnimacao();

    gl.clear(
        gl.COLOR_BUFFER_BIT
    );

    gl.useProgram(program);

    drawBarraEsquerda();

    drawBarraDireita();

    drawBolaCentro();

    requestAnimationFrame(drawScene);
}

// --------------------------------------------------
// DESENHAR BARRA ESQUERDA
// --------------------------------------------------

function drawBarraEsquerda(){

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        verticesBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(
        positionLocation
    );

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length /
        numComponents
    );
}

// --------------------------------------------------
// DESENHAR BARRA DIREITA
// --------------------------------------------------

function drawBarraDireita(){

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        verticesBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(
        positionLocation
    );

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length /
        numComponents
    );
}

// --------------------------------------------------
// DESENHAR BOLA
// --------------------------------------------------

function drawBolaCentro(){

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        verticesBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(
        positionLocation
    );

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length /
        numComponents
    );
}

// --------------------------------------------------
// INÍCIO DO JOGO
// --------------------------------------------------

atualizaPlacar();

drawScene();

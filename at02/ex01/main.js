const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL não é suportado pelo seu navegador.");
}

const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(
            clipSpace * vec2(1, -1),
            0,
            1
        );

        gl_PointSize = 1.0;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }
`;

function criarShader(gl, tipo, fonte) {
    const shader = gl.createShader(tipo);

    gl.shaderSource(shader, fonte);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function criarPrograma(gl, vertexShader, fragmentShader) {
    const programa = gl.createProgram();

    gl.attachShader(programa, vertexShader);
    gl.attachShader(programa, fragmentShader);
    gl.linkProgram(programa);

    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(programa));
        gl.deleteProgram(programa);
        return null;
    }

    return programa;
}

const vertexShader = criarShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = criarShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);

const programa = criarPrograma(
    gl,
    vertexShader,
    fragmentShader
);

gl.useProgram(programa);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positionLocation =
    gl.getAttribLocation(programa, "a_position");

const resolutionLocation =
    gl.getUniformLocation(programa, "u_resolution");

const colorLocation =
    gl.getUniformLocation(programa, "u_color");

const cores = [
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
    [1.0, 0.5, 0.0, 1.0],
    [0.5, 0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0],
    [0.0, 0.0, 0.0, 1.0]
];

let corAtual = cores[0];

let pontoInicial = {
    x: 0,
    y: 0
};

let pontoFinal = {
    x: 0,
    y: 0
};

let esperandoSegundoClique = false;

function alterarCor(indice) {
    if (indice >= 0 && indice <= 9) {
        corAtual = cores[indice];

        desenharLinha(
            pontoInicial.x,
            pontoInicial.y,
            pontoFinal.x,
            pontoFinal.y
        );
    }
}

function bresenham(x0, y0, x1, y1) {
    const pontos = [];

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);

    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;

    let erro = dx - dy;

    while (true) {
        pontos.push(x0, y0);

        if (x0 === x1 && y0 === y1) {
            break;
        }

        const erro2 = 2 * erro;

        if (erro2 > -dy) {
            erro -= dy;
            x0 += sx;
        }

        if (erro2 < dx) {
            erro += dx;
            y0 += sy;
        }
    }

    return pontos;
}

function desenharLinha(x0, y0, x1, y1) {
    const pontos = bresenham(x0, y0, x1, y1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(pontos),
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
    );

    gl.uniform4fv(
        colorLocation,
        corAtual
    );

    gl.drawArrays(
        gl.POINTS,
        0,
        pontos.length / 2
    );
}

gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);

gl.clearColor(
    0.15,
    0.15,
    0.15,
    1.0
);

gl.clear(gl.COLOR_BUFFER_BIT);

desenharLinha(0, 0, 0, 0);

canvas.addEventListener("click", function(event) {
    if (event.button !== 0) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    if (!esperandoSegundoClique) {
        pontoInicial.x = x;
        pontoInicial.y = y;

        esperandoSegundoClique = true;
    } else {
        pontoFinal.x = x;
        pontoFinal.y = y;

        esperandoSegundoClique = false;

        desenharLinha(
            pontoInicial.x,
            pontoInicial.y,
            pontoFinal.x,
            pontoFinal.y
        );
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key >= "0" && event.key <= "9") {
        alterarCor(parseInt(event.key));
    }
});
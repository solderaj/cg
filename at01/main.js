const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
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

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const positionLocation = gl.getAttribLocation(
    program,
    "aPosition"
);

const colorLocation = gl.getUniformLocation(
    program,
    "uColor"
);

const buffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

function draw(vertices, color, mode) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );

    gl.uniform4f(
        colorLocation,
        color[0],
        color[1],
        color[2],
        1.0
    );

    gl.drawArrays(
        mode,
        0,
        vertices.length / 2
    );
}

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

draw([
    -0.70, -0.70,
    -0.70,  0.00
], [0.0, 1.0, 0.0], gl.LINES);

draw([
    -0.70, 0.10,
    -0.70, 0.30
], [1.0, 0.0, 0.0], gl.LINES);

draw([
    -0.75, 0.05,
    -0.90, 0.15
], [1.0, 0.0, 0.0], gl.LINES);

draw([
    -0.65, 0.05,
    -0.50, 0.15
], [1.0, 0.0, 0.0], gl.LINES);

draw([
    -0.75, 0.00,
    -0.85, -0.10
], [1.0, 0.0, 0.0], gl.LINES);

draw([
    -0.65, 0.00,
    -0.55, -0.10
], [1.0, 0.0, 0.0], gl.LINES);

draw([
    -0.75,  0.10,
    -0.65,  0.10,
    -0.65,  0.00,
    -0.75,  0.00
], [1.0, 1.0, 0.0], gl.LINE_LOOP);

draw([
    -0.20, 0.20,
     0.20, 0.20,
     0.20, 0.50,
    -0.20, 0.50
], [0.7, 0.7, 0.7], gl.LINE_LOOP);

draw([
    -0.25, -0.40,
     0.25, -0.40,
     0.25,  0.15,
    -0.25,  0.15
], [0.7, 0.7, 0.7], gl.LINE_LOOP);

draw([
    -0.12, 0.32,
    -0.05, 0.32,
    -0.05, 0.39,
    -0.12, 0.39
], [1.0, 1.0, 1.0], gl.LINE_LOOP);

draw([
     0.05, 0.32,
     0.12, 0.32,
     0.12, 0.39,
     0.05, 0.39
], [1.0, 1.0, 1.0], gl.LINE_LOOP);

draw([
    -0.10, 0.25,
     0.10, 0.25
], [1.0, 1.0, 1.0], gl.LINES);

draw([
    -0.25, 0.05,
    -0.40, -0.15
], [0.7, 0.7, 0.7], gl.LINES);

draw([
     0.25, 0.05,
     0.40, -0.15
], [0.7, 0.7, 0.7], gl.LINES);

draw([
    -0.12, -0.40,
    -0.12, -0.65
], [0.7, 0.7, 0.7], gl.LINES);

draw([
     0.12, -0.40,
     0.12, -0.65
], [0.7, 0.7, 0.7], gl.LINES);

draw([
     0.45, -0.55,
     0.95, -0.55,
     0.95, -0.30,
     0.45, -0.30
], [1.0, 0.0, 0.0], gl.LINE_LOOP);

draw([
     0.55, -0.30,
     0.65, -0.10,
     0.82, -0.10,
     0.90, -0.30
], [1.0, 0.0, 0.0], gl.LINE_LOOP);

draw([
     0.65, -0.28,
     0.70, -0.14,
     0.78, -0.14,
     0.83, -0.28
], [0.0, 0.8, 1.0], gl.LINE_LOOP);

draw([
     0.52, -0.65,
     0.62, -0.65,
     0.62, -0.55,
     0.52, -0.55
], [0.5, 0.5, 0.5], gl.LINE_LOOP);

draw([
     0.78, -0.65,
     0.88, -0.65,
     0.88, -0.55,
     0.78, -0.55
], [0.5, 0.5, 0.5], gl.LINE_LOOP);
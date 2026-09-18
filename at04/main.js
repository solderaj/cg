const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// ==================================================
// SHADERS
// ==================================================

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {

    vec3 position =
        u_viewTransform *
        u_modelTransform *
        vec3(aPosition, 1.0);

    gl_Position =
        vec4(position.xy, 0.0, 1.0);
}
`;


const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {

    outColor =
        vec4(uColor, 1.0);
}
`;


// ==================================================
// SHADER
// ==================================================

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error =
            gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


function createProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
) {

    const vertexShader =
        createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexShaderSource
        );

    const fragmentShader =
        createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

    const program =
        gl.createProgram();

    gl.attachShader(
        program,
        vertexShader
    );

    gl.attachShader(
        program,
        fragmentShader
    );

    gl.linkProgram(program);

    if (!gl.getProgramParameter(
        program,
        gl.LINK_STATUS
    )) {

        throw new Error(
            gl.getProgramInfoLog(program)
        );
    }

    return program;
}


const program =
    createProgram(
        gl,
        vertexShaderSource,
        fragmentShaderSource
    );


// ==================================================
// CLASSE RENDERER
// ==================================================

class Renderer {

    constructor(gl, program) {

        this.gl = gl;
        this.program = program;

        this.positionLocation =
            gl.getAttribLocation(
                program,
                "aPosition"
            );

        this.colorLocation =
            gl.getUniformLocation(
                program,
                "uColor"
            );

        this.viewTransformLocation =
            gl.getUniformLocation(
                program,
                "u_viewTransform"
            );

        this.modelTransformLocation =
            gl.getUniformLocation(
                program,
                "u_modelTransform"
            );

        this.viewTransform =
            m3.identity();

        this.verticesBuffer =
            gl.createBuffer();
    }


    defineViewTransform(viewTransform) {

        this.viewTransform =
            viewTransform;
    }


    draw(object) {

        const gl = this.gl;

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.verticesBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            object.vertices,
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(
            this.positionLocation
        );

        gl.vertexAttribPointer(
            this.positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.uniform3fv(
            this.colorLocation,
            object.color
        );

        gl.uniformMatrix3fv(
            this.modelTransformLocation,
            false,
            object.modelTransform
        );

        gl.uniformMatrix3fv(
            this.viewTransformLocation,
            false,
            this.viewTransform
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            object.vertices.length / 2
        );
    }
}


// ==================================================
// FUNÇÕES AUXILIARES
// ==================================================

function rectangleVertices(
    x,
    y,
    width,
    height
) {

    return [

        x, y,
        x + width, y + height,
        x, y + height,

        x, y,
        x + width, y,
        x + width, y + height
    ];
}


function circleVertices(
    radius,
    numSegments
) {

    const vertices = [];

    for (
        let i = 0;
        i < numSegments;
        i++
    ) {

        const theta1 =
            (i / numSegments) *
            2 * Math.PI;

        const theta2 =
            ((i + 1) / numSegments) *
            2 * Math.PI;

        vertices.push(
            0,
            0
        );

        vertices.push(
            radius * Math.cos(theta1),
            radius * Math.sin(theta1)
        );

        vertices.push(
            radius * Math.cos(theta2),
            radius * Math.sin(theta2)
        );
    }

    return vertices;
}


// ==================================================
// GEOMETRIA DO ROBÔ
// ==================================================

// Corpo
function bodyVertices() {

    return new Float32Array(
        rectangleVertices(
            -0.30,
            -0.30,
            0.60,
            0.60
        )
    );
}


// Cabeça
function headVertices() {

    return new Float32Array(
        circleVertices(
            0.25,
            32
        )
    );
}


// Braço
//
// O ponto (0,0) é o ombro.
// O braço se estende para baixo.
// Isso permite girá-lo em torno do ombro.
function armVertices() {

    return new Float32Array(
        rectangleVertices(
            -0.09,
            -0.40,
            0.18,
            0.40
        )
    );
}


// Perna
//
// O ponto (0,0) é o quadril.
// A perna se estende para baixo.
function legVertices() {

    return new Float32Array(
        rectangleVertices(
            -0.10,
            -0.45,
            0.20,
            0.45
        )
    );
}


// ==================================================
// CLASSE SCENE OBJECT
// ==================================================

class SceneObject {

    constructor(vertices, color) {

        this.vertices = vertices;

        this.color = color;

        this.modelTransform =
            m3.identity();
    }


    updateModelTransform(
        modelTransform
    ) {

        this.modelTransform =
            modelTransform;
    }
}


// ==================================================
// CLASSE PARTE DO ROBÔ
// ==================================================

class RobotPart extends SceneObject {

    constructor(
        vertices,
        color
    ) {

        super(
            vertices,
            color
        );
    }
}


// ==================================================
// CLASSE ROBÔ
// ==================================================

class Robot {

    constructor() {

        // ------------------------------------------
        // Posição do robô
        // ------------------------------------------

        this.x = 0.0;
        this.y = -0.05;


        // ------------------------------------------
        // Movimento do robô
        // ------------------------------------------

        this.speed = 0.004;

        this.direction = 1;


        // ------------------------------------------
        // Ângulos das partes
        // ------------------------------------------

        this.leftArmAngle = 0.0;
        this.rightArmAngle = 0.0;

        this.leftLegAngle = 0.0;
        this.rightLegAngle = 0.0;

        this.headAngle = 0.0;


        // ------------------------------------------
        // Objetos do robô
        // ------------------------------------------

        this.body =
            new RobotPart(
                bodyVertices(),
                new Float32Array([
                    0.2,
                    0.6,
                    0.9
                ])
            );


        this.head =
            new RobotPart(
                headVertices(),
                new Float32Array([
                    0.8,
                    0.8,
                    0.8
                ])
            );


        this.leftArm =
            new RobotPart(
                armVertices(),
                new Float32Array([
                    0.9,
                    0.4,
                    0.2
                ])
            );


        this.rightArm =
            new RobotPart(
                armVertices(),
                new Float32Array([
                    0.9,
                    0.4,
                    0.2
                ])
            );


        this.leftLeg =
            new RobotPart(
                legVertices(),
                new Float32Array([
                    0.2,
                    0.8,
                    0.3
                ])
            );


        this.rightLeg =
            new RobotPart(
                legVertices(),
                new Float32Array([
                    0.2,
                    0.8,
                    0.3
                ])
            );


        // Tempo da animação
        this.time = 0.0;
    }


    // ==================================================
    // ATUALIZAÇÃO
    // ==================================================

    update() {

        this.time += 0.05;


        // ------------------------------------------
        // Movimento horizontal do robô
        // ------------------------------------------

        this.x +=
            this.speed *
            this.direction;


        if (this.x > 1.3) {

            this.direction = -1;
        }


        if (this.x < -1.3) {

            this.direction = 1;
        }


        // ------------------------------------------
        // Movimento vertical do corpo
        // ------------------------------------------
        //
        // O corpo sobe e desce suavemente.
        //

        const bodyBob =
            Math.sin(this.time * 2.0) *
            0.03;

        this.y =
            -0.05 +
            bodyBob;


        // ------------------------------------------
        // BRAÇOS
        // ------------------------------------------
        //
        // Braço esquerdo e direito se movimentam
        // em sentidos opostos.
        //

        this.leftArmAngle =
            Math.sin(this.time * 3.0) *
            0.5;

        this.rightArmAngle =
            -Math.sin(this.time * 3.0) *
            0.5;


        // ------------------------------------------
        // PERNAS
        // ------------------------------------------
        //
        // As pernas têm movimento diferente dos
        // braços e também se movimentam em oposição.
        //

        this.leftLegAngle =
            Math.sin(this.time * 2.0 + Math.PI) *
            0.35;

        this.rightLegAngle =
            Math.sin(this.time * 2.0) *
            0.35;


        // ------------------------------------------
        // CABEÇA
        // ------------------------------------------

        this.headAngle =
            Math.sin(this.time * 1.5) *
            0.10;


        // Atualiza as transformações
        this.updateTransforms();
    }


    // ==================================================
    // TRANSFORMAÇÕES
    // ==================================================

    updateTransforms() {

        // ------------------------------------------
        // Transformação principal do robô
        // ------------------------------------------

        const robotTransform =
            m3.translation(
                this.x,
                this.y
            );


        // ------------------------------------------
        // CORPO
        // ------------------------------------------

        this.body.updateModelTransform(
            robotTransform
        );


        // ------------------------------------------
        // CABEÇA
        // ------------------------------------------
        //
        // A cabeça fica acima do corpo.
        //
        // T = posição do robô
        //   * posição da cabeça
        //   * rotação
        //

        const headTransform =
            m3.multiply(
                robotTransform,
                m3.multiply(
                    m3.translation(
                        0.0,
                        0.68
                    ),
                    m3.rotation(
                        this.headAngle
                    )
                )
            );


        this.head.updateModelTransform(
            headTransform
        );


        // ------------------------------------------
        // BRAÇO ESQUERDO
        // ------------------------------------------
        //
        // O ponto de origem do braço está no ombro.
        //

        const leftArmTransform =
            m3.multiply(
                robotTransform,
                m3.multiply(
                    m3.translation(
                        -0.39,
                        0.20
                    ),
                    m3.rotation(
                        this.leftArmAngle
                    )
                )
            );


        this.leftArm.updateModelTransform(
            leftArmTransform
        );


        // ------------------------------------------
        // BRAÇO DIREITO
        // ------------------------------------------

        const rightArmTransform =
            m3.multiply(
                robotTransform,
                m3.multiply(
                    m3.translation(
                        0.39,
                        0.20
                    ),
                    m3.rotation(
                        this.rightArmAngle
                    )
                )
            );


        this.rightArm.updateModelTransform(
            rightArmTransform
        );


        // ------------------------------------------
        // PERNA ESQUERDA
        // ------------------------------------------

        const leftLegTransform =
            m3.multiply(
                robotTransform,
                m3.multiply(
                    m3.translation(
                        -0.16,
                        -0.30
                    ),
                    m3.rotation(
                        this.leftLegAngle
                    )
                )
            );


        this.leftLeg.updateModelTransform(
            leftLegTransform
        );


        // ------------------------------------------
        // PERNA DIREITA
        // ------------------------------------------

        const rightLegTransform =
            m3.multiply(
                robotTransform,
                m3.multiply(
                    m3.translation(
                        0.16,
                        -0.30
                    ),
                    m3.rotation(
                        this.rightLegAngle
                    )
                )
            );


        this.rightLeg.updateModelTransform(
            rightLegTransform
        );
    }


    // ==================================================
    // DESENHAR
    // ==================================================

    draw(renderer) {

        // Pernas primeiro
        renderer.draw(
            this.leftLeg
        );

        renderer.draw(
            this.rightLeg
        );


        // Corpo
        renderer.draw(
            this.body
        );


        // Braços
        renderer.draw(
            this.leftArm
        );

        renderer.draw(
            this.rightArm
        );


        // Cabeça
        renderer.draw(
            this.head
        );
    }
}


// ==================================================
// CLASSE CENA
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(
                gl,
                program
            );


        this.viewTransform =
            m3.setClippingWindow(
                -2.0,
                -1.0,
                2.0,
                1.0
            );


        this.renderer.defineViewTransform(
            this.viewTransform
        );


        // Cria o robô
        this.robot =
            new Robot();
    }


    // ==================================================
    // UPDATE
    // ==================================================

    update() {

        this.robot.update();
    }


    // ==================================================
    // DRAW
    // ==================================================

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT
        );

        gl.useProgram(
            program
        );


        this.robot.draw(
            this.renderer
        );
    }


    // ==================================================
    // LOOP
    // ==================================================

    execute() {

        this.update();

        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }


    init() {

        requestAnimationFrame(
            () => this.execute()
        );
    }
}


// ==================================================
// CONFIGURAÇÃO DO WEBGL
// ==================================================

gl.clearColor(
    0.1,
    0.1,
    0.1,
    1.0
);


gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);


// ==================================================
// CRIAR CENA
// ==================================================

const scene =
    new Scene(
        gl,
        program
    );


// ==================================================
// INICIAR
// ==================================================

scene.init();
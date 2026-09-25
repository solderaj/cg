class Scene {
    constructor(gl, program) {

        this.gl = gl;
        this.program = program;

        this.renderer =
            new Renderer(gl, program);

        this.helicopterBody =
            new HelicopterBody();

        this.helicopterTopShaft =
            new HelicopterTopShaft();

        this.helicopterTail =
            new HelicopterTail();

        this.helicopterPropellers =
            new HelicopterPropellers();

        this.helicopterTailPropeller =
            new HelicopterTailPropeller();

        this.posX = 0.0;
        this.posY = 0.0;

        this.propellerAngle = 0.0;
        this.tailPropellerAngle = 0.0;

        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.speed = 0.01;
        this.propellerSpeed = 0.15;

        this.setupKeyboard();
    }

    setupKeyboard() {

        window.addEventListener("keydown", (event) => {

            if (
                event.key === "ArrowUp" ||
                event.key === "ArrowDown" ||
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight"
            ) {
                event.preventDefault();
                this.keys[event.key] = true;
            }
        });

        window.addEventListener("keyup", (event) => {

            if (
                event.key === "ArrowUp" ||
                event.key === "ArrowDown" ||
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight"
            ) {
                event.preventDefault();
                this.keys[event.key] = false;
            }
        });
    }

    update() {

        if (this.keys.ArrowUp) {
            this.posY += this.speed;
        }

        if (this.keys.ArrowDown) {
            this.posY -= this.speed;
        }

        if (this.keys.ArrowLeft) {
            this.posX -= this.speed;
        }

        if (this.keys.ArrowRight) {
            this.posX += this.speed;
        }

        this.propellerAngle += this.propellerSpeed;
        this.tailPropellerAngle += this.propellerSpeed;

        const helicopterTransform =
            m4.translation(
                this.posX,
                this.posY,
                0
            );

        this.helicopterBody.update(
            helicopterTransform
        );

        this.helicopterTopShaft.update(
            helicopterTransform
        );

        this.helicopterTail.update(
            helicopterTransform
        );

        const topPropellerRotation =
            m4.yRotation(
                this.propellerAngle
            );

        const topPropellerTransform =
            m4.multiply(
                helicopterTransform,
                topPropellerRotation
            );

        this.helicopterPropellers.update(
            topPropellerTransform
        );

        const tailCenterX = 0.70;
        const tailCenterY = 0.0;
        const tailCenterZ = 0.06;

        let tailPropellerTransform =
            m4.translation(
                tailCenterX,
                tailCenterY,
                tailCenterZ
            );

        tailPropellerTransform =
            m4.multiply(
                tailPropellerTransform,
                m4.zRotation(
                    this.tailPropellerAngle
                )
            );

        tailPropellerTransform =
            m4.multiply(
                tailPropellerTransform,
                m4.translation(
                    -tailCenterX,
                    -tailCenterY,
                    -tailCenterZ
                )
            );

        tailPropellerTransform =
            m4.multiply(
                helicopterTransform,
                tailPropellerTransform
            );

        this.helicopterTailPropeller.update(
            tailPropellerTransform
        );
    }

    draw() {

        this.gl.clear(
            this.gl.COLOR_BUFFER_BIT |
            this.gl.DEPTH_BUFFER_BIT
        );

        this.gl.useProgram(this.program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

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
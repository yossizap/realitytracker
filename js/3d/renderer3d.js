"use strict";

var renderer3d;
class Renderer3d {

    initialized = false;
    // canvas HTML object
    canvas = null;
    // canvas 3d context
    gl = null;
    // DIV containing 3d canvas
    mapDiv = null;
    aspect = 4 / 3;


    cameraPos = vec4.create();
    cameraYaw = 0;
    cameraPitch = 0;

    
    fov = 80;
    
    constructor() {

        this.canvas = $("#map3d")[0];
        this.mapDiv = $("#renderers")[0];
    };

    init() {
        if (this.initialized)
            return;

        this.gl = this.canvas.getContext("webgl");
        if (this.gl === null) {
            alert("Unable to initialize WebGL.");
            return;
        }
        this._updateRenderingSize();
        vec4.set(this.cameraPos, 0, 200, 0, 0);

        terrainRenderer.init();
        heightmap.callOnReady(() => terrainRenderer.initVertices());

        geometry2dRenderer.init();

        this.initialized = true;
    }

    _updateRenderingSize() {
        this.canvas.width = this.mapDiv.clientWidth;
        this.canvas.height = this.mapDiv.clientHeight;
        this.aspect = this.canvas.width / this.canvas.height;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    };



    loadShader(type, source){
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    getCurrentViewMatrix() {
        const cameraRot = this.getCameraQuat();
        const forward = this.getCameraForward(cameraRot);
        const up = this.getCameraUp(cameraRot);


        const fowrardPoint = vec3.create();
        vec3.add(fowrardPoint, this.cameraPos, forward)


        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, this.cameraPos, fowrardPoint, up);

        return viewMatrix;
    }

    getCurrentProjectionMatrix() {
        const fieldOfView = this.fov * Math.PI / 180;
        const zNear = 1.0;
        const zFar = 4000.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix,
            fieldOfView,
            this.aspect,
            zNear,
            zFar);
        return projectionMatrix;

    }

    getCameraQuat() {
        const cameraRot = quat.create();
        quat.fromEuler(cameraRot, this.cameraPitch, this.cameraYaw, 0);
        return cameraRot;
    }

    getCameraForward(quat) {
        if (quat == null)
            quat = this.getCameraQuat();
        const forward = vec3.create();
        vec3.set(forward, 0, 0, -1, 0);
        vec3.transformQuat(forward, forward, quat);
        return forward;
    }

    getCameraRight(quat) {
        if (quat == null)
            quat = this.getCameraQuat();
        const right = vec3.create();
        vec3.set(right, 1, 0, 0, 0);
        vec3.transformQuat(right, right, quat);
        return right;
    }

    getCameraUp(quat) {
        if (quat == null)
            quat = this.getCameraQuat();
        const up = vec3.create();
        vec3.set(up, 0, 1, 0, 0);
        vec3.transformQuat(up, up, quat);
        return up;
    }

    // Called when mouse is moved when held down
    mouseMove(x, y) {
        this.cameraYaw -= x / 5;
        this.cameraPitch += y / 5;

        if (this.cameraYaw < 0)
            this.cameraYaw += 360;
        else
            this.cameraYaw = this.cameraYaw % 360;

        this.cameraPitch = clamp(-80, this.cameraPitch, 80);

        requestUpdate();
    };


    drawables = [];
    addDrawable(drawable) {
        this.drawables.push(drawable);
    }

    update(frameTime) {
        let keyPressed = false;
        if (keysDown.has(87)) { // W
            const forward = vec3.scale(vec3.create(), this.getCameraForward(), frameTime * 140.0);
            vec3.add(this.cameraPos, this.cameraPos, forward);
            keyPressed = true;
        }
        if (keysDown.has(83)) { // S
            const forward = vec3.scale(vec3.create(), this.getCameraForward(), -frameTime * 140.0);
            vec3.add(this.cameraPos, this.cameraPos, forward);
            keyPressed = true;
        }
        if (keysDown.has(68)) { // D
            const right = vec3.scale(vec3.create(), this.getCameraRight(), frameTime * 140.0);
            vec3.add(this.cameraPos, this.cameraPos, right);
            keyPressed = true;
        }
        if (keysDown.has(65)) { // A
            const right = vec3.scale(vec3.create(), this.getCameraForward(), -frameTime * 140.0);
            vec3.add(this.cameraPos, this.cameraPos, right);
            keyPressed = true;
        }


        if (keyPressed)
            requestUpdate();
    }

    draw() {
        this._updateRenderingSize();
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.1, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        for (let drawable of this.drawables)
            drawable.draw();
    };


};






$(() => {
    renderer3d = new Renderer3d();
});
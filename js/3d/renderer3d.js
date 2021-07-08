"use strict";


var renderer3d;
class Renderer3d extends Initializable {

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

    followTarget = null;

    red = vec3.set(vec3.create(), 1.0, 0.0, 0.0);
    green = vec3.set(vec3.create(), 0.0, 1.0, 0.0);
    blue = vec3.set(vec3.create(), 0.0, 0.25, 1.0);
    white = vec3.set(vec3.create(), 1.0, 1.0, 1.0);

    
    fov = 90;

    constructor() {
        super();
        this.canvas = $("#map3d")[0];
        this.mapDiv = $("#renderers")[0];
        this.dataReady = true;
    };



    getInitializationList() { return [terrainRenderer, geometry2dRenderer, geometryRenderer]; }
    getDependencyList() { return [heightmap]; }

    init() {
        if (this.initialized)
            return true;

        this.gl = this.canvas.getContext("webgl2");
        if (this.gl === null) {
            alert("Unable to initialize WebGL.");
            return false;
        }

        if (!this.runInitList())
            return false;


        this._updateRenderingSize();
        vec4.set(this.cameraPos, 0, 300, 0, 0);

        this.initialized = true;
        return true;
    }

    getMousePos(event) {
        var rect = Canvas.getBoundingClientRect()

        return {
            X: (event.clientX - rect.left),
            Y: (event.clientY - rect.top),
        };
    }

    mouseClick(pos) {
        // to [-1, 1]
        const x = 2 * (pos.X / (this.canvas.width - 1)) - 1;
        const y = 2 * (pos.Y / (this.canvas.height - 1)) - 1;
        const fovRadHalf = this.fov / 180 * Math.PI / 2;
        const tangent = Math.tan(fovRadHalf);

        const directionx = tangent * this.aspect * x
        const directiony = tangent  * -y    
        const directionz = -1.0;

        let clickDirection = vec3.normalize(vec3.create(), vec3.set(vec3.create(), directionx, directiony, directionz));

        const cameraQuat = this.getCameraQuat();
        vec3.transformQuat(clickDirection, clickDirection, cameraQuat);



        const maxPipeDist = 13;
        let best = null;
        let bestDist = 9999;
        for (let i in AllPlayers) {
            const p = AllPlayers[i];

            const playerpos = vec3.set(vec3.create(), p.X, p.Y, -p.Z);
            const playerdirection = vec3.sub(vec3.create(), playerpos, this.cameraPos);
            const dist = vec3.len(playerdirection);
            if (dist > bestDist)
                continue;

            vec3.normalize(playerdirection, playerdirection);

            const angle = Math.acos(vec3.dot(clickDirection, playerdirection)); // cos of angle between click direction to player direction
            const maxAngle = Math.atan(maxPipeDist / dist);

            if (angle < maxAngle) {
                bestDist = dist;
                best = p;
            }
        }
        return best;
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
    getCameraForwardUp(quat) {
        if (quat == null)
            quat = this.getCameraQuat();
        const forward = vec3.create();
        vec3.set(forward, 0, 0.3, -1, 0);
        vec3.normalize(forward, forward);
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
        this.cameraYaw += x / 6;
        this.cameraPitch += y / 6;

        this.clampRotation();

        requestUpdate();
    };

    clampRotation() {
        if (this.cameraYaw < 0)
            this.cameraYaw += 360;
        else
            this.cameraYaw = this.cameraYaw % 360;

        this.cameraPitch = clamp(-80, this.cameraPitch, 80);
    }
    clampPosition() {
        const height = heightmap.getHeightFromCoords(this.cameraPos[0], -this.cameraPos[2]) + 3.0;

        if (this.cameraPos[1] < height)
            this.cameraPos[1] = height;
    }


    update(frameTime) {
        let renderNeeded = false;

        if (this.followTarget == null) {
            let speed = 200;
            if (keysDown.has(16))
                speed = speed * 4;

            if (keysDown.has(87)) { // W
                const forward = vec3.scale(vec3.create(), this.getCameraForwardUp(), frameTime * speed);
                vec3.add(this.cameraPos, this.cameraPos, forward);
                renderNeeded = true;
            }
            if (keysDown.has(83)) { // S
                const forward = vec3.scale(vec3.create(), this.getCameraForwardUp(), -frameTime * speed);
                vec3.add(this.cameraPos, this.cameraPos, forward);
                renderNeeded = true;
            }
            if (keysDown.has(68)) { // D
                const right = vec3.scale(vec3.create(), this.getCameraRight(), frameTime * speed);
                vec3.add(this.cameraPos, this.cameraPos, right);
                renderNeeded = true;
            }
            if (keysDown.has(65)) { // A
                const right = vec3.scale(vec3.create(), this.getCameraRight(), -frameTime * speed);
                vec3.add(this.cameraPos, this.cameraPos, right);
                renderNeeded = true;
            }

            this.clampPosition();
        } else {
            const tpos = this.followTarget.getPos();
            const tdirection = -this.followTarget.getRotation();
            const backside = vec3.set(vec3.create(), 0, 10, 30);
            vec3.transformQuat(backside, backside, quat.fromEuler(quat.create(), 0, tdirection, 0));

            vec3.add(this.cameraPos, backside, tpos);
            this.cameraYaw = tdirection;
            this.cameraPitch = -20; 
        }



        if (renderNeeded)
            requestUpdate();

    }

    draw() {
        this._updateRenderingSize();
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.2, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        terrainRenderer.draw();
        geometry2dRenderer.draw();
        geometryRenderer.draw();
    };

    getGeometry(name) {
        let geom = this.getGeometry3d(name);
        if (geom == null)
            return this.getGeometry2d(name);
    }

    getGeometry2d(name) {
        if (!this.initialized)
            return null;

        return geometry2dRenderer.getCreate2DGeometry(name);
    }

    getGeometry3d(name) {
        if (!this.initialized)
            return null;

        return geometryRenderer.getCreateGeometry(name);
    }

    
};



$(() => {
    renderer3d = new Renderer3d();
});
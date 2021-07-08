


class Geometry2dRenderer extends Initializable {

    prog = null;
    gpu_attribute_vertices = null;
    gpu_uniform_viewMatrix = null;
    gpu_uniform_projectionMatrix = null;
    gpu_uniform_rot = null;

    gpu_buffer_vertices = null;
    gpu_buffer_textureCoords = null;
    gpu_uSampler = null;

    defaultGeometry = null;
    geometries = {};

    dataReady = true;
    initialized = false;

    constructor() {
        super();
    }

    init() {
        if (this.initialized)
            return;

        const gl = renderer3d.gl;
        const vsSource = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureUV;

            uniform vec3 uPos;
            uniform float uRot;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying highp vec2 vTextureCoord;

            void main() {      
              float c = cos(uRot);
              float s = sin(uRot);
              mat4 viewModel = mat4(
                        vec4(c,-s,0.0,0.0),          
                        vec4(s,c,0.0,0.0),          
                        vec4(0.0,0.0,1.0,0.0),           
                        vec4(uPos, 1.0)); 
            
              viewModel[3] = uViewMatrix * viewModel[3];

              gl_Position = uProjectionMatrix * viewModel * vec4(aVertexPosition, 0.0, 1.0);

              vTextureCoord = aTextureUV;
            }
          `;
        const fsSource = `
            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform lowp vec3 uColor;

            void main() {
             gl_FragColor = texture2D(uSampler, vTextureCoord);
            
            if (gl_FragColor.a <= 0.3)
                discard;

            gl_FragColor.rgb *= uColor.rgb;
            }
            

                
          `;

        const vertexShader = renderer3d.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = renderer3d.loadShader(gl.FRAGMENT_SHADER, fsSource);

        const prog = gl.createProgram();
        this.prog = prog;
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog));
            return null;
        }

        this.gpu_attribute_vertices = gl.getAttribLocation(prog, 'aVertexPosition');
        this.gpu_attribute_textureCoords = gl.getAttribLocation(prog, 'aTextureUV');

        this.gpu_uniform_tintColor = gl.getUniformLocation(prog, 'uColor');
        this.gpu_uniform_projectionMatrix = gl.getUniformLocation(prog, 'uProjectionMatrix');
        this.gpu_uniform_viewMatrix = gl.getUniformLocation(prog, 'uViewMatrix');
        this.gpu_uniform_pos = gl.getUniformLocation(prog, 'uPos');
        this.gpu_uSampler = gl.getUniformLocation(prog, 'uSampler');
        this.gpu_uniform_rot = gl.getUniformLocation(prog, 'uRot');
        

        let positions = [
            -8.0, 8.0,
            8.0, 8.0,
            -8.0, -8.0,
            8.0, -8.0,
        ];
        this.gpu_buffer_vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_vertices);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        // Y inversed from above, all icons are pointing down, but we want up to be north
        positions = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];
        this.gpu_buffer_textureCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_textureCoords);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        this.defaultGeometry = new Geometry2d(null);

        this.initialized = true;
    }

    getCreate2DGeometry(iconName) {
        if (iconName == null || iconName == "")
            return this.defaultGeometry;

        let geometry = this.geometries[iconName];
        if (geometry === undefined) {
            geometry = new Geometry2d(coloredIcons[iconName][3]);
            this.geometries[iconName] = geometry;
        }
        return geometry;
    }


    //drawProj(p) {
    //    const proj = AllProj[p];
    //    if (proj.ns_isFast && Math.abs(proj.ns_lastX - proj.X) < 10
    //        && Math.abs(proj.ns_lastY - proj.Y) < 10
    //        && Math.abs(proj.ns_lastZ - proj.Z) < 10)
    //        return

    //    let color;
    //    if (proj.player != null) {
    //        const p = proj.player
    //        if (SelectedPlayer == p.id) {
    //            color = this.white;
    //        }
    //        else if (p.team == SelectedSquadTeam && p.squad == SelectedSquadNumber) {
    //            color = this.green;
    //        } else {
    //            color = p.team == 1 ? this.red : this.blue;
    //        }
    //    }

    //    const imageName = proj.ns_iconName;
    //    const geometry = this.getCreate2DGeometry(imageName);

    //    const pos3 = proj.getPos();
    //    pos3[1] += 8.0;
    //    geometry.draw(pos3, ((proj.getRotation() + renderer3d.cameraYaw) / 180.0 * Math.PI), color);
    //}



    draw() {
        const gl = renderer3d.gl;

        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(
            this.gpu_uniform_projectionMatrix,
            false,
            renderer3d.getCurrentProjectionMatrix());
        gl.uniformMatrix4fv(
            this.gpu_uniform_viewMatrix,
            false,
            renderer3d.getCurrentViewMatrix());

        const vertexAttribute = this.gpu_attribute_vertices;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_vertices);
        gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 8, 0);
        gl.enableVertexAttribArray(vertexAttribute);

        const textureCoordsAttribute = this.gpu_attribute_textureCoords;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_textureCoords);
        gl.vertexAttribPointer(textureCoordsAttribute, 2, gl.FLOAT, false, 8, 0);
        gl.enableVertexAttribArray(textureCoordsAttribute);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(geometry2dRenderer.gpu_uSampler, 0);


        //for (var i in AllProj)
        //    this.drawProj(i)     
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}
class Geometry2d {

    texture = null;
    constructor(textureImage) {
        const gl = renderer3d.gl;

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        if (textureImage != null) {
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureImage);
            if (isPowerOf2(textureImage.width) && isPowerOf2(textureImage.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        }
            
        else
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 1, 1, 0, srcFormat, srcType, new Uint8Array([0, 0, 255, 255]));


        
    }

    // only translation and one axis rotation.
    draw(pos3, rot, color) {
        const gl = renderer3d.gl;

        // set texture
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);



        gl.uniform1f(geometry2dRenderer.gpu_uniform_rot, rot);       

        // set position
        gl.uniform3fv(geometry2dRenderer.gpu_uniform_pos, pos3);

        // set tint
        gl.uniform3fv(geometry2dRenderer.gpu_uniform_tintColor, color);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

}

var geometry2dRenderer = null;
$(() => {
    geometry2dRenderer = new Geometry2dRenderer();
})


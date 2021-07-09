"use strict";

var geometryRenderer;
class GeometryRenderer extends Initializable {
    geometries = {};
    geomdata = null;

    prog = null;

    gpu_attribute_vertices = null;
    gpu_attribute_normals = null;
    gpu_attribute_nodeid = null;

    gpu_uniform_tintColor = null; 
    gpu_uniform_projectionMatrix = null;
    gpu_uniform_viewMatrix = null;
    gpu_uniform_modelMatrix = null;

    testIndices = null;
    testVertices = null;

    testGeomPos = vec3.create();

    constructor() {
        super();

        downloadManager.download("indices.rawi", "bin", ((data) => {
            this.testIndices = data;
            this._updateIsDataReady();
        }), "Geometry Indices");


        downloadManager.download("vertices.rawv", "bin", ((data) => {
            this.testVertices = data;
            this._updateIsDataReady();
        }), "Geometry Vertices");


        downloadManager.download("geomdata.json", "json", ((data) => {
            this.geomdata = data;
            this._updateIsDataReady();
        }), "Geometry Data");
    }

    _updateIsDataReady() {
        this.dataReady = (this.geomdata != null && this.testIndices != null && this.testVertices != null)
    }

    init() {
        const gl = renderer3d.gl;
        const vsSource = `
            attribute vec3 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute float nodeid;

            uniform mat4 uModelMatrix[20];
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying highp vec3 vNormal;

            void main() {      
                int id = int(nodeid);
 
            // Position
              gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix[id] * vec4(aVertexPosition, 1.0);

            // Lightning
              vNormal = normalize(mat3(uModelMatrix[id]) * aVertexNormal);
            }
          `;
        const fsSource = `
            varying highp vec3 vNormal;
            varying highp vec2 vTextureCoord;

            uniform highp vec3 uColor;
            
            void main() {            
              highp float strength = max(dot(vNormal,  vec3(0.577, 0.577, 0.577)), 0.0);
              highp vec3 lightning = vec3(0.3, 0.3, 0.3) + (vec3(0.7, 0.7, 0.7) * strength);        

              gl_FragColor.rgb = uColor.rgb * lightning;
              gl_FragColor.a = 1.0;
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
        this.gpu_attribute_normals = gl.getAttribLocation(prog, 'aVertexNormal');
        this.gpu_attribute_nodeid = gl.getAttribLocation(prog, 'nodeid');
        
        this.gpu_uniform_tintColor = gl.getUniformLocation(prog, 'uColor');
        this.gpu_uniform_projectionMatrix = gl.getUniformLocation(prog, 'uProjectionMatrix');
        this.gpu_uniform_viewMatrix = gl.getUniformLocation(prog, 'uViewMatrix');
        this.gpu_uniform_modelMatrix = gl.getUniformLocation(prog, 'uModelMatrix');

        this.initialized = true;
    }


    drawVehicle(i) {
        const v = AllVehicles[i]
        const geometry = v.getGeometry();
        if (geometry == null)
            return;

        const color = v.getTeamColor3d();
        const pos3 = v.getPos();
        pos3[1] += 4.0;
        geometry.draw(pos3, (v.getRotation() / 180.0 * Math.PI), color);
    }


    getCreateGeometry(name) {
        if (!this.initialized)
            return null;

        let geomname;
        // tmp
        if (name.includes("_the_mv22"))
            geomname = "us_the_mv22";
        else if (name.includes("_the_"))
            geomname = "us_the_uh1c";
        else if (name.includes("_jep_"))
            geomname = "us_jep_hmmwv";
        else if (name.includes("_jet_"))
            geomname = "us_jet_f15";
        else if (name.includes("_trk_"))
            geomname = "ru_trk_logistics";
        else if (name.includes("apc") || name.includes("ifv"))
            geomname = "ru_apc_btr80a";
        else if (name.includes("_tnk_"))
            geomname = "us_tnk_m1a2"
        else
            geomname = "us_jep_hmmwv";
        /////


        if (!(geomname in this.geometries))
            this.geometries[geomname] = new Geometry(geomname);
        return this.geometries[geomname];

    }

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

        for (var i in AllVehicles)
            this.drawVehicle(i);

        //this.getCreateGeometry("us_jet_f15").draw(this.testGeomPos, 0, vec3.set(vec3.create(), 0, 1, 0.5));

    }
}


const GEOM3D_STRIDE_SIZE = 16;
class Geometry {


    gpu_buffer_vertices = null;
    gpu_buffer_indices = [];
    data = null;

    constructor(name) {
        const gl = renderer3d.gl;
        const geomdata = geometryRenderer.geomdata
        if (!(name in geomdata))
            name = "us_jep_hmmwv.bundledmesh"

        const data = geomdata[name];
        this.data = data;

        this.gpu_buffer_vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(geometryRenderer.testVertices), gl.STATIC_DRAW, data.verticesOffset, data.verticesCount * GEOM3D_STRIDE_SIZE);

        
        for (let i = 0; i < data.draws.length; i++) {
            const draw = data.draws[i];
            const buf = gl.createBuffer();
            this.gpu_buffer_indices.push(buf);

            const indexview = new DataView(geometryRenderer.testIndices, data.indicesOffset + draw.istart * 2, draw.inum * 2);
            const int32indices = new ArrayBuffer(draw.inum * 4)
            const int32IndicesView = new DataView(int32indices);
            for (let j = 0; j < draw.inum; j++) {
                int32IndicesView.setUint32(j * 4, indexview.getUint16(j * 2, true) + draw.vstart, true)
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, int32IndicesView, gl.STATIC_DRAW, 0);
        }

    }

    draw(pos, rot, color) {
        const gl = renderer3d.gl;
        const m = mat4.create();
        m[0] = 2;
        m[5] = 2;
        m[10] = 2;
        m[12] = pos[0];
        m[13] = pos[1];
        m[14] = pos[2];
        mat4.rotateY(m, m, -rot + Math.PI);


        const ma = new Float32Array(20 * 16);
        for (let i = 0; i < 20; i++) {
            const offset = i * 16;
            for (let j = 0; j < 16; j++) {
                ma[offset + j] = m[j];
            }
            m[13] += 5;
        }

        // Model matrix
        gl.uniformMatrix4fv(
            geometryRenderer.gpu_uniform_modelMatrix,
            false,
            ma);
  


        // Color
        gl.uniform3fv(geometryRenderer.gpu_uniform_tintColor, color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.gpu_buffer_vertices);
        const vertexAttribute = geometryRenderer.gpu_attribute_vertices;
        const normalsAttribute = geometryRenderer.gpu_attribute_normals;
        const nodeidAttribute = geometryRenderer.gpu_attribute_nodeid;
        gl.vertexAttribPointer(vertexAttribute, 3, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(vertexAttribute);

        gl.vertexAttribPointer(normalsAttribute, 3, gl.BYTE, true, 16, 12);
        gl.enableVertexAttribArray(normalsAttribute);

        gl.vertexAttribPointer(nodeidAttribute, 1, gl.BYTE, false, 16, 15);
        gl.enableVertexAttribArray(nodeidAttribute);

        for (let i = 0; i < this.data.draws.length; i++) {
            const draw = this.data.draws[i];
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gpu_buffer_indices[i]);
            gl.drawElements(gl.TRIANGLES, draw.inum, gl.UNSIGNED_INT, 0);
        }

    }

}

$(() => { geometryRenderer = new GeometryRenderer(); })
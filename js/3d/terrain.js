"use strict";


// x, y, z, u, v
const HEIGHTMAP_STRIDE_SIZE = 5 * 4

var terrainRenderer;
class TerrainRenderer extends Initializable {
    indices = null;
    TERRAINSEGMENT_SIZE = 128;
    TERRAINSEGMENT_LODSIZE = [129];
    TERRAINSEGMENT_LODSCALE = [1];
    TERRAINSEGMENT_LODINDEXSIZE = [];

    mapTexture = null;
    terrainProgram = null;

    gpu_verticesCoords = null;
    gpu_textureCoords = null;
    //gpu_verticesNormal = null;

    gpu_projectionMatrix = null;
    gpu_viewMatrix = null;
    gpu_uSampler = null;

    segments = [];

    constructor() {
        super();

        for (let i = 0; i < this.TERRAINSEGMENT_LODSIZE.length; i++)
            this.TERRAINSEGMENT_LODINDEXSIZE.push(this._getElementCount(this.TERRAINSEGMENT_LODSIZE[i]))
        this.dataReady = true;
    }

    getIsDataReady() {
        return MapImage != null && heightmap.initialized;
    }

    init() {
        if (this.initialized)
            return true;

        const gl = renderer3d.gl;

        this._createIndicesBuffers(gl);
        this._loadMapImageAsTexture();
        this._createProgram();
        this._createSegments();
        this.initialized = true;
        return true;
    }

    _createProgram() {
        // Vertex shader
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec2 aTextureUV;

            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying highp vec2 vTextureCoord;


            varying lowp vec3 vLighting;
            void main(void) {      
              gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
              vTextureCoord = aTextureUV;
                

            }
          `;
        // Pixel shader
        const fsSource = `
            varying highp vec2 vTextureCoord;
            varying lowp vec3 vLighting;
            uniform sampler2D uSampler;

            void main() {
              gl_FragColor = texture2D(uSampler, vTextureCoord);
              //gl_FragColor = vec4(gl_FragColor.rgb * vLighting, gl_FragColor.a);
            }`
        const gl = renderer3d.gl;

        const terrainProgram = gl.createProgram();
        gl.attachShader(terrainProgram, renderer3d.loadShader(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(terrainProgram, renderer3d.loadShader(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(terrainProgram);

        if (!gl.getProgramParameter(terrainProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(terrainProgram));
            return null;
        }

        this.terrainProgram = terrainProgram;
        this.gpu_verticesCoords = gl.getAttribLocation(terrainProgram, 'aVertexPosition');
        this.gpu_textureCoords = gl.getAttribLocation(terrainProgram, 'aTextureUV');
        //this.gpu_verticesNormal = gl.getAttribLocation(terrainProgram, 'aVertexNormal');

        this.gpu_projectionMatrix = gl.getUniformLocation(terrainProgram, 'uProjectionMatrix');
        this.gpu_viewMatrix = gl.getUniformLocation(terrainProgram, 'uViewMatrix');
        this.gpu_uSampler = gl.getUniformLocation(terrainProgram, 'uSampler');

        console.log("TERRAIN: Compiled terrain shaders");
    }

    // Create coords for the vertices of the heightmap 
    // Cut heightmap into 129x129 segments.
    _createSegments() {
        const segmentCount = Math.floor(heightmap.size / 128);
        for (let i = 0; i < segmentCount; i++) {
            const l = []
            this.segments.push(l);
            for (let j = 0; j < segmentCount; j++) {
                l.push(new TerrainSegment(i * 128, j * 128));
            }
        }
        console.log("TERRAIN: initialized heightmap segments: " + segmentCount + "x" + segmentCount);
            
    };

    _loadMapImageAsTexture() {
        if (MapImage == null) {
            console.error("TERRAIN: Called load texture for map when map isn't ready");
            return;
        }
        const gl = renderer3d.gl;

        this.mapTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, MapImage);
        gl.generateMipmap(gl.TEXTURE_2D);

        console.log("TERRAIN: Loaded map image as texture");
    }

    _createIndicesBuffers() {
        if (this.indices != null)
            return;
        this.indices = [];

        for (let i = 0; i < this.TERRAINSEGMENT_LODSIZE.length; i++)
            this.indices.push(this._createIndicesBuffer(this.TERRAINSEGMENT_LODSIZE[i]));
    }

    _createIndicesBuffer(size) {

        const gl = renderer3d.gl;
        const indicesSize = this._getElementCount(size);
        const indices = new Uint16Array(indicesSize);
        let indicesIterator = 0;
        for (let i = 0; i < size - 1; i++) // row
        {
            for (let j = 0; j < size; j++) { // columns
                indices[indicesIterator++] = ((i + 0) * size + (j + 0));
                indices[indicesIterator++] = ((i + 1) * size + (j + 0));
            }

            // 2 degenerate verticies for next row, the last and the first of the lower row
            indices[indicesIterator++] = ((i + 1) * size + (size - 1));
            indices[indicesIterator++] = ((i + 1) * size + 0);
        }

        console.assert(indicesIterator == indicesSize);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        return buffer;
    };

    // How many indices do we need for a sizeXsize terrain segment
    _getElementCount(size) {
        return (size - 1) * (2 * size + 2);
    }

    draw() {
        const gl = renderer3d.gl;
        gl.useProgram(this.terrainProgram);
        gl.uniformMatrix4fv(this.gpu_projectionMatrix, false, renderer3d.getCurrentProjectionMatrix());
        gl.uniformMatrix4fv(this.gpu_viewMatrix, false, renderer3d.getCurrentViewMatrix());

        // Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
        gl.uniform1i(this.gpu_uSampler, 0);

        for (let l of this.segments)
            for (let segment of l) {
                segment.draw(0);
            }
                
    }
}

class TerrainSegment {  
    gpu_vertexBuffer = [];

    constructor(xstart, zstart) {
        const gl = renderer3d.gl;
        const tr = terrainRenderer;

        for (let i = 0; i < tr.TERRAINSEGMENT_LODSCALE.length; i++) {
            const lodScale = tr.TERRAINSEGMENT_LODSCALE[i]; // 1, 4, 16
            const size = tr.TERRAINSEGMENT_LODSIZE[i]; // 129, 33, 9

            const verticeBuffer = new ArrayBuffer(size * size * HEIGHTMAP_STRIDE_SIZE)
            for (let i = xstart; i < xstart + size; i = i + lodScale) // i,j in heightmap.raw coordinates
                for (let j = zstart; j < zstart + size; j = j + lodScale) {
                    const xyz = this._getVertexAtHeightmapCoords(i, j);
                    //const normal = this._calculateNormal(i, j);
                    const offset = ((i - xstart) * size) + (j - zstart);

                    const view = new DataView(verticeBuffer, offset * HEIGHTMAP_STRIDE_SIZE, HEIGHTMAP_STRIDE_SIZE);

                    const u = i / heightmap.size;
                    const v = j / heightmap.size;
                    this._encodeHeightmapVertex(view, xyz, u, v);
                }

            const gpuvertices = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gpuvertices);
            gl.bufferData(gl.ARRAY_BUFFER, verticeBuffer, gl.STATIC_DRAW);
            this.gpu_vertexBuffer.push(gpuvertices);
        }
    };

    //_calculateNormal(i, j) {
    //    const points = []
    //    for (let x = -1; x <= 1; x++)
    //        for (let y = -1; y <= 1; y++)
    //            points.push(this._getVertexAtHeightmapCoords(i + x, j + y))
            
    //    const self = points[4];
    //    const sum = vec3.create();
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[0], points[1]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[1], points[2]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[2], points[5]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[5], points[8]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[8], points[7]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[7], points[6]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[6], points[3]));
    //    vec3.add(sum, sum, this.calculateNormalFrom3Points(self, points[3], points[0]));

    //    return vec3.normalize(sum, sum);
    //}

    //calculateNormalFrom3Points(v1, v2, v3) {
    //    const e1 = vec3.sub(vec3.create(), v1, v2);
    //    const e2 = vec3.sub(vec3.create(), v1, v3);
    //    vec3.cross(e1, e1, e2);
    //    if (e1[1] < 0)
    //        vec3.scale(e1, e1, -1.0);
    //    return e1;
            
    // }

    _getVertexAtHeightmapCoords(i, j) {
        const v = vec3.create();
        v[0] = (i * heightmap.scalex) - (heightmap.terrainSize / 2);
        v[1] = heightmap.getHeightFromOffset(heightmap.size - j, i);
        v[2] = (j * heightmap.scalez) - (heightmap.terrainSize / 2);
        return v;
    }


    _encodeHeightmapVertex(view, xyz, u, v, n) {
        view.setFloat32(0, xyz[0], true);
        view.setFloat32(4, xyz[1], true);
        view.setFloat32(8, xyz[2], true);
        view.setFloat32(12, u, true);
        view.setFloat32(16, v, true);
        //view.setUint8(20, n[0] * 0x7F);
        //view.setUint8(21, n[1] * 0x7F);
        //view.setUint8(22, n[2] * 0x7F);
    };

    draw(lod) {
        const gl = renderer3d.gl;

        ////// Set Vertices
        const vertexbuffer = this.gpu_vertexBuffer[lod];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

        // define vertex coords
        {
            const numComponents = 3;  // pull out 3 values per iteration
            const type = gl.FLOAT;    // the data in the buffer is 32bit floats
            const normalize = false;  // don't normalize
            const stride = HEIGHTMAP_STRIDE_SIZE;         // how many bytes to get from one set of values to the next
            const offset = 0;         // how many bytes inside the buffer to start from
            const attributeID = terrainRenderer.gpu_verticesCoords;
            gl.vertexAttribPointer(attributeID, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(attributeID);
        }
        // define vertex texture coords
        {
            const numComponents = 2;  // pull out 2 values per iteration
            const type = gl.FLOAT;    // the data in the buffer is 32bit floats
            const normalize = false;  // don't normalize
            const stride = HEIGHTMAP_STRIDE_SIZE;         // how many bytes to get from one set of values to the next
            const offset = 12;         // how many bytes inside the buffer to start from
            const attributeID = terrainRenderer.gpu_textureCoords;
            gl.vertexAttribPointer(attributeID, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(attributeID);
        }
        //{
        //    const numComponents = 3;
        //    const type = gl.BYTE;
        //    const normalize = true;
        //    const stride = HEIGHTMAP_STRIDE_SIZE;
        //    const offset = 20;
        //    const attributeID = terrainRenderer.gpu_verticesNormal;
        //    gl.vertexAttribPointer(attributeID,numComponents,type,normalize,stride,offset);
        //    gl.enableVertexAttribArray(attributeID);
        //}


        //// Set Indices 
        const indicesForLod = terrainRenderer.indices[lod]
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesForLod);

        // Draw
        gl.drawElements(gl.TRIANGLE_STRIP, terrainRenderer.TERRAINSEGMENT_LODINDEXSIZE[lod], gl.UNSIGNED_SHORT, 0);
    };




}

$(() => {
    terrainRenderer = new TerrainRenderer();

})
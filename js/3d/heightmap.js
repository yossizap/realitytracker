"use strict";


var heightmap;
class Heightmap {
    heightdataview = null;
    bitresolution = null;
    bytesize = null;

    size = null;
    terrainSize = null;

    scalex = null;
    scaley = null;
    scalez = null;

    waterlevel = 0;

    dataReady = true;
    initialized = false;

    constructor() {

    }

    init(link, data) {
        try {
            this.size = parseInt(data.size.split(" ")[0]);
            this.terrainSize = parseInt(data.fullsize);
            //this.waterlevel = parseInt(data.waterlevel);
            this.scalex = parseFloat(data.scale.split("/")[0]);
            this.scaley = parseFloat(data.scale.split("/")[1]);
            this.scalez = parseFloat(data.scale.split("/")[2]);
            this.bitresolution = parseInt(data.bitresolution); 
            this.bytesize = this.bitresolution / 8;
            
        } catch (e) {
            console.error(e);
            console.error("Could not parse heightmap data. Aborting");
            console.error(data);
        }


        this._downloadHeightmap(link);
    };

    _downloadHeightmap(link) {
        downloadManager.download(link, "bin", (data) => {
            console.log("Heightmap downloaded");
            this.heightdataview = new DataView(data);
            this.initialized = true;
        }, "Map Heightmap");
    }

    

    getHeightFromOffset(i, j) {      
        const offset = (i * this.size + j) * this.bytesize;
        if (offset + this.bytesize - 1 > this.heightdataview.byteLength)
            return this.waterlevel;
        if (offset < 0)
            return this.waterlevel;

        switch (this.bytesize) {
            case 1:
                return (this.heightdataview.getUint8(offset) * this.scaley);
            case 2:
                return (this.heightdataview.getUint16(offset, true) * this.scaley);
            case 4:
                return (this.heightdataview.getUint32(offset, true) * this.scaley);
        }
        return this.waterlevel;
    };

    // TODO
    getHeightFromCoords(x, z) {
        x += this.terrainSize / 2;
        z += this.terrainSize / 2;
        x /= this.scalex;
        z /= this.scalez;

        let xint = Math.floor(x);
        let zint = Math.floor(z);
        let dx1 = x - xint;
        let dz1 = z - zint;
        let dx2 = 1.0 - dx1;
        let dz2 = 1.0 - dz1;
        let q11 = this.getHeightFromOffset(zint, xint);
        let q12 = this.getHeightFromOffset(zint, xint + 1); 
        let q21 = this.getHeightFromOffset(zint + 1, xint);
        let q22 = this.getHeightFromOffset(zint + 1, xint + 1); 

        return dx2 * q11 * dz2 +
            dx2 * q12 * dz1 +
            dx1 * q21 * dz2 +
            dx1 * q22 * dz1; 
    }


}


$(() => {
    heightmap = new Heightmap();
});
"use strict";


var heightmap;
class Heightmap {
    heightdataview = null;
    bitresolution = 16;
    bytesize = 2;

    size = 1025;
    terrainSize = 4096;

    scalex = 4;
    scaley = 0.00335693;
    scalez = 4;

    waterlevel = 0;

    ready = false;

    constructor() {

    }

    init(link, data) {
        if (data != null) {
            this.size = data.size;
            this.waterlevel = data.waterlevel;
            this.scalex = data.scalex;
            this.scaley = data.scaley;
            this.scalez = data.scalez;
            this.bitresolution = data.bitresolution;
            this.bytesize = data.bitresolution / 8;
        }

        this._downloadHeightmap(link);
    };

    _downloadHeightmap(link) {
        var req = new XMLHttpRequest();
        req.open('GET', link);
        req.responseType = "arraybuffer";
        req.onload = (() => {

            if (req.status != 0 && req.status != 200 && req.status != 304) {
                console.error("Could not download heightmap. Error code " + req.status)
                return
            }

            console.log("Heightmap downloaded: " + link);
            const buffer = req.response;

            this.heightdataview = new DataView(buffer);

            this.ready = true;
            for (let callback of this.readyCallback)
                callback();
        });
        req.send();
    }

    readyCallback = []
    callOnReady(callback) {
        if (this.ready)
            callback();
        else
            this.readyCallback.push(callback);
    }


    getHeightFromOffset(i, j) {
        const offset = (i * this.size + j) * this.bytesize; 
        if (offset + this.bytesize - 1 > this.heightdataview.byteLength)
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



}


$(() => {
    heightmap = new Heightmap();
});
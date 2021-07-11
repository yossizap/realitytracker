"use strict";


const MAPRENDERER_SEGMENT_DOWNLOADING = new Object();
class MapRenderer {
    fullSize = null;

    // Zoom -> X -> Y
    // undefined for not downloaded
    // MAPRENDERER_SEGMENT_DOWNLOADING during download
    // Image object when done
    segments = null;

    mapname = ""


    init() {
        this.segments = [];
        this.fullSize = MapSize * 1024;
        this.mapname = MapName.replaceAll("_", "");

        for (let i = 0; i < this.getMaxZoomCount(); i++) {
            const zoomLevel = []
            this.segments.push(zoomLevel)
            for (let x = 0; x < this.getSegmentCountOfZoomLevel(i); x++) {
                const zoomLevelX = []
                zoomLevel.push(zoomLevelX);
                for (let y = 0; y < this.getSegmentCountOfZoomLevel(i); y++) {
                    zoomLevelX.push(undefined);
                }
            }
        }


        this._downloadSegment(0, 0, 0);
        this._downloadSegment(0, 0, 1);
        this._downloadSegment(0, 1, 0);
        this._downloadSegment(0, 1, 1);
    }



    // Decide on zoom level and segments
    draw(ctx) {
        // zoom level (0 based where Zoom level 0 is 2x2)
        const zoomlevel = this._decideZoomlevel();
        // Amount of segments in current zoom level (0 is 2 segments, 1 is 4 segments)
        const segmentCount = this.getSegmentCountOfZoomLevel(zoomlevel);


        // Render size in canvas coords after zoom
        const renderSize = this.getSegmentSize(zoomlevel) * CameraZoom;

        // Including
        const minx = clamp(0, Math.floor(-CameraX / renderSize), segmentCount - 1);
        const miny = clamp(0, Math.floor(-CameraY / renderSize), segmentCount - 1);

        // Not including
        const maxx = clamp(0, Math.floor((-CameraX + Canvas.width) / renderSize) + 1, segmentCount);
        const maxy = clamp(0, Math.floor((-CameraY + Canvas.height) / renderSize) + 1, segmentCount);


        for (let x = minx; x < maxx; x++)
            for (let y = miny; y < maxy; y++) {
                const img = this.segments[zoomlevel][x][y];
                if (img === MAPRENDERER_SEGMENT_DOWNLOADING)
                    continue;
                if (img === undefined) {
                    this._downloadSegment(zoomlevel, x, y);
                    continue;
                }
                ctx.drawImage(img, CameraX + x * renderSize, CameraY + y * renderSize, renderSize, renderSize);
            }
        
     }

    // No checks - only call when needed
    _downloadSegment(zoom, x, y) {
        this.segments[zoom][x][y] = MAPRENDERER_SEGMENT_DOWNLOADING;
        const URL = `https://www.realitymod.com/mapgallery/images/maps/${this.mapname}/tiles/${zoom + 1}/${x}/${y}.jpg`;
        
        downloadManager.download(URL, "image", (data) => {
            this.segments[zoom][x][y] = data;
            requestUpdate();
        }, "Map segment");
    }

  

    _decideZoomlevel() {
        const actualZoom = CameraZoom * options_canvasScale;     
        return clamp(0, Math.floor(Math.log2(actualZoom * 1.5)), this.getMaxZoomCount() - 1);
    }


    getSegmentSize(zoom) {        
        return 1024 / (2 ** (zoom + 1));
    }

    getSegmentCountOfZoomLevel(zoom) {
        return 2 ** (zoom + 1);
    }

    getMaxZoomCount() {
        return Math.log2(this.fullSize) - 8;
    }

}


var mapRenderer;
$(() => { mapRenderer = new MapRenderer(); });
"use strict";

const SHOW_DELAY = 3000

var downloadManager;
class DownloadManager {

    downloads = [];

    div = null;
    table = null;
    constructor() {
        this.div = $("#downloads")[0];
        this.table = $("#downloadsTable")[0];

        $("#downloads").dialog({
            //dialogClass: "no-close",
            title: "Downloads",
            width: 350,
            height: 160,
            resizable: false,
            position: { my: "left bottom", at: "left top", of: "#startPauseButton"},
            draggable: false,
            autoOpen: false,
        });
        setInterval(() => this.updateShow(), 1250);
    }



    download(link, type, callback, name, onError) {
        console.log("Downloading " + link);
        const typelow = type.toLowerCase();
        const d = {
            link: link,
            type: typelow,
            callback: callback,
            callbackError: onError,
            name: name,
            done: false,
            totalsize: null,
            donesize: null,
            content: null,
            row: null,
            startTime: Date.now(),
			started: false
        }

        switch (typelow) {
            case "json":
                $.getJSON(link, (json) => {
                    d.content = json;
                    this.onDownloadComplete(d)
                })
                break;
            case "bin":
                const req = new XMLHttpRequest();
                req.open('GET', link);
                req.responseType = "arraybuffer";
                req.onload = (() => {
                    d.content = req.response;
                    this.onDownloadComplete(d)
                });
                req.onprogress = ((e) => {
                    d.totalsize = e.total;
                    d.donesize = e.loaded;
					d.started = true;
                    this.onDownloadProgress(d);
                });
                req.onerror = (() => { this.onDownloadError(d); });
                req.send();
                break;
            case "image":
                const img = new Image();
                img.onload = () => {
                    d.content = img;
                    this.onDownloadComplete(d);
                }
                img.onprogress = ((e) => {
                    d.totalsize = e.total;
                    d.donesize = e.loaded;
					d.started = true;
                    this.onDownloadProgress(d);
                });
                img.onerror = (() => { this.onDownloadError(d); });
                img.load(link);
                break;
            default:
                console.error("Unknown download type " + type);
                return;
        }

        this.downloads.push(d);
        

        const row = this.table.insertRow();
        d.row = row;
        const c0 = row.insertCell();
        const c1 = row.insertCell();

        if (d.name != null)
            c0.innerText = d.name;
        else
            c0.innerText = d.link;
        c1.innerText = "Connecting....";

        this.updateShow();
    }

    onDownloadProgress(d) {
        if (d.totalsize != 0 && d.totalsize != null)
            d.row.cells[1].innerText = Math.floor((d.donesize / d.totalsize) * 100) + "% / " + Math.floor(d.totalsize / 1000) + "kb";
        else
            d.row.cells[1].innerText = Math.floor(d.donesize / 1000) + "kb";
    }
    onDownloadComplete(d) {
        d.done = true;
        d.callback(d.content);
        this.cleanDownload(d);      
    }
    onDownloadError(d) {
        console.log("Error downloading", d)
        d.row.cells[1].innerText = "Error";
        if (d.callbackError != null) {
            d.callbackError(d);
        }

        this.updateShow();
    }

    cleanDownload(d) {
        const id = this.downloads.indexOf(d);
        this.downloads.splice(id, 1);
        d.row.remove();

        this.updateShow();
    }

    updateShow() {
        const shouldShow = (this.downloads.find(download => (download.startTime) + SHOW_DELAY < Date.now() && download.started) != undefined)
        // if (shouldShow)
            // $("#downloads").dialog("open");
        // else
            $("#downloads").dialog("close");
    }


}
$(() => {downloadManager = new DownloadManager();});
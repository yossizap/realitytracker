"use strict;"

var atlascontext

var icons = {}

function atlasLoaded()
{
	if (!(atlasJSON_loaded && atlasPNG_loaded))
		return

	// Draw the atlas on a temp canvas
	var c = document.createElement('canvas');
	c.width = 4096
	c.height = 33
	atlascontext = c.getContext("2d")
	atlascontext.drawImage(atlasPNG, 0, 0)

	for (var Name in atlas)
	{
		ThingsLoading++
		icons[Name] = new Image()
		icons[Name].onload = objectLoaded
		icons[Name].src = loadImageFromAtlas(Name)
	}
}

// Converts to image blob from "ImageData". a bit inefficient, but that's all javascript gives me.
function loadImageFromAtlas(Name)
{
	const atlasPoint = atlas[Name]
	if (!atlasPoint)
	{
		console.log("Unknown atlas key"+Name)
		return
	}

	const XPos = atlasPoint[0]
	const sizex = atlasPoint[1]
	const sizey = atlasPoint[2]
	const imagedata = atlascontext.getImageData(XPos, 0, sizex, sizey)

	var tempcanvas = document.createElement('canvas')
	tempcanvas.width = sizex
	tempcanvas.height = sizey

	var tempcontext = tempcanvas.getContext("2d")
	tempcontext.putImageData(imagedata, 0, 0)

	return tempcanvas.toDataURL()
}
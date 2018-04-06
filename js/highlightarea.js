"use strict";

var highlights = []

const fadePerMillisecond = 0.002

$(()=> redrawNeededChecks.push(highlightExists))

function highlight(x,z)
{
	this.x = x
	this.z = z
	this.fade = 1
	this.time = (new Date().getTime())
	highlights.push(this)
	redrawTimerStart()
}


function drawAllHightlights()
{
	Context.strokeStyle = "red"
	Context.lineWidth = 2
	for (var i = 0; i < highlights.length; i++)
		drawHighlight(highlights[i])
	
}

//Is there still an highlight in the list
function highlightExists()
{
	for (var i = 0; i < highlights.length; i++)
	{
		const H = highlights[i]
		H.fade = 1-((new Date().getTime() - H.time)*fadePerMillisecond)
		if (H.fade < 0)
		{
			highlights.splice(i, 1)
			i--
		}
	}
	return (highlights.length != 0)
}

function drawHighlight(H)
{
	const x = XtoCanvas(H.x)
	const y = YtoCanvas(H.z)
	
	Context.save()
	
	Context.globalAlpha = H.fade
	
	
	Context.beginPath()
	Context.moveTo(x,0);
	Context.lineTo(x,Canvas.height);
	Context.stroke();
	
	Context.beginPath()
	Context.moveTo(0,y);
	Context.lineTo(Canvas.width,y);
	Context.stroke();
	
	
	Context.restore()
}
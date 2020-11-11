"use strict";

// Drag and Zoom System
$(function ()
{
	// var Canvas = $("#map")[0]
	// var Context = Canvas.getContext("2d")
	// <!--  MouseDown, wheel, click are only relevant on the canvas -->
	Canvas.addEventListener("mousedown", MouseDown, false)
	Canvas.addEventListener("click", MouseClick, false)
	Canvas.addEventListener("wheel", Wheel, false)
	// <!-- Mouse Up/move is always important to catch everywhere so we can keep dragging when the mouse leaves the canvas -->
	document.addEventListener("mouseup", function (event)
	{
		if (event.button == 0) MouseIsDown = false
	}, false)
	document.addEventListener("mousemove", MouseMove, false)
});


// Position the mouse went down on
var MouseDownPosX
var MouseDownPosY
// Position of the Camera when the mouse went down
var MouseDownCameraX
var MouseDownCameraY
var MouseIsDown = false


function GetMousePos(event)
{
	var rect = Canvas.getBoundingClientRect()

	return {
		X: event.clientX - rect.left,
		Y: event.clientY - rect.top
	};
}

function MouseDown(event)
{
	// Left click only
	if (event.button != 0)
		return

	event.preventDefault();
	EndZoom() //stop zooming
	var pos = GetMousePos(event)
	MouseDownPosX = pos.X
	MouseDownPosY = pos.Y
	MouseDownCameraX = CameraX
	MouseDownCameraY = CameraY
	MouseIsDown = true
}


function MouseMove(event)
{
	if (MouseIsDown)
	{
		event.preventDefault();
		var pos = GetMousePos(event)
		CameraX = MouseDownCameraX - (MouseDownPosX - pos.X)
		CameraY = MouseDownCameraY - (MouseDownPosY - pos.Y)

		clampCamera()
		redrawIfNotPlaying()
	}
}

function clampCamera()
{
	// 350 pixels safe space
	var maxh = Canvas.height - 350
	var maxw = Canvas.width - 350
	var min = 350 - MapImageDrawSize
	CameraX = clamp(min, CameraX, maxw)
	CameraY = clamp(min, CameraY, maxh)
}


var doubleClickTimer = null
const doubleClickTime = 220
// Distance from point of click where players are selectable
const MinDistanceSquared = 350

function MouseClick(event)
{
	event.preventDefault();
	if (event.button != 0)
		return

	var pos = GetMousePos(event)

	// <!-- if mouse was dragged, do not deselect or select. -->
	if (Math.pow(MouseDownPosX - pos.X, 2) + Math.pow(MouseDownPosY - pos.Y, 2) > 45)
		return
	
	
	var initialdis = MinDistanceSquared * CameraZoom
	var minDis = initialdis
	var objectToSelect = null
	for (var I in AllPlayers)
	{
		var p = AllPlayers[I]
		if (p.isJoining)
			continue
		
		var dis = Math.pow(XtoCanvas(p.X) - pos.X, 2) + Math.pow(YtoCanvas(p.Z) - pos.Y, 2)
		if (dis < minDis)
		{
			objectToSelect = p
			minDis = dis
		}
	}
	for (var I in AllProj)
	{
		const p = AllProj[I]
		var dis = (Math.pow(XtoCanvas(p.X) - pos.X, 2) + Math.pow(YtoCanvas(p.Z) - pos.Y, 2)) * 2 // less click priority than players
		if (dis < minDis)
		{
			objectToSelect = p
			minDis = dis
		}
	}
	
	// Didn't click on anything, deselect
	if (objectToSelect == null) {
		selection_SelectPlayer(SELECTED_NOTHING)
	}
	
	if (doubleClickTimer == null) {
		doubleclick_StartTimer()
		handleSingleClick(objectToSelect)
	} else {
		doubleclick_Clear()
		handleDoubleClick(objectToSelect)
	}
	
	redrawIfNotPlaying()
}

function handleSingleClick(objectClicked) {
	selection_SelectObject(objectClicked)
}

function handleDoubleClick(objectClicked) {
	selection_selectObjectSquad(objectClicked)
}


function doubleclick_StartTimer()
{
	doubleclick_Clear()
	doubleClickTimer = setTimeout(() => doubleClickTimer = null, doubleClickTime)
}

function doubleclick_Clear()
{
	if (doubleClickTimer != null)
		clearTimeout(doubleClickTimer)
	doubleClickTimer = null
}



// -- Zoom animation system
// Animation frames
var ZoomNumOfTicks = 0 //calculated per zoom
// Time per frame
var ZoomMousePos = null
var ZoomAmount = 1
var ZoomTicks = 10000000
const ZoomTotalTime = 250


function Wheel(event)
{
	if (event.deltaY < 0)
		ZoomAmount = 1.25
	else
		ZoomAmount = 0.75

	ZoomMousePos = GetMousePos(event)
	BeginZoom()
}



$(()=> redrawNeededChecks.push(TickZoom))
function BeginZoom()
{
	// Don't do anything if mouse is down
	if (MouseIsDown)
		return;

	ZoomTicks = 0
	ZoomNumOfTicks = ZoomTotalTime / frameTime

	var Amount = Math.pow(ZoomAmount, 1 / ((ZoomTicks + 1) * 2))
	Zoom(Amount)
	redrawTimerStart()
}

function TickZoom()
{
	if (ZoomTicks >= ZoomNumOfTicks)
		return false

	var Amount = Math.pow(ZoomAmount, 1 / ((ZoomTicks + 1) * 2))
	Zoom(Amount)

	ZoomTicks++
	return true
}

//Set tick number to something high so TickZoom will stop.
function EndZoom()
{
	ZoomTicks = 10000000
}

const Zoom_Minimum = 0.2
const Zoom_Maximum = 32

function Zoom(Amount)
{
	var OldZoom = CameraZoom
	CameraZoom *= Amount
	CameraZoom = clamp(Zoom_Minimum, CameraZoom, Zoom_Maximum)

	// Adjust Camera so mouse will still be pointing at the same pixel
	CameraX = ZoomMousePos.X - (CameraZoom / OldZoom) * (ZoomMousePos.X - CameraX)
	CameraY = ZoomMousePos.Y - (CameraZoom / OldZoom) * (ZoomMousePos.Y - CameraY)

	MapImageDrawSize = 1024 * CameraZoom

	clampCamera()
	
	redrawIfNotPlaying()
}


function clamp(min, X, max)
{
	return Math.min(Math.max(X, min), max);
}

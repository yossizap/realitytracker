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

	//stop zooming
	if (ZoomAnimation.instance != null)
		ZoomAnimation.instance.delete();
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
		const x = p.getX();
		const z = p.getZ();
		if (p.isJoining)
			continue
		
		var dis = Math.pow(XtoCanvas(x) - pos.X, 2) + Math.pow(YtoCanvas(z) - pos.Y, 2)
		if (dis < minDis)
		{
			objectToSelect = p
			minDis = dis
		}
	}
	for (var I in AllProj)
	{
		const p = AllProj[I]
		const x = p.getX();
		const z = p.getZ();
		var dis = (Math.pow(XtoCanvas(x) - pos.X, 2) + Math.pow(YtoCanvas(z) - pos.Y, 2)) * 2 // less click priority than players
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



function Wheel(event)
{
	if (MouseIsDown || event.ctrlKey)
		return;

	if (event.deltaY < 0)
		new ZoomAnimation(GetMousePos(event), 1.05)
	else
		new ZoomAnimation(GetMousePos(event), 0.95)
}

// -- Zoom animation system
const ZoomTotalTime = 0.3
const ZoomMinimum = 0.2
const ZoomMaximum = 32
class ZoomAnimation extends AnimationInstance {
	static instance = null;

	constructor(mousepos, amount) {
		super();
		if (ZoomAnimation.instance != null)
			ZoomAnimation.instance.delete();
		ZoomAnimation.instance = this;

		this.ZoomAmount = amount;
		this.ZoomMousePos = mousepos;

		this.ZoomTime = 0
		this.onTick(0);
	}
	onTick(timePassed) {
		
		var Amount = Math.pow(this.ZoomAmount, 1 / (this.ZoomTime * 20 + 1) );
		var OldZoom = CameraZoom
		CameraZoom *= Amount
		CameraZoom = clamp(ZoomMinimum, CameraZoom, ZoomMaximum)

		// Adjust Camera so mouse will still be pointing at the same pixel
		CameraX = this.ZoomMousePos.X - (CameraZoom / OldZoom) * (this.ZoomMousePos.X - CameraX)
		CameraY = this.ZoomMousePos.Y - (CameraZoom / OldZoom) * (this.ZoomMousePos.Y - CameraY)

		MapImageDrawSize = 1024 * CameraZoom

		this.ZoomTime += timePassed
		clampCamera()
	}
	shouldDelete() {
		return this.ZoomTime >= ZoomTotalTime || (MouseIsDown);
	}
	delete() {
		this.ZoomTicks = 99999999;
		ZoomAnimation.instance = null;
    }
}





function clamp(min, X, max)
{
	return Math.min(Math.max(X, min), max);
}

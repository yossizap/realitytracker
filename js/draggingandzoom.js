"use strict";

// Drag and Zoom System
$(function ()
{
	const mapdiv = $("#renderers")[0]
	// var Context = Canvas.getContext("2d")
	// <!--  MouseDown, wheel, click are only relevant on the canvas -->
	mapdiv.addEventListener("mousedown", MouseDown, false)
	mapdiv.addEventListener("click", MouseClick, false)
	mapdiv.addEventListener("wheel", Wheel, false)
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

var MouseLastPosX
var MouseLastPosY

// Position of the Camera when the mouse went down
var MouseDownCameraX
var MouseDownCameraY
var MouseIsDown = false




function MouseDown(event)
{
	// Left click only
	if (event.button != 0)
		return

	event.preventDefault();

	//stop zooming
	if (ZoomAnimation.instance != null)
		ZoomAnimation.instance.delete();
	var pos = activeRenderer.getMousePos(event)
	MouseDownPosX = pos.X
	MouseDownPosY = pos.Y
	MouseLastPosX = pos.X;
	MouseLastPosY = pos.Y;
	MouseDownCameraX = CameraX
	MouseDownCameraY = CameraY
	MouseIsDown = true
}


function MouseMove(event)
{
	if (MouseIsDown)
	{
		event.preventDefault();
		var pos = activeRenderer.getMousePos(event)

		if (is3DMode) {
			renderer3d.mouseMove(pos.X - MouseLastPosX, pos.Y - MouseLastPosY);
		} else {
			CameraX = MouseDownCameraX + (pos.X - MouseDownPosX);
			CameraY = MouseDownCameraY + (pos.Y - MouseDownPosY);
        }

		MouseLastPosX = pos.X;
		MouseLastPosY = pos.Y;

		clampCamera();
		requestUpdate();
	}
}

function clampCamera()
{
	var maxh = (Canvas.height - 200) / options_canvasScale
	var maxw = (Canvas.width - 200) / options_canvasScale
	var min = (200 - MapImageDrawSize)
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

	var pos = activeRenderer.getMousePos(event)

	// <!-- if mouse was dragged, do not deselect or select. -->
	if (Math.pow(MouseDownPosX - pos.X, 2) + Math.pow(MouseDownPosY - pos.Y, 2) > 45)
		return

	const objectToSelect = activeRenderer.mouseClick(pos);

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

	requestUpdate();

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
		new ZoomAnimation(activeRenderer.getMousePos(event), 1.05)
	else
		new ZoomAnimation(activeRenderer.getMousePos(event), 0.95)
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

"use strict";

var opSquadColors = ['#0000FF',
	'#9395ea',
	'#c4c400',
	'#800080',
	'#56a8a7',
	'#ff8040',
	'#2ed232',
	'#00ffff',
	'#ff0080',
	'#a56d5a'
]

var bluSquadColors = ['#FF0000',
	'#9395ea',
	'#c4c400',
	'#800080',
	'#56a8a7',
	'#ff8040',
	'#2ed232',
	'#00ffff',
	'#ff0080',
	'#a56d5a'
]

// this syntax is for collapsing regions in notepad++.
//{REGION

//}


//{ options
var options_DrawKillLines = true
var options_DrawEmptyVehicles = true
var options_DrawFlagRadius = true
var options_DrawKitIcons = true
var options_DrawDOD = true
var options_ClampVehiclesToMap = true //Dont draw vehicles outside the map
var options_DrawVehicleHeight = true
var options_health_players = true
var options_health_vehicles = true
var options_drawAllOrderIcons = false
	//}

//{TIMER - Functions for handling the timer
var Timer = null
// Called when Start/pause button is clicked 
function togglePlay()
{
	if (!isPlaying())
		Start()
	else
		Stop()
}

function Start()
{
	//using setTimeout instead of interval so its possible to easily change play speed on the fly.
	Timer = setTimeout(playTimerFire, frameTime)
	onResume()
}

function Stop()
{
	clearTimeout(Timer)
	Timer = null
	onPause()
	playTimerPausedWaitingForData = false
}

var frameTime = 16.66

// True when update returns false and we're playing
var playTimerPausedWaitingForData = false

// Called every timer fire, 60fps currently
function playTimerFire()
{
	interpolation_CurrentAmount = (interpolation_CurrentFrame % interpolation_FramesPerTick) /
		interpolation_FramesPerTick

	// while: for very fast speeds, skip drawing between updates.
	while (interpolation_CurrentFrame >= interpolation_FramesPerTick)
	{
		if (!Update()) // If update returned false, don't touch anything anymore.
		{
			playTimerPausedWaitingForData = true
			return
		}

		interpolation_CurrentFrame -= interpolation_FramesPerTick
	}

	Timer = setTimeout(playTimerFire, frameTime)
	playTimerPausedWaitingForData = false
	drawCanvas()

	interpolation_CurrentFrame++
}

function isPlaying()
{
	return (Timer != null)
}

// Called when the playbar object receives user input
// Limit to 60fps to prevent 1000hz gaming mice from choking it.
var RangeChangeCooldownTimer = null
var RangeChangeCooldownTime = 33

function onPlayBarChange()
{
	if (RangeChangeCooldownTimer != null)
		return

	RangeChangeCooldownTimer = setTimeout(function ()
	{
		RangeChangeCooldownTimer = null
	}, RangeChangeCooldownTime)

	goTo($("#playBar")[0].value)
}

function onPlaySpeedChange()
{
	// This makes the range nonlinear
	var rangevalue = $("#playSpeed")[0].value
	var speed = Math.pow(rangevalue, 2.5)

	setSpeed(speed)
}

function updatePlayBar()
{
	$("#playBar")[0].value = Tick_Current
}

function toggleSubMenu(submenu)
{
	const menu = $("#" + submenu + "Container")
	if (menu.dialog("isOpen"))
		menu.dialog("close");
	else
		menu.dialog("open");
}

const TICKS_JUMP_AMOUNT_SHIFT = 40
const TICKS_JUMP_AMOUNT = 10

var HealthButtonDown = false

function onKeyDown(e)
{
	// Return if a modal is open
	if ($("#addbookmarkComment").dialog("isOpen"))
		return

	// 1 - 9
	if (e.which >= 49 && e.which <= 57)
	{
		if (e.shiftKey)
			selection_SelectSquad(1, e.which - 48)
		else
			selection_SelectSquad(2, e.which - 48)
	}
	else
		switch (e.which)
		{
		case 32: //space
			togglePlay()
			break
		
		case 72: //h
			HealthButtonDown = true
			redrawIfNotPlaying()
			break
		case 73: //i
			toggleSubMenu("serverinfo")
			break;
		case 90: //z
			toggleSubMenu("scoreBoard")
			break
		case 88:  //x
			toggleSubMenu("kills")
			break
		case 67: //c
			toggleSubMenu("vehicles")
			break
		case 84: //t
			toggleSubMenu("chat")
			break
		case 82: //r
			toggleSubMenu("revives")
			break
		case 75: //k
			toggleSubMenu("kitAllocations")
			break
		case 68: //d
			toggleSubMenu("vehicleDestroyers")
			break
		case 37: // left
			if (e.shiftKey)
				goTo(Tick_Current - TICKS_JUMP_AMOUNT_SHIFT)
			else
				goTo(Tick_Current - TICKS_JUMP_AMOUNT)
			break

		case 39: // right
			if (e.shiftKey)
				goTo(Tick_Current + TICKS_JUMP_AMOUNT_SHIFT)
			else
				goTo(Tick_Current + TICKS_JUMP_AMOUNT)
			break
		default:
			return;
		}
	
	// prevent the default action (unless its i which opens console and its annoying to override it)
	if (e.which != 73)
		e.preventDefault(); 
}

function onKeyUp(e)
{
	switch (e.which)
	{
		case 72: //h
			HealthButtonDown = false
			redrawIfNotPlaying()
			break
	}
	
	e.preventDefault();
}

// Sort of a placerholder
function updateHeader()
{
	if (GameMode == "gpm_insurgency")
		$("#headerInner")[0].innerHTML = tickets2 + " (" + intel +") - " + tickets1 + " " + getTimeStringOfTick(Tick_Current) + " x" + playSpeed.toFixed(1)
	else
		$("#headerInner")[0].innerHTML = tickets2 + " - " + tickets1 + " " + getTimeStringOfTick(Tick_Current) + " x" + playSpeed.toFixed(1)
}

function getTimeInSecondsFromString(time) {
	const re = /(\d{0,2})[hH]?(\d{0,2})[Mm]?(\d{0,2})[Ss]?/
	const match = re.exec(time)
	if (match)
		return (match[1] * 3600) + (match[2] * 60) + (match[3] * 1)
	return 0
	
}

function getTickfromTimeString(time) {
	const seconds = roundLength + briefingtime - getTimeInSecondsFromString(time)
	const tick = tickToTime.findIndex(x => x > seconds)
	return tick
}

function getTimeStringOfTick(tick)
{
	if (tick >= tickToTime.length) tick = tickToTime.length - 1
	
	const time = roundLength + briefingtime - tickToTime[tick]
	return getTimeString(time)
}
function getTimeString(time)
{
	time = Math.floor(time)
	var sec = time % 60
	var min = Math.floor(time / 60) % 60
	const hour = Math.floor(time / 3600)

	if (sec < 10) sec = "0" + sec
	if (min < 10) min = "0" + min

	return hour + ":" + min + ":" + sec
}

function checkboxClicked(Checkbox)
{
	changeSetting(Checkbox.value, Checkbox.checked)
}

// Called when an options checkbox is clicked.
function changeSetting(settingName, bool)
{
	window[settingName] = bool
	localStorage[settingName] = JSON.stringify(window[settingName])

	redrawIfNotPlaying()
}


var playBarBubble
$(() => playBarBubble = $("#playBarBubble")[0])
function showPlayBarBubble()
{
	playBarBubble.style.display = "block"
}

function setPlayBarBubble(e)
{
	var Position = e.offsetX // Pixels of mouse from left side of bar
	var Tick = Math.max(Math.round((Position / e.target.clientWidth) * parseInt(e.target["max"])), 0)
	var StringToShow = getTimeStringOfTick(Tick) // String to show in bubble

	playBarBubble.style.left = (Position - 22) + "px"
	playBarBubble.innerHTML = StringToShow
}

function hidePlayBarBubble()
{
	playBarBubble.style.display = "none"
}


//TODO menu styles
$( function() {$( "#menuList" ).menu(
{

}
);});
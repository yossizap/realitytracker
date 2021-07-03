"use strict;"



$(() =>
{
	$("#killfeedContainer").dialog(
	{
		classes:
		{
			"ui-dialog-titlebar": "killfeedTitle"
		},
		resize: killfeed_UpdateScroll,
		containment: "#mainContainer",
		height: 250,
		width: 600,
		minHeight: 80,
		minWidth: 405,
		autoOpen: false,
		open: () =>
		{
			$("#killfeedToggle").addClass("submenu-toggle-open");
			killfeed_UpdateScroll();
		},
		close: () => $("#killfeedToggle").removeClass("submenu-toggle-open"),
		title: "Kill Feed (X)"
	})

	// Append autoscroll button
	$(".killfeedTitle").children("span").append(
		'<input type="checkbox" checked="" onclick="killfeed_UpdateScroll()" id="killfeed_lockScroll">' +
		'Auto Scroll'
	);


	killfeed_LockScrollElement = $("#killfeed_lockScroll")[0]
	killfeed_Element = $("#killfeed")[0]
	killfeed_TableElement = $("#killfeedTable")[0]
	killfeed_Element.addEventListener("scroll", killfeed_onScroll)
	

})



function killfeed_Select(killid)
{
	if (killid == SELECTED_NOTHING)
		SelectedKill = SELECTED_NOTHING

	if (killid == null)
		return

	else
		SelectedKill = killid

	if (!isPlaying())
		requestUpdate();
}

var killfeed_DOMCollection = [] // Array of all killrows elements
var killfeed_LastKill = 0 // First row that has the "future kill" class
var killfeed_IgnoreScroll = false
var killfeed_Element = null
var killfeed_TableElement = null
var killfeed_LockScrollElement = null


function killfeed_EnableOne()
{
	killfeed_DOMCollection[killfeed_LastKill].classList.remove("killfeedRow_Future")
	killfeed_LastKill++
	killfeed_UpdateScroll()
}


function killfeed_UpdateScroll()
{
	if (killfeed_LockScrollElement.checked)
	{
		killfeed_IgnoreScroll = true
		if (killfeed_LastKill == 0)
			killfeed_Element.scrollTop = 0
		else
			killfeed_Element.scrollTop = killfeed_DOMCollection[killfeed_LastKill - 1].offsetTop +
			killfeed_DOMCollection[killfeed_LastKill - 1].offsetHeight -
			killfeed_Element.clientHeight
	}
}

function killfeed_onScroll(e)
{
	if (killfeed_IgnoreScroll)
		killfeed_IgnoreScroll = false
	else
		killfeed_LockScrollElement.checked = false
}

const GOTOTICKSBEFOREKILL = 1
function killfeed_WriteOne(Kill)
{
	const row = $("#killfeedTable")[0].insertRow(-1)

	row.className = "killfeedRow killfeedRow_Future"
	row.insertCell(0).textContent = getTimeStringOfTick(Tick_Current)
	row.insertCell(1).textContent = Kill.AttackerName
	row.insertCell(2).textContent = Kill.Distance + "m "

	const cell = row.insertCell(3)
	//const weaponName = (Kill.Weapon in weaponsData) ? weaponsData[Kill.Weapon] : Kill.Weapon
	const weaponName = Kill.Weapon
	cell.textContent = "[" + weaponName + "]"
	cell.title = Kill.Weapon

	row.insertCell(4).textContent = Kill.VictimName

	if (Kill.AttackerTeam == 1)
		row.cells[1].className = "killfeed_Team1"
	else
		row.cells[1].className = "killfeed_Team2"

	if (Kill.VictimTeam == 1)
		row.cells[4].className = "killfeed_Team1"
	else
		row.cells[4].className = "killfeed_Team2"

	row.onmouseenter = () => killfeed_Select(Kill.index)
	row.onmouseleave = () => killfeed_Select(SELECTED_NOTHING)
	row.cells[0].onclick = () =>
	{
		$("#killfeed_lockScroll")[0].checked = false;
		goTo(Kill.Tick - GOTOTICKSBEFOREKILL)
	}

	row.cells[1].onclick = () =>
	{
		if (Kill.AttackerID in AllPlayers) // ID exists currently
			if (Kill.AttackerName == AllPlayers[Kill.AttackerID].name) // Is the same player (different player could have had that ID)
				selection_SelectPlayer(Kill.AttackerID)
	}
	row.cells[4].onclick = () =>
	{
		// Same as above
		if (Kill.VictimID in AllPlayers)
			if (Kill.VictimName == AllPlayers[Kill.VictimID].name)
				selection_SelectPlayer(Kill.VictimID)
	}
	
	//Cache the collection so we can access parts of it without going through all 500 kills
	killfeed_DOMCollection.push(row)
}


function killfeed_Reenable()
{
	for (var i = killfeed_LastKill - 1; i >= eventArrays.Kills.iterator; i--)
		killfeed_DOMCollection[i].classList.add("killfeedRow_Future")

	for (var i = killfeed_LastKill; i < eventArrays.Kills.iterator; i++)
		killfeed_DOMCollection[i].classList.remove("killfeedRow_Future")

	killfeed_LastKill = eventArrays.Kills.iterator
}

function killfeed_onLoad()
{
	killfeed_Reenable()
	killfeed_UpdateScroll()
}

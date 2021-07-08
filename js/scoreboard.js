"use strict;"
var playerRows = {}

$(() =>
{
	$("#scoreBoardContainer").dialog(
	{
		title: "ScoreBoard (Z)",
		containment: "#mainContainer",
		id: "scoreBoardDialog",
		resizable: "n, s",
		height: 500,
		width: 465,
		minHeight: 200,
		minWidth: 465,
		maxWidth: 465,
		autoOpen: false
	})
})

// Creates a new row object and assigns event functions to it
function playerRow_Create(id)
{
	var row = document.createElement("TR")

	row.setAttribute("playerid", id);
	row.setAttribute("playername", AllPlayers[id].name);

	for (var i = 0; i < 4; i++)
		row.insertCell(i)

	row.cells[0].textContent = AllPlayers[id].name
	row.classList.add("player-row")
	row.onclick = function ()
	{
		// If player is selected again or is in a vehicle that has been selected, deselect. 
		if (SelectedPlayer == id || SelectedVehicle == AllPlayers[id].vehicleid)
			selection_SelectPlayer(SELECTED_NOTHING)
		else
			selection_SelectPlayer(id,true)
	}

	playerRows[id] = row
}

// Update the row with all new information
function playerRow_Update(id)
{
	var p = AllPlayers[id]
	var row = playerRows[id]

	if (p.isAlive)
		row.classList.remove("player-row-dead")
	else
		row.classList.add("player-row-dead")

	if (p.isSquadLeader)
		row.classList.add("player-row-squadlead")
	else
		row.classList.remove("player-row-squadlead")

	row.cells[1].textContent = p.kills + "/" + p.deaths

	row.cells[2].textContent = ""
	if (p.kit != "")
		row.cells[2].appendChild(p.ns_kitImage.cloneNode(false))

	row.cells[3].textContent = ""
	if (p.vehicleid >= 0 && (p.vehicleid in AllVehicles))
	{
		var vobj = AllVehicles[p.vehicleid]
		if (vobj.ns_menuImage != null)
			row.cells[3].appendChild(vobj.ns_menuImage.cloneNode(false))
	}
}

// Deselect all players
function playerRow_PlayerDeselectAll()
{
	$(".player-row-selected").removeClass("player-row-selected")
}

function playerRow_UpdateAll()
{
	for (var i in AllPlayers)
		playerRow_Update(i)
}

function playerRow_Remove(id)
{
	delete playerRows[id]
	$(".player-row[playerid='" + id + "']").remove()
}


// Readds the player to the scoreboard list so he can be at the right spot after changing squad or team
function playerRow_ReAdd(i)
{
	$("#scoreBoard .player-row[playerid='" + i + "']").remove();

	var p = AllPlayers[i]
	if (p.team == 0)
		return

	var Table
	// figure out which table does the player belong to
	// is in squad
	if (p.squad != 0)
		Table = $("#Squad" + p.team + p.squad)[0]
	// isCommander 
	else if (p.isSquadLeader)
		Table = $("#Commander" + p.team)[0]
	// is unassigned 
	else
		Table = $("#Unassigned" + p.team)[0]

	// Append as first child if squad leader. 
	if (p.isSquadLeader)
		Table.insertBefore(playerRows[i], Table.firstChild)
	else
		Table.appendChild(playerRows[i])
}

// Clears the scoreboard and readds the rows
function playerRow_Write()
{
	for (var i in AllPlayers)
		playerRow_ReAdd(i)
}
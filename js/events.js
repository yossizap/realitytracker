"use strict;"
//ONLY DO UI CHANGES HERE


// Called when the parser resets back to 0.
function onReset()
{
	playerRow_UpdateAll()
	playerRow_Write()

	//clear vehicles bar
	$("#Team2Vehicles")[0].innerHTML = ""
	$("#Team1Vehicles")[0].innerHTML = ""

	//Reselect player
	selection_SelectPlayer(SelectedPlayer)

	// Empty killLines 
	killLines = []

	gametimelasttime = NaN;
	// redraw the map 
	requestUpdate();
}


// Called when a state is loaded (when going reverse, or skipping far ahead)
function onLoadState()
{
	// remove/add row data for players that disconnected/connected.

	for (var i in playerRows)
		if (!(i in AllPlayers) || playerRows[i].getAttribute("playername") != AllPlayers[i].name )
			playerRow_Remove(i)

	for (var i in AllPlayers)
		if (!(i in playerRows))
			playerRow_Create(i)

	// Update to current state
	playerRow_UpdateAll()
	// Rewrite
	playerRow_Write()


	// remove UI elements for vehicles that were destroyed or still dont exist
	for (var i in vehicleTables)
		if (!(i in AllVehicles))
			vehicleTable_Remove(i)
	//create new UI elements for new vehicles 
	for (var i in AllVehicles)
		if (!(i in vehicleTables))
			vehicleTable_Create(i)

	// Rewrite vehicle tables
	vehicleTable_UpdateAll()
	vehicleTable_Write()
	
	
	// Update head bar
	updateHeader()
	updatePlayBar()

	// Reselect player (after vehicle lists are updated), to see if he's in a vehicle now
	selection_SelectPlayer(SelectedPlayer)

	killLine_RemoveOld()
	
	
	//Update squad names
	for (var team = 1;team<=2;team++)
		for (var squad = 1;squad<=9;squad++)
			$("#Squad" + team + squad + " thead td")[0].textContent = squad + ". " + getSquadName(team, squad)

	gametimelasttime = NaN;
}

// Called when vehicle's crew change
function onVehicleDataChange(vehicleid)
{
	if (vehicleid in vehicleTables)
		vehicleTable_Update(vehicleid)

	if (SelectedVehicle == vehicleid)
		selection_UpdateInformationBox()
}

// Called when a player changed vehicle.
function onPlayerVehicleChange(playerid)
{
	if (playerid == SelectedPlayer)
		selection_SelectPlayer(playerid)
	else //Check if this player is in a selected vehicle now
		selection_CheckIfPlayerInSelectedVehicle(playerid)
}

// Called when a new vehicle is created
function onNewVehicle(vehicleid)
{
	// Check who has this vehicle as vehicleid and update their table row 
	for (var i in AllPlayers)
	{
		var p = AllPlayers[i]
		if (p.vehicleid == vehicleid)
			playerRow_Update(i)
	}

	vehicleTable_Create(vehicleid)
}
function onVehicleDestroyed(vehicleid)
{
	vehicleTable_Remove(vehicleid)
}

function onPlayerLeave(id)
{
	if (SelectedPlayer == id)
		selection_SelectPlayer(SELECTED_NOTHING)

	playerRow_Remove(id)
}

// Called when a player's information that should be shown on the selection panel changes
function onPlayerSelectionInfoChange(id)
{
	if (SelectedPlayer == id)
		selection_UpdateInformationBox(id)
}

// Called when player's information that show on the scoreboard change
function onPlayerStatusChanged(id)
{
	playerRow_Update(id)
}

// Called when player changes squad or Team
function onPlayerTeamOrSquadChange(id)
{
	playerRow_ReAdd(id)
}

// Called once when loading is finished
function onLoad()
{
	bookmarks_Load()
	$("#playBar")[0].max = Tick_Count
}

// Called when the parser advances one tick 
function onUpdate()
{
	if (!isFastForwarding)
	{
		//Playbar position below
		updatePlayBar()
		//Header for clock and tickets
		updateHeader()
		//Remove old killlines
		killLine_RemoveOld()
	}
}

function onSquadNameChanged(team, squad, name)
{
	$("#Squad" + team + squad + " thead td")[0].textContent = squad + ". " + name
}

function onResume()
{
	const spb = $("#startPauseButton")[0]
	spb.classList.remove("state-paused")
	spb.classList.add("state-playing")
}

function onPause()
{
	const spb = $("#startPauseButton")[0]
	spb.classList.remove("state-playing")
	spb.classList.add("state-paused")
}
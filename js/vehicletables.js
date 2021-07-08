"use strict;"


$(() => $("#vehiclesContainer").dialog(
{
	containment: "#mainContainer",
	height: 250,
	width: 630,
	minHeight: 200,
	minWidth: 320,
	maxWidth: 630,
	autoOpen: false,
	title: "Active Vehicles (C)"
}))

var vehicleTables = {}

// Create a new table for a vehicle
function vehicleTable_Create(id)
{
	var v = AllVehicles[id]
	if (isVehicleContainer(id))
		return

	var table = document.createElement('table');
	table.setAttribute("vehicleid", id)
	table.classList.add("vehicleTable")

	const closure = id
	table.onclick = () => selection_SelectVehicle(closure)

	// Top row: vehicle name and icon with colspan 2
	var row = table.insertRow(0)
	var cell = row.insertCell(0)
	cell.colSpan = 2
	cell.innerHTML = ""

	if (v.team != 0 && v.ns_mapImage != null)
		cell.appendChild(v.ns_mapImage[v.team - 1].cloneNode(false))

	// Try to find vehicle name in dictionary
	if (v.name in vehicleData)
		cell.innerHTML += escapeHtml(vehicleData[v.name].HudName)
	else
		cell.innerHTML += escapeHtml(v.name)

	vehicleTables[id] = table
	vehicleTable_Update(id)
	vehicleTable_WriteOne(id)
}

// Update a single vehicle's table (refresh player list)
function vehicleTable_Update(i)
{
	var t = vehicleTables[i]
	var v = AllVehicles[i]
	if (isVehicleContainer(i))
		return

	$(vehicleTables[i]).find("tr:gt(0)").remove() //remove all rows (except the header)

	var healthcell = t.insertRow(1).insertCell(0);
	healthcell.innerHTML = v.health + "/" + v.maxHealth;
	healthcell.colSpan = 2

	var row = 2

	// Go over the list 3 times
	//Find driver, Find gunners first, then passnegers
	for (var j = 0; j <= 2; j++)
		v.Passengers.forEach((i) => 
		{
			const p = AllPlayers[i]
			if (p.vehicleSlot == j)
				vehicleTable_AddPlayer(t, v, p, row++)
		
		})

	// Hide if vehicle is empty
	if (v.Passengers.size == 0)
		t.style.display = "none"
	else
		t.style.display = ""

}

// Add a row for a player.
function vehicleTable_AddPlayer(table, vehicle, player, rownum)
{
	var row = table.insertRow(rownum)

	var seatName = player.vehicleSeatName
	// See if we can remove vehiclename from seat name
	if (seatName.startsWith(vehicle.name))
	{
		seatName = seatName.substring(vehicle.name.length)
		if (seatName.startsWith("_"))
			seatName = seatName.substring(1)
		else if (seatName.length == "")
			seatName = "Driver"
	}

	// Capitalize first letter because not all seatnames are starting with caps
	seatName = seatName.charAt(0).toUpperCase() + seatName.substring(1);
	
	row.insertCell(0).innerHTML = escapeHtml(seatName)
	row.insertCell(1).innerHTML = escapeHtml(player.name)
}

function vehicleTable_UpdateAll()
{
	for (var i in AllVehicles)
		vehicleTable_Update(i)
}

function vehicleTable_Write()
{
	for (var id in vehicleTables)
		vehicleTable_WriteOne(id)
}

function vehicleTable_WriteOne(id)
{
	var T = vehicleTables[id]
	var V = AllVehicles[id]

	if (V.team != 0)
		vehicleTable_AppendSorted(V.team, T)

}

// Makes sure the vehicle table list is always sorted by id when we insert so they dont jump around
// finds the first table that has id greater than current and uses insertBefore on it
function vehicleTable_AppendSorted(team, table)
{
	// Find the first element with higher vehicleID
	var list = $("#Team" + team + "Vehicles .vehicleTable").filter((i, e) =>
	{
		return e.getAttribute("vehicleid") > table.getAttribute("vehicleid")
	})
	if (list.length != 0)
		$("#Team" + team + "Vehicles")[0].insertBefore(table, list[0]);
	else
		$("#Team" + team + "Vehicles")[0].appendChild(table);
}

function vehicleTable_Remove(id)
{
	$(".vehicleTable[vehicleid='" + id + "']").remove()
	delete vehicleTables[id]
}
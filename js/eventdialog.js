"use strict;"

//Options required:
//name
//height/width/minHeight/minWidth
//title
//rowWriteFunction ((obj,newRow) -> void), fill a row
//tableStyles

//All event dialogs by name
const eventDialogs = {}

function eventDialog(options)
{
	const name = options.name
	eventDialogs[name] = this
	const globalString = 'eventDialogs.'+name
	
	//Called to set scroll to proper spot if lockScroll is checked
	this.updateScroll = function ()
	{
		if (this.lockScrollElement.checked)
		{
			this.ignoreScroll = true
			if (this.lastEvent == 0)
				this.element.scrollTop = 0
			else
				this.element.scrollTop = this.DOMCollection[this.lastEvent - 1].offsetTop +
				this.DOMCollection[this.lastEvent - 1].offsetHeight -
				this.element.clientHeight
		}
	}
	
	//Called onScroll
	this.onScroll = function ()
	{
		if (this.ignoreScroll)
			this.ignoreScroll = false
		else
			this.lockScrollElement.checked = false
	}
	
	//Enable the next row.
	this.enableOne = function ()
	{
		this.DOMCollection[this.lastEvent].classList.remove("futureRow")
		this.lastEvent++
		this.updateScroll()
	}
	
	//Enable to a specific Row.
	this.reenable = function (newIterator)
	{
		for (var i = this.lastEvent-1; i >= newIterator; i--)
			this.DOMCollection[i].classList.add("futureRow")
		
		for (var i = this.lastEvent; i < newIterator; i++)
			this.DOMCollection[i].classList.remove("futureRow")
		
		this.lastEvent = newIterator
		this.updateScroll()
	}
	
	
	//The given row writing function
	this.rowWriteFunction = options.rowWriteFunction
	
	//Called when a new event is parsed (Only in initial parsing or network mode)
	this.newEvent = function(obj)
	{
		const newRow = $("#"+name+"Table")[0].insertRow(-1) //Create a new row
		this.rowWriteFunction(obj,newRow) //Use the custom function to style the row
		newRow.classList.add('futureRow') 
		this.DOMCollection.push(newRow) //Add it to our cached array
	}
	
	//Append new HTML
	$("#floaters")[0].innerHTML+=('<div id="'+name+'Container"><div id="'+name+'"><table id="'+name+'Table"></table></div></div>')
	
	//Set Styles
	$("#"+name)[0].setAttribute("style", "overflow-x: hidden;overflow-y: auto;width: 100%;height: 100%;")

	
	
	//Set the new HTML as dialog
	$("#"+name+"Container").dialog(
	{
		classes:
		{
			"ui-dialog-titlebar": name+"Title" //Set special class for title so its easily selectable (Bit of a hac
		},
		height: options.height,
		width: options.width,
		minHeight: options.minHeight,
		minWidth: options.minWidth,
		resize: () => this.updateScroll(), //These must be a lambda function because "this" means the object that called the function.
		open: () => this.updateScroll(),
		autoOpen: false,
		title: options.title,
		containment: "#mainContainer",
	})
	
	
	$("."+options.name+"Title").children("span").append(
		'<input type="checkbox" checked="" onclick="'+globalString+'.updateScroll()" id="'+name+'LockScroll" class="autoScroll">' +
		'Auto Scroll'
	);
	
	
	
	//Store "Pointers" to elements to save jquery lookups.
	this.lockScrollElement = $("#"+name+"LockScroll")[0]
	this.element = $("#"+name)[0]
	this.element.addEventListener("scroll", () => this.onScroll())
	this.tableElement = $("#"+name+"Table")[0]
	this.DOMCollection = []
	this.lastEvent = 0
	
	
	for (var style in options.tableStyles)
		this.tableElement.style[style] = options.tableStyles[style]
	
	
}


$(() => 
{
	new eventDialog({
		name: 'kills',
		height: 230,
		width: 610,
		minHeight: 60,
		minWidth: 200,
		title: "Kill Feed (X)",
		rowWriteFunction: kf_makeRow,
		tableStyles: {
			"fontSize": "12px"
		}
	})
	

	new eventDialog({
		name: 'chat',
		height: 400,
		width: 550,
		minHeight: 60,
		minWidth: 200,
		title: "Chat (T)",
		rowWriteFunction: chat_makeRow,
		tableStyles: {
			"fontSize": "12px"
		}
	})
	

	new eventDialog({
		name: 'revives',
		height: 200,
		width: 350,
		minHeight: 80,
		minWidth: 300,
		title: "Revives (R)",
		rowWriteFunction: revive_makeRow,
		tableStyles: {
			"fontSize": "12px"
		}
	})
	
	new eventDialog({
		name: 'kitAllocations',
		height: 200,
		width: 350,
		minHeight: 80,
		minWidth: 300,
		title: "Kit Allocations (K)",
		rowWriteFunction: kit_makeRow,
		tableStyles: {
			"fontSize": "14px"
		}
	})
	
	new eventDialog({
		name: 'vehicleDestroyers',
		height: 300,
		width: 470,
		minHeight: 80,
		minWidth: 300,
		title: "Vehicles Destroyed (D)",
		rowWriteFunction: vdestroy_makeRow,
		tableStyles: {
			"fontSize": "14px"
		}
	})
})



function setCellTeamColor(rowObject, cellIndex, team)
{
	if (team == 1)
		rowObject.cells[cellIndex].className = "color_Team1"
	else
		rowObject.cells[cellIndex].className = "color_Team2"
}

//Special row making functions

function insertTimeCellAtIndex(row,index,obj,dialog)
{
	row.insertCell(index).innerHTML = getTimeStringOfTick(Tick_Current)
	
	//add click event
	row.cells[index].onclick = () =>
	{
		//Disable scroll lock
		dialog.lockScrollElement.checked = false;
		goTo(obj.tick - 1)
		if (obj.X && obj.Y)
			highlight(obj.X,obj.Y)
	}
	
	row.cells[index].style.cursor = "pointer"
}

function insertNameCellAtIndex(row,index,obj,name,playerID,team)
{
	row.insertCell(index).textContent = name
	setCellTeamColor(row, index, team)
	
	//add click event
	addPlayerSelectFunctionToCell(row.cells[index],name,playerID)
	
	//TODO error message if that player does not exist at that time (Left or didnt join yet) when selecting
}

function addPlayerSelectFunctionToCell(cell, name, playerID)
{
	cell.onclick = () =>
	{
		if (playerID in AllPlayers) // ID exists currently
			if (name==AllPlayers[playerID].name) // Is the same player (different player could have had that ID)
				selection_SelectPlayer(playerID,true)
	}
	cell.style.cursor = "pointer"
}


function vdestroy_makeRow(obj,row)
{
	insertTimeCellAtIndex(row,0,obj,eventDialogs.vehicleDestroyers)
	insertNameCellAtIndex(row,1,obj,obj.destroyerName,obj.destroyerID,obj.destroyerTeam)
	name = obj.vehicleTemplate
	if (name in vehicleData)
		if (vehicleData[name].HudName != "")
			name = vehicleData[name].HudName
	
	
	row.insertCell(2).textContent = name
	setCellTeamColor(row, 2, obj.vehicleTeam)	
}

function kit_makeRow(obj,row)
{
	insertTimeCellAtIndex(row,0,obj,eventDialogs.kitAllocations)
	insertNameCellAtIndex(row,1,obj,obj.playerName,obj.playerID,obj.team)
	row.insertCell(2).textContent = obj.kitName
}

function revive_makeRow(obj, row)
{
	insertTimeCellAtIndex(row,0,obj,eventDialogs.revives)
	insertNameCellAtIndex(row,1,obj,obj.MedicName,obj.MedicID,obj.team)
	insertNameCellAtIndex(row,2,obj,obj.RevivedName,obj.RevivedID,obj.team)
}

function chat_makeRow(obj, row)
{
	insertTimeCellAtIndex(row,0,obj,eventDialogs.chat)
	
	
	var channelName = ""
	var colorClass = "color_Team"+obj.team
	var isSquadChat = false
	var team
	var squad
	//Above 0x30, special channels
	if (obj.channel >= 0x30)
		channelName = CHATCHANNELS[obj.channel]
	// if AllChat
	else if (obj.channel == 0x00)
		channelName = "All Chat"
	else 
	{
		team = ((obj.channel & 0xF0) >> 4)
		squad = ((obj.channel & 0x0F))
		channelName = "T"+ team
		if (squad != 0)
		{
			channelName += " Squad " + squad
			colorClass = "color_Squad"
			isSquadChat = true
		}
		else
		{
			channelName += " Team "
		}
	}
	
	row.className = colorClass
	
	row.insertCell(1).textContent = channelName
	
	row.insertCell(2).textContent = obj.speaker +":"
	addPlayerSelectFunctionToCell(row.cells[2],obj.speaker,obj.playerID)
	
	row.insertCell(3).textContent = obj.text 
	
	if (isSquadChat)
	{
		row.cells[1].onclick = () =>
		{
			selection_SelectSquad(team, squad)
		}
		row.cells[1].style.cursor = "pointer"
	}
	
	row.cells[2].onclick = () =>
	{
		if (obj.playerID in AllPlayers && obj.speaker == AllPlayers[obj.playerID].name)
			selection_SelectPlayer(obj.playerID,true)
		else
			selection_SelectPlayer(SELECTED_NOTHING)
		
	}
}

function kf_makeRow(kill, row)
{
	row.className = "killsRow"
	insertTimeCellAtIndex(row,0,kill,eventDialogs.kills)
	row.insertCell(1).innerHTML = kill.Distance + "m "
	insertNameCellAtIndex(row,2,kill,kill.AttackerName,kill.AttackerID,kill.AttackerTeam)
	
	const cell = row.insertCell(3)
	const weaponName = kill.Weapon
	cell.textContent = "[" + weaponName + "]"
	cell.title = kill.Weapon
	cell.style.cursor = "pointer"
	
	insertNameCellAtIndex(row,4,kill,kill.VictimName,kill.VictimID,kill.VictimTeam)
	
	
	row.onmouseenter = () => kf_select(kill.index)
	row.onmouseleave = () => kf_select(SELECTED_NOTHING)
}


function kf_select(killid)
{
	SelectedKill = killid

	requestUpdate();
}
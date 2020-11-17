$(() => $("#serverinfoContainer").dialog(
{
	containment: "#mainContainer",
	autoOpen: false,
	width: 500,
	height: "auto",
	resizable: false,
	title: "Server info",
}))


function serverInfoTableAddLine(key, value)
{
	const table = $("#serverinfoTable")[0]

	var row = table.insertRow(-1)
	row.insertCell(0).textContent = key
	row.insertCell(1).textContent = value
}
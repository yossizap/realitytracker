"use strict;"

$(() =>
{
	$("#bookmarksContainer").dialog(
	{
		containment: "#mainContainer",
		autoOpen: false,
		title: "Bookmarks",
		width: 760,
		minWidth: 250,
	})


	$("#addbookmarkComment").dialog(
	{
		containment: "#mainContainer",
		modal: true,
		open: () =>
		{
			Stop();
			$("#addbookmarkComment").dialog("option", "title", "Add bookmark: " + getTimeStringOfTick(Tick_Current));
			$("#bookmarkCommentField")[0].value = ""
		},
		buttons:
		{
			"OK": () =>
			{
				var c = $("#bookmarkCommentField")[0].value
				bookmarks_Add(c);
				$("#addbookmarkComment").dialog("close");
			}
		},
		autoOpen: false,
		resizable: false,
		width: 600,
	})

})

bookmarks_List = []

function bookmarks_Add(_Comment)
{
	var bookmark = {
		"tick": Tick_Current,
		"comment": _Comment,
	}

	var index = bookmarks_List.findIndex((i) =>
	{
		return (i.tick > Tick_Current)
	})
	if (index == -1)
		bookmarks_List.push(bookmark)
	else
		bookmarks_List.splice(index, 0, bookmark);
	bookmarks_WriteAll()
	bookmarks_Save()
}

function bookmarks_Delete(b)
{
	var index = bookmarks_List.indexOf(b);
	if (index == -1)
		return

	bookmarks_List.splice(index, 1);

	bookmarks_Save()
	bookmarks_WriteAll()
}

function bookmarks_Save()
{
	var key = (IPPort + " " + StartTime) // IP plus start time sounds unique enough
	var value = JSON.stringify(bookmarks_List)
	localStorage[key] = value
}

function bookmarks_Load()
{
	var key = (IPPort + " " + StartTime)
	if (key in localStorage)
		bookmarks_List = JSON.parse(localStorage[key])

	bookmarks_WriteAll()
}

function bookmarks_WriteOne(b)
{
	const time = getTimeStringOfTick(Tick_Current)
	const comment = b.comment
	const table = $("#bookmarksTable")[0]

	var row = table.insertRow(-1)
	row.insertCell(0).innerHTML = time
	row.insertCell(1).innerHTML = "<label>" + comment + "</label>" +
		"<input style='display:none;'></input>"
	row.insertCell(2).innerHTML = "X"


	row.cells[0].onclick = () => goTo(b.tick)
	row.cells[2].onclick = () => bookmarks_Delete(b)


	// const label = $(row.cells[1]).find("label")
	// const input = $(row.cells[1]).find("input")

	// label.onclick = () =>  
	// {
	// label.css('display', 'none');
	// input
	// .val(label.text())
	// .css('display', '')
	// .focus();
	// }

	// input.blur(() =>
	// {
	// input.css('display', 'none');
	// label
	// .text($('#amount_entry').val())
	// .css('display', '');
	// });


}

// Clear the table and rewrite all
function bookmarks_WriteAll()
{
	$("#bookmarksTable tr:gt(0)").remove()
	bookmarks_List.forEach(bookmarks_WriteOne)
}
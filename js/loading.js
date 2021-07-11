"use strict";

//Loading order:
//
//0. Before everything:
//0.1 HideInterface() is called to hide all map related interface (playbar, map division, options, left bar)

//1. Icons, Map information JSON, Vehicle informaton JSON:
//1.1 loadIconsAndDictionaries() - Loads all icons and all json.
//1.2 When above done, stage1LoadingFininshed()
//1.2.1 Create a list of vehicle map icons that need to be colored.
//
//2. Demo load deciding phase:
//2.1 if we have a "demo" Query string, Skip to 3
//2.2 Show the demo loading interface and wait for input
//

//3. Demo loading:
//3.1 loadDemo(URL) or loadDemoFromFile() are called depending on input.
//3.1a connectToServer() //TODO
//3.2 When above is done, stage3LoadingFininshed()

//4. Parser goes through the demo and the browser downloads the map image async.
//4.1 when done, stage4LoadingFininshed


//5 Create a copy of the map image and draws the DOD on top 
//	so we have 2 versions one with DoDs and one without (so we dont have to draw the DoD polygons from scratch every draw call.)
//5.1 When above is done ShowInterface() is called and loading is done


// Initial Loading.
$(()=>
{
	hideInterface()
	setLoadingOverlayText("Preparing to load icons...")
	Canvas = $("#map")[0]
	Context = Canvas.getContext("2d")
	mapDiv = $("#mapDiv")[0]
	
	// add onclick listeners to squad tables
	for (var i=1;i<=2;i++)
		for (var j=1;j<=9;j++)
		{
			$("#Squad" + i + j)[0].rows[0].onclick = 
			((ClosureI,ClosureJ) =>
			{
				return (() => {selection_SelectSquad(ClosureI, ClosureJ)})
			})(i,j)
		}
			

	// draw canvas on resize 
	window.onresize = function() {requestUpdate()}
	
	$("#demoFileSelection")[0].addEventListener('change', loadDemoFromFile);
	
	$("#playBar")[0].addEventListener("mouseenter", showPlayBarBubble);
	$("#playBar")[0].addEventListener("mouseleave", hidePlayBarBubble);
	$("#playBar")[0].addEventListener('mousemove',  setPlayBarBubble)
	
	
	loadIconsAndDictionaries()
	
	//$(document).tooltip() TODO
});



var MapsURL = "Maps/" 
var HeightmapURL = "Heightmaps/"
var MapImage = null
var MapImageWithCombatArea = null


// Icons and data
var atlas = null
var atlasPNG = null
var atlasJSON_loaded = false
var atlasPNG_loaded = false

//var weaponsData

var vehicleData
var KitNameToImageDictionary
var heightmapData

var ThingsLoading = 1
function loadIconsAndDictionaries()
{
	ThingsLoading++
	
	$.getJSON("data.json", json => {
		//VEHICLES
		vehicleData = json.vehicles;
		for (var name in vehicleData)
			{ // Apply default map icon for vehicles without icon.
				if (vehicleData[name].MiniMapIcon == "")
					vehicleData[name].MiniMapIcon = "mini_shp_light"
			}
		
		//ATLAS
		atlas = json.atlas;
		atlasJSON_loaded = true
		atlasLoaded()

		heightmapData = json.height;
		
		//KIT DICTIONARY
		KitNameToImageDictionary = json.kits
		objectLoaded();
		})
	
	ThingsLoading++
	atlasPNG = new Image()
	atlasPNG.onload = () =>
	{
		atlasPNG_loaded = true
		atlasLoaded()
		objectLoaded()
	}
	atlasPNG.src = "atlas.png"
	
	objectLoaded() //the entire function is considered "something" loading.
}


// Called when an icon has finished loading 
function objectLoaded()
{
	ThingsLoading--
	setLoadingOverlayText("Loading Icons... " + ThingsLoading + " Left")
	
	if (ThingsLoading == 0)
		stage1LoadingFininshed()
}


const ProjectileTypeShouldRotate = {
	0: false,	// PROJECTILE_TYPE_UNKNOWN = 0
	1: false,	// PROJECTILE_TYPE_MINE_VICTIM_AT = 1
	2: false,	// PROJECTILE_TYPE_MINE_VICTIM_AP = 2
	3: false,	// PROJECTILE_TYPE_MINE_REMOTE_AT = 3
	4: false,	// PROJECTILE_TYPE_MINE_REMOTE_AP = 4
	5: false,	// PROJECTILE_TYPE_C4_SMALL = 5
	6: false,	// PROJECTILE_TYPE_C4_LARGE = 6
	32: true,	// PROJECTILE_TYPE_AT_LIGHT = 32
	33: true,	// PROJECTILE_TYPE_AT_HEAVY = 33
	34: true,	// PROJECTILE_TYPE_AT_TOW = 34
	35: true,	// PROJECTILE_TYPE_AA_AA = 35
	36: true,	// PROJECTILE_TYPE_GRENADIER = 36
	37: true,	// PROJECTILE_TYPE_MORTAR = 37
	38: false,	//PROJECTILE_TYPE_GRENADEFRAG = 38
	39: false,	//PROJECTILE_TYPE_SMOKE = 39
	40: true,	//PROJECTILE_TYPE_TANKSHELL = 40
	41: false, // PROJECTILE_TYPE_SMOKE_IR = 41
}
const ProjectileTypeToImageName = {
	0: null,	// PROJECTILE_TYPE_UNKNOWN = 0
	1: "proj_mineat",	// PROJECTILE_TYPE_MINE_VICTIM_AT = 1
	2: "proj_mineap",	// PROJECTILE_TYPE_MINE_VICTIM_AP = 2
	3: "proj_mineatremote",	// PROJECTILE_TYPE_MINE_REMOTE_AT = 3
	4: "proj_mineap",	// PROJECTILE_TYPE_MINE_REMOTE_AP = 4
	5: "proj_c4",	// PROJECTILE_TYPE_C4_SMALL = 5
	6: "proj_c4satchel",	// PROJECTILE_TYPE_C4_LARGE = 6
	32: "proj_lat",	// PROJECTILE_TYPE_AT_LIGHT = 32
	33: "proj_hat",	// PROJECTILE_TYPE_AT_HEAVY = 33
	34: "proj_tow",	// PROJECTILE_TYPE_AT_TOW = 34
	35: "proj_aa",	// PROJECTILE_TYPE_AA_AA = 35
	36: "proj_grenadier",	// PROJECTILE_TYPE_GRENADIER = 36
	37: "proj_mortar",	// PROJECTILE_TYPE_MORTAR = 37
	38: "proj_frag",	//PROJECTILE_TYPE_GRENADEFRAG = 38
	39: "proj_smoke",	//PROJECTILE_TYPE_SMOKE = 39
	40: null,	//PROJECTILE_TYPE_TANKSHELL = 40
	41: "proj_smoke", // PROJECTILE_TYPE_SMOKE_IR = 41
}

var coloredIcons = {}
// TODO might be race condition here? probably done synchronized though because its not actual remote loading
function createColoredMapIcons()
{
	var imagesToColor = new Set()
	for (var vehicle in vehicleData)
		imagesToColor.add(vehicleData[vehicle].MiniMapIcon)
	
	for (var projectileType in ProjectileTypeToImageName)
		if (ProjectileTypeToImageName[projectileType] != null)
			imagesToColor.add(ProjectileTypeToImageName[projectileType])
	
	
	imagesToColor.forEach((name) => {
		var tempImg = new Image()

		// This creates a proper closure. See http://javascriptissexy.com/understand-javascript-closures-with-ease/ Section 3.
		tempImg.onload =
			((closureName, closureImage) =>
			{
				return (() =>
				{
					coloredIcons[closureName] = colorImage(closureImage);
				})
			})(name, tempImg)

		tempImg.onerror = onErrorLoading
		tempImg.src = loadImageFromAtlas(name)
	})
	
}

//Called when all icons are done loading. Now the demo needs to be selected or loaded.
function stage1LoadingFininshed() {
	createColoredMapIcons()

	if (getUrlParameter("demo")) { 
		setLoadingOverlayText("Preparing to load demo...")
		loadDemo(getUrlParameter("demo"), false)
	}
	else
	{
		showDemoSelectionInterface()
		setLoadingOverlayText("")
	}
}

//load live Demo from active server
function loadLiveDemo(IP,Port,Username,Password)
{
	if (!WebSocket)
	{
		console.log("Raw TCP sockets are not supported on this browser")
		return false
	}
	
	//network_connect(IP,Port,Username,Password,stage3LoadingFininshed, () => {}); //TODO some onerror callback
	//Wait for callback from onConnect and go to stage3 finished
}

var demoLink = null;
//LoadDemo from URL
function loadDemo(link, CredsNeeded)
{
	if (link == "")
		return false

	
	//Guarantee that link will use the same protocol as the window
	// (if it fails its probably a relative path)
	var originalProtocol = "https:"; 
	try {
		var url = new URL(link);
		originalProtocol = url.protocol;
		if (window.location.protocol != "file:")
			url.protocol = window.location.protocol;
		link = url.href;
	} catch (err) { }
	


	demoLink = link;
	//Manually set query string when loading from a URL
	if (history.pushState) 
	{
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname; //get base URL
		newurl += '?demo=' + demoLink  //set demo link
		for (var arg of ["t", "cx", "cy", "czoom"])
			if (getUrlParameter(arg))
				newurl += '&' + arg + '=' + getUrlParameter(arg)  //set timestamp
		window.history.pushState({path:newurl},'',newurl);
	}
	
	
	var req = new XMLHttpRequest();
	req.open('GET', link);
	req.withCredentials = CredsNeeded
	req.responseType = "arraybuffer";


	req.onload = () =>
	{
	
		if (req.status == 401)
		{
			console.log("XMLHttpRequest returned 401, Trying again with 'withCredentials' flag set")
			return loadDemo(link, true)
		
		}
		
		if (req.status != 200 && req.status != 304)
		{
			setLoadingOverlayText("Error downloading demo file. Status code: "+req.status)
			return 
		}
		
		console.log("Request status: "+req.status)
		
		const buffer = req.response;
		
		//Set the global databuffer var (contains the file)
		DataBuffer = checkIfGZAndInflate(buffer);
		
		//Tell the message handler to cut the buffer into an array of dataviews of the buffer
		messageArrayObject.updateNewMessages()
		
		//All Messages parsed, call next stage
		stage3LoadingFininshed()
	}
	req.onprogress = e => 
	{
		const total = e.total ? Math.floor(e.total/1000) : "Unknown "
		setLoadingOverlayText("Loading Demo file... " + Math.floor(e.loaded / 1000) + "kb / " + total +"kb");
	}
	req.onerror= e => 
	{
			// Due to security reasons, its impossible to tell if network failure was due to CORS.
			console.log("Network error, retrying with cors proxy")
			setLoadingOverlayText("Error downloading demo file, retrying with CORS proxy...")
	}
	
	req.send();
	return true
}



function handleFileDrop(ev) {
	if (loadingComplete)
		return;

	ev.preventDefault();
	if (ev.dataTransfer.items) {
		if (ev.dataTransfer.items[0].kind === 'file') {
			const file = ev.dataTransfer.items[0].getAsFile();
			loadDemoFromFileObject(file);
		}
	
	}
	else {
		loadDemoFromFileObject(file);
	}
}
$(() => {
	document.addEventListener("drop", handleFileDrop);
	document.addEventListener("dragover", (ev) => ev.preventDefault());
});

//Load demo from selected file
function loadDemoFromFile()
{
	loadDemoFromFileObject($("#demoFileSelection")[0].files[0]);
}

function loadDemoFromFileObject(file) {
	var reader = new FileReader()
	reader.onloadend = () => {
		DataBuffer = checkIfGZAndInflate(reader.result)
		messageArrayObject.updateNewMessages()
		stage3LoadingFininshed()
	}
	reader.readAsArrayBuffer(file)

	$("#copyLink")[0].style["cursor"] = "not-allowed";
}


var isParsingDone = false

// Temp workaround until v4. I want to get rid of that mapdata.json completely for now.
const mapSizeDict = {
	"operation_falcon": 2,
	"tad_sae": 1,
	"operation_ghost_train": 1,
	"sahel": 2,
	"operation_marlin": 2,
	"burning_sands": 4,
	"pavlovsk_bay": 4,
	"xiangshan": 4,
	"karbala": 2,
	"goose_green": 2,
	"korengal": 1,
	"albasrah_2": 2,
	"operation_soul_rebel": 4,
	"shijiavalley": 4,
	"dragon_fly": 2,
	"gaza_2": 1,
	"hill_488": 1,
	"bijar_canyons": 4,
	"kokan_sp": 2,
	"khamisiyah": 4,
	"kokan": 2,
	"operation_archer": 2,
	"ramiel": 2,
	"qwai1": 2,
	"charlies_point": 2,
	"asad_khal": 1,
	"beirut": 2, 
	"jabal": 2,
	"lashkar_valley": 2,
	"wanda_shan": 4,
	"dovre_winter": 2,
	"yamalia": 4, 
	"dovre": 2,
	"hades_peak": 4,
	"kozelsk": 2,
	"the_falklands": 8,
	"fallujah_west": 1,
	"muttrah_city_2": 2,
	"kashan_desert": 4,
	"battle_of_ia_drang": 2,
	"iron_ridge": 2,
	"bamyan": 4,
	"saaremaa": 4,
	"assault_on_grozny": 2,
	"op_barracuda": 2,
	"fools_road": 2,
	"ulyanovsk": 2,
	"route": 2,
	"test_bootcamp": 1,
	"nuijamaa": 2,
	"sbeneh_outskirts": 2,
	"assault_on_mestia": 1,
	"black_gold": 4,
	"silent_eagle": 4,
	"test_airfield": 4,
	"vadso_city": 4,
	"iron_thunder": 4,
	"shahadah": 2,
	"outpost": 2,
}

//Called when demo buffer is acquired.
function stage3LoadingFininshed()
{
	hideDemoSelectionInterface()
	setLoadingOverlayText("Parsing demo")
	
	
	//Read up to server details message, update things like map name, layer, gamemode, team names.
	ReadServerDetails()
	
	if (MapSize == 0)
	{
		if (MapName in mapSizeDict)
			MapSize = mapSizeDict[MapName]
		else
			MapSize = prompt("Map unknown, please enter map size (0.5,1,2,4,8)")
	}
	
	//Load this map's image
	downloadManager.download(MapsURL + MapName + ".png", "image", (img) => {
		MapImage = img;
		createMapImageWithCombatArea();
		requestUpdate();
	}, "Map image");

	mapRenderer.init();


	// Load this map's heightmap raw and configuration
	heightmap.init(HeightmapURL + MapName + ".raw", heightmapData[MapName]); 
	
	// TODO handle unknown flag names.
	bluforflag = icons[BluForTeam.toLowerCase() + "_cp"]
	opforflag = icons[OpForTeam.toLowerCase() + "_cp"]
	neutralflag = icons["neutral_cp"]
	
	// Parse the file and create checkpoints (while the map downloads!)
	ParseDemo_Start()

}



// Parse demo from start to end, count ticks and create checkpoints
// using hacks to make it assync because javascript is shit and there's no other way to force DOM update
function ParseDemo_Start()
{
	isFastForwarding = true
	messagePos = 0
	Tick_Count = 0
	
	ParseDemo_Part()
}
function ParseDemo_Part()
{
	for (var i=0; i<2500; i ++)
		if (!Update()) //if reached end of file, end
		{
			ParseDemo_End()
			return
		}
	
	//after parsing 2500 ticks, sleep a little to let browser redraw UI
	updateLoadingStatus()
	setTimeout(ParseDemo_Part,5)
}
function ParseDemo_End()
{
	isFastForwarding = false;
	isParsingDone = true
	InitialParse = false
	updateLoadingStatus()
	stage4LoadingFininshed();
}


var loadingComplete = false;
//called when demo parsing stage finishes
function stage4LoadingFininshed()
{
	writeServerInfoTable()
	//Remove status overlay
	setLoadingOverlayText("")
	
	//Remove demo selection interface
	hideDemoSelectionInterface() 
	
	//Register keyboard events
	$(document).keydown(onKeyDown)
	$(document).keyup(onKeyUp)
	
	//Show the demo interface
	showInterface()
	
	Reset()
	
	//Load options from localStorage
	loadSettings()
	

	
	//Reset speed to 1
	setSpeed(1)
		
	onLoad()
	
	if (getUrlParameter("t")) {
		const tick = getTickfromTimeString(getUrlParameter("t"))
		if (tick != -1)
			goTo(tick)
	}
	if (getUrlParameter("cx") && getUrlParameter("cy")) {
		const cx = parseFloat(getUrlParameter("cx"));
		const cy = parseFloat(getUrlParameter("cy"));
		const czoom = parseFloat(getUrlParameter("czoom"));
		if (!isNaN(cx) && !isNaN(cy))
			setCanvasCenterWithZoom(cx, cy, isNaN(czoom) ? 1 : czoom / options_canvasScale);
	} else {
		setCanvasCenterWithZoom(0, 0, 1);
	}

	//Draw the canvas for the first time
	requestUpdate();

	// Chrome hack: draw again a second later, its doing some async caching and images are not ready
	setTimeout(requestUpdate, 300);

	loadingComplete = true;
}

function writeServerInfoTable()
{
	serverInfoTableAddLine("Server name", ServerName)
	serverInfoTableAddLine("Round start time", new Date(StartTime * 1000).toGMTString())
	serverInfoTableAddLine("Max Players", MaxPlayers)
	serverInfoTableAddLine("Map name", MapName)
	serverInfoTableAddLine("Map mode", GameMode)
	serverInfoTableAddLine("Map layer", Layer)
	serverInfoTableAddLine("Round length", roundLength)
}

function showDemoSelectionInterface()
{
	$("#DemoSelectionInterface")[0].style.display = "block";
}
function hideDemoSelectionInterface()
{
	$("#DemoSelectionInterface")[0].style.display = "none";
}




function onErrorLoading()
{
	//Planned: deal with 404/503
	console.log("Error loading item")
}

function unload()
{
	//planned. 
}


//misc
function hideInterface()
{
	$.each($(".hideAtStart"), (i,e) => {e.style.display = "none"})
}

function showInterface()
{
	$.each($(".hideAtStart"), (i,e) => {e.style.display = ""})
}


function updateLoadingStatus()
{
	const T2 = isParsingDone ? "Done" : Tick_Count
	setLoadingOverlayText("Parsing demo<br>Ticks Parsed: "+T2)
}

function setLoadingOverlayText(Text)
{
	if (Text == "")
	{
		$("#loadingStatusOverlay")[0].style.display = "none"
	}
	else
	{
		$("#loadingStatusOverlay")[0].style.display = "block"
		$("#loadingStatusOverlay")[0].innerHTML = Text
	}
}


function checkIfGZAndInflate(demobuffer)
{
	var dataview = new Uint8Array(demobuffer)
	if(dataview[0] == 0x78 && //This is always true for GZ
	   dataview[1] == 0x9c)  //This marks the selected compression level. It will change if we change compression level. w/e good enough
	{
		console.log("Detected GZ, decompressing")
		return (new Zlib.Inflate(dataview)).decompress().buffer;
	}
	else
	{
		console.log("Not GZ")
		return demobuffer
	}
}


const fillstyle_neutral = "rgba(128, 128, 128, 0.4)";
const fillstyle_red = "rgba(255, 0, 0, 0.2)";
const fillstyle_blue = "rgba(0, 0, 255, 0.2)";
function createMapImageWithCombatArea()
{
	if (MapImageWithCombatArea)
		return
	
	//The scaling functions used here rely on CameraX/Y zeroed
	const CameraXTemp = CameraX
	const CameraYTemp = CameraY
	CameraX = 0
	CameraY = 0
	
	const c = document.createElement('canvas');
	const context = c.getContext("2d")
	c.width = MapImage.width
	c.height = MapImage.height
	context.drawImage(MapImage,0,0)
	
	currentDODList.forEach(function (CA)
	{
		if (CA.inverted == 1) //todo
			return
		
		if (CA.team == 0)
			context.fillStyle = fillstyle_neutral
		else if (CA.team == 2)
			context.fillStyle = fillstyle_red
		else
			context.fillStyle = fillstyle_blue
		
		context.beginPath()
		CA.points.forEach(function (Point)
		{
			const x = XtoCanvas(Point[0]) *2
			const y = YtoCanvas(Point[1]) *2
			context.lineTo(x,y)
		})
		context.closePath()
		
		context.fill()
	})
	
	MapImageWithCombatArea = new Image()
	MapImageWithCombatArea.src = c.toDataURL()
	
	
	CameraX=CameraXTemp
	CameraY=CameraYTemp
}

//Load settings from local storage
function loadSettings()
{
	for (var Name in localStorage) 
		if (Name.startsWith("options_"))
		{
			changeSetting(Name, JSON.parse(localStorage[Name]))


			if ($("input[id='" + Name + "']")[0]) {
				const input = $("input[id='" + Name + "']")[0]
				if (input.type == "checkbox")
					input.checked = window[Name]
				else if (input.type == "range")
					input.value = window[Name]
            }
		}
}

// Gets an image and returns an array of 4 images where white is replaced by [blue,red,green,white] (No efficient way of real time coloring on canvas?)
function colorImage(white)
{
	var c = document.createElement('canvas');
	var context = c.getContext("2d")
	c.width = white.width
	c.height = white.height
	
	
	context.drawImage(white,0,0)
	var blue = context.getImageData(0, 0, c.width, c.height)
	var red = context.getImageData(0, 0, c.width, c.height)
	var green = context.getImageData(0, 0, c.width, c.height)

	
	for (var i=0;i<blue.data.length;i+=4)
	{
		  // is white enough pixel (Some PR icons are not full white for some reason)
		  if(blue.data[i]>220 &&
			 blue.data[i+1]>220 &&
			 blue.data[i+2]>220
		)
		{
			// change to some colors 
			blue.data[i]=0;
			blue.data[i+1]=64;
			blue.data[i+2]=255;
			
			red.data[i]=255;
			red.data[i+1]=0;
			red.data[i+2]=0;
			
			green.data[i]=0;
			green.data[i+1]=255;
			green.data[i+2]=0;
		}
	}
	
	context.putImageData(blue,0,0)
	blue = new Image()
	blue.src = c.toDataURL()
	
	context.putImageData(red,0,0)
	red = new Image()
	red.src = c.toDataURL()
	
	context.putImageData(green,0,0)
	green = new Image()
	green.src = c.toDataURL()
	
	return [red, blue, green, white];
}

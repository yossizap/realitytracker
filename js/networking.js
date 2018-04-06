"use strict;"

var isNetworking = false

var network_FutureMessageLastParsed

//The socket itself
var network_Socket

//Callback function after we've acquired header and server details
var network_onServerDetailsAcquired
//bool, whether or not we acquired details yet
var network_serverDetailsAcquired

//Callback function on error
var network_onErrorCallback

var network_username = ""
var network_password = ""

//const NETWORK_TIMEOUT = 20000

const NETWORKSTATE_WAITINGFORCHALLENGE = 0
const NETWORKSTATE_AUTHENTICATED = 1
var network_state = NETWORKSTATE_WAITINGFORCHALLENGE

function network_connect(ip, port, username, password, serverDetailsAqcuiredCallback, errorCallback)
{
	// Assume network is available.
	network_onServerDetailsAcquired = serverDetailsAqcuiredCallback
	network_onErrorCallback = errorCallback
	isNetworking = true

	network_FutureMessageLastParsed = 0
	messagePos = 0

	network_serverDetailsAcquired = false

	network_Socket = new WebSocket("ws://" + ip + ":" + port + "/tracker")
	network_Socket.binaryType = "arraybuffer"
	network_Socket.onclose = network_onEnd
	network_Socket.onerror = network_onError
	network_Socket.onmessage = network_onData
	network_Socket.onopen = network_onConnect

	network_username = username
	network_password = password

	return true;
}

function network_onConnect()
{
	console.log("Network: Connected")
}

// Add a buffer to our main buffer
function network_onData(messageEvent)
{
	const view = new DataView(messageEvent.data)
	// Connected
	if (network_state == NETWORKSTATE_AUTHENTICATED)
	{
		const type = view.getUint8(0)
		console.log("Network: Data received, type: " + type)


		// Check if recieved a control message
		switch (type)
		{
		case MESSAGETYPE.PRIVATEMESSAGE:
			network_textMessageRecieved(getStringToEndOfMessage(view, 1))
			return;
		case MESSAGETYPE.ERRORMESSAGE:
			network_textErrorMessageRecieved(getStringToEndOfMessage(view, 1))
			return
		}

		// Update Messages array
		messageArrayObject.addMessage(view)

		// See if we need to get server detail
		if (!network_serverDetailsAcquired)
		{
			if (ReadServerDetails())
			{
				console.log("Network: Server confirmed authentication")
				network_serverDetailsAcquired = true
				network_onServerDetailsAcquired()
			}
		}
		else // If we're passed that part start counting ticks
			handleNewData()
	}

	////
	// Waiting for server challenge
	else //if (network_state == NETWORKSTATE_WAITINGFORCHALLENGE)
	{
		const serverkey = getString(view, 0)
		const hash = Sha1.hash(serverkey + network_password)
		const reply = network_username + "\0" + hash

		network_write(stringToByteArray(reply))
		network_state = NETWORKSTATE_AUTHENTICATED
	}
}

function network_onEnd()
{
	console.log("Network: Connection closed")
	network_Socket = null
}

function network_onError(error)
{
	console.log("Network: Error occurred: " + error.message)
	network_onErrorCallback()
	network_Socket = null
}

function network_write(data)
{
	network_Socket.send(data)
}

// Called when a text message was sent to this specific client
function network_textMessageRecieved(messageString)
{
	console.log("Private message from server: " + messageString)
}
// Called when an error message was sent to this specific client
function network_textErrorMessageRecieved(messageString)
{
	console.log("Network: Error from server: " + messageString)
}

function stringToByteArray(string)
{
	var A = new ArrayBuffer(string.length)
	var V = new Uint8Array(A)
	for (var i = 0; i < string.length; i++)
	{
		V[i] = string.charCodeAt(i)
	}
	return A
}

// Checks if any new ticks arrived with this data.
function handleNewData()
{
	// Each iteration handles a full new message
	while (true)
	{
		const message = messageArrayObject.getMessageAt(network_FutureMessageLastParsed)
		if (message == null)
			return

		// This is a new tick, increase the max ticks on the UI
		if (MESSAGETYPE.VEHICLE_UPDATE == message.getUint8(0))
			increaseTickCount()

		network_FutureMessageLastParsed++
	}
}

function increaseTickCount()
{
	Tick_Count += 1
	$("#playBar")[0].max = Tick_Count

	if (playTimerPausedWaitingForData)
		playTimerFire()
}
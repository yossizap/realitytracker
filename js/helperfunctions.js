"use strict;"

// Adds onprogress event to image loading.
$(function ()
{
	Image.prototype.load = function (url)
	{
		var thisImg = this;
		var xmlHTTP = new XMLHttpRequest();
		xmlHTTP.open('GET', url, true);
		xmlHTTP.responseType = 'arraybuffer';
		xmlHTTP.onload = function (e)
		{
			var blob = new Blob([this.response]);
			thisImg.src = window.URL.createObjectURL(blob);
		};
		xmlHTTP.onprogress = function (e)
		{
			thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);

			//Images using "load" instead of "src" must have onprogress set!
			thisImg.onprogress(e)
		};
		xmlHTTP.onloadstart = function ()
		{
			thisImg.completedPercentage = 0;
		};
		xmlHTTP.send();
	};
	Image.prototype.completedPercentage = 0;
})

// Queries individual args
function getUrlParameter(sParam)
{

	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('#')[0].split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++)
	{
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam)
		{
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};


var viewerScripts = {
	doPerTick: function (func)
	{
		goTo(0)
		while (Update())
			func()
	},

	findNameByPartialFromKillList: function (PlayerPartial)
	{
		const k = eventArrays.kills.events.find(e => e.AttackerName.toLowerCase().includes(PlayerPartial.toLowerCase()))
		return k ? k.AttackerName : ""
	},

	getPlayerVictimList: function (PlayerName)
	{
		var VictimList = {}
		eventArrays.kills.events.forEach(function (kill)
		{
			if (kill.AttackerName == PlayerName)
			{
				if (kill.VictimName in VictimList)
					VictimList[kill.VictimName]++
					else
						VictimList[kill.VictimName] = 1
			}
		})

		return VictimList
	},

	getPlayerWeaponList: function (PlayerName)
	{
		var WeaponList = {}
		var PlayerName = findNameByPartialFromKillList(PlayerPartial)

		killList.forEach(function (kill)
		{
			if (kill.AttackerName == PlayerName)
			{
				if (kill.Weapon in WeaponList)
					WeaponList[kill.Weapon]++
					else
						WeaponList[kill.Weapon] = 1
			}
		})

		return WeaponList
	},
}


function copyTrackerLink() {
	if (demoLink == null)
		return;

	var u = window.location.protocol + "//" + window.location.host + window.location.pathname; 
	u += '?demo=' + demoLink;
	u += '&t=' + getTimeStringOfTick(Tick_Current);
	u += '&cx=' + parseFloat(getCanvasCenter()[0]).toFixed(2);
	u += '&cy=' + parseFloat(getCanvasCenter()[1]).toFixed(2);
	u += '&czoom=' + parseFloat(CameraZoom).toFixed(2);
	copyTextToClipboard(u);
}

function copyTextToClipboard(text) {
	if (!navigator.clipboard) {
		console.log("Browser does not support modern clipboard API")
		return;
	}
	navigator.clipboard.writeText(text);
}

// Update location hash
// Only update once per X seconds, every tick is too expensive.
// var hashUpdatedRecently = false
// var currentHash = ""
// const TIMEPERHASHUPDATE = 1300

// function updateHash(forceUpdate)
// {
	// if (currentHash == "#" + Tick_Current)
		// return

	// if (forceUpdate)
	// {
		// currentHash = "#" + Tick_Current
		// location.replace(currentHash)
	// }
	// else if (!hashUpdatedRecently)
	// {
		// currentHash = "#" + Tick_Current
		// if (Tick_Current <= 1)
			// location.replace("#")
		// location.replace("#" + Tick_Current)
		// hashUpdatedRecently = true

		// setTimeout(() =>
		// {
			// hashUpdatedRecently = false;
			// updateHash(false)
		// }, TIMEPERHASHUPDATE)
	// }
// }

// Some random SHA1 that works
var Sha1 = {}
	/**
	 * Generates SHA-1 hash of string.
	 *
	 * @param   {string} msg - (Unicode) string to be hashed.
	 * @param   {Object} [options]
	 * @param   {string} [options.msgFormat=string] - Message format: 'string' for JavaScript string
	 *   (gets converted to UTF-8 for hashing); 'hex-bytes' for string of hex bytes ('616263' ≡ 'abc') .
	 * @param   {string} [options.outFormat=hex] - Output format: 'hex' for string of contiguous
	 *   hex bytes; 'hex-w' for grouping hex bytes into groups of (4 byte / 8 character) words.
	 * @returns {string} Hash of msg as hex character string.
	 */
Sha1.hash = function (msg, options)
{
	var defaults = {
		msgFormat: 'string',
		outFormat: 'hex'
	};
	var opt = Object.assign(defaults, options);

	switch (opt.msgFormat)
	{
		default: // default is to convert string to UTF-8, as SHA only deals with byte-streams
		case 'string':
			msg = Sha1.utf8Encode(msg);
		break;
	case 'hex-bytes':
			msg = Sha1.hexBytesToString(msg);
		break; // mostly for running tests
	}

	// constants [§4.2.1]
	var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

	// initial hash value [§5.3.1]
	var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

	// PREPROCESSING [§6.1.1]

	msg += String.fromCharCode(0x80); // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

	// convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
	var l = msg.length / 4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
	var N = Math.ceil(l / 16); // number of 16-integer-blocks required to hold 'l' ints
	var M = new Array(N);

	for (var i = 0; i < N; i++)
	{
		M[i] = new Array(16);
		for (var j = 0; j < 16; j++)
		{ // encode 4 chars per integer, big-endian encoding
			M[i][j] = (msg.charCodeAt(i * 64 + j * 4) << 24) | (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
				(msg.charCodeAt(i * 64 + j * 4 + 2) << 8) | (msg.charCodeAt(i * 64 + j * 4 + 3));
		} // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
	}
	// add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
	// note: most significant word would be (len-1)*8 >>> 32, but since JS converts
	// bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
	M[N - 1][14] = ((msg.length - 1) * 8) / Math.pow(2, 32);
	M[N - 1][14] = Math.floor(M[N - 1][14]);
	M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

	// HASH COMPUTATION [§6.1.2]

	for (var i = 0; i < N; i++)
	{
		var W = new Array(80);

		// 1 - prepare message schedule 'W'
		for (var t = 0; t < 16; t++) W[t] = M[i][t];
		for (var t = 16; t < 80; t++) W[t] = Sha1.ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);

		// 2 - initialise five working variables a, b, c, d, e with previous hash value
		var a = H[0],
			b = H[1],
			c = H[2],
			d = H[3],
			e = H[4];

		// 3 - main loop (use JavaScript '>>> 0' to emulate UInt32 variables)
		for (var t = 0; t < 80; t++)
		{
			var s = Math.floor(t / 20); // seq for blocks of 'f' functions and 'K' constants
			var T = (Sha1.ROTL(a, 5) + Sha1.f(s, b, c, d) + e + K[s] + W[t]) >>> 0;
			e = d;
			d = c;
			c = Sha1.ROTL(b, 30) >>> 0;
			b = a;
			a = T;
		}

		// 4 - compute the new intermediate hash value (note 'addition modulo 2^32' – JavaScript
		// '>>> 0' coerces to unsigned UInt32 which achieves modulo 2^32 addition)
		H[0] = (H[0] + a) >>> 0;
		H[1] = (H[1] + b) >>> 0;
		H[2] = (H[2] + c) >>> 0;
		H[3] = (H[3] + d) >>> 0;
		H[4] = (H[4] + e) >>> 0;
	}

	// convert H0..H4 to hex strings (with leading zeros)
	for (var h = 0; h < H.length; h++) H[h] = ('00000000' + H[h].toString(16)).slice(-8);

	// concatenate H0..H4, with separator if required
	var separator = opt.outFormat == 'hex-w' ? ' ' : '';

	return H.join(separator);
};


/**
 * Function 'f' [§4.1.1].
 * @private
 */
Sha1.f = function (s, x, y, z)
{
	switch (s)
	{
	case 0:
		return (x & y) ^ (~x & z); // Ch()
	case 1:
		return x ^ y ^ z; // Parity()
	case 2:
		return (x & y) ^ (x & z) ^ (y & z); // Maj()
	case 3:
		return x ^ y ^ z; // Parity()
	}
};

/**
 * Rotates left (circular left shift) value x by n positions [§3.2.5].
 * @private
 */
Sha1.ROTL = function (x, n)
{
	return (x << n) | (x >>> (32 - n));
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Encodes multi-byte string to utf8 - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
 */
Sha1.utf8Encode = function (str)
{
	return unescape(encodeURIComponent(str));
};


/**
 * Converts a string of a sequence of hex numbers to a string of characters (eg '616263' => 'abc').
 */
Sha1.hexBytesToString = function (hexStr)
{
	hexStr = hexStr.replace(' ', ''); // allow space-separated groups
	var str = '';
	for (var i = 0; i < hexStr.length; i += 2)
	{
		str += String.fromCharCode(parseInt(hexStr.slice(i, i + 2), 16));
	}
	return str;
};



//string sanitizing
var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}
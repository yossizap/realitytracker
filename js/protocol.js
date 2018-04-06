"use strict";

//(DataView, pos, types) -> [size, [arg1,arg2,arg3...]]
function unPack(startpos, types)
{
	const ret = []
	var pos = startpos
	
	for (var i = 0, len = types.length; i < len; i++)
	{
		const type = types[i]
		const result = dataParsers[type].apply(this, [pos,true])
		if (type != "s")
			pos += dataSizes[type]
		else
			pos += (result.length + 1)
			
		ret.push(result)
	}
	
	return [pos-startpos, ret]
}
DataView.prototype.unPack = unPack


function parseCString(pos)
{
	var text = ''
	while (pos < this.byteLength)
	{
		const val = this.getUint8(pos++);
		if (val == 0) break;
		text += String.fromCharCode(val);
	}
	return text
}



const dataParsers =
{
	"b": DataView.prototype.getInt8,
	"B": DataView.prototype.getUint8,
	"h": DataView.prototype.getInt16,
	"H": DataView.prototype.getUint16,
	"i": DataView.prototype.getInt32,
	"I": DataView.prototype.getUint32,
	"f": DataView.prototype.getFloat32,
	"s": parseCString,
}

const dataSizes =
{
	"b": 1,
	"B": 1,
	"h": 2,
	"H": 2,
	"i": 4,
	"I": 4,
	"f": 4,
	"s": 0,
}


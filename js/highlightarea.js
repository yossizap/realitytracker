"use strict";

var highlights = []

const fadePersecond = 1.5

class HighLightArea extends AnimationInstance {
	constructor(x, z) {
		super();
		this.x = x;
		this.z = z;
		this.fade = 1
	}
	onTick(timePassed) {
		
		this.fade = Math.max(this.fade - timePassed * fadePersecond, 0);
	}
	shouldDelete() {
		return this.fade == 0;
    }
	draw(context) {
		const x = XtoCanvas(this.x)
		const y = YtoCanvas(this.z)

		context.save()

		context.globalAlpha = this.fade
		Context.strokeStyle = "red"
		Context.lineWidth = 2

		context.beginPath()
		context.moveTo(x, 0);
		context.lineTo(x, Canvas.height);
		context.stroke();

		context.beginPath()
		context.moveTo(0, y);
		context.lineTo(Canvas.width, y);
		context.stroke();


		context.restore()
    }
}

function highlight(x,z)
{
	new HighLightArea(x, z)
}

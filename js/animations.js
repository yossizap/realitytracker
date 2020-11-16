"use strict";

class AnimationInstance {
	constructor() {
		Animations.addAnimation(this)
	}

	onTick(timePassed) {

	}
	shouldDelete() {
		return true;
    }
	draw(context) {

	}
	onDelete() {
		
	}
}

var Animations = {

	addAnimation: function (animation) {
		Animations.animations.push(animation);
    },

    animations: [],

    reset: function () {
		Animations.animations = [];
    },

    animationsPlaying: function () {
		return Animations.animations.length > 0;
    },

	lastUpdate: new Date().getTime(),
	update: function () {
		const newTime = new Date().getTime() 
		const time = (newTime - Animations.lastUpdate) / 1000.0;
		for (var i = 0; i < Animations.animations.length; i++) {
			const anim = Animations.animations[i];
			if (anim.shouldDelete()) {
				anim.onDelete();
				Animations.animations.splice(i, 1);
				i--;
				continue;
			}

			anim.onTick(time);
		}
		Animations.lastUpdate = newTime;


		// if canvas is not redrawing but we have animations playing, force redraw
		if (!isPlaying() && Animations.animationsPlaying())
			drawCanvas()
	},

	draw: function (context) {
		for (const anim of Animations.animations)
			anim.draw(context);
    }

}
$(() => Animations.redrawTimer = setInterval(Animations.update, frameTime));

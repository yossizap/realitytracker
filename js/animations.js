"use strict";

class AnimationInstance {
	constructor() {
		animations.addAnimation(this)
		requestUpdate();
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

var animations = {

	addAnimation: function (animation) {
		animations.animations.push(animation);
    },

    animations: [],

    reset: function () {
		Animations.animations = [];
    },

    animationsPlaying: function () {
		return animations.animations.length > 0;
    },

	update: function (time) {
		for (var i = 0; i < animations.animations.length; i++) {
			const anim = animations.animations[i];
			if (anim.shouldDelete()) {
				anim.onDelete();
				animations.animations.splice(i, 1);
				i--;
				continue;
			}

			anim.onTick(time);
		}
	},

	draw: function (context) {
		for (const anim of animations.animations)
			anim.draw(context);
    }

}

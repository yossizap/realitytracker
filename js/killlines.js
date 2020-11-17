// Kill Lines

//TODO make the line point to target
//TODO make the line different if its a bleed-out (weapon = "Killed")

var killLines = []

const FadeAmountPerTick = 0.025
const FadeTicks = 40

var SelectedKill = SELECTED_NOTHING


function killLine_Add(kill)
{
	killLines.push(kill)
}

function killLine_RemoveOld()
{
	killLines = killLines.filter(killLine_ShouldKeep)
}

// used to filter the array of killlines
function killLine_ShouldKeep(Kill)
{
	// keep if:
	//	-we're after the kill's tick
	//	-it hasn't been FadeTicks ticks yet since the kill.
	return (((Tick_Current - Kill.tick) <= FadeTicks) && (Tick_Current >= Kill.tick))
}

function killLine_Draw(Kill)
{
	Context.save()

	const Atk = AllPlayers[Kill.AttackerID]
	const Vic = AllPlayers[Kill.VictimID]

	if (Atk == null || Vic == null)
		return

	var Fade = 1 - (Tick_Current - Kill.tick) * FadeAmountPerTick
	Context.globalAlpha = Math.max(Fade, 0)


	var x1 = Atk.getCanvasX()
	var y1 = Atk.getCanvasY()
	var x2 = Vic.getCanvasX()
	var y2 = Vic.getCanvasY()
	drawArrow(x1, x2, y1, y2, Atk.team, Atk.squad)


	Context.restore()
}

// Draws from a "kill" object (using the global var SelectedKill), no fade
function killLine_DrawSelected()
{
	Context.lineWidth = 5;
	Context.beginPath()
	var kill = eventArrays.kills.events[SelectedKill]
	if (kill == null)
		return

	var Atk = AllPlayers[kill.Attacker]
	var x1 = XtoCanvas(kill.AttackerX)
	var y1 = YtoCanvas(kill.AttackerY)
	var x2 = XtoCanvas(kill.VictimX)
	var y2 = YtoCanvas(kill.VictimY)

	drawArrow(x1, x2, y1, y2, kill.AttackerTeam, kill.AttackerSquad)
}



function drawArrow(x1, x2, y1, y2, Team, Squad)
{
	Context.beginPath()
	
	const xdirection = x2 - x1
	const ydirection = y2 - y1
	const size = Math.sqrt(xdirection * xdirection + ydirection * ydirection)
	
	const xnorm = xdirection / size
	const ynorm = ydirection / size
	
	const xbefore = x2 - xnorm * 25
	const ybefore = y2 - ynorm * 25

	const styleouter = getStyle(Team, Squad);
	const styleinner = (Team == 1) ? Style_RedTeam : Style_BlueTeam;

	Context.moveTo(x1, y1);
	Context.lineTo(xbefore, ybefore);
	
	Context.strokeStyle = styleouter
	Context.lineWidth = 6;
	Context.stroke()
	
	Context.strokeStyle = styleinner
	Context.lineWidth = 2;
	Context.stroke()
	
	
	const cos = Math.cos(Math.PI / 18) 
	const sin = Math.sin(Math.PI / 18)
	const xnormScaled = xnorm * 25
	const ynormScaled = ynorm * 25
	
	const trianglex1 = x2 - (cos * xnormScaled + sin * ynormScaled)
	const triangley1 = y2 - (-sin * xnormScaled + cos * ynormScaled)
	const trianglex2 = x2 - (cos * xnormScaled + -sin * ynormScaled)
	const triangley2 = y2 - (sin * xnormScaled + cos * ynormScaled)
	
	Context.beginPath()
	Context.moveTo(x2, y2);
	Context.lineTo(trianglex1, triangley1);
	Context.lineTo(trianglex2, triangley2);
	Context.closePath()

	Context.fillStyle = styleinner
	Context.fill()

}
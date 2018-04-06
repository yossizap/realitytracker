# Reality Tracker
This project provides an easy way to view game recordings created by the realitytracker.py script. The goal is to provide as much data as possible to analyse matches for learning and administration without launching the game to use DICE's Battlerecoder.

It was originally a [C# project](https://www.youtube.com/watch?v=IqPZUMPv2ss&feature=youtu.be&t=447) that automatically uploaded server recordings to youtube but it was decided to make it a portable web application.

### See realitytracker in action
You can play a live match from the project reality tournament [here](https://tournament.realitymod.com/prt_mods/tracker/?demo=files/c13_b9.PRdemo#185). For more you can visit public server's websites or PRT's [replay archive](https://tournament.realitymod.com/showthread.php?p=375923).

### Usage
- Clone the tracker or use the [github pages](https://yossizap.github.io/realitytracker/) hosted master branch version
- Load one of the example .PRdemo files from `examples/`
- Click the stack icon on the right to toggle options
- Click on the running man in the play bar to set the speed
- Press 1-9 to select blufor squads and SHIFT+1-9 for opfor
- Click on vehicles/players icons for more information
- You can select an entire squad by clicking on it's name
- Squad leaders have a white circle around them
- Click on the `menus` button to open misc menus

### Features
- Recording rewind and speed slider
- Interactive map
- Toggleable display options
- Squad coloring
- Bookmark interface
- Player and asset FOV marking
- Player and vehicle kill feed menus
- 60FPS support
- Draggable and toggleable menus
- Ticket and time count
- Live kill indication
- Command markers
- Accessible parse file format - can be used by any application from statistics to displaying the match in a rotating heightmap

### TODO
- Networking for real time match streaming
- Administration interface for streamed matches
- UI and UX upgrades
- Better documentation
- Add any data that can be extracted from the game that is useful for the viewer

### Tracker JSON format
TODO. For now see [js/parser.js](https://github.com/yossizap/realitytracker/blob/master/js/parser.js) and [js/protocol.js](https://github.com/yossizap/realitytracker/blob/master/js/protocol.js)

### Repository structure
- `Maps/` - Map images taken from the game's files
- `Graphics/UI/` - Custom icons
- `examples/` - .PRdemo files for testing
- `js/` - Project sources
- `atlas.png` - In game asset, flag and marker icons
- `data.json` - Generated JSON of kit, vehicle and atlas data

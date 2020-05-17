[Click for Example](https://yossizap.github.io/realitytracker/?demo=examples/tracker_2018_04_05_20_49_09_black_gold_gpm_cq_64.PRdemo)


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

### Tracker protocol
See [this spreadsheet](https://docs.google.com/spreadsheets/d/1ArciEg1rkG_MHzSYWphje1s071a6kD2ojuD58nVmwAE/edit#gid=0) for the full protocol documentation. The protocol uses a very minimal implementation because the server side code has to run in the game's mainloop and it's intended to work over bad network.

In each configured game tick interval the tracker sends a single packet/writes to the .PRdemo file with different types of updates. The parser parses the headers of each update and then it's content based on the 'message type' opcodes. Each 'message' is internally cached. For example, if the parser finds MESSAGETYPE_PLAYER_UPDATE(0x10) it will start parsing the following strucutre(you can find it in the PLAYER_UPDATE sheet)

| Description                                | Type                    | Length          |
|--------------------------------------------|-------------------------|-----------------|
| Update flags                               | PlayerUpdate Flags Enum | 2               |
| Player ID                                  | Unsigned Byte           | 1               |
| Team                                       | Byte                    | 1               |
| Squad / isSquadLeader                      | Byte                    | 1               |
| VehicleID                                  | int16                   | 2               |
| Vehicle Seat Name                          | String                  | Null terminated |
| Vehicle Seat number (Only [0-2] )          | Byte                    | 1               |
| Health                                     | Byte                    | 1               |
| Score                                      | int16                   | 2               |
| Teamwork Score                             | int16                   | 2               |
| Kills                                      | int16                   | 2               |
| Deaths                                     | int16                   | 2               |
| Ping                                       | int16                   | 2               |
| isAlive                                    | bool                    | 1               |
| isJoining (True until player first spawns) | bool                    | 1               |
| Position X,Y,Z                             | 3x int16                | 6               |
| Yaw rotation in Degrees [-179,180]         | int16                   | 2               |
| Kit name                                   | String                  | Null terminated |

The update flags uses an enum with bitmasks to mark which fields changed so the parser will only look for those. In addition to that only players that had changes in cached fields will have their updates sent in the first place. 

The relevant code is in [js/parser.js](https://github.com/yossizap/realitytracker/blob/master/js/parser.js) and [js/protocol.js](https://github.com/yossizap/realitytracker/blob/master/js/protocol.js). For the server's side see realitytracker.py.

### Repository structure
- `Maps/` - Map images taken from the game's files
- `Graphics/UI/` - Custom icons
- `examples/` - .PRdemo files for testing
- `js/` - Project sources
- `atlas.png` - In game asset, flag and marker icons
- `data.json` - Generated JSON of kit, vehicle and atlas data

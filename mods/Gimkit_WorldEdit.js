/**
* @name Gimkit WorldEdit
* @description A mod designed to make building in GKC easier!
* @author Blackhole927
* @downloadUrl https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/mods/Gimkit_WorldEdit.js
* @needsLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
* @needsLib MobxUtils | https://raw.githubusercontent.com/TheLazySquid/Gimloader/main/libraries/MobxUtils.js

* @version 0.0.6
*/

let mobx = GL.lib("MobxUtils");
let CommandLine = GL.lib("CommandLine")
let err;

/*

CommandLine.addCommand(
    "tcollision",
    [],
    () => {
        window.stores.network.room.send("TOGGLE_PHASE", {enabled: !window.stores.me.phase})
    }
)
*/

GL.addEventListener("loadEnd", () => {
    // placeDevice function and deviceOptions
    function nanoID() {
        let charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
        let nanoID = ""
        for (let i=0;i<21;i++) {
            nanoID += charset[Math.round(Math.random()*(charset.length-1))]
        }
        return nanoID;
    }

    function placeDevice(deviceId, x, y, depth, id = "") {
        let data = {
            id: id != "" ? id : nanoID(),
            deviceTypeId: deviceId,
            options: JSON.stringify(deviceOptions[deviceId]),
            x: x,
            y: y,
            depth: depth
        }
        window.stores.network.room.send("PLACE_DEVICE", data)
    }
    function resetDeviceOptions() {
        for (let device of Array.from(window.stores.worldOptions.deviceOptions)) {
            let data = Array.from(device.optionSchema.options)
            let newData = {}
            for (let option of data) {
                newData[option.key] = option.option.defaultValue
            }
            deviceOptions[device.id] = newData
        }
    }
    let deviceOptions = {}
    resetDeviceOptions()

    //see all of the messages the client sends
    const sendMessage = window.stores.network.room.send.bind(window.stores.network.room)
    window.stores.network.room.send = (t, n) => {
        onMessage(t,n)
        sendMessage(t,n)
    }

    let copiedDeviceChunk = []
    let mainCopiedDeviceID = ""
    let selection = []
    let IDMAP = {}
    let wires = []

    function onMessage(t,n) {
        if (t == "PLACE_DEVICE") {
            if (n.copyingFromExistingDevice != undefined) {
                // if the copyingFromExistingDevice ID is different, it must be a new selection we're copying.
                if (n.copyingFromExistingDevice != mainCopiedDeviceID) {
                    copiedDeviceChunk = []
                    mainCopiedDeviceID = n.copyingFromExistingDevice
                    selection = window.stores.phaser.scene.actionManager.multiselect.selectedDevices
                    IDMAP = {}
                    wires = []
                }
    
                // add the device id we just copied to the copied device chunk
                copiedDeviceChunk.push(n.id)
    
                // when we're done copying the selection
                if (selection.length == copiedDeviceChunk.length) {
    
                    // link the old devices with the new ones
                    for (let i=0; i<selection.length; i++) {
                        IDMAP[selection[i].id] = copiedDeviceChunk[i]
                        mainCopiedDeviceID = ""
                    }
    
                    // generate a wire map of the old devices
                    for (let wire of window.stores.phaser.scene.worldManager.wires.wires) {
                        let device1 = wire[0].slice(0, 21)
                        let device2 = wire[0].slice(22, 43)
                    
                        // are both devices in the selection
                        if (Object.keys(IDMAP).includes(device1) && Object.keys(IDMAP).includes(device1)) {
                            // get the wire info
                            wires.push({
                                startDevice:device1,
                                endDevice:device2,
                                startConnection: wire[1].startConnection,
                                endConnection: wire[1].endConnection,
                            })
                        }
                    }
    
                    // place wires
                    for (let wire of wires) {
                        let wireData = {
                            startDevice: IDMAP[wire.startDevice],
                            endDevice: IDMAP[wire.endDevice],
                            startConnection: wire.startConnection,
                            endConnection: wire.endConnection,
                        }
                    
                        setTimeout(()=>{
                            window.stores.network.room.send("PLACE_WIRE", wireData)
                        },100)
                    }
                    
                }
            }
        }
    }

    

    //Channelmap
    /*
    CommandLine.addCommand(
        "/channelmap",
        {},
        () => {
            let channels = {}
            //channel menu
            //build channel map
            for (device of window.stores.phaser.scene.worldManager.devices.allDevices) {
                for (option in device.options) {
                    // Is the device option channel-related
                    isAChannel = false
                    optionName = ""
                    channelName = ""
                    
                    for (o of device.deviceOption.optionSchema.options) {
                        if (o.option.props) {
                            if (o.key == option && o.option.props.category == "channel") {
                                isAChannel = true
                                //find the channel name and option name
                                optionName = o.option.label
                                channelName = device.options[option]
                            }
                        }
                    }

                    if (isAChannel) {
                        if (!Object.keys(channels).includes(channelName)) {channels[channelName] = {}}
                        if (!Object.keys(channels[channelName]).includes(optionName)) {channels[channelName][optionName] = []}
                        channels[channelName][optionName].push(device.id)
                    }
                }
            }

            
        }
    )
    */

    //STACK
    CommandLine.addCommand(
        "/stack",
        [
            {"direction": ["up", "down", "left", "right"]},
            {"amount" : "number"},
            {"spacing" : "number"}
        ],
        (dir, amount, spacing) => {
            try {
                let phaser = window.stores.phaser
                spacing = spacing*64;
                
                //selection
                let selection = phaser.scene.actionManager.multiselect.selectedDevices
                let commandBuffer = phaser.scene.actionManager.multiselect.selectedDevicesOverlay.graphics.commandBuffer
                let selectionMinX = commandBuffer[commandBuffer.length -6]
                let selectionMaxX = commandBuffer[commandBuffer.length -11]
                let selectionMinY= commandBuffer[commandBuffer.length -10]
                let selectionMaxY = commandBuffer[commandBuffer.length -2]
                let selectionWidth = selectionMaxX - selectionMinX
                let selectionHeight = selectionMinY - selectionMaxY

            
                //Get the Coords of each device
                let coords = []
                for (let device of selection) {
                    coords.push([device.x, device.y])
                }
            
                //Paste the devices
                for (let i=0;i<amount;i++) {
                    //Offset device locations
                    for (let j=0;j<selection.length;j++) {
                        if (dir == "right") {
                            coords[j][0] += selectionWidth + spacing
                        }
                        else if (dir == "left") {
                            coords[j][0] -= selectionWidth + spacing
                        }
                        else if (dir == "up") {
                            coords[j][1] += selectionHeight - spacing
                        }
                        else if (dir == "down") {
                            coords[j][1] -= selectionHeight - spacing
                        }
                    }
                    
                    let j = 0;
                    
                    for (let device of selection) {
                        let deviceID = device.deviceOption.id
                        //config options
                        deviceOptions[deviceID] = device.options
                        let deviceDepth = device.layers.depth
            
                        //place device
                        placeDevice(deviceID, coords[j][0], coords[j][1], deviceDepth)
                        j += 1
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
        }
    )

    //ALIGN
    CommandLine.addCommand(
        "align",
        [{"axis" : ["x", "y"]}],
        (axis) => {
            let phaser = window.stores.phaser;
            //selection
            let selection = phaser.scene.actionManager.multiselect.selectedDevices
        
            //Get the Coords of each device
            let coords = []
            for (let device of selection) {
                coords.push([device.x, device.y])
            }
            
            let average = 0
            for (let coord of coords) {
                average += coord[axis == "y" ? 1 : 0]
            }
            average /= coords.length
        
            //set to average
            for (let i=0;i<coords.length;i++) {
                coords[i][axis == "y" ? 1 : 0] = average
            }
        
            //Paste the devices
            let j = 0
            for (let device of selection) {
                let deviceID = device.deviceOption.id
                //config options
                deviceOptions[deviceID] = device.options
                let deviceDepth = device.layers.depth

                //place device
                placeDevice(deviceID, coords[j][0], coords[j][1], deviceDepth, device.id)
                j += 1
            }
        }
    )
    
    //FLIP
    CommandLine.addCommand(
        "flip",
        [{"coordinate" : ["x", "y"]}],
        (coordinate)=>{
            let phaser = window.stores.phaser
            //selection
            let selection = phaser.scene.actionManager.multiselect.selectedDevices
        
            //Get the Coords of each device
            let coords = []
            for (let device of selection) {
                coords.push([device.x, device.y])
            }
        
            //Flip the coords of the devices around the average
            let averageX = 0
            let averageY = 0
            for (let coord of coords) {
                averageX += coord[0]
                averageY += coord[1]
            }
            averageX /= coords.length
            averageY /= coords.length
        
            //Flip each coord across the average
            for (let i=0;i<coords.length;i++) {
                if (coordinate == "x") {
                    coords[i][0] = averageX - (coords[i][0]-averageX)
                }
                else {
                    coords[i][1] = averageY - (coords[i][1]-averageY)
                }
            }
        
            //Paste the devices
            let j = 0
            for (let device of selection) {
                let deviceID = device.deviceOption.id
                //config options
                deviceOptions[deviceID] = device.options
                let deviceDepth = device.layers.depth
        
                //if a prop, flip it
                deviceOptions.prop.FlipX = !deviceOptions.prop.FlipX
                deviceOptions.prop.Angle += coordinate=="y"?180:0
                if (deviceOptions.prop.Angle > 360) {deviceOptions.prop.Angle -= 360}



                //place device
                placeDevice(deviceID, coords[j][0], coords[j][1], deviceDepth, device.id)
                j += 1
            }
        }
    )

    //SCALE
    CommandLine.addCommand(
        "/scale",
        [
            {"by" : ["by", "to"]},
            {"amount" : "number"}
        ],
        (option, amount) => {
            amount = parseFloat(amount)
            //selection
            let phaser = window.stores.phaser
            let selection = phaser.scene.actionManager.multiselect.selectedDevices

            //Get the Coords of each device
            let coords = []
            for (let device of selection) {
                coords.push([device.x, device.y])
            }


            //Paste the devices
            let j = 0
            for (let device of selection) {
                let deviceID = device.deviceOption.id
                //config options
                deviceOptions[deviceID] = device.options
                let deviceDepth = device.layers.depth
                if (option == "by") {
                    deviceOptions.prop.Scale *= amount
                    deviceOptions.barrier.height *= amount
                    deviceOptions.barrier.width *= amount
                    deviceOptions.barrier.radius *= amount
                } else {
                    deviceOptions.prop.Scale = amount
                }

                //place device
                placeDevice(deviceID, coords[j][0], coords[j][1], deviceDepth, device.id)
                j += 1
            }   
        }
    )

    //SPEED
    CommandLine.addCommand(
        "speed",
        [{"speedValue" : "number"}],
        (number) => {
            window.stores.me.movementSpeed = 310*number
        }
    )

    //i (my favorite command)
    // try fixing by checking if nimimumRoleLevel is undefined
    let deviceNames = {}
    for (let device of Array.from(window.stores.worldOptions.deviceOptions)) {
        if (device.minimumRoleLevel == undefined) {//device.minimumRoleLevel != 90 && device.initialMemoryCost > 0) {
            deviceNames[device.name.replaceAll(" ", "_").toLowerCase()] = device.id
        }
    }
    CommandLine.addCommand(
        "/i",
        [{"device name": Object.keys(deviceNames)}],
        (deviceName) => {
            let phaser = window.stores.phaser
            resetDeviceOptions()
            placeDevice(
                deviceNames[deviceName],
                phaser.mainCharacter.body.x,
                phaser.mainCharacter.body.y - 100,
                1000
            )
        }
    )

    /*
    //ATTRIBUTE
    CommandLine.addCommand(
        "/attribute",
        [
            {"attribute" : []},
            {"value" : "string"}
        ],
        (attribute, value) => {
            console.log(attribute);
            console.log(value);
        },
        () => {
            let phaser = window.stores.phaser
            let selection = phaser.scene.actionManager.multiselect.selectedDevices
            let deviceID = selection[0].deviceOption.id
            let canRun = true;
            for (let device of selection) {
                if (device.deviceOption.id != deviceID) {
                    canRun = false;
                }
            }

            let optionsForThisDevice = []
            if (canRun) {
                for (let option of selection[0].deviceOption.optionSchema.options) {
                    optionsForThisDevice.push(option.option.label.replaceAll(" ", "_"))
                }
                console.log(deviceOptions)
            }

            CommandLine.editCommand(
                "/attribute",
                [
                    {"attribute" : optionsForThisDevice},
                    {"value" : "string"}
                ]
            )
        },
        (textValue)=>{
            if (textValue.length > 2) {
                let deviceOptionSelected = textValue.split(" ")[1];
            }
        }
    )
    */

    //SELECTFILTER
    CommandLine.addCommand(
        "/selectfilter",
        [{"device" : Object.keys(deviceNames).concat(["prop"])}],
        (deviceID) => {
            if (deviceID != "prop") {deviceID = deviceNames[deviceID]}
            let filter = deviceID
            let phaser = window.stores.phaser;
            let selection = phaser.scene.actionManager.multiselect.selectedDevices;
            let newSelection = []
            for (let i=0;i<selection.length;i++) {
                if (selection[i].deviceOption.id == filter) {
                    newSelection.push(selection[i])
                }
            }

            phaser.scene.actionManager.multiselect.selectedDevices = newSelection;


            phaser.scene.actionManager.multiselect.updateSelectedDevicesOverlay()
        }
    )

    //ZOOM
    CommandLine.addCommand(
        "/zoom",
        [{"to":"number"}],
        (amount)=> {
            if (amount < 0.3){amount = 0.3}
            if (amount > 4){amount = 4}
            window.stores.phaser.scene.cameras.cameras[0].setZoom(parseFloat(amount))
        }
    )

    //TP
    CommandLine.addCommand(
        "/tp",
        [{"to" : []}],
        (player) => {
            let name = player.replaceAll("_", " ")
            let x = 0
            let y = 0
            for (let character of Array.from(window.stores.phaser.scene.characterManager.characters)) {
                if (character[1].nametag.name == name) {
                    x = character[1].body.x
                    y = character[1].body.y
                }
            }
            // no, this does not work in game lmao
            window.stores.phaser.mainCharacter.physics.setServerPosition({
                teleport: true,
                x: x,
                y: y,
                packet: 1,
                jsonState: {
                    "gravity": 0,
                    "velocity": {
                        "x": 0,
                        "y": 0
                    },
                    "movement": {
                        "direction": "none",
                        "xVelocity": 0,
                        "accelerationTicks": 0
                    },
                    "jump": {
                        "isJumping": false,
                        "jumpsLeft": 1,
                        "jumpCounter": 0,
                        "jumpTicks": 0,
                        "xVelocityAtJumpStart": 0
                    },
                    "forces": [],
                    "grounded": false,
                    "groundedTicks": 0,
                    "lastGroundedAngle": 0
                }
            })
        },
        ()=>{
            let playerNames = [];
            for (let character of Array.from(window.stores.phaser.scene.characterManager.characters)) {
                playerNames.push(character[1].nametag.name.replaceAll(" ", "_"))
            }
            
            CommandLine.editCommand("/tp", [{"to" : playerNames}])
        }
    )
})

//ClickTP
//note
//can't teleport without zoom doing weird things
//figure out how to convert zoom slider to actual zoom
/*
onmousedown = function(e) {
    var xy
    var zoom
    var savedMapStyle
    var savedSpeed
    if (e.shiftKey) {
        xy = window.stores.phaser.scene.inputManager.getMouseWorldXY()

        //have to save the speed, zoom, and mapstyle because they need to be changed for the teleport
        zoom = window.stores.phaser.scene.cameras.cameras[0].zoom
        savedSpeed =  window.stores.me.movementSpeed
        savedMapStyle = window.stores.session.mapStyle
        window.stores.me.movementSpeed = 0
        window.stores.session.mapStyle = "topDown"

        //teleport
        window.stores.phaser.mainCharacter.physics.setServerPosition({
            teleport: true,
            x: xy["x"],
            y: xy["y"],
            packet: 1,
            jsonState: {
                "gravity": 0,
                "velocity": {
                    "x": 0,
                    "y": 0
                },
                "movement": {
                    "direction": "none",
                    "xVelocity": 0,
                    "accelerationTicks": 0
                },
                "jump": {
                    "isJumping": false,
                    "jumpsLeft": 1,
                    "jumpCounter": 0,
                    "jumpTicks": 0,
                    "xVelocityAtJumpStart": 0
                },
                "forces": [],
                "grounded": false,
                "groundedTicks": 0,
                "lastGroundedAngle": 0
            }
        })
        window.stores.me.editing.preferences.cameraZoom = zoom/1.86
        window.stores.me.movementSpeed = savedSpeed
        window.stores.session.mapStyle = savedMapStyle
    }
}
*/

//Bigger Eraser
//CREDIT- TheLazySquid
//he wrote this whole function
mobx.interceptObserver("InjectExample", (str) => str.includes("Eraser Size"), (fn) => {
    let newFn = function() {
        let res = fn.apply(this, arguments);
    
        let children = res?.props?.children?.props?.children?.[2]?.props?.children?.[1]?.props?.children;
        
        if(!children) return res;
        if(!children[0].key === 'remove-tiles-eraser-size-1') return res;
        
        let newEl = GL.React.createElement(children[0].type, { value: 4 }, 4);
        children.push(newEl);
        let newEl2 = GL.React.createElement(children[0].type, { value: 5 }, 5);
        children.push(newEl2);
        
        return res;
    }
  
    return newFn;
})

//Bigger Terrain Placement
mobx.interceptObserver("InjectExample", (str) => str.includes("Brush Size"), (fn) => {
    let newFn = function() {
        let res = fn.apply(this, arguments);
    
        let children = res?.props?.children?.props?.children?.props?.children[0]?.props?.children[1]?.props?.children[1]?.props?.children?.props?.children
        if(!children) return res;
        if(!children[0].key === 'terrain-brush-size-0') return res;

        let newEl = GL.React.createElement(children[0].type, { value: 5 }, 5);
        children.push(newEl);
        
        return res;
    }
  
    return newFn;
})


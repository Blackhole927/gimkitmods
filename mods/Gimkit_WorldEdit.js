/**
* @name Gimkit WorldEdit
* @description A mod designed to make building in GKC a bit easier!
* @author Blackhole927
* @downloadUrl https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/mods/Gimkit_WorldEdit.js
* @needsLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
*/

let CommandLine = GL.lib("CommandLine")
let err;

/*
CommandLine.addCommand(
    "speed",
    [{"speedValue" : "number"}],
    (number) => {
        window.stores.me.movementSpeed = 310*number
    }
)

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
            nanoID += charset[Math.round(Math.random()*charset.length-1)]
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
    let deviceOptions = {}
    for (let device of Array.from(window.stores.worldOptions.deviceOptions)) {
        let data = Array.from(device.optionSchema.options)
        let newData = {}
        for (let option of data) {
            newData[option.key] = option.option.defaultValue
        }
        deviceOptions[device.id] = newData
    }

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
})

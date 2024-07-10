/**
* @name CommandLine
* @description A simple slash-command ui/system inspired by Minecraft.
* @author Blackhole927
* @isLibrary true
* @downloadUrl https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
* @version 0.0.3
*/

let commandlineOpen = false;
let commandlineTrigger = "/";
let commands = {};
let onCommandLineOpenFunctions = {};
let onCommandInputFunctions = {};
let textValue = "/";

let suggestorHighlightVertical = 0
let suggestion;
let i;
let data;
let commandName;
let errors;
let output;
let dontSort;
let command;
let argumentData;
let currentArgument;
let argName;
let currentTyping;
let position;
let currentText;
let item;
let chunks;
let chunk;
let type;
let arg;
let argType;
let option;
let err;
let suggestorScroll = 0;
let trueSuggestorLength = 0;

GL.addEventListener("loadEnd", () => {
    commandlineOpen = false;
    // this solution is actually hilarious vvv
    document.body.style.backgroundColor = "#000";
    let game = document.getElementById("root");
    game.style.transitionDuration = "100ms";
    game.style.transitionProperty = "all";

    // text input
    let textInput = document.createElement("input");
    textInput.style.position = "fixed";
    textInput.style.bottom = "-5rem";
    textInput.style.width = "100%";
    textInput.style.height = "5rem";
    textInput.style.fontSize = "4rem";
    textInput.style.fontFamily = "monospace";
    textInput.style.paddingLeft = "1rem";
    textInput.style.zIndex = 100000000000000;
    textInput.style.backgroundColor = "hsla(0, 100%, 0%, 0.5)";
    textInput.style.color = "#fff";
    textInput.style.outlineWidth = 0;
    textInput.style.borderWidth = 0;
    textInput.style.transitionDuration = "100ms";
    textInput.style.transitionProperty = "all";
    document.body.appendChild(textInput);

    // suggestor
    let suggestor = document.createElement("p");
    suggestor.style.position = "fixed";
    suggestor.style.bottom = "3.4rem";
    suggestor.style.opacity = 0;
    suggestor.style.fontFamily = "monospace";
    suggestor.style.fontSize = "2.5rem";
    suggestor.style.paddingLeft = "1rem";
    suggestor.style.paddingRight = "1rem";
    suggestor.style.zIndex = 100000000000000;
    suggestor.style.backgroundColor = "hsla(0, 100%, 0%, 0.35)";
    suggestor.style.color = "#fff";
    suggestor.style.transitionDuration = "100ms";
    suggestor.style.transitionProperty = "all";
    suggestor.style.userSelect = "none"
    suggestor.innerHTML = "";
    document.body.appendChild(suggestor);

    // suggestor highlight
    let suggestorHighlight = document.createElement("p");
    suggestorHighlight.style.position = "fixed";
    suggestorHighlight.style.bottom = "3.4rem";
    suggestorHighlight.style.opacity = 0;
    suggestorHighlight.style.fontFamily = "monospace";
    suggestorHighlight.style.fontSize = "2.5rem";
    suggestorHighlight.style.paddingLeft = "1rem";
    suggestorHighlight.style.paddingRight = "1rem";
    suggestorHighlight.style.zIndex = 200000000000009;
    suggestorHighlight.style.backgroundColor = "hsla(0, 100%, 0%, 0)";
    suggestorHighlight.style.color = "#fff200";
    suggestorHighlight.style.transitionDuration = "100ms";
    suggestorHighlight.style.transitionProperty = "all";
    suggestorHighlight.style.userSelect = "none"
    document.body.appendChild(suggestorHighlight);

    // suggestor highlight width
    let suggestorWidth = document.createElement("p");
    suggestorWidth.style.position = "fixed";
    suggestorWidth.style.bottom = "-100rem";
    suggestorWidth.style.fontFamily = "monospace";
    suggestorWidth.style.fontSize = "2.5rem";
    suggestorWidth.style.paddingLeft = "1rem";
    suggestorWidth.style.paddingRight = "1rem";
    document.body.appendChild(suggestorWidth);

    //suggestor ghost
    let suggestorGhost = document.createElement("input");
    suggestorGhost.style.pointerEvents = "none"
    suggestorGhost.style.position = "fixed";
    suggestorGhost.style.bottom = 0;
    suggestorGhost.style.opacity = 0;
    suggestorGhost.style.width = "100%";
    suggestorGhost.style.height = "5rem";
    suggestorGhost.style.fontSize = "4rem";
    suggestorGhost.style.fontFamily = "monospace";
    suggestorGhost.style.paddingLeft = "1rem";
    suggestorGhost.style.zIndex = 10;
    suggestorGhost.style.backgroundColor = "hsla(0, 100%, 0%, 0)";
    suggestorGhost.style.color = "#fff";
    suggestorGhost.style.outlineWidth = 0;
    suggestorGhost.style.borderWidth = 0;
    suggestorGhost.style.transitionDuration = "100ms";
    suggestorGhost.style.transitionProperty = "all";
    document.body.appendChild(suggestorGhost);


    // enabling and disabling all the commandline stuff functions
    


    function enableCommandline() {
        game.style.opacity = 0.7;
        suggestor.style.opacity = 1;
        suggestorHighlight.style.opacity = 1;
        suggestorGhost.style.opacity = 1;
        textInput.style.bottom = 0;
        textInput.value = "/";
        textInput.focus();
        window.stores.phaser.scene.inputManager.isListeningForInput = false;
        commandlineOpen = true;
        textValue = "/"
        suggestor.style.color = "#fff";
        suggestorScroll = 0;
    
        // config suggestor
        suggestion = Object.keys(commands).sort()
        suggestorHighlightVertical = 0
        trueSuggestorLength = suggestion.length;
        if (suggestion.length > 5) {suggestion = suggestion.slice(0, 5)}
        for (i=0;i<suggestion.length;i++) {suggestion[i] = suggestion[i].slice(1, suggestion[i.length])}
        suggestor.innerHTML = suggestion.join("<br>")
        suggestor.style.left = "3.2rem"
        suggestorHighlight.style.left = "3.2rem"
        suggestorGhost.value = "/"
    
        if (suggestorHighlightVertical < 0) {suggestorHighlightVertical = 0}
        if (suggestorHighlightVertical > suggestion.length-1) {suggestorHighlightVertical = suggestion.length-1}
        suggestorHighlight.innerHTML = suggestion[0+suggestorHighlightVertical] + "<br>".repeat(suggestion.length-suggestorHighlightVertical)
        if (suggestorHighlight.innerHTML == "undefined") {
            suggestorHighlight.innerHTML = ""
        }
    
        // run onCommandLineOpenFunctions
        for (let f of Object.values(onCommandLineOpenFunctions)) {
            f();
        }
    
        //clear errors
        clearError()
    }
    function disableCommandline() {
        game.style.opacity = 1;
        suggestorGhost.style.opacity = 0;
        suggestorGhost.value = "";
        suggestorHighlight.innerHTML = "";
        suggestorHighlight.style.opacity = 0;
        suggestor.style.opacity = 0;
        textInput.style.bottom = "-5rem";
        window.stores.phaser.scene.inputManager.isListeningForInput = true;
        commandlineOpen = false;
    }

    // open / close
    document.addEventListener('keydown', (event) => {
        if (event.key === commandlineTrigger) {
            setTimeout(enableCommandline,11)
        }
        if (event.key === "Escape") {
            disableCommandline();
        }
    });

    // suggestor scroll detector
    addEventListener("wheel", (event) => {
        if (commandlineOpen) {
            suggestorHighlightVertical += event.deltaY/Math.abs(event.deltaY)
            updateSuggestor(event, true)
        }
    });


    // enter, update suggestor, and disable shortcuts 
    suggestorHighlightVertical = 0
    textInput.addEventListener('keydown', (event) => {
        if (commandlineOpen) {
            if (event.key === "Enter") {
                setTimeout(disableCommandline,30)
                //process command
                data = textInput.value.split(" ");
                commandName = data[0]
                if (errors > 0) {
                    error(suggestor.innerHTML);
                } else {
                    data.shift()
    
                    if (!commands.hasOwnProperty(commandName)) {
                        error("Command does not exist");
                        return;
                    }
                    if (data.length != commands[commandName][0].length) {
                        error("Wrong number of arguments");
                        return;
                    }
                    commands[commandName][1](...data)
                }
            }
        }
        if (event.key === "Escape") {
            disableCommandline();
        }
        if (commandlineOpen == true) {
            if (event.key == "ArrowUp") {
                event.preventDefault();
                suggestorHighlightVertical -= 1
            }
            if (event.key == "ArrowDown") {
                event.preventDefault();
                suggestorHighlightVertical += 1
            }
            //run onCommandInputFunctions
            for (let f of Object.values(onCommandInputFunctions)) {
                f();
            }
        }
        //suggestor tab
        if (commandlineOpen) {
            if (event.key == "Tab") {
                event.preventDefault();
                onSuggestorTab()
            }
        }

        //update suggestor
        if (commandlineOpen) {
            updateSuggestor(event)
            //handle errors
            handleErrors(event)
        }

        // stop gimkit's shortcuts
        if (commandlineOpen) {
            // TYSM SQUID
            event.stopPropagation();
        }
    });
    // handle the suggestor
    function updateSuggestor(event, scrolling=false) {
        try {
            output = [];
            textValue = textInput.value;
            if (!scrolling) {
                if (event.key == "Backspace") {textValue = textInput.value.slice(0, textInput.value.length-1)};
                textValue += (event.key.length == 1 ? event.key : "")
            }
            
            dontSort = false;
    
            if (textValue.split(" ").length - 1 == 0) {
                commandName = textValue.split(" ")[0];
                for (command in commands) {
                    if (command.startsWith(commandName)) {
                        output.push(command.slice(1, command.length));
                    };
                };
            } else {
                argumentData = commands[textValue.split(" ")[0]][0]
                currentArgument = textValue.split(" ").length - 2
    
                argName = Object.keys(argumentData[currentArgument])[0]
                if (Array.isArray(argumentData[currentArgument][argName])) {
                    //autocomplete for custom options
                    currentTyping = textValue.split(" ")[textValue.split(" ").length-1]
                    output = [];
                    for (option of argumentData[currentArgument][argName]) {
                        if (option.startsWith(currentTyping)) {
                            output.push(option);
                        };
                    };
                } else {
                    // zero-width space used between the <> to stop it from becoming an element
                    argName = "\<​" + argumentData[currentArgument][argName].replace("string", "text") + "\>"
                    output = [argName]
                }
    
            }
    
            // suggestor content
            if (dontSort) {suggestion = output}
            else {suggestion = output.sort();}
            trueSuggestorLength = suggestion.length;
            if (suggestion.length > 5) {suggestion = suggestion.slice(0+suggestorScroll, 5+suggestorScroll);};
            suggestor.innerHTML = suggestion.join("<br>");
    
            // position the suggestor stuff
            position = textValue
            position = position.split(" ");
            position.pop();
            position = position.join(" ") + " "
            suggestorWidth.innerHTML = position;
            suggestor.style.left = (suggestorWidth.offsetWidth*0.0625*(4/2.5) + "rem")
            suggestorHighlight.style.left = (suggestorWidth.offsetWidth*0.0625*(4/2.5) + "rem")
            
    
            // suggestor scroll
            if (suggestorHighlightVertical > suggestion.length-1) {
                suggestorHighlightVertical = suggestion.length-1
                if (suggestorScroll < trueSuggestorLength - 5) {
                    suggestorScroll += 1;
                }
            }
    
            if (suggestorHighlightVertical < 0) {
                suggestorHighlightVertical = 0;
                if (suggestorScroll > 0) {
                    suggestorScroll -= 1;
                }
            }
    
            //suggestor content
            if (dontSort) {suggestion = output}
            else {suggestion = output.sort();}
            trueSuggestorLength = suggestion.length;
            if (suggestion.length > 5) {suggestion = suggestion.slice(0+suggestorScroll, 5+suggestorScroll);};
            suggestor.innerHTML = suggestion.join("<br>");
    
    
    
            //update suggestorHighlight
            suggestorHighlight.innerHTML = suggestion[0+suggestorHighlightVertical] + "<br>".repeat(suggestion.length-suggestorHighlightVertical)
            if (suggestorHighlight.innerHTML == "undefined") {
                suggestorHighlight.innerHTML = ""
            }
    
            //update suggestorGhost
            suggestion = suggestion[0+suggestorHighlightVertical]
            currentText = textValue.split(" ")
            if (suggestion.includes("text>") || suggestion.includes("number>") || suggestion.includes("true") || suggestion.includes("false")) {
                if (currentText[currentText.length-1] == "") {
                    suggestion = Object.keys(argumentData[currentArgument])[0]
                } else {
                    suggestion = ""
                }
            }
            currentText[currentText.length-1] = suggestion
            currentText = currentText.join(" ")
            if (currentText[0] != commandlineTrigger) {currentText = commandlineTrigger + currentText}
            suggestorGhost.value = currentText
        } catch {
            //this is to stop errors from occuring when the base command hasn't finished typing yet
        }
    }
    //tab handling for the suggestor
    function onSuggestorTab() {
        item = textValue.split(" ")
        item[item.length-1] = suggestorHighlight.innerHTML.replaceAll("<br>", "")
        if (!(item[item.length-1].includes("text&gt;") || item[item.length-1].includes("number&gt;") || item[item.length-1].includes("bool: &lt;"))) {
            if (item.length == 1) {item[0] = "/" + item[0]}
            textInput.value = item.join(" ")
        }
    }
    // display command errors live
    function handleErrors(event) {
        textValue = textInput.value;
        if (event.key == "Backspace") {textValue = textInput.value.slice(0, textInput.value.length-1)};
        textValue += (event.key.length == 1 ? event.key : "")
        chunks = textValue.split(" ")
        errors = 0

        if (!Object.keys(commands).includes(chunks[0])) {
            if (suggestorHighlight.innerHTML == "") {
                liveError("Error: Command '" + chunks[0] + "' does not exist.")
                errors += 1
            }
        }

        if (Object.keys(commands).length == 0) {
            liveError("Error: No commands exist.")
            errors += 1
        }

        try {
            argumentData = commands[chunks[0]][0]

            if (chunks.length > 1) {
                i = 0
                for (chunk of chunks.slice(1, chunks.length)) {
                    currentArgument = i
                    argName = Object.keys(argumentData[currentArgument])[0]
                    type = argumentData[currentArgument][argName]

                    if (type == "number") {
                        if (isNaN(chunk)) {
                            liveError("Error: '" + chunk + "' is not a number.")
                            errors += 1
                        }
                    }
                    if (Array.isArray(type)) {
                        if (suggestorHighlight.innerHTML == "") {
                            liveError("Error: '" + chunk + "' is not a valid option here.")
                            errors += 1
                        }
                    }
                    i += 1
                }
            }
        } catch {
            //this is just to stop errors from popping up with the /command hasn't been fully typed yet
        }
        try {
            if (chunks.length > argumentData.length + 1) {
                setTimeout(()=>{
                    liveError("Error: Too many arguments.")
                },30)
            }
        } catch {
            //this is just to stop errors from popping up with the /command hasn't been fully typed yet
        }

        if (errors == 0) {
            clearError()
        }
    }
    // displaylive errors
    function liveError(error) {
        if (commandlineOpen) {
            suggestor.style.opacity = 1;
            suggestorGhost.style.opacity = 0;
            suggestorHighlight.style.opacity = 0;
    
            suggestor.style.color = "#ff2424";
            suggestor.innerHTML = error;
        }
    }
    function clearError() {
        suggestor.style.opacity = 1;
        suggestorGhost.style.opacity = 1;
        suggestorHighlight.style.opacity = 1;

        suggestor.style.color = "#fff";
    }

    // display errors
    function error(errorMessage) {
        displayNotification("topRight", "Error", errorMessage, "error", "10")
    }

    
});

//notif function
export function displayNotification(placement, title, description, type, duration) {
    var notif = {
        placement: placement, //topRight, topLeft, bottomRight, bottomLeft
        title:title, //text
        description:description, //text
        type:type, //error, warning, success, info
        duration:duration //in seconds
    }
    window.stores.network.room.onMessageHandlers.events.NOTIFICATION[0](notif)
}

// add a command to the commandline
export function addCommand(commandName, argData, func, onOpenFunction=null, onCommandInput=null) {
    if (commandName[0] != "/") {commandName = "/" + commandName;};

    if (commandName == "/") {
        error("Error adding command. CommandName argumnet cannot be empty.");
        return;
    }

    for (arg of argData) {
        argName = Object.getOwnPropertyNames(arg)[0]
        if (argName == "") {
            error("Error adding command '" + commandName + "'. An argument name canont be empty.");
            return;
        }
        argType = arg[argName]
        if (!["string", "number"].includes(argType)) {
            if (Array.isArray(argType) === "object") {
                error("Error adding command '" + commandName + "'. Invalid Argument Type: " + argType + ". Can only be 'string', 'number', or a list of strings.");
                return;
            }
        }
    }

    if (!typeof(func) == 'function') {
        error("Error adding command '" + commandName + "'. The function argument must be a *function* (I thought this was obvious)");
        return;
    }

    if (typeof(onOpenFunction) == 'function') {
        onCommandLineOpenFunctions[commandName] = onOpenFunction;
    }

    if (typeof(onCommandInput) == 'function') {
        onCommandInputFunctions[commandName] = onCommandInput;
    }

    commands[commandName] = [argData, func];
}

// edit one of the commands that already exists
export function editCommand(commandName, argData=null, func=null, onOpenFunction=null, onCommandInput=null) {
    if (commandName[0] != "/") {commandName = "/" + commandName;};

    //update the arguments if new ones are provided
    if (argData != null) {
        for (arg of argData) {
            argName = Object.getOwnPropertyNames(arg)[0]
            argType = arg[argName]
            if (!["string", "number"].includes(argType)) {
                if (Array.isArray(argType) === "object") {
                    error("Error editing command '" + commandName + "'. Invalid Argument Type: " + argType + ". Can only be 'string', 'number', or a list of strings.");
                    return;
                }
            }
        }

        commands[commandName][0] = argData
    }

    //change function if a new one is provided
    if (func != null) {
        if (!typeof(func) == 'function') {
            error("Error editing command '" + commandName + "'. The function argument must be a *function* (I thought this was obvious)");
            return;
        }
        commands[commandName][1] = func
    }

    if (typeof(onOpenFunction) == 'function') {
        onCommandLineOpenFunctions[commandName] = onOpenFunction;
    }

    if (typeof(onCommandInput) == 'function') {
        onCommandInputFunctions[commandName] = onCommandInput;
    }
}

// remove one of the commands
export function removeCommand(commandName) {
    if (commandName[0] != "/") {commandName = "/" + commandName;};

    delete commands[commandName];
    delete onCommandLineOpenFunctions[commandName];
    delete onCommandInputFunctions[commandName];
}

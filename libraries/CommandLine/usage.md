# CommandLine
CommandLine is a Minecraft-inspired mod that adds a slash command interface into Gimkit.

## Usage
To add CommandLine to your mod, simply add the following to your plugin headers:

`@needsLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js`

After you've done this, you'll be able use the following functinons to add, edit, and remove commands.

## CommandLine.addCommand(name, args, func)
This commmand adds a command to the interface for the user to use. It takes three arguments, name, arg, and func.

### Name
Name is the name of the command. For example, `"/test"`.

### Args
Args are the arguments that the user can specify when using the command. Args are provided as a list of dictionaries. Each dictionary contains only one entry. The key is the name of the argument, and the value is the type.

The three types supported are strings, numbers, and multiple choice. For specifying string and number, simply type `"string"` or `"number"`. For multiple choice, just provide a list of the choices. Examples:

```js
[
  // an argument named word, of type string
  {"word" : "string"},

  // an argument named amount, of type number
  {"amount" : "number"},

  // an multiple choice argumnet named color, with options red, green, and blue.
  {"color" : ["red", "green", "blue"]}
]
```

### Func
Func is a function that is ran when the user runs the command. Any arguments specified in the Args input will be passed to this function, so the function needs to have as many parameters as there are arguments. Continuing with the example shown for the Args parameter, here is an example:
```js
function myFunction(word, amount, color) {
  console.log("Your word was " + word);
  console.log("Your number was" + number);
  console.log("Your color was" + color);
}
```

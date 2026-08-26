# Component

The components are the bricks of the botSystem project.  
They are the interface to use the different botSystem service.

In concrete terms, it is a abstract class to extend, with the needed properties to interact with the botSystem.

## Usage

To begin a new component, declare a class extend to `Component` with a `export default`:
```ts
import { Component } from "bot-system";

export default class MyComponent extends Component {

}
```

To launch the component, indicate in the bot configuration component list its name and its file path:
```json
  "components": {
    "distDir": "./dist/",
    "confPath": "./config/bot-components/",
    "componentList": [
      {
        "name": "MyComponent",
        "path": "component-dir/my-component"
      }
	]
  }
```
It is the `ComponentManager` from the botSystem which load and initiate your component.

Your component is created with its name indicated in the configuration file, as the first parameter in its constructor call: `new MyComponent(componentConf.name)`  
Thus, for a specific use, a same component class can be indicated several time in the configuration file, to initiate several component from the same class.

## Component configuration

Each component can have a configuration file to initiate some component parameter at boot.  
At boot, `ComponentManager` from boSystem initiate the component and try automatically to read its configuration file.

The configuration file have to be stored in the path indicated by the `confPath` in the bot configuration file.
The configuration file have to be named with the component name, indicated in bot configuration file, follow by `-conf.json`.  
For example, with the previous component, the component configuration file is `my-component-conf.json`, and the project organization will be:
```
|-config
    |-bot-conf
    |-bot-components
        |-my-component-conf.json
|-dist
    |-component-dir/my-component.js
|-src
    |-component-dir/my-component.ts
```

Each component have default configuration parameter from `ComponentConf`:
| parameter name  | type   | description                                              | default value |
| -----------------| --------| ----------------------------------------------------------| ---------------|
| logLevel        | number | log level (Error=1 ; Warning=2 ; Info=3 ; Verbose=4)     | 3 (Info)      |
| savePathFile    | string | path to the component save file, from the save directory | ""            |
| saveFileVersion | string | version of the component save file                       | ""            |

You can add every configuration parameter you need.

```json
{
  "logLevel": 3,
  "nbMsgLimit": 16
}
```


## Component class declaration

```ts
abstract class Component {
	readonly name: string;
	readonly description: string;
	/** component configuration */
	conf: ComponentConf;
	/** property to indicate the log level of the component */
	propLogLevel: Prop<LogLevel>;
	/** list of the component's extension */
	extensionList: Array<Extension<Component>>;

	/** Interface to add or get form the others components */
	mthInterface: MethodInterface;
	/** Interface to add property or get property from other component */
	propInterface: PropInterface;
	/** Interface to subscribe to a event, or add a 'wake up on date' event */
	eventInterface: EventInterface;
	/** Interface to add text command or slash command */
	cmdInterface: CommandInterface;
	/** Interface to create modal or message component */
	commInterface: CommInterface;
	/** Interface to load and save the component save file */
	protected saveInterface: SaveInterface;

	/**
	 * Create the component with default conf
	 * @param name Component name
	 */
	constructor(name: string, description: string);


	/** Indicate default value for the component configuration
	 * @param defaultConf default configuration for the component
	 */
	defaultConf<Conf extends ComponentConf>(defaultConf: Conf): void;

	/** Component boot
	 * Bot api may be not connected
	 * Sub the BootConnectedEvent, for a boot after api connection
	*/
	boot(): void;

	/** log a message */
	log(logLevel: LogLevel, txt: string): void;
	logError(txt: string): void;
	logWarning(txt: string): void;
	logInfo(txt: string): void;
	logDebug(txt: string): void;
}
```

For more details about the 6 interfaces check the documentation.

## Example

```ts
import { Component, ComponentConf } from "bot-system";

interface MyComponentConf extends ComponentConf {
    nbMsgLimit: number
}

export default class MyComponent extends Component {
    declare conf:  BotLanguageConf
    
    constructor(componentName: string) {
        super(componentName, "my fist component");

        // default value, if the configuration file does not exist
        // or if some parameter are not indicate int he file
        this.defaultConf<MyComponentConf>({
            nbMsgLimit: 8
        });

        /** Continue to initiate the component, with the interfaces */
	}
}
```


# Extension

The extensions are associated to one component, to complete or add features to the component.  
Thus, the features can by easily split in different of your project, and can be added or removed from the configuration.

An extension depends to its component, but a component should be work without extension.

For example extension can be use: 
- with a tcg component where each extension is a new collection
- to connect the component to an other one
- to add an option to a command


## Usage

To begin a new extension, declare a class extend to `Extension` with a template to the target component class and with a `export default`:
```ts
import { Component } from "bot-system";
import MyComponent from "./my-component";

export default class MyExtension extends Extension<MyComponent> {

}
```

To associate the extension to its component and load it, indicate in the component extension list in the bot configuration its name and its file path:

```json
  "components": {
    "distDir": "./dist/",
    "confPath": "./config/bot-components/",
    "componentList": [
      {
        "name": "MyComponent",
        "path": "component-dir/my-component",
        "extensionList": [
          {
            "name": "MyExtension",
            "path": "component-dir/my-extension"
          }
		]
      }
	]
  }
```
It is the `ComponentManager` from the botSystem which load and initiate the component with all its extension.

To access to its component, your extension is created with its component target as the first parameter in its constructor call:  
`new MyExtension(myComponent, extensionConf.name)`

## Extension configuration

As the components, the extensions can have configuration parameters.  
However, the extensions share their configuration files with their component.

Thus, for our example, the configuration parameters are stored in the `my-component-conf.json` file.

## Component class declaration

Extension class inherits from the same class that the Component class.

```ts
abstract class Extension {
	readonly name: string;
	readonly description: string;
	/** component configuration */
	conf: ComponentConf;
	/** the target component */
	component: ComponentType;
	/** property to indicate the log level of the component */
	propLogLevel: Prop<LogLevel>;

	/** Interface to add or get form the others components */
	mthInterface: MethodInterface;
	/** Interface to add property or get property from other component */
	propInterface: PropInterface;
	/** Interface to subscribe to a event, or add a 'wake up on date' event */
	eventInterface: EventInterface;
	/** Interface to add text command or slash command */
	cmdInterface: CommandInterface;
	/** Interface to create modal or message component */
	commInterface: CommInterface;

	/**
	 * Constructor with the component linked to the extension
	 * @param component the component link to the extension
	 * @param extensionName the extension name
	 * @param description the description of the extension
	 */
	constructor(component: ComponentType, extensionName: string, description: string);

	/** Component boot
	 * Bot api may be not connected
	 * Sub the BootConnectedEvent, for a boot after api connection
	*/
	boot(): void;

	/** log a message */
	log(logLevel: LogLevel, txt: string): void;
	logError(txt: string): void;
	logWarning(txt: string): void;
	logInfo(txt: string): void;
	logDebug(txt: string): void;
}
```

## Example


```ts
import { Component } from "bot-system";
import MyComponent from "./my-component";

export default class MyExtension extends Extension<MyComponent> {

  constructor(component: MyComponent) {
    super(component, "MyExtension", "my first extension");



  }
}
```


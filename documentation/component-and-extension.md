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

To launch the component, indicate in the bot configuration component list, its name and its file path:
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
It the `ComponentManager` from the botSystem which load and initiate your component.

Your component is created with its name indicated in the configuration file, as the first parameter in its constructor call: `new MyComponent(componentConf.name)`  
Thus, for a specific use, a same component class can be indicated several time in the configuration file, to initiate several component from the same class.

## Component configuration

Each component can have a configuration file to initiate some component parameter at boot.  
At boot, `ComponentManager` from boSystem initiate the component and try automatically to read its configuration file.

The configuration file have to be stocked in the path indicated by the `confPath` in the bot configuration file.
The configuration file have to be named with the component name, indicated in bot configuration file, follow by `-conf.json`.  
For example, with the previous component, the component configuration file is `my-component-conf.json`, and the project organisation will be:
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
	/** Interface to subcribe to a event, or add a 'wake up on date' event */
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
	 * Sub the BootConnectedEvent, for a boot after api connexion
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

For more details about the 6 interfaces check the documention.

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

        /** Continue to intiate the component, with the interfaces */
	}
}
```


# Extension

```ts
export declare abstract class Extension<ComponentType extends Component> extends UnitComponent {
	conf: ComponentConf;
	component: ComponentType;
	/**
	 * Constructor with the component linked to the extension
	 * @param component the component link to the extension
	 * @param extensionName the extension name
	 * @param description the description of the extension
	 */
	constructor(component: ComponentType, extensionName: string, description: string);
}
```

# Configuration

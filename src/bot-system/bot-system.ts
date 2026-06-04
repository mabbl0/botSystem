import { BotSystemConf, BotSystemState } from "./bot-system-type";
import { checkDirectory, loadData } from "../tools/file";
import { nowDateStr } from "../tools/date";
import { randInt } from "../tools/random";

import { Unit } from "./component/unit";
import { InterfaceApiManager } from "./interface-api/interface-api-manager";
import { ComponentManager } from "./component/component-manager";
import { CommManager } from "./communication/comm-manager";
import { CommandManager } from "./communication/command/command-manager"
import { UserManager } from "./user/user-manager";
import { EventManager } from "./event/event-manager";
import { PropertyManager } from "./property/property-manager";
import { MethodManager } from "./method/method-manager";

import type { InterfaceAPI } from './interface-api/interface-api-type'
import { Prop } from './property/property'
import { User } from "./user/user";
import { Recycler } from "../tools/collection/recycler";
import { VoiceManager } from "./communication/voice/voice-manager";
import { Message, MessageRecycled } from "./communication/message";
import { InteractionType, InteractionRecycled } from "./communication/interaction";
import { ChannelCore } from "./communication/channel";


export class BotSystem extends Unit {
    #bsConf: BotSystemConf

    /** Proprieties **/
    #instanceId: number
    #instanceName: string // bot name with instance id
    #startDateStr: string // string date of the botSystem start
    #propBotSystemState: Prop<BotSystemState> // indicate the state of the bot system
    #propSaveDirPath: Prop<String> // path to the save directory

    
    /** Bot System Components */
    #interfaceApiManager: InterfaceApiManager
    #componentManager: ComponentManager  // manage the components
    #methodManager: MethodManager
    #propertyManager: PropertyManager
    #commManager: CommManager
    #cmdManager: CommandManager
    #userManager: UserManager
    #eventManager: EventManager
    #voiceManager: VoiceManager

    /**
     * Create and Initiate the Bot System
     * @param bsConfPath path to the bot system configure file
     */
    constructor(bsConfPath: string) {
        super("BotSystem", "BotSystem main");
        this.#bsConf = loadData<BotSystemConf>(bsConfPath);

        // Initiate Bot System properties
        let nowDate = Date.now();
        this.#instanceId = randInt(10) * 1000 + (nowDate - 1000 * Math.floor(nowDate / 1000)); // a random int + the milliseconds of the now date
        this.#instanceName = this.#bsConf.name + "_" + this.#instanceId;
        this.#startDateStr = nowDateStr();

        this.logInfo("****** Start BotSystem Start ******");
        this.#propBotSystemState = new Prop<BotSystemState>("botSystemState", BotSystemState.Start, {readOnly: true});
        this.#propSaveDirPath = new Prop<String>("saveDirPath", this.#bsConf.dataDirPath, {readOnly: true});
        if( !checkDirectory(this.#bsConf.dataDirPath) ){
            this.logInfo('Save directory creating: ' + this.#bsConf.dataDirPath);
        }

        // Create and update the BotSystem Components
        this.#methodManager = new MethodManager( this.#propBotSystemState.getPropAccess() );
        Unit.initUnit( this.#methodManager.addMethod.bind(this.#methodManager), 
            this.#methodManager.getMethod.bind(this.#methodManager),
            this.#methodManager.initNewComponentMth.bind(this.#methodManager)
        );

        // TODO: update in a loop
        this.#propertyManager = new PropertyManager();
        this.updateUnit();
        this.#propertyManager.addProp(this.name, this.#propBotSystemState);
        this.#propertyManager.addProp(this.name, this.#propSaveDirPath);
        this.#propertyManager.updateUnit();
        this.#methodManager.updateUnit();

        this.#cmdManager = new CommandManager();
        this.#propertyManager.cmdInterface.initInterface();
        this.#methodManager.cmdInterface.initInterface();
        
        this.#eventManager = new EventManager(this.#bsConf.event);
        this.#propertyManager.eventInterface.initInterface();
        this.#methodManager.eventInterface.initInterface();
        this.#cmdManager.eventInterface.initInterface();

        this.#commManager = new CommManager(this.#bsConf.communication);
        this.#propertyManager.commInterface.initInterface();
        this.#methodManager.commInterface.initInterface();
        this.#eventManager.commInterface.initInterface();
        this.#commManager.commInterface.initInterface();

        this.#propertyManager.initTxtCommand();

        this.#voiceManager = new VoiceManager(this.#bsConf.dataDirPath);
        this.#userManager = new UserManager(this.#bsConf.users);

        
        // Initiate interface Api Manager
        this.#interfaceApiManager = new InterfaceApiManager();
        this.#interfaceApiManager.msgRecycler = new Recycler<MessageRecycled>(10, MessageRecycled);
        this.#interfaceApiManager.interactRecycler = new Recycler<InteractionRecycled>(10, InteractionRecycled);
        this.#interfaceApiManager.fctBootEvent = this.bootEvent.bind(this);
        this.#interfaceApiManager.fctMessageCreation = this.messageCreationEvent.bind(this);
        this.#interfaceApiManager.fctAddUserEvent = this.addUserEvent.bind(this);
        this.#interfaceApiManager.fctCreateChannelEvent = this.createChannelEvent.bind(this);
        this.#interfaceApiManager.fctInteractionCreation = this.interactionCreationEvent.bind(this);
        this.#interfaceApiManager.fctUserVoiceConnection = this.userVoiceConnectionEvent.bind(this);
        
        // Init recycler with event call 
        this.#commManager.commFunction = {
            beforeSentFct: this.#eventManager.callBeforeSent.bind(this.#eventManager),

            getMentionedUserStr: this.#userManager.getMentionedUser.bind(this.#userManager),
            getMentionedRoleStr: this.#userManager.getMentionedRole.bind(this.#userManager),
            getAllMentionedUserStr: this.#userManager.getAllMentionedUser.bind(this.#userManager),

            commActionApi: this.#commManager.commActionApi.bind(this.#commManager)
        }
        this.#interfaceApiManager.msgRecycler.initItems( (msg: MessageRecycled) => {
            msg.commFunction = this.#commManager.commFunction;
        });
        this.#interfaceApiManager.interactRecycler.initItems( (interact: InteractionRecycled) => {
            interact.commFunction = this.#commManager.commFunction;
        });
        
        this.logInfo("****** Start BotSystem Initialization ******");
        this.#propBotSystemState.value = BotSystemState.Initialization;


        // Create Custom Components
        this.#componentManager = new ComponentManager(this.#bsConf);
        this.#componentManager.addBsComponent(this.#interfaceApiManager);
        this.#componentManager.addBsComponent(this.#eventManager);
        this.#componentManager.addBsComponent(this.#propertyManager);
        this.#componentManager.addBsComponent(this.#cmdManager);
        this.#componentManager.addBsComponent(this.#methodManager);
        this.#componentManager.addBsComponent(this.#userManager);
        this.#componentManager.addBsComponent(this.#commManager);
        this.#componentManager.addBsComponent(this.#voiceManager);

        Unit.resetTmp();

        // Add BotSystem Text Command
        this.#cmdManager.addTxtCmd("disconnect", this.name, "disconnect the bot", this.txtCmdDisconnect.bind(this), { adminOnly: true });
        this.#cmdManager.addTxtCmdNotInRun("connect", this.name, "re-connect the bot", this.txtCmdConnect.bind(this), { adminOnly: true });
        this.#cmdManager.addTxtCmdNotInRun("status", this.name, "indicate the bot status", this.txtCmdStatus.bind(this), { adminOnly: true });
    }


    /**
     * start the bot
     */
    startBot() {
        this.logInfo("****** Start BotSystem Boot ******");
        this.#propBotSystemState.value = BotSystemState.Boot;
        this.#componentManager.boot();
        this.#interfaceApiManager.interfaceApi.startBot();
    }
    
    /**
     * Add and initiate the Bot API interface
     * @param interfaceAPI the interface api
     */
    addInterfaceAPI(interfaceAPI: InterfaceAPI) {
        this.#interfaceApiManager.addInterfaceAPI(interfaceAPI);
        this.#cmdManager.botApiCmdUpdate = interfaceAPI.command.updateBotCommands.bind(interfaceAPI.command);
        this.#userManager.getMentionedUserApi = interfaceAPI.mentioned.getMentionedUser.bind(interfaceAPI.mentioned);
        this.#userManager.getMentionedRoleApi = interfaceAPI.mentioned.getMentionedRole.bind(interfaceAPI.mentioned);
        
        this.#commManager.setCommActionApi( interfaceAPI.adaptComm.commActionApi.bind(interfaceAPI.adaptComm) );
        this.#commManager.newMessageComponentAdapter = interfaceAPI.adaptComm.getMessageComponentAdapterConstructor();
        this.#voiceManager.botVoiceControlApi = interfaceAPI.voiceControl;
    }



    /****** Initiate Events ******/


    /**
     * Initiate Communication after bot connection
     * @internal
     */
    private bootEvent() {
        this.#interfaceApiManager.interfaceApi.command.initCmdMap( this.#cmdManager.cmdMap );
        this.#commManager.initChannels(this.#interfaceApiManager.interfaceApi.chat.getChannels(), this.#commManager.commFunction );
        this.#voiceManager.initVoiceChannels(this.#interfaceApiManager.interfaceApi.chat.getVoiceChannels() );
        this.#userManager.initUsers(this.#interfaceApiManager.interfaceApi.chat.getUsers());
        this.#userManager.initRoles(this.#interfaceApiManager.interfaceApi.chat.getRoles());

        this.initLogInBotChannel( this.#commManager.sendMsgToBotChannel.bind(this.#commManager) );
        this.#componentManager.initLogComponent( this.#commManager.sendMsgToBotChannel.bind(this.#commManager) );

        this.#commManager.sendMsgToBotChannel(`**Bot Start: ${this.#instanceName}** - ${this.#startDateStr}`);
        this.#eventManager.bootConnectedEvent.call();
        this.logInfo("****** Start BotSystem Runtime ******");
        this.#propBotSystemState.value = BotSystemState.Runtime;
    }

    
    /**
     * Event at the message creation
     * @internal
     */
    private messageCreationEvent(message: MessageRecycled) {
        if(message.author == undefined || message.channel == undefined) {
            this.logError('message received without user author or text channel defined');
            message.trash();
            return;
        }

        let isTxtCmd = this.#cmdManager.checkAndExecTxtCmd(message, false);
        if (this.#propBotSystemState.value == BotSystemState.Runtime &&
            !message.author.bot &&
            !isTxtCmd && 
            (!this.#bsConf.modeDev || message.author.admin)) // mode dev to disable other admin interaction
        {
            this.logDebug(`[${message.author.name}]${message.content}`);

            isTxtCmd = this.#cmdManager.checkAndExecTxtCmd(message, true);
            if (!isTxtCmd) { // do not call the message interaction if the message is a text command
                this.#eventManager.msgInteractionEvent.call(message);
            }
        }
        message.trash();
    }


    
    /**
     * Event at user add
     * @internal
     */
    private addUserEvent(user: User){
        this.logInfo(`New User ${user.name} add to the System !!`);
        this.#userManager.addNewUser(user);
        this.#eventManager.addedUserEvent.call(user);
    }

    
    /**
     * Event at channel creation
     * @internal
     */
    private createChannelEvent(channel: ChannelCore){
        this.logInfo(`New Channel ${channel.name} create and add to the System !!`);
        this.#commManager.createNewChannel(channel);
    }

    
    /**
     * Event at user add
     * @internal
     */
    private userVoiceConnectionEvent(user: User){
        if( this.#propBotSystemState.value == BotSystemState.Runtime &&
            !user.bot &&
            (!this.#bsConf.modeDev || user.admin)) 
        {
            this.logDebug('New Voice Connexion');
            this.#eventManager.userVoiceConnectionEvent.call(user);
        }
    }

    /**
     * Event at interaction creation
     * @internal
     */
    private interactionCreationEvent(interaction: InteractionRecycled){
        if(interaction.author == undefined || interaction.channel == undefined) {
            this.logError('interaction received without user author or text channel defined');
            interaction.trash();
            return;
        }

        if(this.#propBotSystemState.value == BotSystemState.Runtime &&
            !interaction.author.bot &&
            (!this.#bsConf.modeDev || interaction.author.admin)) // mode dev to disable other admin interaction
        {
            switch(interaction.type){
                case InteractionType.SlashCmd:
                    this.#cmdManager.execSlashCmd(interaction);
                    break;
                case InteractionType.ContextMenuUser:
                    // TODO: ContextMenu
                    break;
                case InteractionType.ContextMenuMessage:
                    break;
                case InteractionType.MessageComponentInteraction:
                case InteractionType.ModalSubmit:
                    this.#commManager.messageComponentInteraction(interaction);
                    break;
                default:
                    this.logError("interaction type unknow");
            }
        }
    }



    /****** Text Commands ******/

    
    /**
     * desactivate and make in Pause the bot functionality
     * @internal
     */
    private txtCmdDisconnect(msg: Message) {
        if (this.#propBotSystemState.value == BotSystemState.Runtime) {
        this.logInfo("****** Start BotSystem Pause ******");
            this.#propBotSystemState.value = BotSystemState.Pause;
            msg.channel.send(this.#instanceName + ": 😴");
        }
    }
    

    /**
     * re-activate and make in Runtime the bot functionality
     * @internal
     */
    private txtCmdConnect(msg: Message) {
        if (this.#propBotSystemState.value == BotSystemState.Pause) {
            this.logInfo("****** re Start BotSystem Runtime ******");
            this.#propBotSystemState.value = BotSystemState.Runtime;
            msg.channel.send(this.#instanceName + ": 🥱");
        }
    }

    
    /**
     * indicate the the Bot System satus
     * @internal
     */
    private txtCmdStatus(msg: Message) {
        msg.channel.send(`**${this.#instanceName}** - ${this.#startDateStr}: ${this.toStringState()}`);
    }

    
    /**
     * return actual BotSystem status in string
     * @internal
     */
    private toStringState(): string {
        switch (this.#propBotSystemState.value) {
            case BotSystemState.Start:
                return "Start";
            case BotSystemState.Initialization:
                return "Initialization";
            case BotSystemState.Boot:
                return "Boot";
            case BotSystemState.Runtime:
                return "Runtime";
            case BotSystemState.Pause:
                return "Pause";
            default:
                return "unknown";
        }
    }
}


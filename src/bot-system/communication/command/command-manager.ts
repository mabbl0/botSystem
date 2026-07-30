import { CommunicationBase} from "../comm-type";
import { UnitComponent } from "../../component/unit-component";
import { TxtCmdOption, SlashCmdOption, MsgContextMenu, UserContextMenu, ContextMenuOption, ApiCmd } from "./command-type";
import { MapName } from "../../../tools/collection/map";
import { SlashCmd, TxtCmd } from "./command-type";
import { InteractionRecycled, Interaction, InteractionArgument, InteractionArgumentType } from "../interaction";
import { Message } from "../message";
import { User } from "../../user/user";

/** @internal */
export class CommandManager extends UnitComponent {
    #txtCmdArray: MapName<TxtCmd>
    #txtCmdNotInRunArray: MapName<TxtCmd>
    #slashCmdArray: MapName<SlashCmd>
    #msgContextMenuArray: MapName<MsgContextMenu>
    #userContextMenuArray: MapName<UserContextMenu>

    #botApiCmdUpdate: () => void;

    constructor() {
        super("CommandManager", "Manage BotSystem Command");
        this.#txtCmdArray = new MapName<TxtCmd>();
        this.#txtCmdNotInRunArray = new MapName<TxtCmd>();
        this.#slashCmdArray = new MapName<SlashCmd>();
        this.#msgContextMenuArray = new MapName<MsgContextMenu>();
        this.#userContextMenuArray = new MapName<UserContextMenu>();

        this.mthInterface.addMethod("addTxtCmd", this.addTxtCmd.bind(this));
        this.mthInterface.addMethod("addSlashCmd", this.addSlashCommand.bind(this));
        this.mthInterface.addMethod("addMsgContextMenu", this.addMsgContextMenu.bind(this));
        this.mthInterface.addMethod("addUserContextMenu", this.addUserContextMenu.bind(this));

        this.addTxtCmd("updateCmd", this.name, "update the bot commands",
            this.updateBotApiCommands.bind(this), { adminOnly: true });

        this.addTxtCmd("helpCmd", this.name, "list your available commands",
            this.helpCmd.bind(this));
        this.addSlashCommand("helpCmd", this.name, "list your available commands",
            this.slashHelpCmd.bind(this), [
            {
                name: "search",
                description: "precise search to help",
                type: InteractionArgumentType.String,
                required: false
            }
        ]);

        // update itself interface
        this.cmdInterface.initInterface();
    }

    /*** Text Commands ***/

    /**
     * Add a text command
     * @param txtCmdName name of the text command to add
     * @param ownerName component name which add this txtCmd
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the text command
     */
    addTxtCmd(txtCmdName: string, ownerName: string, description: string, fct: (msg: Message, arg: string) => void, option?: TxtCmdOption) {
        this.logInfo(`${ownerName} add txtCmd: '${txtCmdName}'`);
        this.#txtCmdArray.set(
            new TxtCmd(txtCmdName, ownerName, description, fct, (option != undefined) ? option : {})
        );
    }

    /**
     * Add a text command that can be executed not in running state
     * @param txtCmdName name of the text command to add
     * @param ownerName component name which add this txtCmd
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the text command
     */
    addTxtCmdNotInRun(txtCmdName: string, ownerName: string, description: string, fct: (msg: Message, arg: string) => void, option?: TxtCmdOption) {
        if (option != undefined && option.adminOnly == false) {
            this.logError(`${ownerName} should indicate adminOnly option to add the txtCmd '${txtCmdName}' notInRun`)
            return;
        }

        this.logInfo(`${ownerName} add txtCmd notInRun: '${txtCmdName}'`);
        this.#txtCmdNotInRunArray.set(
            new TxtCmd(txtCmdName, ownerName, description, fct, (option != undefined) ? option : {})
        );
    }

    /**
     * Check if a message received is a text command, and try to execute it
     * @param msg text of the message received
     * @param inRun indicate if the botSystem is in running state
     * @returns indicate if a text command is found and executed
     */
    checkAndExecTxtCmd(msg: Message, inRun: boolean): boolean {
        let txtCmdMatch = msg.content.match(/^!\w{2,}/g);
        if (txtCmdMatch != null && txtCmdMatch.length == 1) { // check txtCmd format: "!cmdName "
            let matchLength = txtCmdMatch[0].length;
            let txtCmdName = txtCmdMatch[0].slice(1, matchLength); // remove '!' and ' '

            let txtCmdFound: TxtCmd;
            if (inRun) {
                txtCmdFound = this.#txtCmdArray.get(txtCmdName);
            }
            else {
                txtCmdFound = this.#txtCmdNotInRunArray.get(txtCmdName);
            }

            // Try to Execute the text Command found
            if (txtCmdFound != undefined) {
                if (txtCmdFound.option.adminOnly && !msg.author.admin) {
                    this.logInfo(`${msg.author.name} try to execute txt admin cmd: '${txtCmdFound.name}'`);
                    return true;
                }

                this.logInfo(`txtCmd executed by ${msg.author.name} for ${txtCmdFound.ownerName}: '${msg.content}'`);
                txtCmdFound.fct(msg, msg.content.slice(matchLength + 1).trim());
                return true;
            }
            else if (inRun) {
                this.logInfo(`txt command detect but not found: '${txtCmdName}'`);
            }
        }
        return false;
    }

    /*** Update Bot Api Commands ***/

    // give all commands: guild, global, slashCmd, contextCmd, ..
    get cmdMap(): ApiCmd {
        return {
            slashCmd: this.#slashCmdArray,
            msgContextMenu: this.#msgContextMenuArray,
            userContextMenu: this.#userContextMenuArray
        };
    }

    set botApiCmdUpdate(fct: () => void) {
        if (this.#botApiCmdUpdate == undefined) { // set once
            this.#botApiCmdUpdate = fct;
        }
    }

    // call the interfaceApi to update the bot slash commands
    updateBotApiCommands() {
        this.logInfo("Update Bot Api Commands");
        this.#botApiCmdUpdate();
        if (this.#botApiCmdUpdate != undefined) {
        }
    }

    /*** Slash Commands ****/

    /**
     * Add a slash command
     * @param slashCmdName name of the slash command to add
     * @param ownerName component name which add this slashCmd
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the slash command
     */
    addSlashCommand(slashCmdName: string, ownerName: string, description: string, fct: (interaction: Interaction) => void, args?: Array<InteractionArgument>, option?: SlashCmdOption) {
        this.logInfo(`${ownerName} add slashCmd: '${slashCmdName}'`);
        this.#slashCmdArray.set(
            new SlashCmd(slashCmdName, ownerName, description, fct, (args != undefined) ? args : [], (option != undefined) ? option : {})
        );
    }

    // find, check, then execute a slash command
    execSlashCmd(interaction: InteractionRecycled) {
        let slashCmdFound = this.#slashCmdArray.get(interaction.name);
        if (!slashCmdFound)
            return;

        if (slashCmdFound.option.adminOnly && !interaction.author.admin) {
            this.logInfo(`${interaction.author.name} try to execute slash admin cmd: '${slashCmdFound.name}'`);
            return;
        }

        this.logInfo(`slashCmd '${slashCmdFound.name}' executed by ${interaction.author.name} for ${slashCmdFound.ownerName}`);
        slashCmdFound.fct(interaction);
    }

    /*** Context Menu ***/

    /**
     * Add a message context menu
     * @param msgConextMenuName name of the message context menu to add
     * @param ownerName component name which add this message context menu
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the message context menu
     */
    addMsgContextMenu(msgConextMenuName: string, ownerName: string, description: string, fct: (interaction: Interaction, message: Message) => void, option?: ContextMenuOption) {
        this.logInfo(`${ownerName} add msgContextMenu: '${msgConextMenuName}'`);
        this.#msgContextMenuArray.set(
            new MsgContextMenu(msgConextMenuName, ownerName, description, fct, (option != undefined) ? option : {})
        );
    }

    // find, check, then execute a message context menu command
    execMsgContextMenu(interaction: InteractionRecycled) {
        let msgConextMenuFound = this.#msgContextMenuArray.get(interaction.name);
        if (!msgConextMenuFound)
            return;

        if (msgConextMenuFound.option.adminOnly && !interaction.author.admin) {
            this.logInfo(`${interaction.author.name} try to execute a msg context menu admin cmd: '${msgConextMenuFound.name}'`);
            return;
        }

        this.logInfo(`msgConextMenu '${msgConextMenuFound.name}' executed by ${interaction.author.name} for ${msgConextMenuFound.ownerName}`);
        msgConextMenuFound.fct(interaction, interaction.choice as Message);
    }

    /**
     * Add a user context menu
     * @param userConextMenuName name of the user context menu to add
     * @param ownerName component name which add this user context menu
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the user context menu
     */
    addUserContextMenu(userConextMenuName: string, ownerName: string, description: string, fct: (interaction: Interaction, user: User) => void, option?: ContextMenuOption) {
        this.logInfo(`${ownerName} add userContextMenu: '${userConextMenuName}'`);
        this.#userContextMenuArray.set(
            new UserContextMenu(userConextMenuName, ownerName, description, fct, (option != undefined) ? option : {})
        );
    }

    // find, check, then execute a user context menu command
    execUserContextMenu(interaction: InteractionRecycled) {
        let userConextMenuFound = this.#userContextMenuArray.get(interaction.name);
        if (!userConextMenuFound)
            return;

        if (userConextMenuFound.option.adminOnly && !interaction.author.admin) {
            this.logInfo(`${interaction.author.name} try to execute a user context menu admin cmd: '${userConextMenuFound.name}'`);
            return;
        }

        this.logInfo(`userConextMenu '${userConextMenuFound.name}' executed by ${interaction.author.name} for ${userConextMenuFound.ownerName}`);
        userConextMenuFound.fct(interaction, interaction.choice as User);
    }


    /*** Help command ***/
    slashHelpCmd(interact: Interaction) {
        this.helpCmd(interact, interact.getArg('search', ''));
    }

    // list available user commands
    helpCmd(comm: CommunicationBase<Message>, researchArg: string) {
        let researchStr = researchArg.trim().toLowerCase();
        let hasAresearch = researchStr.length != 0;
        let introAns = hasAresearch ? `command research for '${researchArg}':\n` : "";
        let userAdmin = comm.author.admin;

        // Search in the Text Command
        let txtCmdAns = "";
        let txtCmdAnsAdmin = "";
        let nbTxtCmd = 0;
        let nbTxtCmdAdmin = 0;
        this.#txtCmdArray.forEach(txtCmd => {
            if (txtCmd.authorized(comm.author) && (!hasAresearch || txtCmd.correspondingToResearch(researchStr)) ) {
                nbTxtCmd += 1;
                if(txtCmd.option.adminOnly) {
                    nbTxtCmdAdmin += 1;
                    txtCmdAnsAdmin += '- ' + txtCmd.toString4Dev() + '\n';
                }
                else {
                    txtCmdAns += '- ' + (userAdmin ? txtCmd.toString4Dev() : txtCmd.toString()) + '\n';
                }
            }
        });
        if (userAdmin) {
            this.#txtCmdNotInRunArray.forEach(txtCmd => {
                if (!hasAresearch || txtCmd.correspondingToResearch(researchStr)) {
                    nbTxtCmd += 1;
                    txtCmdAnsAdmin += '- ' + txtCmd.toString4Dev() + '\n';
                }
            });
        }
        let headerTxtCmd = `## ${nbTxtCmd} Text Commands\n`;
        let subHeaderTxtCmd = `### Admin Text Commands\n`;

        // search in the Slash Command
        let slashCmdAns = "";
        let slashCmdAnsAdmin = "";
        let nbSlashCmd = 0;
        let nbSlashCmdAdmin = 0;
        this.#slashCmdArray.forEach(slashCmd => {
            if (slashCmd.authorized(comm.author) && (!hasAresearch || slashCmd.correspondingToResearch(researchStr)) ) {
                nbSlashCmd += 1;
                if(slashCmd.option.adminOnly) {
                    nbSlashCmdAdmin += 1;
                    slashCmdAnsAdmin += '- ' + slashCmd.toString4Dev() + '\n';
                }
                else {
                    slashCmdAns += '- ' + (userAdmin ? slashCmd.toString4Dev() : slashCmd.toString()) + '\n';
                }
            }
        });
        let headerSlashCmd = `## ${nbSlashCmd} Slash Commands\n`;
        let subHeaderSlashCmd = `### Admin Slash Commands\n`;

        let strReply = "";
        if(nbTxtCmd==0 && nbSlashCmd==0) {
            strReply = "no command found";
        }
        else if(userAdmin) {
            strReply = introAns + 
                (nbTxtCmd==0? '' : headerTxtCmd + txtCmdAns + 
                    (nbTxtCmdAdmin==0? '' : subHeaderTxtCmd + txtCmdAnsAdmin)) +
                (nbSlashCmd==0? '' : headerSlashCmd + slashCmdAns + 
                    (nbSlashCmdAdmin==0? '' : subHeaderSlashCmd + slashCmdAnsAdmin));
        }
        else {
            strReply = introAns + 
                (nbTxtCmd==0? '' : headerTxtCmd + txtCmdAns) + 
                (nbSlashCmd==0? '' : headerSlashCmd + slashCmdAns);
        }
        comm.reply({ content: strReply, 
            option: { ephemeral: true } });
    }
    

    // give command information about an component
    infoComponent(componentName: string): string {
        let strReturn = '';
        let strTxtCmd = '';
        let nbTxtCmd = 0;
        this.#txtCmdArray.forEach(cmd => {
            if(cmd.ownerName == componentName) {
                nbTxtCmd += 1;
                strTxtCmd += '  - ' + cmd.toString() + '\n';
            }
        });
        this.#txtCmdNotInRunArray.forEach(cmd => {
            if(cmd.ownerName == componentName) {
                nbTxtCmd += 1;
                strTxtCmd += '  - ' + cmd.toString() + '\n';
            }
        });
        if(nbTxtCmd!=0) {
            strReturn += `- ${nbTxtCmd} text commands:\n`;
            strReturn += strTxtCmd;
        }
        
        let strSlashCmd = '';
        let nbSlashCmd = 0;
        this.#slashCmdArray.forEach(cmd => {
            if(cmd.ownerName == componentName) {
                nbSlashCmd += 1;
                strSlashCmd += '  - ' + cmd.toString() + '\n';
            }
        });
        if(nbSlashCmd!=0) {
            strReturn += `- ${nbSlashCmd} slash commands:\n`;
            strReturn += strSlashCmd;
        }
        return strReturn;
    }
}
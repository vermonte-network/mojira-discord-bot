import { MessageReaction, User } from 'discord.js';
import BotConfig from '../../BotConfig';
import DiscordEventHandler from '../EventHandler';
import RequestEventHandler from '../request/RequestEventHandler';
import RequestReopenEventHandler from '../request/RequestReopenEventHandler';
import RequestResolveEventHandler from '../request/RequestResolveEventHandler';
import RoleSelectEventHandler from '../roles/RoleSelectEventHandler';
import MojiraBot from '../../MojiraBot';

export default class ReactionAddEventHandler implements DiscordEventHandler<'messageReactionAdd'> {
	public readonly eventName = 'messageReactionAdd';

	private readonly botUserId: string;

	private readonly roleSelectHandler = new RoleSelectEventHandler();
	private readonly requestResolveEventHandler = new RequestResolveEventHandler();
	private readonly requestReopenEventHandler: RequestReopenEventHandler;

	constructor( botUserId: string, internalChannels: Map<string, string> ) {
		this.botUserId = botUserId;

		const requestEventHandler = new RequestEventHandler( internalChannels );
		this.requestReopenEventHandler = new RequestReopenEventHandler( requestEventHandler );
	}

	// This syntax is used to ensure that `this` refers to the `ReactionAddEventHandler` object
	public onEvent = async ( messageReaction: MessageReaction, user: User ): Promise<void> => {
		// Do not react to own reactions
		if ( user.id === this.botUserId ) return;

		if ( messageReaction.partial ) {
			messageReaction = await messageReaction.fetch();
		}

		MojiraBot.logger.debug( `User ${ user.tag } reacted with ${ messageReaction.emoji } to message ${ messageReaction.message.id }` );

		if ( BotConfig.roleGroups.find( g => g.message === messageReaction.message.id ) ) {
			// Handle role selection
			return this.roleSelectHandler.onEvent( messageReaction, user );
		} else if ( BotConfig.request.internalChannels.includes( messageReaction.message.channel.id ) ) {
			// Handle resolving user request
			return this.requestResolveEventHandler.onEvent( messageReaction, user );
		} else if ( BotConfig.request.logChannel.includes( messageReaction.message.channel.id ) ) {
			// Handle reopening a user request
			return this.requestReopenEventHandler.onEvent( messageReaction, user );
		}
	};
}
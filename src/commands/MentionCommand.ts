import { Message, RichEmbed } from 'discord.js';
import BotConfig from '../BotConfig';
import GuildConfig from '../GuildConfig';
import { MentionRegistry } from '../mentions/MentionRegistry';
import Command from './Command';

export default class MentionCommand extends Command {
	public test( messageText: string, config: GuildConfig ): boolean | string[] {
		const ticketRegex = RegExp( `(?:^|[^${ config.escapePrefixes }])${ config.mentionPrefix }(${ this.getTicketPattern() })`, 'g' );

		// replace all issues posted in the form of a link from the search either with a mention or remove them
		if ( config.ignoreUrls || config.mentionPrefix ) {
			messageText = messageText.replace(
				new RegExp( `https?://bugs.mojang.com/browse/(${ this.getTicketPattern() })`, 'g' ),
				config.ignoreUrls ? '' : `${ config.mentionPrefix }$1`
			);
		}

		let ticketMatch: RegExpExecArray;
		const ticketMatches: Set<string> = new Set();

		while ( ( ticketMatch = ticketRegex.exec( messageText ) ) !== null ) {
			ticketMatches.add( ticketMatch[1] );
		}

		return ticketMatches.size ? Array.from( ticketMatches ) : false;
	}

	public async run( message: Message, args: string[], config: GuildConfig ): Promise<boolean> {
		const mention = MentionRegistry.getMention( args );

		let embed: RichEmbed;
		try {
			embed = await mention.getEmbed();
		} catch ( err ) {
			try {
				message.channel.send( err );
			} catch ( err ) {
				Command.logger.log( err );
			}
			return false;
		}

		if ( embed === undefined ) return false;

		embed.setFooter( message.author.tag, message.author.avatarURL )
			.setTimestamp( message.createdAt );

		try {
			await message.channel.send( embed );
		} catch ( err ) {
			Command.logger.error( err );
			return false;
		}

		if ( message.deletable ) {
			const matchesTicketId = message.content.match( new RegExp( `^\\s*${ config.mentionPrefix }${ this.getTicketPattern() }\\s*$` ) );
			const matchesTicketUrl = message.content.match( new RegExp( `^\\s*https?://bugs.mojang.com/browse/${ this.getTicketPattern() }\\s*$` ) );

			if ( matchesTicketId || ( !config.ignoreUrls && matchesTicketUrl ) ) {
				try {
					message.delete();
				} catch ( err ) {
					Command.logger.error( err );
				}
			}
		}

		return true;
	}

	public asString( args: string[] ): string {
		return '[mention] ' + args.join( ', ' );
	}

	private getTicketPattern(): string {
		return `(?:${ BotConfig.projects.join( '|' ) })-\\d+`;
	}
}

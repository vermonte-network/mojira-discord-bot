import { Client, Guild } from 'discord.js';
import GuildConfig from './GuildConfig';
import MojiraBot from './MojiraBot';
import Sqlite3 = require( 'better-sqlite3' );

export interface RoleConfig {
	emoji: string;
	desc: string;
	id: string;
}

export interface FilterFeedConfig {
	jql: string;
	channel: string;
	title: string;
	title_single?: string;
}

export default class BotConfig {
	public static debug: boolean;

	private static token: string;
	public static owner: string;

	public static debugChannel: string;

	// These three settings will be moved over to `GuildConfig` later
	public static rolesChannel: string;
	public static rolesMessage: string;
	public static requestChannels: string[];

	// settings for mention command
	public static ticketUrlsCauseEmbed: boolean;
	public static requiredTicketPrefix: string;
	public static forbiddenTicketPrefix: string;

	public static projects: Array<string>;

	public static roles: RoleConfig[];

	public static filterFeedInterval: number;
	public static filterFeeds: FilterFeedConfig[];

	public static guildConfigs = new Map<string, GuildConfig>();

	public static database: Sqlite3.Database;

	// projects etc
	// wrapper class for settings.json

	public static init( settingsJson: string ): void {
		const settings = JSON.parse( settingsJson );

		if ( !settings ) throw 'Settings could not be parsed';

		if ( !settings.debug ) this.debug = false;
		else this.debug = settings.debug;

		if ( !settings.token ) throw 'Token is not set';
		this.token = settings.token;

		if ( !settings.owner ) throw 'Owner is not set';
		this.owner = settings.owner;

		if ( !settings.home_channel ) throw 'Home channel is not set';
		this.debugChannel = settings.home_channel;

		if ( !settings.roles_channel ) throw 'Roles channel is not set';
		this.rolesChannel = settings.roles_channel;

		if ( !settings.roles_message ) throw 'Roles message is not set';
		this.rolesMessage = settings.roles_message;

		if ( !settings.request_channels ) throw 'Request channels are not set';
		this.requestChannels = settings.request_channels;

		this.ticketUrlsCauseEmbed = !!settings.ticketUrlsCauseEmbed;

		if ( !settings.forbiddenTicketPrefix ) this.forbiddenTicketPrefix = '';
		else this.forbiddenTicketPrefix = settings.forbiddenTicketPrefix;

		if ( !settings.requiredTicketPrefix ) this.requiredTicketPrefix = '';
		else this.requiredTicketPrefix = settings.requiredTicketPrefix;

		if ( !settings.projects ) throw 'Projects are not set';
		this.projects = settings.projects;

		if ( !settings.roles ) throw 'Roles are not set';
		this.roles = settings.roles;

		if ( !settings.filter_feed_interval ) throw 'Filter feed interval is not set';
		this.filterFeedInterval = settings.filter_feed_interval;

		if ( !settings.filter_feeds ) throw 'Filter feeds are not set';
		this.filterFeeds = settings.filter_feeds;

		this.database = new Sqlite3( './db.sqlite' );
		GuildConfig.setup();
	}

	public static getGuildConfig( guild: Guild ): GuildConfig {
		if ( !this.guildConfigs.has( guild.id ) ) {
			console.log( `Creating new config for guild ${ guild.name } (${ guild.id })` );
			this.guildConfigs.set( guild.id, GuildConfig.create( guild ) );
		}

		return this.guildConfigs.get( guild.id );
	}

	public static async login( client: Client ): Promise<boolean> {
		try {
			await client.login( this.token );
		} catch ( err ) {
			MojiraBot.logger.error( err );
			return false;
		}
		return true;
	}
}

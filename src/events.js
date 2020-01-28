/**
 * Handles incoming events, using Slack's Events API. See also send.js, which handles outgoing
 * messages sent back to Slack.
 *
 * @see https://api.slack.com/events-api
 */

'use strict';

const slack = require( './slack' ),
      points = require( './points' ),
      helpers = require( './helpers' ),
      messages = require( './messages' ),
      operations = require( './operations' ),
      leaderboard = require( './leaderboard' );

const camelCase = require( 'lodash.camelcase' );

/**
 * Handles an attempt by a user to 'self plus' themselves, which includes both logging the attempt
 * and letting the user know it wasn't successful.
 *
 * @param {object} user    The ID of the user (Uxxxxxxxx) who tried to self plus.
 * @param {object} channel The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                         private channels - aka groups) that the message was sent from.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel.
 */
const handleSelfPlus = ( user, channel ) => {
  console.log( user + ' tried to alter their own score.' );
  const message = messages.getRandomMessage( operations.operations.SELF, user );
  return slack.sendMessage( message, channel );
};

/**
 * Handles a plus or minus against a user, and then notifies the channel of the new score.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {object} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @param {string} ts        The timestamp of the event message
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const handlePlusMinus = async( item, operation, quantity, channel, userInit, ts ) => {
  console.log( userInit + ' triggered a operation on ' + item );
  const check = await points.checkCanUpdate(userInit, quantity);
  console.log( check);
  if (check)
  {
    console.log( userInit + ' has enough juice' );
   const score = await points.updateScore( item, operation, quantity ),
        operationName = operations.getOperationName( operation ),
        message = messages.getRandomMessage( operationName, item, score[0], score[1] );
        return slack.sendThreadMessage( message, channel, ts );
  }
  else
  {
    console.log( userInit + 'CANNOT UPDATE ' + item );
    return slack.sendMessage( 'No Soup for <@' + userInit + '>!\nSorry but you exceded your :taco: limit, check back tomorrow', channel );
  }
};

/**
 * Handles a taco against a user, and then notifies the channel of the new score.
 *
 * @param {object} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const handleTaco = async(channel ) => {

  return slack.sendMessage( ":taco:!", channel );
};

/**
 * Handles a = against a user, and then notifies the channel of the new score.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {object} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const handlePlusEqual = async( item, operation, channel ) => {
  const scores = await points.getScore( item, operation ),
        operationName = operations.getOperationName( operation ),
        message = messages.getRandomMessage( operationName, item, scores[0], scores[1]);

  return slack.sendMessage( message, channel );
};

/**
 * Resets the temporary scores.
 *
 *  @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const reset = async( event ) => {
  await points.resetTempScores();

  return slack.sendMessage( "TacoCat began another one of it\'s many lives.", event.channel );
};



/**
 * Sends a random thank you message to the requesting channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const sayThankyou = ( event ) => {

  const thankyouMessages = [
    'Don\'t mention it!',
    'You\'re welcome.',
    'Pleasure!',
    'No thank YOU!',
    (
      '++ for taking the time to say thanks!\n...' +
      'just kidding, I can\'t `++` you. But it\'s the thought that counts, right??'
    )
  ];

  const randomKey = Math.floor( Math.random() * thankyouMessages.length ),
        message = '<@' + event.user + '> ' + thankyouMessages[ randomKey ];

  return slack.sendMessage( message, event.channel );

}; // SayThankyou.

/**
 * Sends a help message, explaining the bot's commands, to the requesting channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const sendHelp = ( event ) => {

  const botUserID = helpers.extractUserID( event.text );
  var today = new Date();
  const crypto = require('crypto')
  , shasum = crypto.createHash('sha1');
  shasum.update(event.user + today.getHours() + today.getMinutes() + today.getFullYear() + today.getMonth() + today.getDate());
  const message = (
    'Sure, here\'s what I can do:\n\n' +
    '• *@Someone++*, *@Someone :taco:*, or give multiple tacos *@Someone @SomeoneElse Great job team! :taco: :taco:*\n' +
    // '• `@Someone--`: Subtract points from a user or a thing\n' +
    // '• `@Someone==`: Gets current points from a user or a thing\n' +
    // '• `@Someone##`: Randomly adds or removes 1-5 points from a user or a thing\n' +
    '• *<@' + botUserID + '> leaderboard*: Display the leaderboard for just you\n' +
    // '• `<@' + botUserID + '> leaderboardall {your secret key from help}`: Display the leaderboard for everyone (you need your secret key)\n' +
    '• *<@' + botUserID + '> help*: Display this help message\n\n' +
    // '• `<@' + botUserID + '> helpall`: Display this message for everyone\n\n' +
    'You\'ll need to invite me to a channel before I can recognise ' +
    '*++* and *:taco:* commands in it.\n\n' +
    'If you\'re a developer, you can teach me new things! :awwww_yeah:\n\n  '


  );

  return slack.sendEphemeral( message, event.channel,event.user );

}; // SendHelp.

/**
 * Sends a help message, explaining the bot's commands, to the requesting channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const sendAllHelp = ( event ) => {

  const botUserID = helpers.extractUserID( event.text );
  const message = (
    'Sure, here\'s what I can do:\n\n' +
    '• *@Someone++*, *@Someone :taco:*, or give multiple tacos *@Someone @SomeoneElse Great job team! :taco: :taco:*\n' +
    // '• `@Someone--`: Subtract points from a user or a thing\n' +
    // '• `@Someone==`: Gets current points from a user or a thing\n' +
    // '• `@Someone##`: Randomly adds or removes 1-5 points from a user or a thing\n' +
    '• *<@' + botUserID + '> leaderboard*: Display the leaderboard for just you\n' +
    // '• `<@' + botUserID + '> leaderboardall {your secret key from help}`: Display the leaderboard for everyone (you need your secret key)\n' +
    '• *<@' + botUserID + '> help*: Display this help message\n\n' +
    // '• `<@' + botUserID + '> helpall`: Display this message for everyone\n\n' +
    'You\'ll need to invite me to a channel before I can recognise ' +
    '*++* and *:taco:* commands in it.\n\n' +
    'If you\'re a developer, you can teach me new things! :awwww_yeah:\n\n  '


  );

  return slack.sendMessage( message, event.channel );

}; // SendAllHelp.
const donothing = ( event ) => {

}; // donothing

const handlers = {

  /**
   * Handles standard incoming 'message' events sent from Slack.
   *
   * Assumes basic validation has been done before receiving the event. See handleEvent().
   *
   * @param {object} event  A hash of a validated Slack 'message' event. See the documentation at
   *                        https://api.slack.com/events-api#events_dispatched_as_json and
   *                        https://api.slack.com/events/message for details.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise to send a
   *                        Slack message back to the requesting channel.
   */


      message: ( event ) => {

    // Extract the relevant data from the message text.

    let data = helpers.extractPlusMinusEventData( event.text );

    var result = true;

    for (var i = 0; i < data.length; i++) {
      const { item, quantity, cats } = data[i];

      if ( ! item || ! quantity ) {
        return false;
      }

      // Bail if the user is trying to ++ themselves...
      if ( item === event.user ) {
        handleSelfPlus( event.user, event.channel );
      } else {
        // Otherwise, let's go!
        handlePlusMinus( item, '+', quantity, event.channel, event.user, event.ts );

        if (cats > 0 && event.user == 'ULJ7NNS8H') {
          handlePlusMinus( item, '-', cats, event.channel, event.user, event.ts );
        }
      }

    }

    return result;
  }, // Message event.


  /**
   * Handles standard incoming 'message' events sent from Slack.
   *
   * Assumes basic validation has been done before receiving the event. See handleEvent().
   *
   * @param {object} event  A hash of a validated Slack 'message' event. See the documentation at
   *                        https://api.slack.com/events-api#events_dispatched_as_json and
   *                        https://api.slack.com/events/message for details.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise to send a
   *                        Slack message back to the requesting channel.
   */


      reactionAdded: ( event, request  ) => {
        // Bail if the user is trying to ++ themselves...
        if ( event.item_user != event.user ) {
          // handlePlusMinus( event.item_user, '+', 1, event.item.channel, event.user, event.item.ts );
          return true;
        }

    return false;
  }, // Message event.



  /**
   * Handles 'app_mention' events sent from Slack, primarily by looking for known app commands, and
   * then handing the command off for processing.
   *
   * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
   *                         https://api.slack.com/events-api#events_dispatched_as_json and
   *                         https://api.slack.com/events/app_mention for details.
   * @param {object} request The incoming Express request object for this event.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise - usually
   *                        to send a Slack message back to the requesting channel - which will be
   *                        handled by the command's own handler.
   */
  appMention: ( event, request ) => {

    const appCommandHandlers = {
      leaderboardall: leaderboard.allHandler,
      leaderboard: leaderboard.handler,
      reincarnate:reset,
      helpall: sendAllHelp,
      help: sendHelp,
      thx: sayThankyou,
      thanks: sayThankyou,
      thankyou: sayThankyou,
      '++': handlePlusMinus,
      // '--': handlePlusMinus,
      ':taco:': handlePlusMinus,
      ':cat:': handlePlusMinus,
      // '==': handlePlusEqual
    };

    const validCommands = Object.keys( appCommandHandlers ),
          appCommand = helpers.extractCommand( event.text, validCommands );

    if ( appCommand ) {
      return appCommandHandlers[appCommand]( event, request );
    }

    const defaultMessage = (
      'Sorry, I\'m not quite sure what you\'re asking me. I\'m not very smart - there\'s only a ' +
      'few things I\'ve been trained to do. Send me `help` for more details.'
    );

    return slack.sendEphemeral( defaultMessage, event.channel,event.user );

  } // AppMention event.
}; // Handlers.

/**
 * Determines whether or not incoming events from Slack can be handled by this app, and if so,
 * passes the event off to its handler function.
 *
 * @param {object} event   A hash of a Slack event. See the documentation at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/message for details.
 * @param {object} request The incoming Express request object for this event.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise as returned
 *                        by the event's handler function.
 */
const handleEvent = ( event, request ) => {
  console.log('handleEvent');

  // If the event has no type, something has gone wrong.
  if ( 'undefined' === typeof event.type ) {
    console.warn( 'Event data missing' );
    return false;
  }

  // If the event has a subtype, we don't support it.
  // TODO: We could look at this in the future, in particular, the bot_message subtype, which would
  //       allow us to react to messages sent by other bots. However, we'd have to be careful to
  //       filter appropriately, because otherwise we'll also react to messages from ourself.
  //       Because the 'help' output contains commands in it, that could look interesting!
  if ( 'undefined' !== typeof event.subtype ) {
    console.warn( 'Unsupported event subtype: ' + event.subtype );
    return false;
  }

  let reaction = event.type == 'reaction_added' && event.reaction == 'taco';

  // If there's no text with the event, there's not a lot we can do.
  if (!reaction && ('undefined' === typeof event.text || ! event.text.trim()) ) {
    console.warn( 'Event text missing' );
    return false;
  }


  // Providing we have a handler for the event, let's handle it!
  const eventName = camelCase( event.type );
  if ( handlers[ eventName ] instanceof Function ) {
    console.log( 'Handling event type: ' + event.type);
    return handlers[ eventName ] ( event, request );
  }

  console.warn( 'Invalid event received: ' + event.type );
  return false;

}; // HandleEvent.

module.exports = {
  handleSelfPlus,
  handlePlusMinus,
  reset,
  sayThankyou,
  sendHelp,
  sendAllHelp,
  handlers,
  handleEvent
};

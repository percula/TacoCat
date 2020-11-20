/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const app = require( './src/app' ),
      slack = require( './src/slack' );

const fs = require( 'fs' ),
      mime = require( 'mime' ),
      express = require( 'express' ),
      bodyParser = require( 'body-parser' ),
      slackClient = require( '@slack/client' );

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.PORT || 80; // Let Heroku set the port.
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN;
/* eslint-enable no-process-env, no-magic-numbers */

/**
 * Starts the server and bootstraps the app.
 *
 * @param {object} options Optional. Allows passing in replacements for the default Express server
 *                         module (`express` property) and Slack Web API client module (`slack`
 *                         property).
 * @returns {http.Server} A Node.js http.Server object as returned by Express' listen method. See
 *                        https://expressjs.com/en/4x/api.html#app.listen and
 *                        https://nodejs.org/api/http.html#http_class_http_server for details.
 */
const bootstrap = ( options = {}) => {

  // Allow alternative implementations of both Express and Slack to be passed in.
  const server = options.express || express();
  slack.setSlackClient( options.slack || new slackClient.WebClient( SLACK_OAUTH_ACCESS_TOKEN ) );

  server.use( bodyParser.json() );
  server.enable( 'trust proxy' );
  server.get( '/', app.handleGet );
  server.post( '/', app.handlePost );

  // Static assets.
  server.get( '/assets/*', ( request, response ) => {
    const path = 'src/' + request._parsedUrl.path,
          type = mime.getType( path );

    response.setHeader( 'Content-Type', type );
    response.send( fs.readFileSync( path ) );
  });

  // Additional routes.
  server.get( '/leaderboard', app.handleGet );

  return server.listen( PORT, () => {
    console.log( 'Listening on port ' + PORT + '.' );
  });

}; // Bootstrap.

// If module was called directly, bootstrap now.
if ( require.main === module ) {
  bootstrap();
}

module.exports = bootstrap;

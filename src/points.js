/**
 * All the stuff that handles the giving, taking away, or otherwise querying of points.
 *
 * NOTE: As the functions here pretty much deal exclusively with the database, they generally
 *       aren't unit tested, as that would require anyone who runs the tests to also have a Postgres
 *       server. Instead, the functions in this file are well covered via the integration and
 *       end-to-end tests.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const pg = require( 'pg' );

/* eslint-disable no-process-env */
const DATABASE_URL = process.env.DATABASE_URL,
      DATABASE_USE_SSL = 'false' === process.env.DATABASE_USE_SSL ? false : true;
const MAX_OPS = process.env.MAX_OPS;
/* eslint-enable no-process-env */

const scoresTableName = 'scores',
      postgresPoolConfig = {
        connectionString: DATABASE_URL,
        ssl: DATABASE_USE_SSL
      },userTrackerTableName = 'usertracker'; 



const postgres = new pg.Pool( postgresPoolConfig );

/**
 * Retrieves all scores from the database, ordered from highest to lowest.
 *
 * TODO: Add further smarts to retrieve only a limited number of scores, to avoid having to query
 *       everything. Note that this isn't just LIMIT, because we'll need to apply the limit
 *       separately to both users (/U[A-Z0-9]{8}/) and things (everything else) & return both sets.
 *
 * @return {array} An array of entries, each an object containing 'item' (string) and 'score'
 *                (integer) properties.
 */
const retrieveTopScores = async() => {

  const query = 'SELECT * FROM ' + scoresTableName + ' ORDER BY score DESC';

  const dbClient = await postgres.connect(),
        result = await dbClient.query( query ),
        scores = result.rows;

  await dbClient.release();

  return scores;

};

/**
 * Updates the score of an item in the database. If the item doesn't yet exist, it will be inserted
 * into the database with an assumed initial score of 0.
 *
 * This function also sets up the database if it is not already ready, including creating the
 * scores table and activating the Postgres case-insensitive extension.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @return {int} The item's new score after the update has been applied.
 */
const updateScore = async( item, operation ) => {

  // Connect to the DB, and create a table if it's not yet there.
  // We also set up the citext extension, so that we can easily be case insensitive.
  const dbClient = await postgres.connect();
  await dbClient.query( '\
    CREATE EXTENSION IF NOT EXISTS citext; \
    CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER); \
  ' );

  // Atomically record the action.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  await dbClient.query( '\
    INSERT INTO ' + scoresTableName + ' VALUES (\'' + item + '\', ' + operation + '1) \
    ON CONFLICT (item) DO UPDATE SET score = ' + scoresTableName + '.score ' + operation + ' 1; \
  ' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( '\
    SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\'; \
  ' );

  await dbClient.release();
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

/**
 * Updates the score of an item in the database. If the item doesn't yet exist, it will be inserted
 * into the database with an assumed initial score of 0.
 *
 * This function also sets up the database if it is not already ready, including creating the
 * scores table and activating the Postgres case-insensitive extension.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @return {int} The item's new score after the update has been applied.
 */
const randomScore = async( item, operation ) => {

  // Connect to the DB, and create a table if it's not yet there.
  // We also set up the citext extension, so that we can easily be case insensitive.
  const dbClient = await postgres.connect();
  await dbClient.query( '\
    CREATE EXTENSION IF NOT EXISTS citext; \
    CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER); \
  ' );
  //Set Random Operation
  var ops = ['+', '-', '+', '+'];
  var operation = ops[Math.floor(Math.random() * ops.length)];
  //Set Random int
  var numbers = ['1', '2', '3', '4', '5'];
  var amount = numbers[Math.floor(Math.random() * numbers.length)];
  // Atomically record the action.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  await dbClient.query( '\
    INSERT INTO ' + scoresTableName + ' VALUES (\'' + item + '\', ' + operation + ' ' + amount + ') \
    ON CONFLICT (item) DO UPDATE SET score = ' + scoresTableName + '.score ' + operation + ' ' + amount + ' ; \
  ' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( '\
    SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\'; \
  ' );

  await dbClient.release();
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;
}; // UpdateScore.



const reallyRandomScore = async( item, operation ) => {

  // Connect to the DB, and create a table if it's not yet there.
  // We also set up the citext extension, so that we can easily be case insensitive.
  const dbClient = await postgres.connect();
  await dbClient.query( '\
    CREATE EXTENSION IF NOT EXISTS citext; \
    CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER); \
  ' );
  //Set Random Operation
  var ops = ['+', '-'];
  var operation = ops[Math.floor(Math.random() * ops.length)];
  //Set Random int
  var N = 100;
  var numbers = Array.apply(null, {length: N}).map(Number.call, Number);
  var amount = numbers[Math.floor(Math.random() * numbers.length)];
  // Atomically record the action.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  await dbClient.query( '\
    INSERT INTO ' + scoresTableName + ' VALUES (\'' + item + '\', ' + operation + ' ' + amount + ') \
    ON CONFLICT (item) DO UPDATE SET score = ' + scoresTableName + '.score ' + operation + ' ' + amount + ' ; \
  ' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( '\
    SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\'; \
  ' );

  await dbClient.release();
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.
/**
 * Gets score
 * into the database with an assumed initial score of 0.
 *
 * This function also sets up the database if it is not already ready, including creating the
 * scores table and activating the Postgres case-insensitive extension.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @return {int} The item's new score after the update has been applied.
 */
const getScore = async( item, operation ) => {

  // Connect to the DB, and create a table if it's not yet there.
  // We also set up the citext extension, so that we can easily be case insensitive.
  const dbClient = await postgres.connect();
  await dbClient.query( '\
    CREATE EXTENSION IF NOT EXISTS citext; \
    CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER); \
  ' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( '\
    SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\'; \
  ' );

  await dbClient.release();
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

const checkCanUpdate = async (user) => {

  const dbClient = await postgres.connect();
  
  await dbClient.query( '\
     CREATE EXTENSION IF NOT EXISTS citext; \
   CREATE TABLE IF NOT EXISTS ' + userTrackerTableName + ' (theuser CITEXT PRIMARY KEY, operations INTEGER, ts INTEGER); \
   ' );

  var dbSelect = await dbClient.query( '\
  SELECT * FROM ' + userTrackerTableName + ' WHERE theuser = \'' + user + '\'; \
' );

if (dbSelect.rows.length < 1) {
  await dbClient.query( '\
  INSERT INTO ' + userTrackerTableName + ' VALUES (\'' + user + '\', 0, ' + (Math.floor(new Date() / 1000) ) + '  ) \
  ON CONFLICT (theuser) DO UPDATE SET operations = 0, ts = ' + (Math.floor(new Date() / 1000) ) + ' ; \
' );
var dbSelect = await dbClient.query( '\
SELECT * FROM ' + userTrackerTableName + ' WHERE theuser = \'' + user + '\'; \
' );
}
  

const userOperations =  dbSelect.rows[0].operations

  const userTS =  dbSelect.rows[0].ts
  
  if ((Math.floor(new Date() / 1000) - userTS) < 3600) {
    if(userOperations >= MAX_OPS ) {
      await dbClient.release();
      return false;
    }
    else {
      await dbClient.query( '\
      INSERT INTO ' + userTrackerTableName + ' VALUES (\'' + user + '\', ' + '+' + '1, ' + userTS + ' ) \
      ON CONFLICT (theuser) DO UPDATE SET operations = ' + (userOperations +1) +'; \
    ' );
    await dbClient.release();
      return true;
    }
  }
  else {
    const test = await dbClient.query( '\
      INSERT INTO ' + userTrackerTableName + ' VALUES (\'' + user + '\', 1, ' + (Math.floor(new Date() / 1000) ) + '  ) \
      ON CONFLICT (theuser) DO UPDATE SET operations = 1, ts = ' + (Math.floor(new Date() / 1000) ) + ' ; \
    ' );
    await dbClient.release();
    return true;

  }
  await dbClient.release();




};

module.exports = {
  retrieveTopScores,
  updateScore,
  randomScore,
  reallyRandomScore,
  getScore,
  checkCanUpdate
};

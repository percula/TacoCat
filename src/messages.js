/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 *
 * @author Julian Calaby <julian.calaby@gmail.com>
 */

'use strict';

const helpers = require( './helpers' ),
      operations = require( './operations' ).operations;

const messages = {};

messages[ operations.PLUS ] = [
  {
    probability: 100,
    set: [
      'Congrats!',
      'Got it!',
      'Bravo.',
      'Nice work!',
      'Well done.',
      'Exquisite.',
      'Lovely.',
      'Superb.',
      'Classic!',
      'Oh well done.',
      'Charming.',
      'Noted.',
      'Well, well!',
      'Well played.',
      'Meow.',
      'Mmmmm...tacos.',
      'Delicious.',
      ':taconyancat:',
      ':businesscat:',
      ':smile_cat:',
      ':dance_pig:',
      ':dance-carrot:',
      ':dance-pickle:',
      ':doge_dance:',
      ':jalapeno_dance_pbj:',
      ':dancing_penguin:',
      ':burrito_dance:',
      ':mario_luigi_dance:',
      ':taco_dance:',
      'Om nom nom',
      'Aw yeah!',
      'Let\'s taco \'bout how awesome you are!',
      'If you don\'t like tacos, I\'m nacho type',
      'Purr-fect!',
      'Purr-ty good!',
      'You\'ve gotta be kitten me!',
      ':smiley_cat:',
      ':heart_eyes_cat:',
      ':cookie: :cookie: COOOOKIES!!! Oh wait, sorry, wrong reference',
      'Was it a car or a cat I saw?',
      'A nut for a jar of tuna',
      'Never odd or even'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.MINUS ] = [
  {
    probability: 100,
    set: [
      'Oh RLY?',
      'Oh, really?',
      'Oh :slightly_frowning_face:.',
      'I see.',
      'Ouch.',
      'Oh là là.',
      'Oh.',
      'Condolences.',
      ':smirk_cat:'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.EQUAL ] = [
  {
    probability: 100,
    set: [
      'How is',
      'Why is'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.SELF ] = [
  {
    probability: 100,
    set: [
      'Hahahahahahaha no.',
      'Nope.',
      'No. Just no.',
      'Not cool!'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.RANDOM ] = [
  {
    probability: 100,
    set: [
      'Hahahahahahaha no.',
      'Nope.',
      'No. Just no.',
      'Not cool!'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];
messages[ operations.REALLYRANDOM ] = [
  {
    probability: 100,
    set: [
      'Hahahahahahaha no.',
      'Nope.',
      'No. Just no.',
      'Not cool!'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];
/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string}  operation The name of the operation to retrieve potential messages for.
 *                            See operations.js.
 * @param {string}  item      The subject of the message, eg. 'U12345678' or 'SomeRandomThing'.
 * @param {integer} score     The item's current score. Defaults to 0 if not supplied.
 * @param {integer} tempscore     The item's current score. Defaults to 0 if not supplied.
 *
 * @returns {string} A random message from the chosen pool.
 */
const getRandomMessage = (operation, item, score = 0, tempScore = 0) => {

  const messageSets = messages[operation];
  let format = '';

  switch (operation) {
    case operations.MINUS:
    case operations.PLUS:
      format = '<message> *<item>* has <tempScore> :taco:<plural>. (<score> total)';
      break;

    case operations.SELF:
      format = '<item> <message>';
      break;

    case operations.EQUAL:
      format = '<message> *<item>* currently at <score> :taco:<plural>.';
      break;

    default:
      throw Error('Invalid operation: ' + operation);
  }

  let totalProbability = 0;
  for (const set of messageSets) {
    totalProbability += set.probability;
  }

  let chosenSet = null,
    setRandom = Math.floor(Math.random() * totalProbability);

  for (const set of messageSets) {
    setRandom -= set.probability;

    if (0 > setRandom) {
      chosenSet = set.set;
      break;
    }
  }

  if (null === chosenSet) {
    throw Error(
      'Could not find set for ' + operation + ' (ran out of sets with ' + setRandom + ' remaining)'
    );
  }

  const plural = helpers.isPlural(score) ? 's' : '',
    max = chosenSet.length - 1,
    random = Math.floor(Math.random() * max),
    message = chosenSet[random];

  const formattedMessage = format.replace('<item>', helpers.maybeLinkItem(item))
    .replace('<score>', score)
    .replace('<tempScore>', tempScore)
    .replace('<plural>', plural)
    .replace('<message>', message);

  return formattedMessage;

}; // GetRandomMessage.

module.exports = {
  messages,
  getRandomMessage
};

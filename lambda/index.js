/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

/**
 * This file contains the controller (backend) endpoint function for FIFA Galaxy (Alexa Skill).
 * Returns a response depending upond the intent and the intent slots passed 
 * in the request to the function.
 **/

'use strict';
//const Alexa = require('ask-sdk-v1adapter');
//const {ImageHelper, PlainTextContentHelper, RichTextContentHelper} = require('ask-sdk');
const Alexa = require('ask-sdk-core');
//const cookbook = require('alexa-cookbook.js');
const util = require('util');
const http = require('http');

const {isSlotValid, supportsDisplay, values, concat, random, randomPop} = require('./utils');
const players = require('./players');
const teams = require('./teams');
const leagues = require('./leagues');

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.32f6405b-b9c1-407f-b6be-a6d1ec863a2f';

const SKILL_NAME = 'FIFA Galaxy';
const GET_FACT_MESSAGE = "Here's your fact: ";
const HELP_MESSAGE = "You can say tell me a FIFA fact, or, you can say exit... What can I help you with?";
const HELP_REPROMPT = "What can I help you with?";
const FALLBACK_MESSAGE = [
    "I didn't get that. Can you say it again?",
    "I missed what you said. Can you say it again?",
    "Sorry, could you say that again?",
    "Sorry, can you say that again?",
    "Can you say that again?",
    "Sorry, I didn't get that.",
    "Sorry, what was that?",
    "One more time?",
    "What was that?",
    "Say that again?",
    "I didn't get that.",
    "I missed that.",
    "I didn't understand. Can you try again?",
    "I don't understand what you're saying. You can say things like \"Who is Lionel Messi?\" to get information about him.",
    "I don't get what you're saying. You can say things like \"Tell me something about Real Madrid\" to get interesting facts about Real Madrid.",
];
const FALLBACK_REPROMPT = "What can I help you with?";
const STOP_MESSAGE = "See you next time. Goodbye!";
const REPROMPT = [
    "What can I help you with?", 
    "Do you want to know something else?", 
    "What else can I help you with?", 
    "Anything else, you want to know?"
]

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/data
//=========================================================================================================================================
const PLAYERS = players.Players.reduce((obj, player) => {
                    obj[player.name] = player;
                    return obj;
                }, {});
const TEAMS   = teams.Teams.reduce((obj, team) => {
                    obj[team.name] = team;
                    return obj;
                }, {});
const LEAGUES = leagues.Leagues.reduce((obj, league) => {
                    obj[league.name] = league;
                    return obj;
                }, {});
const FIFA = [
    "In 1986, FIFA banned shirt swapping because they did not want players being barechested on the field.",
    "India qualified for the 1950 World Cup but withdrew when they realised that playing barefoot was against the rules.",
    "Only eight nations have won the World Cup; Brazil, Italy, Germany, Argentina, Uruguay, England, Spain and France.",
    "Russia’s Oleg Slanko holds the record for most individual goals in a single match, netting five goals against Cameroon in 1994.",
    "Lucien Laurent of France scored the first goal in World Cup history on July 13, 1930.",
    "The oldest goal scorer in the World Cup was Roger Milla, who was 42 in 1994 when he scored a goal for Cameroon against Russia.",
    "The highest scoring game in World Cup history was in 1954, when Austria defeated Switzerland 7-5.",
    "Of all countries that have appeared in the World Cup, Indonesia has played the least number of matches – just one in 1938.",
    "Mexico has the most World Cup losses (25), though they do also have 14 wins and 14 draws.",
    "Only 13 teams competed in the first World Cup: Argentina, Belgium, Brazil, Bolivia, Chile, France, Mexico, Paraguay, Peru, Romania, the United States, Uruguay, and Yugoslavia.",
    "Only Brazil has qualified to compete in every World Cup since the tournament began in 1930."
];

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================

const LaunchRequestHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle: function(handler_input) {
        const speech_output = "Hi! Welcome to FIFA Galaxy! What can I do for you?";
        return handler_input.responseBuilder.speak(speech_output)
                                            .reprompt(speech_output)
                                            .getResponse();
    },
};

/**
 * Respond with a fact related to a player/team/league or any random fact 
 * related to FIFA.
 * Slots:-
 *      player: Any football player (OPTIONAL)
 *      team: Any league/national football team (OPTIONAL)
 *      league: Any league related to football (OPTIONAL)
 **/
const FifaFactsIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'FifaFactsIntent';
    },
    handle: function(handler_input) {
        console.log('FIFAFactsIntent');
        var speech_output;
        var player = isSlotValid(handler_input.requestEnvelope.request, 'player');
        var team   = isSlotValid(handler_input.requestEnvelope.request, 'team');
        var league = isSlotValid(handler_input.requestEnvelope.request, 'league');
        var fact;

        if (player) { 
            fact = random(PLAYERS[player]['facts']);
            if (fact) {
                speech_output = "Okay, here's a fact about " + PLAYERS[player]['name'] + ".\n" + fact;
                handler_input.responseBuilder.withStandardCard(player, fact, PLAYERS[player]['image_url']);
            }
            else {
                speech_output = "Sorry! I don't know about " + player + ".";
            }
        }
        else if (team) {
            fact = random(TEAMS[team]['facts']);
            if (fact) {
                speech_output = "Okay, here's a fact about " + TEAMS[team]['name'] + ".\n" + fact;
                handler_input.responseBuilder.withStandardCard(team, fact, TEAMS[team]['logo']);
            }
            else {
                speech_output = "Sorry! I don't know about " + team + ".";
            }
        }
        else if (league) {
            fact = random(LEAGUES[league]['facts']);
            if (fact) {
                speech_output = "Okay, here's a fact about " + LEAGUES[league]['name'] + ".\n" + fact;
                handler_input.responseBuilder.withStandardCard(league, fact, LEAGUES[league]['logo']);
            }
            else {
                speech_output = "Sorry! I don't know about " + league + ".";
            }
        }
        else {
            fact = random(FIFA);
            speech_output = "Okay, here's your fact: " + fact;
            handler_input.responseBuilder.withSimpleCard(SKILL_NAME, fact);
        }
        
        return handler_input.responseBuilder.speak(speech_output)
                                            .reprompt(random(REPROMPT))
                                            .getResponse();
    },
};

/**
 * Respond with a particular team's or a team pair's previous match result 
 * and upcoming match details.
 * Slots:-
 *      home_team: Any league/national football team (REQUIRED)
 *      away_team: Any league/national football team (OPTIONAL)
 **/
const MatchScoreIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'MatchScoreIntent';
    },
    handle: function(handler_input) {
        console.log('MatchScoreIntent');
        var first_team = isSlotValid(handler_input.requestEnvelope.request, 'first_team');
        var second_team = isSlotValid(handler_input.requestEnvelope.request, 'second_team');
        var home_team, away_team;
        // Check if a single team or a pair of team is given 
        if (first_team) {
            return getPreviousUpcomingTeamFixtures(first_team, second_team).then((fixtures) => {
                var previous_fixture = fixtures['previous_fixture'];
                var upcoming_fixture = fixtures['upcoming_fixture'];
                var list_items = [];

                if (!previous_fixture && !upcoming_fixture) {
                    return handler_input.responseBuilder.speak("There are no matches scheduled for the given team currently.")
                                                        .reprompt(random(REPROMPT))
                                                        .getResponse();
                }

                if (previous_fixture) {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    var previous_fixture_date = new Date(previous_fixture['date']);
                    list_items.push({
                        token: "previous_fixture", 
                        image: {
                            sources: [
                                {
                                    url: getLeagueImageUrl(previous_fixture['homeTeamName'], previous_fixture['awayTeamName'], previous_fixture_date), 
                                }
                            ],
                            contentDescription: previous_fixture['homeTeamName'] + " VS " + previous_fixture['awayTeamName'], 
                        }, 
                        textContent: {
                            primaryText: {
                                type: "RichText", 
                                text: "<font size='1'>" + previous_fixture_date.toLocaleString(undefined, {
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                }) + "</font>", 
                            }, 
                            secondaryText: {
                                type: "RichText", 
                                text: "<font size='3'><b>" + home_team + "</b>  " + previous_fixture['result']['goalsHomeTeam'] + "  ⚽  " + 
                                previous_fixture['result']['goalsAwayTeam'] + "  <b>" + away_team + "</b></font>", 
                            }, 
                        }, 
                    });
                }
                if (upcoming_fixture) {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    var upcoming_fixture_date = new Date(upcoming_fixture['date']);
                    list_items.push({
                        token: "upcoming_fixture", 
                        image: {
                            sources: [
                                {
                                    url: getLeagueImageUrl(upcoming_fixture['homeTeamName'], upcoming_fixture['awayTeamName'], upcoming_fixture_date), 
                                }
                            ],
                            contentDescription: upcoming_fixture['homeTeamName'] + "  VS  " + upcoming_fixture['awayTeamName'], 
                        }, 
                        textContent: {
                            primaryText: {
                                type: "RichText", 
                                text: "<font size='1'>" + upcoming_fixture_date.toLocaleString(undefined, {
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: 'numeric', 
                                    hour12: true, 
                                }) + "</font>", 
                            }, 
                            secondaryText: {
                                type: "RichText", 
                                text: "<font size='3'><b>" + home_team + "</b> VS <b>" + away_team + "</b></font>", 
                            }, 
                        }, 
                    });
                }
                
                if (supportsDisplay(handler_input)) {
                    handler_input.responseBuilder.addRenderTemplateDirective({
                        type: "ListTemplate1", 
                        token: "scores_fixtures", 
                        title: "<div align='center'><font size='5'><b>Scores &amp; Fixtures</b></font></div>", 
                        backgroundImage: {
                            sources: [
                                {
                                    url: "https://wallpapercave.com/wp/Xy5Nlwl.jpg", 
                                }
                            ],
                            contentDescription: "Scores & Fixtures", 
                        }, 
                        listItems: list_items, 
                    });
                }
                var current_date = new Date(Date.now());
                if (!upcoming_fixture) {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    handler_input.responseBuilder.withStandardCard(
                        "Scores & Fixtures", 
                        home_team + "  " + previous_fixture['result']['goalsHomeTeam'] + "  ⚽  " + 
                        previous_fixture['result']['goalsAwayTeam'] + "  " + away_team, 
                        getLeagueImageUrl(previous_fixture['homeTeamName'], previous_fixture['awayTeamName'], previous_fixture_date)
                    );
                }
                else if (!previous_fixture) {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    handler_input.responseBuilder.withStandardCard(
                        "Scores & Fixtures", 
                        home_team + "  VS  " + away_team + "\n" + 
                        upcoming_fixture_date.toLocaleString(undefined, {
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: 'numeric', 
                            hour12: true, 
                        }), 
                        getLeagueImageUrl(upcoming_fixture['homeTeamName'], upcoming_fixture['awayTeamName'], upcoming_fixture_date)
                    );
                }
                else if ((current_date - previous_fixture_date) < (upcoming_fixture_date - current_date)) {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(previous_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    handler_input.responseBuilder.withStandardCard(
                        "Scores & Fixtures", 
                        home_team + "  " + previous_fixture['result']['goalsHomeTeam'] + "  ⚽  " + 
                        previous_fixture['result']['goalsAwayTeam'] + "  " + away_team, 
                        getLeagueImageUrl(previous_fixture['homeTeamName'], previous_fixture['awayTeamName'], previous_fixture_date)
                    );
                }
                else {
                    home_team = '', away_team = '';
                    for (let i=0; i<teams.Teams.length; i++) {
                        if (!home_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['homeTeamName']) !== -1) 
                            home_team = teams.Teams[i]['name'];
                        if (!away_team && teams.Teams[i]['synonyms'].indexOf(upcoming_fixture['awayTeamName']) !== -1) 
                            away_team = teams.Teams[i]['name'];
                    }
                    handler_input.responseBuilder.withStandardCard(
                        "Scores & Fixtures", 
                        home_team + "  VS  " + away_team + "\n" + 
                        upcoming_fixture_date.toLocaleString(undefined, {
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: 'numeric', 
                            hour12: true, 
                        }), 
                        getLeagueImageUrl(upcoming_fixture['homeTeamName'], upcoming_fixture['awayTeamName'], upcoming_fixture_date)
                    );
                }
                return handler_input.responseBuilder.speak(jsonToSpeechText(fixtures, first_team, second_team))
                                                    .reprompt(random(REPROMPT))
                                                    .getResponse();
            }).catch((error) => {
                console.log(error);
                return handler_input.responseBuilder.speak("I am not able to connect to the servers at the moment. Please come back later after some time to get the latest updates on your favourite teams.")
                                                    .reprompt(random(REPROMPT))
                                                    .getResponse();
            });
        }
        else {
            return handler_input.responseBuilder.speak("Sorry! I didn't get that. Can you say it again?")
                                                .reprompt(random(REPROMPT))
                                                .getResponse();
        }
    },
};

const HelpIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle: function(handler_input) {
        return handler_input.responseBuilder.speak(HELP_MESSAGE)
                                            .reprompt(HELP_REPROMPT)
                                            .getResponse();
    },
};

const CancelIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent';
    },
    handle: function(handler_input) {
        return handler_input.responseBuilder.speak(STOP_MESSAGE)
                                            .withShouldEndSession(true)
                                            .getResponse();
    },
};

const StopIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'AMAZON.StopIntent';
    },
    handle: function(handler_input) {
        return handler_input.responseBuilder.speak(STOP_MESSAGE)
                                            .withShouldEndSession(true)
                                            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    // Handler for the Session Ended Request 
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle: function(handler_input) {
        return handler_input.responseBuilder.speak(STOP_MESSAGE)
                                            .withShouldEndSession(true)
                                            .getResponse();
    },
};

const UnhandledHandler = {
    // Handler for the Unhandled Request 
    canHandle: function(handler_input) {
        return true;
    },
    handle: function(handler_input) {
        return handler_input.responseBuilder.speak(FALLBACK_MESSAGE)
                                            .reprompt(FALLBACK_REPROMPT)
                                            .getResponse();
    },
};

const ErrorHandler = {
    // Handler for handling errors 
    canHandle: function() {
        return true;
    },
    handle: function(handler_input, error) {
      console.log("Error handled:", error.message);

      return handler_input.responseBuilder.speak("I am not able to connect to the servers at the moment. Please come back later after some time to get the latest updates on your favourite teams.")
                                         .reprompt(random(REPROMPT))
                                         .getResponse();
    },
};

const handlers = {
/*    'Unhandled': function () {
        this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
    },
    'SessionEndedRequest': function () {
        //handler for the Session Ended Request
    },
*/};

/* Using ask-sdk-v1adapter (Version 1)*/
//exports.handler = function (event, context, callback) {
//    const alexa = Alexa.handler(event, context, callback);
//    alexa.APP_ID = APP_ID;
//    alexa.registerHandlers(handlers);
//    alexa.registerV2Handlers(
//        LaunchRequestHandler, 
//        FifaFactsIntentHandler, 
//        MatchScoreIntentHandler, 
//        HelpIntentHandler, 
//        CancelIntentHandler, 
//        StopIntentHandler
//    );
//    alexa.execute();
//};

/* Using ask-sdk-core (Version 2)*/
exports.handler = Alexa.SkillBuilders.custom()
                       .addRequestHandlers(
                           LaunchRequestHandler, 
                           FifaFactsIntentHandler, 
                           MatchScoreIntentHandler, 
                           HelpIntentHandler, 
                           CancelIntentHandler, 
                           StopIntentHandler,
                           SessionEndedRequestHandler
                       )
                       .addErrorHandlers(ErrorHandler)
                       .lambda();


/**
 * Action specific helper functions to be used in the intent handlers 
 * to allow for easy editing.
 */

/**
 * Make an HTTP request to the football-data.org API to get the name and 
 * ID of the given team.
 * Arguments:- 
 *      team: Any league/national football team 
 * Returns: JSON with name and ID of the given team 
 */
function getTeamNameAndId(team) {
    return new Promise((resolve, reject) => {
        const host = 'api.football-data.org';
        const path = '/v1/teams?name=' + escape(team);
        var team_name_id;
        http.get({
            host: host,
            path: path,
            headers: { 'X-Auth-Token': '7ec2b4ec0a5a426885f1bf55362d73de' }
        }, (raw_response) => {
            let body = ''; // var to store the raw response chunks
            raw_response.on('data', (raw_response_chunk) => { body += raw_response_chunk; }); // store each raw response chunk
            raw_response.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                var parsed_response = JSON.parse(body);
                if (parsed_response['count'] === 1) {
                    team_name_id = {
                        'id': parsed_response['teams'][0]['id'],
                        'name': parsed_response['teams'][0]['name']
                    };
                }
                else {
                    var given_team = parsed_response['teams'].reduce((res_team, team) => {
                        return (team.id < res_team.id) ? team : res_team;
                    });
                    team_name_id = {
                        'id': given_team['id'],
                        'name': given_team['name']
                    };
                }
                console.log(team_name_id);
                resolve(team_name_id);
            });
            raw_response.on('error', (error) => {
                // If there is any error while handling the http GET request, handle the error appropriately
                console.log(`Error while calling the football-data.org API: ${error}`);
                reject(error);
            });
        });
    });
}

/**
 * Make an HTTP request to the football-data.org API to get the fixtures 
 * of the given team.
 * Arguments:- 
 *      team_id: ID of any league/national football team 
 * Returns: JSON with season, count and fixtures of the given team 
 */
function getTeamFixtures(team_id) {
    return new Promise((resolve, reject) => {
        const host = 'api.football-data.org';
        const path = '/v1/teams/' + team_id + '/fixtures/';
        http.get({
            host: host,
            path: path,
            headers: { 'X-Auth-Token': '7ec2b4ec0a5a426885f1bf55362d73de' }
        }, (raw_response) => {
            let body = ''; // var to store the raw response chunks
            raw_response.on('data', (raw_response_chunk) => { body += raw_response_chunk; }); // store each raw response chunk
            raw_response.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                var parsed_response = JSON.parse(body);
                var team_fixtures = {
                    'season': parsed_response['season'],
                    'count': parsed_response['count'],
                    'fixtures': parsed_response['fixtures']
                };
                console.log(team_fixtures);
                resolve(team_fixtures);
            });
            raw_response.on('error', (error) => {
                // If there is any error while handling the http GET request, handle the error appropriately
                console.log(`Error while calling the football-data.org API: ${error}`);
                reject(error);
            });
        });
    });
}

/**
 * Get the previous and the upcoming/current match details of the 
 * given team or a team pair.
 * Arguments:- 
 *      team1: Any league/national football team (REQUIRED) 
 *      team2: Any league/national football team (OPTIONAL) 
 * Returns: JSON with previous and upcoming/current match details 
 */
function getPreviousUpcomingTeamFixtures(team1, team2 = null) {
    return new Promise((resolve, reject) => {
        getTeamNameAndId(team1).then((team1_name_id) => {
            if (!team1_name_id['id']) {
                return null;
            }
            return getTeamFixtures(team1_name_id['id']);
        }).then((team1_fixtures) => {
            var previous_fixture, upcoming_fixture;
            var fixtures;
            if (team2) {
                getTeamNameAndId(team2).then((team2_name_id) => {
                    if (!team2_name_id['id']) {
                        return null;
                    }
                    for (let i = 0; i < team1_fixtures['fixtures'].length; i++) {
                        if (team1_fixtures['fixtures'][i]['status'] === 'FINISHED' && 
                            (team1_fixtures['fixtures'][i]['awayTeamName'] === team2_name_id['name'] ||
                             team1_fixtures['fixtures'][i]['homeTeamName'] === team2_name_id['name']))
                            previous_fixture = team1_fixtures['fixtures'][i];
                    }
                    for (let i = (team1_fixtures['fixtures'].length - 1); i >= 0; i--) {
                        if (team1_fixtures['fixtures'][i]['status'] !== 'FINISHED' &&
                            (team1_fixtures['fixtures'][i]['awayTeamName'] === team2_name_id['name'] ||
                             team1_fixtures['fixtures'][i]['homeTeamName'] === team2_name_id['name']))
                            upcoming_fixture = team1_fixtures['fixtures'][i];
                    }
                    fixtures = {
                        'previous_fixture': previous_fixture,
                        'upcoming_fixture': upcoming_fixture
                    };
                    console.log(fixtures);
                    resolve(fixtures);
                    return fixtures;
                }).catch((error) => {
                    //console.log(error);
                    reject(error);
                });
            }
            else {
                for (let i = 0; i < team1_fixtures['fixtures'].length; i++) {
                    if (team1_fixtures['fixtures'][i]['status'] === 'FINISHED')
                        previous_fixture = team1_fixtures['fixtures'][i];
                }
                for (let i = (team1_fixtures['fixtures'].length - 1); i >= 0; i--) {
                    if (team1_fixtures['fixtures'][i]['status'] !== 'FINISHED')
                        upcoming_fixture = team1_fixtures['fixtures'][i];
                }
                fixtures = {
                    'previous_fixture': previous_fixture,
                    'upcoming_fixture': upcoming_fixture
                };
                console.log(fixtures);
                resolve(fixtures);
            }
            return fixtures;
        }).catch((error) => {
            //console.log(error);
            reject(error);
        });
    });
}

/**
 * Get league name of the given team.
 * Arguments:- 
 *      team: Any league/national football team 
 * Returns:- League's name of the given team 
 */
function getLeagueName(team) {
    for (var i=0; i<teams.Teams.length; i++) {
        if (teams.Teams[i]['synonyms'].indexOf(team) !== -1) 
            return teams.Teams[i]['league'];
    }
    return null;
}

/**
 * Get the image url of the league to which the given 
 * pair of teams belong.
 * Arguments:-
 *      team1: Any league/national football team 
 *      team2: Any league/national football team 
 *      date: Date of the fixture 
 * Returns: URL of the image of the league 
 */
function getLeagueImageUrl(team1, team2, date) {
    var league1 = getLeagueName(team1);
    var league2 = getLeagueName(team2);
    if (league1 === league2) 
        return LEAGUES[league1]['logo'];
    else {
        if (date.getMonth() > 4 && date.getMonth() < 7)
            return "https://eplfootballmatch.com/wp-content/uploads/2017/03/international-friendly-match-2z8pgeckcwr9lg4nwfo8i2-535x300.jpg";
        else
            return LEAGUES['Champions League']['logo'];
    }
}

/**
 * Get the speech/text response for the Alexa according to 
 * the JSON response passed as a parameter to the function 
 * (Match-Score Intent).
 * Arguments:- 
 *      json_response: JSON response to be converted to speech/text response 
 *      team1: Any league/national football team (REQUIRED)
 *      team2: Any league/national football team (OPTIONAL)
 * Returns:- Speech/Text response for the Alexa 
 */
function jsonToSpeechText(json_response, team1, team2) {
    if (json_response['previous_fixture']) {
        var previous_fixture_date = new Date(json_response['previous_fixture']['date']);
        var previous_fixture_date_time = previous_fixture_date.toLocaleString(undefined, {
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
        });
        // Previous Fixture Response 
        var speech_text_response = "In the last match, " + team1 + " went up against ";
        var home_team = '', away_team = '';
        var team1_goals, team2_goals;
        for (let i=0; i<teams.Teams.length; i++) {
            if (!home_team && teams.Teams[i]['synonyms'].indexOf(json_response['previous_fixture']['homeTeamName']) !== -1) 
                home_team = teams.Teams[i]['name'];
            if (!away_team && teams.Teams[i]['synonyms'].indexOf(json_response['previous_fixture']['awayTeamName']) !== -1) 
                away_team = teams.Teams[i]['name'];
        }

        if (team1 === home_team) {
            speech_text_response += away_team + ", which ended " + json_response['previous_fixture']['result']['goalsHomeTeam'] + 
                                    " - " + json_response['previous_fixture']['result']['goalsAwayTeam'];
            team1_goals = json_response['previous_fixture']['result']['goalsHomeTeam'];
            team2_goals = json_response['previous_fixture']['result']['goalsAwayTeam'];
        }
        else {
        speech_text_response += home_team + ", which ended " + json_response['previous_fixture']['result']['goalsAwayTeam'] + 
                                " - " + json_response['previous_fixture']['result']['goalsHomeTeam'];
        team1_goals = json_response['previous_fixture']['result']['goalsAwayTeam'];
        team2_goals = json_response['previous_fixture']['result']['goalsHomeTeam'];
        }
    
        if (team1_goals > team2_goals) 
                speech_text_response += " with " + team1 + "'s win.\n";
        else if (team1_goals < team2_goals) 
            speech_text_response += " with " + (!team2 ? (team1 + "'s loss.\n") : (team2 + "'s win.\n"));
        else 
            speech_text_response += " in a draw.\n";
    }

    if (json_response['upcoming_fixture']) {
        var upcoming_fixture_date = new Date(json_response['upcoming_fixture']['date']);
        var upcoming_fixture_date_time = upcoming_fixture_date.toLocaleString(undefined, {
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true, 
        });
        // Upcoming Fixture Response 
        home_team = '', away_team = '';
        for (let i=0; i<teams.Teams.length; i++) {
            if (!home_team && teams.Teams[i]['synonyms'].indexOf(json_response['upcoming_fixture']['homeTeamName']) !== -1) 
                home_team = teams.Teams[i]['name'];
            if (!away_team && teams.Teams[i]['synonyms'].indexOf(json_response['upcoming_fixture']['awayTeamName']) !== -1) 
                away_team = teams.Teams[i]['name'];
        }
        if (!team2)
            speech_text_response += "The club's next game will be on " + upcoming_fixture_date_time + 
                                    ", where they will take on " + (team1 === home_team ? away_team : home_team) + ".";
        else 
            speech_text_response += "Their next game wil be on " + upcoming_fixture_date_time + ".";
    }

    return speech_text_response;
}
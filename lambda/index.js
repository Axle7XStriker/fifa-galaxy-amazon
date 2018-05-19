/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

/**
 * This file contains the controller (backend) endpoint function for FIFA World (Alexa Skill).
 * Returns a response depending upond the intent and the intent slots passed 
 * in the request to the function.
 **/

'use strict';
const Alexa = require('ask-sdk-v1adapter');
//const cookbook = require('alexa-cookbook.js');
const util = require('util');
const http = require('http');

const {isSlotValid, values, concat, random, randomPop} = require('./utils');
const facts = require('./facts');

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.32f6405b-b9c1-407f-b6be-a6d1ec863a2f';

const SKILL_NAME = 'FIFA World';
const GET_FACT_MESSAGE = "Here's your fact: ";
const HELP_MESSAGE = "You can say tell me a FIFA fact, or, you can say exit... What can I help you with?";
const HELP_REPROMPT = "What can I help you with?";
const FALLBACK_MESSAGE = "The FIFA World can't help you with that.  It can help you discover facts about space if you say tell me a space fact. What can I help you with?";
const FALLBACK_REPROMPT = "What can I help you with?";
const STOP_MESSAGE = "Goodbye!";
const REPROMPT = [
    "What can I help you with?", 
    "Do you want to know something else?", 
    "What else can I help you with?", 
    "Anything else, you want to know?"
]

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/data
//=========================================================================================================================================
const PLAYERS = facts.Players.reduce((obj, player) => {
                    obj[player.name] = player;
                    return obj;
                }, {});
const TEAMS   = facts.Teams.reduce((obj, team) => {
                    obj[team.name] = team;
                    return obj;
                }, {});
const LEAGUES = facts.Leagues.reduce((obj, league) => {
                    obj[league.name] = league;
                    return obj;
                }, {});

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
        console.log(player);

        if (player) {
            fact = random(PLAYERS[player]['facts']);
            speech_output = PLAYERS[player]['fact_prefix'] + "\n" + fact;
            return handler_input.responseBuilder.speak(speech_output)
                                                .withStandardCard(player, fact, PLAYERS[player]['image_url'])
                                                .reprompt(random(REPROMPT))
                                                .getResponse();
        }
        else if (team) {
            fact = random(TEAMS[team]['facts']);
            speech_output = TEAMS[team]['fact_prefix'] + "\n" + fact;
            return handler_input.responseBuilder.speak(speech_output)
                                                .withStandardCard(team, fact, TEAMS[team]['image_url'])
                                                .reprompt(random(REPROMPT))
                                                .getResponse();
        }
        else if (league) {
            fact = random(LEAGUES[league]['facts']);
            speech_output = LEAGUES[league]['fact_prefix'] + "\n" + fact;
            return handler_input.responseBuilder.speak(speech_output)
                                                .withStandardCard(league, fact, LEAGUES[league]['image_url'])
                                                .reprompt(random(REPROMPT))
                                                .getResponse();
        }
        else {
            speech_output = "Sorry! I don't know any fact related to FIFA";
            return handler_input.responseBuilder.speak(speech_output)
                                                .reprompt(random(REPROMPT))
                                                .getResponse();
        }
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
        // Check if a single team or a pair of team is given 
        if (first_team) {
            return getPreviousUpcomingTeamFixtures(first_team, second_team).then((fixtures) => {
                var previous_fixture = fixtures['previous_fixture'];
                var upcoming_fixture = fixtures['upcoming_fixture'];
                var previous_fixture_date = new Date(previous_fixture['date']);
                var upcoming_fixture_date = new Date(upcoming_fixture['date']);

                /* List Select to display fixtures */
/*
                conv.ask(new List({
                    items: {
                        'previous_match': {
                            title: previous_fixture['homeTeamName'] + " " + previous_fixture['result']['goalsHomeTeam'] + "  ⚽  " + 
                                previous_fixture['result']['goalsAwayTeam'] + " " + previous_fixture['awayTeamName'],
                            description: previous_fixture_date.toLocaleString(undefined, {
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric', 
                            }),
                            image: new Image({
                                url: getLeagueImageUrl(previous_fixture['homeTeamName'], previous_fixture['awayTeamName'], conv.data.LEAGUES),
                                alt:  previous_fixture['homeTeamName'] + " VS " + previous_fixture['awayTeamName'],
                            }),
                        },
                        'upcoming_match': {
                            title: upcoming_fixture['homeTeamName'] + " V/S " + upcoming_fixture['awayTeamName'],
                            description: upcoming_fixture_date.toLocaleString(undefined, {
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: 'numeric', 
                                hour12: true, 
                            }),
                            image: new Image({
                                url: getLeagueImageUrl(upcoming_fixture['homeTeamName'], upcoming_fixture['awayTeamName'], conv.data.LEAGUES),
                                alt:  previous_fixture['homeTeamName'] + " VS " + previous_fixture['awayTeamName'],
                            }),
                        },
                    },
                }));
*/
                return handler_input.responseBuilder.speak(jsonToSpeechText(fixtures, first_team, second_team))
                                                    .getResponse();
            }).catch((error) => {
                console.log(error);
                return handler_input.responseBuilder.speak("I am not able to connect to the servers at the moment. Please come back later after some time to get the latest updates on your favourite teams.");
            });
        }
        else {
            return handler_input.responseBuilder.speak("Sorry! I didn't get that. Can you say it again?");
        }
    },
};

const HelpIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'Amazon.HelpIntent';
    },
    handle: function(handler_input) {
        const speech_output = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;
        return handler_input.responseBuilder.speak(speech_output)
                                            .listen(reprompt);
    },
};

const CancelIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'Amazon.CancelIntent';
    },
    handle: function(handler_input) {
        return this.handler_input.responseBuilder.speak(STOP_MESSAGE);
    },
};

const StopIntentHandler = {
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'IntentRequest' && 
            handler_input.requestEnvelope.request.intent.name === 'Amazon.StopIntent';
    },
    handle: function(handler_input) {
        return this.handler_input.responseBuilder.speak(STOP_MESSAGE);
    },
};

const SessionEndedRequestHandler = {
    //handler for the Session Ended Request
    canHandle: function(handler_input) {
        return handler_input.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle: function(handler_input) {
        
    },
};

const UnhandledHandler = {
    canHandle: function(handler_input) {
        
    },
    handle: function(handler_input) {
        
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

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.registerV2Handlers(
        LaunchRequestHandler, 
        FifaFactsIntentHandler, 
        MatchScoreIntentHandler, 
        HelpIntentHandler, 
        CancelIntentHandler, 
        StopIntentHandler
    );
    alexa.execute();
};


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
            path: path
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
            path: path
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
    for (var i=0; i<facts.Teams.length; i++) {
        if (facts.Teams[i]['synonyms'].indexOf(team) !== -1) 
            return facts.Teams[i]['league'];
    }
    return null;
}

/**
 * Get the image url of the league to which the given 
 * pair of teams belong.
 * Arguments:-
 *      team1: Any league/national football team 
 *      team2: Any league/national football team 
 * Returns: URL of the image of the league 
 */
function getLeagueImageUrl(team1, team2) {
    var league1 = getLeagueName(team1);
    var league2 = getLeagueName(team2);
    if (league1 === league2) 
        return LEAGUES[league1]['logo'];
    else {
        var date = new Date();
        if (date.getMonth() > 4 && date.getMonth() < 7)
            return "http://eplfootballmatch.com/wp-content/uploads/2017/03/international-friendly-match-2z8pgeckcwr9lg4nwfo8i2-535x300.jpg";
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
    var previous_fixture_date = new Date(json_response['previous_fixture']['date']);
    var upcoming_fixture_date = new Date(json_response['upcoming_fixture']['date']);
    
    // Previous Fixture Response 
    var speech_text_response = "In the last match, " + team1 + " went up against ";
    var home_team = '', away_team = '';
    var team1_goals, team2_goals;
    for (let i=0; i<facts.Teams.length; i++) {
        if (!home_team && facts.Teams[i]['synonyms'].indexOf(json_response['previous_fixture']['homeTeamName']) !== -1) 
            home_team = facts.Teams[i]['name'];
        if (!away_team && facts.Teams[i]['synonyms'].indexOf(json_response['previous_fixture']['awayTeamName']) !== -1) 
            away_team = facts.Teams[i]['name'];
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
        speech_text_response += "in a draw.\n";

    // Upcoming Fixture Response 
    home_team = '', away_team = '';
    for (let i=0; i<facts.Teams.length; i++) {
        if (!home_team && facts.Teams[i]['synonyms'].indexOf(json_response['upcoming_fixture']['homeTeamName']) !== -1) 
            home_team = facts.Teams[i]['name'];
        if (!away_team && facts.Teams[i]['synonyms'].indexOf(json_response['upcoming_fixture']['awayTeamName']) !== -1) 
            away_team = facts.Teams[i]['name'];
    }
    if (!team2)
        speech_text_response += "The club's next game will be on " + /* Date and Time of the match */ 
                                ", where they will take on " + (team1 === home_team ? away_team : home_team) + ".";
    else 
        speech_text_response += "Their next game wil be on " + /* Date and Time of the match */ ".";
    
    return speech_text_response;
}
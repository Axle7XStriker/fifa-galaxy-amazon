/**
 * This file contains the utilities or helper functions required by the main 
 * code logic (endpoint for Alexa Skills) to allow for easy editing.
 **/
 
/**
 * Checks the value of the given slot name in the received IntentRequest  and 
 * returns null, or the value of the slot.
 * Arguments:-
 *      request: request sent to lambda function by Alexa Skill (FIFA Galaxy)
 *      slot_name: name of the slot whose value is to be obtained
 * Returns:- null, or the value of the slot
 **/
exports.isSlotValid = (request, slot_name) => {
    var slot = request.intent.slots[slot_name]['resolutions'];
    //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
    var slot_value;

    //if we have a slot, get the text and store it into speechOutput
    if (slot && slot['resolutionsPerAuthority'][0]['values'][0]['value']['name']) {
        //we have a value in the slot
        slot_value = slot['resolutionsPerAuthority'][0]['values'][0]['value']['name'];
        return slot_value;
    } 
    else {
        //we didn't get a value in the slot
        return false;
    }
};

/**
 * Checks if the skill is running on a device with a display (show|spot).
 * Arguments:- 
 *    handler_input: Object containing the inbound request 
 * Returns:- true, if the skill is running on a device with a display (show|spot) 
 */
exports.supportsDisplay = (handler_input) => {
  var has_display = handler_input.requestEnvelope.context &&
                    handler_input.requestEnvelope.context.System &&
                    handler_input.requestEnvelope.context.System.device &&
                    handler_input.requestEnvelope.context.System.device.supportedInterfaces &&
                    handler_input.requestEnvelope.context.System.device.supportedInterfaces.Display
  return has_display;
};

/**
 * Get the values of the keys of an object.
 * Arguments:-
 *      obj: object
 * Returns:- values of the keys of an object
 **/
exports.values = (obj) => Object.keys(obj).map((k) => obj[k]);

/**
 * Concatenates a list of messages into a single string.
 * Arguments:-
 *      messages: The messages to concat
 * Returns:- The concatenated messages
 */
exports.concat =
  (...messages) => messages.map((message) => message.trim()).join(' ');

/**
 * Gets a random element from an array.
 * Arguments:-
 *      arr: The array to retrieve an element from
 * Returns:- The random element retrieved from the array
 */
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

exports.random = random;

/**
 * Pop a random element from an array.
 * Arguments:-
 *      array: The array to pop a random element from
 * Returns:- The random element popped from the array
 */
exports.randomPop = (array) => {
  if (!array.length) {
    return null;
  }
  const element = random(array);
  array.splice(array.indexOf(element), 1);
  return element;
};
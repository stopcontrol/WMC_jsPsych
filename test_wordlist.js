/**
 * jspsych-single-stim
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/

(function($) {
    jsPsych["wordlist"] = (function() {

        var plugin = {};

        plugin.create = function(params) {

            params = jsPsych.pluginAPI.enforceArray(params, ['items', 'choices']);

            var trials = new Array(params.items.length);
            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
                trials[i].item = params.items[i];
                trials[i].style = params.style;
                trials[i].color = params.colors[i];
                trials[i].response_ends_trial = (typeof params.response_ends_trial === 'undefined') ? true : params.response_ends_trial;
                // timing parameters
                trials[i].timing_stim = params.timing_stim || -1; // if -1, then show indefinitely
                trials[i].timing_response = params.timing_response || -1; // if -1, then wait for response forever
                // optional parameters
            }
            return trials;
        };



        plugin.trial = function(display_element, trial) {

            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            var colorDic = {'red':'#FF0000','blue':'#0000FF'};

            // this array holds handlers from setTimeout calls
            // that need to be cleared if the trial ends early
            var setTimeoutHandlers = [];

            // display stimulus
            display_element.append($('<div>', {
                text: trial.item.text,
                style: trial.style+'color:'+colorDic[trial.color]+';'
            }));

            // store response
            var response = {rt: -1, key: -1};

            // function to end trial when it is time
            var end_trial = function() {

                // kill any remaining setTimeout handlers
                for (var i = 0; i < setTimeoutHandlers.length; i++) {
                    clearTimeout(setTimeoutHandlers[i]);
                }

                // kill keyboard listeners
                if(typeof keyboardListener !== 'undefined'){
                    jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
                }

                function getJudgement(size,keystring){
                    if (keystring=='rightarrow' && size>0||keystring=='leftarrow' && size<0) {
                        return "correct"
                    }else{
                        return "incorrect"
                    }
                }

                var lastWordList = jsPsych.data.getTrialsOfType('wordlist')
                var repetition = lastWordList.length>9 ? trialIdx == lastWordList[lastWordList.length-10]['trial_idx'] : false;

                // gather the data to store for the trial
                var trial_data = {
                    "rt": response.rt,
                    "text": trial.item.text,
                    "word_id": trial.item.word_id,
                    "color": trial.color,
                    "size_difference" : trial.item.size_difference,
                    "binary_size": 0 ? trial.item.size_difference > 0 : 1,
                    "key_code": response.key_code,
                    "key_string": response.key_string,
                    "trial_idx" : trialIdx,
                    "repetition" : repetition,
                    "size_judgement": getJudgement(trial.item.size_difference,response.key_string)
                };

                jsPsych.data.write(trial_data);

                // clear the display
                display_element.html('');

                // move on to the next trial
                jsPsych.finishTrial();
            };

            // function to handle responses by the subject
            var after_response = function(info) {

                // after a valid response, the stimulus will have the CSS class 'responded'
                // which can be used to provide visual feedback that a response was recorded
                $("#jspsych-single-stim-stimulus").addClass('responded');

                // only record the first response
                if(response.key == -1){
                    response = info;
                }

                if (trial.response_ends_trial) {
                    end_trial();
                }
            };

            // start the response listener
            if(JSON.stringify(trial.choices) != JSON.stringify(["none"])) {
                var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                    callback_function: after_response,
                    valid_responses: [37,39],
                    rt_method: 'date',
                    persist: false,
                    allow_held_key: false,
                });
            }


            // end trial if time limit is set
            if (trial.timing_response > 0) {
                var t2 = setTimeout(function() {
                    end_trial();
                }, trial.timing_response);
                setTimeoutHandlers.push(t2);
            }
            if (trial.timing_stim > 0) {
                var t3 = setTimeout(function() {
                    display_element.html('');
                }, trial.timing_stim);
                setTimeoutHandlers.push(t3);
            }

        };

        return plugin;
    })();
})(jQuery);
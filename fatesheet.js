$.expr[":"].contains = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

/* populate function ala Dave Stewart - http://davestewart.io/plugins/jquery/jquery-populate/ */
jQuery.fn.populate = function (g, h) { function parseJSON(a, b) { b = b || ''; if (a == undefined) { } else if (a.constructor == Object) { for (var c in a) { var d = b + (b == '' ? c : '[' + c + ']'); parseJSON(a[c], d) } } else if (a.constructor == Array) { for (var i = 0; i < a.length; i++) { var e = h.useIndices ? i : ''; e = h.phpNaming ? '[' + e + ']' : e; var d = b + e; parseJSON(a[i], d) } } else { if (k[b] == undefined) { k[b] = a } else if (k[b].constructor != Array) { k[b] = [k[b], a] } else { k[b].push(a) } } }; function debug(a) { if (window.console && console.log) { console.log(a) } } function getElementName(a) { if (!h.phpNaming) { a = a.replace(/\[\]$/, '') } return a } function populateElement(a, b, c) { var d = h.identifier == 'id' ? '#' + b : '[' + h.identifier + '="' + b + '"]'; var e = jQuery(d, a); c = c.toString(); c = c == 'null' ? '' : c; e.html(c) } function populateFormElement(a, b, c) { var b = getElementName(b); var d = a[b]; if (d == undefined) { d = jQuery('#' + b, a); if (d) { d.html(c); return true } if (h.debug) { debug('No such element as ' + b) } return false } if (h.debug) { _populate.elements.push(d) } elements = d.type == undefined && d.length ? d : [d]; for (var e = 0; e < elements.length; e++) { var d = elements[e]; if (!d || typeof d == 'undefined' || typeof d == 'function') { continue } switch (d.type || d.tagName) { case 'radio': d.checked = (d.value != '' && c.toString() == d.value); case 'checkbox': var f = c.constructor == Array ? c : [c]; for (var j = 0; j < f.length; j++) { d.checked |= d.value == f[j] } break; case 'select-multiple': var f = c.constructor == Array ? c : [c]; for (var i = 0; i < d.options.length; i++) { for (var j = 0; j < f.length; j++) { d.options[i].selected |= d.options[i].value == f[j] } } break; case 'select': case 'select-one': d.value = c.toString() || c; break; case 'text': case 'button': case 'textarea': case 'submit': default: c = c == null ? '' : c; d.value = c } } } if (g === undefined) { return this }; var h = jQuery.extend({ phpNaming: true, phpIndices: false, resetForm: true, identifier: 'id', debug: false }, h); if (h.phpIndices) { h.phpNaming = true } var k = []; parseJSON(g); if (h.debug) { _populate = { arr: k, obj: g, elements: [] } } this.each(function () { var a = this.tagName.toLowerCase(); var b = a == 'form' ? populateFormElement : populateElement; if (a == 'form' && h.resetForm) { this.reset() } for (var i in k) { b(this, i, k[i]) } }); return this };

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|\s(\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
};

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

(function (fatesheet, $, undefined) {


  /***********************************
          CONFIG
  ***********************************/
    fatesheet.config = {
        content: $('#results'),
        environment: '',
        isAuthenticated: false,
        appId: '189783225112476',
        roleArn: 'arn:aws:iam::210120940769:role/FateCharacterSheetUser',
        awsBucket: null,
        fbUserId: null,
        characterId: null,
        diceRoller: new DiceRoller(),
        adversarytable: ''
    }

    fatesheet.templates = {

        characterList: "<div class='card'>" +
                            "	  <div class='card-body'>" +
                            "		<h5 class='card-title character-name'>{{name}}</h5>" +
                            "		<p class='card-text'>{{highconcept}}</p>" +
                            "		<p class='card-note font-italic small'>({{description}})</p>" +
                            "		<a href='#!{{sheetname}}/{{id}}' class='btn btn-primary' data-id='{{id}}'>Play</a>" +
                            "		<a href='#' class='btn btn-danger' data-id='{{id}}' data-toggle='modal' data-target='#modalDeleteCharacterConfirm'>Delete <i class='fa fa-trash'></i></a>" +
                            "	  </div>" +
                            "     <div class='card-footer text-muted'>" +
                            "           <span class='badge badge-secondary'>{{sheetname}}</span>" +
                            "     </div>" +
                           "</div>",
        sheetList: "<div class='card'>" +
                           "  <img class='card-img-top img-thumbnail img-fluid' src='sheets/{{id}}/logo.png' alt='Character Sheet Logo'>" +
                           "	<div class='card-body'>" +
                           "		<h5 class='card-title charactersheet-name'>{{sheetname}}</h5>" +
                           "		<a href='#!{{id}}' class='btn btn-primary' data-id='{{id}}'>Create Character <i class='fa fa-user'></i></a>" +
                           "	</div>" +
                           "     <div class='card-footer text-muted'>" +
                            "           <span class='badge badge-secondary'>{{system}}</span>" +
                            "     </div>" +
                           "</div>",
    }

    fatesheet.navigation = {
        character: {
            auth: "<hr/><div class='row'><div class='col'>" +
                        "   <button type='button' class='btn btn-success js-save-character d-print-none'>Save Character <i class='fa fa-save'></i></button>" +
                        "   <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                        "</div></div>",
            noauth: "<hr/><div class='row'><div class='col'>" +
                        "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                        "</div></div>",

        },
        sheet: {
            auth: "<hr/><div class='row'><div class='col'>" +
                   "    <button type='button' class='btn btn-success js-create-character d-print-none'>Save Character <i class='fa fa-user'></i></button>" +
                   "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                   "</div></div>",
            noauth: "<hr/><div class='row'><div class='col'>" +
                    "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                    "</div></div>",
        }

    }

    function configAWS() {
        AWS.config.region = 'us-east-1';
    }

    function getDBClient() {
      // Create DynamoDB document client
      var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
      docClient.service.config.credentials = fatesheet.config.awsBucket.config.credentials;

      return docClient;
    }

    /***********************************
            CHARACTERS & SHEETS
    ***********************************/
    function getSheetListInfo(key) {
        /// get character sheet meta data information
        fatesheet.config.awsBucket.headObject({
            Key: key
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                $.notify(err.message || err, 'error');
            } else {
                console.log(data);           // successful response
                var elem = fatesheet.templates.sheetList
                                .replaceAll('{{sheetname}}', data.Metadata.sheetname)
                                .replaceAll('{{system}}', data.Metadata.system)
                                .replaceAll('{{id}}', key.replace('sheets/', '').replace('/',''));

                $('.card-columns', fatesheet.config.content).append(elem);
            }
        });
    }

    fatesheet.listSheets = function () {
        /// show a list of available character sheets
        fatesheet.config.content.empty();

        var prefix = 'sheets';
        fatesheet.config.awsBucket.listObjects({
            Prefix: prefix
        }, function (err, data) {
            if (err) {
              console.log(err, err.stack); // an error occurred
              $.notify(err.message || err, 'error');
            } else {
                var objKeys = "";

                var rowContainer = fatesheet.config.content.append("<div class='card-columns'></div>");

                data.Contents.forEach(function (obj) {
                    //look for top level child folders under sheets/
                    var isSheetFolder = (obj.Key.toString().substring(0, obj.Key.lastIndexOf("/"))).split('/').length == 2
                                            && obj.Key.lastIndexOf("/") + 1 == obj.Key.length
                    if (isSheetFolder) {
                        getSheetListInfo(obj.Key);
                    }
                });
            }
        });
    }

    function getCharacterIdFromKey(key) {
        return key.replace(/^.*[\\\/]/, '').replace('.character', '');
    }

    function getCharacterInfo(key) {
        fatesheet.config.characterId = key;

        fatesheet.config.awsBucket.getObject({
            Key: 'facebook-' + fatesheet.config.fbUserId + '/' + key + '.character'
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                $.notify(err.message || err, 'error');
            } else {
                console.log(data);           // successful response

                var character = JSON.parse(data.Body.toString());

                $('form').populate(character);

                //check if there is an autocalc function and runit
                if (typeof autocalc !== "undefined") {
                    autocalc();
                }
            }
        });

    }

    fatesheet.getCharacterListInfo = function (key) {
        /// populate the character list screen
        fatesheet.config.awsBucket.headObject({
            Key: key
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                $.notify(err.message || err, 'error');
            } else {
                console.log(data);           // successful response

                var elem = fatesheet.templates.characterList
                                    .replaceAll('{{name}}', (data.Metadata.name || ''))
                                    .replaceAll('{{highconcept}}', (data.Metadata.highconcept || ''))
                                    .replaceAll('{{description}}', (data.Metadata.description || ''))
                                    .replaceAll('{{sheetname}}', (data.Metadata.sheetname || ''))
                                    .replaceAll('{{system}}', (data.Metadata.system || ''))
                                    .replaceAll('{{id}}', getCharacterIdFromKey(key));

                $('.card-columns', fatesheet.config.content).append(elem);
            }
        });

    }

    fatesheet.listCharacters = function () {

        /// show a list of the users characters
        fatesheet.config.content.empty();

        var prefix = 'facebook-' + fatesheet.config.fbUserId;
        fatesheet.config.awsBucket.listObjects({
            Prefix: prefix
        }, function (err, data) {
            if (err) {
                $.notify(err.message || err, 'error');
                console.log(err, err.stack); // an error occurred
            } else {
                if (data.Contents.length === 0) {
                    fatesheet.config.content.html('No characters found.');
                }
                else {
                    var objKeys = "";

                    var rowContainer = fatesheet.config.content.append("<div class='card-columns'></div>");
                    data.Contents.forEach(function (obj) {
                        fatesheet.getCharacterListInfo(obj.Key);
                    });
                };
            }
        });
    }

    fatesheet.showSheet = function (key, character) {
        // if we are showing a blank sheet then null out the character
        // so we properly create a new one if needed
        if (!character) {
            fatesheet.config.characterId = null;
        }

        key = 'sheets/' + key;
        /// if character is null then we will show a blank sheet
        /// if character is not null then we will load a character into the sheet
        fatesheet.config.content.empty();

        fatesheet.config.awsBucket.getObject({ Key: key + '/sheet.html' }, function (err, data) {
            if (!err) {
                var sheetHtml = data.Body.toString();
                fatesheet.config.content.html(sheetHtml);

                // add navigation
                if (character != null) {
                    getCharacterInfo(character);
                    addNav(fatesheet.navigation.character);
                }
                else {
                    addNav(fatesheet.navigation.sheet);
                }
            }
        });
    }

    fatesheet.saveCharacter = function () {
        if (fatesheet.config.isAuthenticated) {

            /// save a character
            var data = $('form').serializeJSON();
            var dataObj = JSON.parse(data);

            //creat a new characterId if we don't have one
            if (!fatesheet.config.characterId) {
                fatesheet.config.characterId = generateUUID();
                FB.AppEvents.logEvent('createdACharacter' + dataObj.sheetname);
            }

            var key = 'facebook-' + fatesheet.config.fbUserId + '/' + fatesheet.config.characterId + '.character';
            var metadata = {
                name: dataObj.name,
                highconcept: dataObj.aspect.highconcept || 'Uknown',
                description: (dataObj.description || '').replace(/[\n\r]/g, ' '),
                sheetname: dataObj.sheetname,
                system: dataObj.system
            }

            fatesheet.config.awsBucket.putObject({
                Key: key,
                Body: data,
                Metadata: metadata,
            }, function (err, data) {
                if (!err) {
                    console.log('character saved.');
                    $.notify('Character Saved.', 'success');
                }
                else {
                    console.log(err);
                    $.notify(err.message || err, 'error');
                }
            });
        }
        else {
            window.print();
        }
    }

    fatesheet.deleteCharacter = function (characterId) {
        /// delete a character
        fatesheet.config.awsBucket.deleteObject({
            Key: 'facebook-' + fatesheet.config.fbUserId + '/' + characterId + '.character'
        }, function (err, data) {
            $('#modalDeleteCharacterConfirm').modal('hide');

            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(data);           // successful response

                //refresh the list of characters
                fatesheet.listCharacters();
            }
        });
    }

    fatesheet.diceRoller = function () {

        $('.current-roll').removeClass('current-roll');

        var $diceTray = $('.modal-body', '#modalDiceRoller');
        var modifier = $('#rollModifier').val();
        // affixe a + on front of the modifier if it's missing
        modifier = (modifier !== '' && modifier.indexOf('-') === -1) ? "+" + modifier : modifier;

        fatesheet.config.diceRoller.roll('4dF.2' + modifier);

        // get the latest dice rolls from the log
        var latestRoll = fatesheet.config.diceRoller.getLog().shift();
        var displayDice = '';

        $.each(latestRoll.rolls[0], function (key, value) {
            switch (value) {
                case -1:
                    displayDice += '<span class="dice">-</span>';
                    break;
                case 1:
                    displayDice += '<span class="dice">+</span>';
                    break;
                default:
                    displayDice += '<span class="dice">0</span>';
                    break;
            }
        });

        var rollElem = "<p class='dice-roll current-roll'>" + displayDice + (modifier !== '' ? ' (' + modifier + ')' : '') + " = " + latestRoll.getTotal() + "</p>";
        $diceTray.prepend(rollElem);
    }

    fatesheet.clearDiceTray = function () {
        fatesheet.config.diceRoller.clearLog();
        var $diceTray = $('.modal-body', '#modalDiceRoller');
        $diceTray.empty();
    }

    fatesheet.search = function(searchText) {
      // clear the hash so we don't show a false id/name getCharacterInfo
      hasher.setHash('');

      //character and sheet search
    	if (location.pathname.indexOf('charactersheets.htm') > -1 || location.pathname.indexOf('characters.htm') > -1)
    	{
    		$('.card').hide();

    		// filter by character name and description
    		$(".card-title:contains('" + searchText + "'), .card-note:contains('" + searchText + "'), .card-text:contains('" + searchText + "')", ".card")
    			.parent().show();

    		//account for body text in a card
    		$(".card-title:contains('" + searchText + "'), .card-note:contains('" + searchText + "'), .card-text:contains('" + searchText + "')", ".card-body")
    			.parent().parent().show();

    		// filter by footer content
    		$(".card-footer:contains('" + searchText + "')")
    			.parent().show();
    	}
    	else if (location.pathname.indexOf('adversary.htm') > -1)
    	{
        fatesheet.listAdversaries(searchText); //adversary search
    	}

    }

    /***********************************
            HELPERS METHODS
    ***********************************/
    function isEmpty(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    // clean out empty objects - used for cleaning adversary  objects
    //https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript/24190282
    function removeEmpty(obj) {
      $.each(obj, function(key, value){
         if (key === "")
         {
            delete obj[""];
         }
         else {
           if (value === "" || value === null || value === undefined || value === {}){
               delete obj[key];
           } else if (Object.prototype.toString.call(value) === '[object Object]') {
               removeEmpty(value);
           } else if ($.isArray(value)) {
               $.each(value, function (k,v) {
                 if (v === "") {
                   value.splice(k);
                 }
               });
           }
         }
       });
    };

    function addNav(navBar) {
        /// add nav bars to a character sheet so we know what actions are available
        $('.sheet', fatesheet.config.content).append(fatesheet.config.isAuthenticated ? navBar.auth : navBar.noauth);
        $('.sheet', fatesheet.config.content).wrap('<form></form>')
    }


    function generateUUID() { // Public Domain/MIT
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function generateShortUID() {
        // I generate the UID from two parts here
        // to ensure the random number provide enough bits.
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    }

    function sortObject(obj) {
        return Object.keys(obj).sort().reduce(function (result, key) {
            result[key] = obj[key];
            return result;
        }, {});
    }

    function slugify(text)
    {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }

/***********************************
        ADVERSARY
***********************************/

    function upsertAdversary() {
        var data = $('#adversaryForm').serializeArray();
        var result = {};
        var currentKey;
        $.each(data, function () {
            if (this.name !== '') {
                if (this.name.indexOf('[name]') > -1)
                {
                    var label = this.name.replace('[name]',''); //get the name of the parent property
                    if (!result[label]) {
                        result[label] = {};
                    }
                    currentKey = this.value; //get the value that needs to be appened to the parent
                    result[label][this.value] = null;
                }

                else if (this.name.indexOf('[value]') > -1)
                {
                    var label = this.name.replace('[value]', '');//get the name of the parent property
                    result[label][currentKey] = this.value; //get the last name we stored, should be in order so we assume the previous name is paired with this
                    currentKey = '';
                }

                else {
                    result[this.name] = this.value;
                }
            }
        });

        if (result.adversary_stress) {
            //iterate over stress and make each value an array
            $.each(result.adversary_stress, function (key, value) {
                result.adversary_stress[key] = value.split(',');
            });
        }

        var isNew = false;
        if (!result.adversary_id)
        {
          // add a uniqueid
          result['adversary_id'] = generateUUID();
          result['adversary_owner_id'] = fatesheet.config.fbUserId;
          isNew = true;
        }

        //adversary_name is a key field, we're going to force this to title case
        result.adversary_name = result.adversary_name.toTitleCase();

        // clear empty values
        removeEmpty(result);

        if (isNew)
        {
          //create the adversary
          insertAdversary(result);
        }
        else {
          updateAdversary(result);
        }

        //refresh the list of adversaries
        setTimeout(fatesheet.listAdversaries($('#search-text').val()), 1000);
    }

    function insertAdversary(adversaryData) {

        var docClient = getDBClient();

        var params = {
            TableName: fatesheet.config.adversarytable,
            Key: {
             'adversary_owner_id': adversaryData.adversary_owner_id,
             'adversary_name': adversaryData.adversary_name
            },
        }

        // if this adversary already exists then warn and don't overwrite
        docClient.get(params, function(err, data) {
            if (err) {
              console.log("Error", err);
            } else {
              if (data.Item)
              {
                $.notify('You already have an adversary with this name.', 'danger');
              }
              else {
                  // create a new creature
                  var params = {
                      TableName: fatesheet.config.adversarytable,
                      Item: adversaryData
                  };

                  console.log("Adding a new item...");
                  docClient.put(params, function (err, data) {
                      if (err) {
                          $.notify(err.code, 'error');
                          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                      } else {
                          $.notify('Adversary added.', 'success');
                          console.log("Added item:", JSON.stringify(data, null, 2));
                          fatesheet.clearAdversaryForm();
                      }
                  });
              }
            }
        });


    }

    fatesheet.deleteAdversary = function(key) {
        var docClient = getDBClient();

        var params = {
            TableName: fatesheet.config.adversarytable,
            Key: key
        };

        console.log("Adding a new item...");
        docClient.delete(params, function (err, data) {
            if (err) {
                $.notify(err.code, 'error');
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                $('#modalDeleteAdversaryConfirm').modal('hide');
                $.notify('Adversary deleted.', 'success');

                setTimeout(fatesheet.listAdversaries($('#search-text').val()), 1000);
                fatesheet.clearAdversaryForm();

                $('.js-adversary-list').removeClass('hidden');
                $('#adversaryForm').addClass('hidden');

                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        });
    }

    function updateAdversary(data) {
        var docClient = getDBClient();

        var params = {
            TableName: fatesheet.config.adversarytable,
            Key: {
             'adversary_owner_id': data.adversary_owner_id,
             'adversary_name': $('#adversary_name').val() // it's disabled when we update so they don't try to change it.
            },
            UpdateExpression: "set adversary_aspects = :a, adversary_slug =:slg, adversary_consequences=:c, adversary_genre=:g, adversary_skills=:sk, adversary_stress=:str, adversary_stunts=:stn, adversary_system=:sys, adversary_type=:t",
            ExpressionAttributeValues:{
                ":a":data.adversary_aspects,
                ":slg": data.adversary_slug,
                ":c":data.adversary_consequences,
                ":g":data.adversary_genre,
                ":sk": data.adversary_skills,
                ":str": data.adversary_stress,
                ":stn": data.adversary_stunts,
                ":sys": data.adversary_system,
                ":t": data.adversary_type
            },
            ReturnValues:"UPDATED_NEW"
        };

        console.log("Adding a new item...");
        docClient.update(params, function (err, data) {
            if (err) {
                $.notify(err.code, 'error');
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                $.notify('Adversary updated.', 'success');
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
        });
    }

    fatesheet.clearAdversaryForm = function() {
      //clear the form
      $('#adversaryForm').trigger("reset");
      $('.adversary-item-copy', '#adversaryForm').remove();

      $('#adversary_id').val('');
      $('#adversary_owner_id').val('');
    }

    var fate_adversary_helpers = {
        stress: function (stressValue) {
            var stressboxes = '';
            $.each(stressValue, function (i, val) {
                stressboxes += "<input type='checkbox' value='" + val + "'>" + val + "&nbsp;";
            });
            return stressboxes;
        },
        fixLabel: function (val) {
            return val.replace(/_/g, ' ').replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });;
        },
        showOwnerControls: function(ownerid, name) {
          // if this is the owner then let them edit it
          if (fatesheet.config.fbUserId == ownerid) {
            return "<small><a href='#' class='js-edit-adversary d-print-none' data-owner-id='" + ownerid + "' data-adversary-name='" + name + "'><i class='fa fa-edit'></i></a></small>";
          }
        },
        isEmpty: function(obj) {
          for(var key in obj) {
              if(obj.hasOwnProperty(key))
                  return false;
          }
          return true;
        }
    };

    fatesheet.listAdversaries = function (searchText) {
          //make sure the search text is up to snuff
          $('#search-text').val(searchText);

          $.views.helpers(fate_adversary_helpers);

          // Create DynamoDB document client
          var docClient = getDBClient();

          var params = {
              TableName: fatesheet.config.adversarytable,
              Select: 'ALL_ATTRIBUTES'
          }

          //search
          if (searchText && searchText.length > 0) {
            params.ExpressionAttributeValues= {
              ':an': searchText,
              ':anl': searchText.toLowerCase(),
              ':anu': searchText.toUpperCase(),
              ':ant': searchText.toTitleCase(),
            };

            params.FilterExpression = '( contains (adversary_name, :an)';
            params.FilterExpression += ' OR contains (adversary_name, :anl)';
            params.FilterExpression += ' OR contains (adversary_name, :anu)';
            params.FilterExpression += ' OR contains (adversary_name, :ant)';

            params.FilterExpression += ' OR contains (adversary_aspects.high_concept, :an)';
            params.FilterExpression += ' OR contains (adversary_aspects.high_concept, :anl)';
            params.FilterExpression += ' OR contains (adversary_aspects.high_concept, :anu)';
            params.FilterExpression += ' OR contains (adversary_aspects.high_concept, :ant)';

            params.FilterExpression += ' OR contains (adversary_aspects.trouble, :an)';
            params.FilterExpression += ' OR contains (adversary_aspects.trouble, :anl)';
            params.FilterExpression += ' OR contains (adversary_aspects.trouble, :anu)';
            params.FilterExpression += ' OR contains (adversary_aspects.trouble, :ant)';

            params.FilterExpression += ' OR contains (adversary_aspects.other_aspects, :an)';
            params.FilterExpression += ' OR contains (adversary_aspects.other_aspects, :anl)';
            params.FilterExpression += ' OR contains (adversary_aspects.other_aspects, :anu)';
            params.FilterExpression += ' OR contains (adversary_aspects.other_aspects, :ant)';

            params.FilterExpression += ' OR contains (adversary_system, :an)';
            params.FilterExpression += ' OR contains (adversary_system, :anl)';
            params.FilterExpression += ' OR contains (adversary_system, :anu)';
            params.FilterExpression += ' OR contains (adversary_system, :ant)';

            params.FilterExpression += ' OR contains (adversary_type, :an)';
            params.FilterExpression += ' OR contains (adversary_type, :anl)';
            params.FilterExpression += ' OR contains (adversary_type, :anu)';
            params.FilterExpression += ' OR contains (adversary_type, :ant)';

            params.FilterExpression += ' OR contains (adversary_genre, :an)';
            params.FilterExpression += ' OR contains (adversary_genre, :anl)';
            params.FilterExpression += ' OR contains (adversary_genre, :anu)';
            params.FilterExpression += ' OR contains (adversary_genre, :ant)';

            params.FilterExpression += ' OR adversary_slug = :anl )';
          }

          //show only the current users adversaries if the box is checked
          if ($('#my_adversaries').is(':checked'))
          {
            if (!params.FilterExpression)
            {
              params.ExpressionAttributeValues = {':owner_id' : fatesheet.config.fbUserId };
              params.FilterExpression = 'adversary_owner_id = :owner_id';
            }
            else {
              params.ExpressionAttributeValues[':owner_id'] = fatesheet.config.fbUserId;
              params.FilterExpression += ' AND (adversary_owner_id = :owner_id)';
            }

          }

          docClient.scan(params, function (err, data) {
              if (err) {
                  console.log("Error", err);
              } else {
                  console.log("Success", data.Items);

                  //https://www.jsviews.com/
                  var template = $.templates("#tmpladversaryDetail");

                  //dynamodb doesn't order items, it's a NODB. WE'll manually tweak a few
                  // things to try and make them consistent
                  $.each(data.Items, function(i, v) {
                    if (v.adversary_aspects)
                    {
                      const orderedAspects = {};
                      if (v.adversary_aspects["high_concept"])
                        orderedAspects["high_concept"] = v.adversary_aspects["high_concept"];
                      if (v.adversary_aspects["trouble"])
                        orderedAspects["trouble"] = v.adversary_aspects["trouble"];
                      if (v.adversary_aspects["other_aspects"])
                        orderedAspects["other_aspects"] = v.adversary_aspects["other_aspects"];

                      v.adversary_aspects = orderedAspects;
                    }

                    const orderedSkills = {};
                    Object.keys(v.adversary_skills).sort().forEach(function(key) {
                      orderedSkills[key] = v.adversary_skills[key];
                    });
                    v.adversary_skills = orderedSkills;

                    const orderedConsequences = {};
                    Object.keys(v.adversary_consequences).sort().forEach(function(key) {
                      orderedConsequences[key] = v.adversary_consequences[key];
                    });
                    v.adversary_consequences = orderedConsequences;
                  });
                  var htmlOutput = template.render(data.Items, fate_adversary_helpers);
                  $("#adversaryDetail").html(htmlOutput);
              }
          });
        }

        fatesheet.editAdversary = function(ownerid, name) {
          $('#adversary_name').attr('disabled', true);

          $('.js-adversary-list').addClass('hidden');
          $('#adversaryForm').removeClass('hidden');

          // Create DynamoDB document client
          var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
          docClient.service.config.credentials = fatesheet.config.awsBucket.config.credentials;

          var params = {
              TableName: fatesheet.config.adversarytable,
              Key: {
               'adversary_owner_id': ownerid.toString(),
               'adversary_name': name
              },
          }

          docClient.get(params, function(err, data) {
              if (err) {
                console.log("Error", err);
              } else {
                console.log("Success", data.Item);

                fatesheet.clearAdversaryForm();
                populateAdversaryForm(data.Item);
              }
          });
        }

        function populateAdversaryForm(data) {
          $.each(data, function(name, val){
              if (typeof val === 'object')
              {
                switch(name) {
                  case 'adversary_aspects':
                    $.each(val, function(n, t) {
                      $('input[name="adversary_aspects[name]"][data-name=' + n + ']').next().val(t);
                    });
                    break;
                  default:
                    var objName = name.replace('_', '-');
                    for(var i=0;i<Object.keys(val).length-1;i++) {
                      fatesheet.addDeleteRow($(".js-" + objName + ":first").clone().addClass('adversary-item-copy').insertAfter(".js-" + objName +":last"));
                    }
                    $(".js-"+objName).each(function(i) {
                      $(this).find('input[name="'+ name +'[name]"]').val(Object.keys(val)[i]);
                      $(this).find('input[name="'+ name +'[value]"]').val(Object.values(val)[i]);
                      $(this).find('textarea[name="'+ name +'[value]"]').val(Object.values(val)[i]);
                    });
                    break;
                }
              }
              else {
                var $el = $('[name="'+name+'"]', '#adversaryForm');
                var type = $el.attr('type');

                switch(type){
                    default:
                        $el.val(val);
                }
              }
          });

          var slug = slugify(data.adversary_name);
          $('#adversary_slug').val(slug);
        }


        fatesheet.addDeleteRow = function($elem) {
          $('div:first', $elem).addClass('input-group-prepend')
            .append('<div class="input-group-text btn btn-danger js-delete-adversary-item"><i class="fa fa-trash"><i></div>');
        }

        fatesheet.adversaryAddSkills = function(aSkills) {
          $('.js-adversary-skills.adversary-item-copy', '#adversaryForm').remove();
          $('.js-adversary-skills input', '#adversaryForm').val('');

          for( var i = 0; i < aSkills.length-1; i++) {
            fatesheet.addDeleteRow($(".js-adversary-skills:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-skills:last"));
          };
          $.each($('.js-adversary-skills'), function(i, val) {
            $(this).find('input[name="adversary_skills[name]"]').val(aSkills[i]);
            $(this).find('input[name="adversary_skills[value]"]').val('');
          })
        }


        fatesheet.adversaryAddStress = function(aStress) {
          $('.js-adversary-stress.adversary-item-copy', '#adversaryForm').remove();
          $('.js-adversary-stress input', '#adversaryForm').val('');

          for( var i = 0; i < aStress.length-1; i++) {
            fatesheet.addDeleteRow($(".js-adversary-stress:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-stress:last"));
          };
          $.each($('.js-adversary-stress'), function(i, val) {
            $(this).find('input[name="adversary_stress[name]"]').val(aStress[i][0]);
            $(this).find('input[name="adversary_stress[value]"]').val(aStress[i][1]);
          })
        }

        fatesheet.adversaryAddConsequences = function(aConsequences) {
          $('.js-adversary-consequence.adversary-item-copy', '#adversaryForm').remove();
          $('.js-adversary-consequences input', '#adversaryForm').val('');
          $('.js-adversary-consequences textarea', '#adversaryForm').val('');

          for( var i = 0; i < aConsequences.length-1; i++) {
            fatesheet.addDeleteRow($(".js-adversary-consequence:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-consequence:last"));
          };
          $.each($('.js-adversary-consequence'), function(i, val) {
            $(this).find('input[name="adversary_consequences[name]"]').val(aConsequences[i][0]);
            $(this).find('textarea[name="adversary_consequences[value]"]').val(aConsequences[i][1]);
          })
        }

/***********************************
        CORE
***********************************/
    function domEvents() {
        $(document).on('click', '.js-delete-character', function (e) {
            e.preventDefault();

            var key = $(this).data('id');
            fatesheet.deleteCharacter(key);
        });

        $(document).on('click', '.js-delete-adversary', function (e) {
            e.preventDefault();

            var key = {
             'adversary_owner_id': fatesheet.config.fbUserId,
             'adversary_name': $('#adversary_name').val()
            }
            fatesheet.deleteAdversary(key);
        });

        $(document).on('click', '.js-create-character', function (e) {
            e.preventDefault();
            fatesheet.saveCharacter();
        });

        $(document).on('click', '.js-save-character', function (e) {
            e.preventDefault();
            fatesheet.saveCharacter();
        });

        $(document).on('keyup', '#search-text', function (event) {
            if (event.keyCode === 13) {
                $("#search-button").click();
            }
        });

        $(document).on('click', '.js-edit-adversary', function (e) {
            e.preventDefault();
            fatesheet.editAdversary($(this).data('owner-id'), $(this).data('adversary-name'));
        });

        $(document).on('click', '.js-clear-search', function (e) {
            $("#search-text").val('');
            $("#search-button").click();
        });

        $(document).on('click', '.js-add-skill', function (e) {
            fatesheet.addDeleteRow($(".js-adversary-skills:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-skills:last"));
        });

        $(document).on('click', '.js-add-skill-fae', function (e) {
            var aSkills = ['Careful','Clever','Flashy','Forceful','Quick','Sneaky'];
            fatesheet.adversaryAddSkills(aSkills);
        });

        $(document).on('click', '.js-add-skill-core', function (e) {
            var aSkills = ['(+1) Average','(+2) Fair','(+3) Good','(+4) Great','(+5) Superb', '(+6) Fantastic'];
            fatesheet.adversaryAddSkills(aSkills);
        });

        $(document).on('click', '.js-add-stunt', function (e) {
            fatesheet.addDeleteRow($(".js-adversary-stunts:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-stunts:last"));
        });

        $(document).on('click', '.js-add-stress', function (e) {
            fatesheet.addDeleteRow($(".js-adversary-stress:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-stress:last"));
        });

        $(document).on('click', '.js-add-stress-core', function (e) {
          var aStress = [["Physical","1,2,3"],["Mental","1,2,3"]]
          fatesheet.adversaryAddStress(aStress);
        });

        $(document).on('click', '.js-add-stress-fae', function (e) {
          var aStress = [["Stress","1,2,3"]]
          fatesheet.adversaryAddStress(aStress);
        });

        $(document).on('click', '.js-add-consequence', function (e) {
           var $item = $(".js-adversary-consequence:first").clone().addClass('adversary-item-copy').insertAfter(".js-adversary-consequence:last")
              $('div:first', $item).addClass('input-group-prepend')
                .append('<div class="input-group-text btn btn-danger js-delete-adversary-item">X</div>');
        });

        $(document).on('click', '.js-add-consequence-default', function (e) {
            var aConsequences = [["Mild","-2"],["Moderate","-4"],["Severe","-2"]]
            fatesheet.adversaryAddConsequences(aConsequences);
        });

        $(document).on('click', '.js-delete-adversary-item', function (e) {
            $(this).parent().parent().remove();
        });

        $(document).on('click', '.js-close-adversary-edit', function (e) {
          $('.js-adversary-list').removeClass('hidden');
          $('#adversaryForm').addClass('hidden');
        });

        $(document).on('click', '.js-create-adversary', function (e) {
          fatesheet.clearAdversaryForm();
          $('.js-adversary-list').addClass('hidden');
          $('#adversaryForm').removeClass('hidden');
          $('#adversary_name').attr('disabled', false);
        });

        $(document).on('click', '.js-adversary-tag', function (e) {
          $('#search-text').val($(this).data('search-text'));
          $("#search-button").click();
        });

        $(document).on('change', '#my_adversaries', function (e) {
          //this resets the whole results so clear the search text if it's not empty
          $('#search-text').val('');
          //refresh the adversary list
          fatesheet.listAdversaries($('#search-text').val());
        });

        $(document).on('change', '#adversary_name', function (e) {
          var slug = slugify($(this).val());
          $('#adversary_slug').val(slug);
        });

        $(document).on('submit', '#adversaryForm', function (e) {
            e.preventDefault();
            upsertAdversary();
        });

        $(document).on('show.bs.modal', '#modalDeleteCharacterConfirm', function (event) {
            var button = $(event.relatedTarget) // Button that triggered the modal
            var characterId = button.data('id') // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this);
            $(modal.find('.js-delete-character')).data('id', characterId);
          })

          $(document).on('show.bs.modal', '#modalDeleteAdversaryConfirm', function (event) {
              var modal = $(this);
          })

          $(document).on('click', '#search-button', function () {

  			  var searchText = $('#search-text').val(); // get the value of the input, which we filter on

    			fatesheet.search(searchText);
        });

    }

    /*!
        * Login to your application using Facebook.
        * Uses the Facebook SDK for JavaScript available here:
        * https://developers.facebook.com/docs/javascript/quickstart/
        */
    function authenticate() {
        //see if we're already logged into facebook
        try {
            FB.getLoginStatus(function (response) {
                console.log(response);
                if (response.status === 'connected') {
                    fatesheet.setupAuthorizedUser(response);
                } else {
                    fatesheet.setupUnAuthorizedUser();
                }
            }, true);
        }
        catch (ex) {
            if (ex.message === 'FB is not defined') {
                fatesheet.setupUnAuthorizedUser();
            }
            else {
                console.log(ex.message, ex);
                $.notify(ex.message, 'error');
            }
        }
    }

    fatesheet.setupUnAuthorizedUser = function () {
        fatesheet.config.isAuthenticated = false;

        // supply anonymous access credentials
        fatesheet.config.awsBucket.config.credentials = new AWS.Credentials('AKIAIHABKVJBZUFCVWLA', 'WA/7JhLy6SOS9G/XuG4DBu7zCvxRdLZhkY3ag2C5');

        var sts = new AWS.STS();
        sts.config.credentials = new AWS.Credentials('AKIAIHABKVJBZUFCVWLA', 'WA/7JhLy6SOS9G/XuG4DBu7zCvxRdLZhkY3ag2C5');
        sts.getSessionToken(function (err, data) {
            if (err) console.log("Error getting credentials");
            else {
                fatesheet.config.awsBucket.config.credentials = sts.credentialsFrom(data, fatesheet.config.awsBucket.config.credentials);
            }
        });

        $('.requires-auth').addClass('hidden');
        $('.requires-noauth').removeClass('hidden');

        // setup hashes and routes here so we have credentials set
        configureRoutes();
    }

    fatesheet.setupAuthorizedUser = function (response) {
        fatesheet.config.isAuthenticated = true;

        fatesheet.config.awsBucket.config.credentials = new AWS.WebIdentityCredentials({
            ProviderId: 'graph.facebook.com',
            RoleArn: fatesheet.config.roleArn,
            WebIdentityToken: response.authResponse.accessToken
        });
        fatesheet.config.fbUserId = response.authResponse.userID;
        $('.requires-auth').removeClass('hidden');
        $('.requires-noauth').addClass('hidden');

        // setup hashes and routes here so we have credentials set
        configureRoutes();
    }

    fatesheet.logout = function () {
        FB.logout(function (response) {
            fatesheet.setupUnAuthorizedUser();
        });
    };

    fatesheet.authenticateFacebook = function () {
        FB.login(function (response) {
            fatesheet.setupAuthorizedUser(response);
        })
    }

    fatesheet.setupForEnvironment = function (env) {
        fatesheet.config.environment = env;

        switch (env) {
            case 'develop':
                fatesheet.config.fbUserId = '1764171710312177';
                fatesheet.config.adversarytable = 'fate_adversary';
                fatesheet.config.awsBucket = new AWS.S3({
                    params: {
                        Bucket: 'fatecharactersheet'
                    }
                });
                $('body').prepend('<h1 class="d-print-none">DEVELOPMENT</h1>');

                fatesheet.init();
                break;

            case 'beta':
                fatesheet.config.adversarytable = 'fate_adversary_dev';
                fatesheet.config.awsBucket = new AWS.S3({
                    params: {
                        Bucket: 'fatecharactersheet'
                    }
                });
                $('body').prepend('<h1 class="d-print-none">BETA</h1>');

                //auth facebook
                $.ajaxSetup({ cache: true });
                $.getScript('https://connect.facebook.net/en_US/sdk.js', function () {
                    FB.init({
                        appId: fatesheet.config.appId,
                        status: true,
                        cookie: true,
                        xfbml: true,
                        oauth: true,
                        version: 'v2.12'
                    });
                    fatesheet.init();
                });
                break;

            default:
                fatesheet.config.adversarytable = 'fate_adversary';
                fatesheet.config.awsBucket = new AWS.S3({
                    params: {
                        Bucket: 'fatecharactersheet.com'
                    }
                });

                //auth facebook
                $.ajaxSetup({ cache: true });
                $.getScript('https://connect.facebook.net/en_US/sdk.js', function () {
                    FB.init({
                        appId: fatesheet.config.appId,
                        autoLogAppEvents: true,
                        status: true,
                        cookie: true,
                        xfbml: true,
                        oauth: true,
                        version: 'v2.12'
                    });

                    FB.AppEvents.logPageView();

                    fatesheet.init();
                });
                break;
        }

    }


    function configureRoutes() {
        //String rule with param:
        //match '/news/123' passing "123" as param to handler

        if (location.pathname === '/charactersheets.htm') {
            var route3 = crossroads.addRoute('/{id}', function (id) {
                fatesheet.showSheet(id, null);
            });

            var route4 = crossroads.addRoute('/', function () {
                fatesheet.listSheets();
            });
        }

        if (location.pathname === '/characters.htm') {
            var route1 = crossroads.addRoute('/{sheetid}/{id}', function (sheetid, id) {
                fatesheet.showSheet(sheetid, id)
            });

            var route2 = crossroads.addRoute('/', function () {
                fatesheet.listCharacters();
            });
        }

        if (location.pathname === '/adversary.htm') {
            var route1 = crossroads.addRoute('/', function () {
                fatesheet.listAdversaries();
            });

            var route2 = crossroads.addRoute('/{slug}', function (slug) {
                fatesheet.listAdversaries(slug);
            });
        }


        hasher.prependHash = '!'; //for proper google crawling
        hasher.initialized.add(parseHash); //parse initial hash
        hasher.changed.add(parseHash); //parse hash changes
        hasher.init(); //start listening for history change


        // default to the character sheet list if we don't have a hash to go to
        if (!hasher.getHash()) {
        //    hasher.setHash('/');
        }

    }

    //setup hasher
    function parseHash(newHash, oldHash) {
        crossroads.parse(newHash);
    }

    fatesheet.init = function () {
      // load the navigation
      $("nav").load("nav.htm", function() {
        // initialize the application
        domEvents();
        configAWS();
        authenticate();
  		});
    }

})(window.fatesheet = window.fatesheet || {}, jQuery);

$(function () {

    switch (window.location.host) {
        case 'localhost:8080':
            fatesheet.setupForEnvironment('develop');
            break;

        case 'fatecharactersheet.s3-website-us-east-1.amazonaws.com':
            fatesheet.setupForEnvironment('beta');
            break;

        default:
            fatesheet.setupForEnvironment('production');
            break;
    }
});

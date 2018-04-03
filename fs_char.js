
/***********************************
        CHARACTERS & SHEETS
***********************************/
(function (fs_char, $, undefined) {
    fs_char.config = {
        charactersheettable: '',
        charactertable: '',
    }

    fs_char.navigation = {
        character: {
            auth: "<hr/><div class='row'><div class='col'>" +
                        "   <button type='button' class='btn btn-success js-save-character d-print-none'>Save Character <i class='fa fa-save'></i></button>" +
                        "   <button type='button' class='btn btn-secondary' onclick='hasher.setHash(\"/\");'>Close <i class='fa fa-times-circle'></i></button>" +
                        "   <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                        "</div></div>",
            noauth: "<hr/><div class='row'><div class='col'>" +
            "   <button type='button' class='btn btn-secondary' onclick='hasher.setHash(\"/\");'>Close <i class='fa fa-times-circle'></i></button>" +
                        "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                        "</div></div>",

        },
        sheet: {
            auth: "<hr/><div class='row'><div class='col'>" +
                   "    <button type='button' class='btn btn-success js-create-character d-print-none'>Save Character <i class='fa fa-user'></i></button>" +
                   "   <button type='button' class='btn btn-secondary' onclick='hasher.setHash(\"/\");'>Close <i class='fa fa-times-circle'></i></button>" +
                   "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                   "</div></div>",
            noauth: "<hr/><div class='row'><div class='col'>" +
            "   <button type='button' class='btn btn-secondary' onclick='hasher.setHash(\"/\");'>Close <i class='fa fa-times-circle'></i></button>" +
                    "    <button type='button' class='btn btn-default d-print-none' onclick='window.print();'>Print Character <i class='fa fa-print'></i></button>" +
                    "</div></div>",
        }

    }

    function getDBClient()  {
      return fatesheet.getDBClient();
    }

    fs_char.listSheets = function ($contentElem) {
        /// show a list of available character sheets
        $contentElem.empty();

        // Create DynamoDB document client
        var docClient = getDBClient();

        var params = {
            TableName: fs_char.config.charactersheettable,
            Select: 'ALL_ATTRIBUTES'
        }

        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Items);

                //https://www.jsviews.com/
                var template = $.templates("#tmplCharacterSheetList");

                //list the sheets
                $contentElem.append("<div class='card-columns'></div>");
                data.Items.forEach(function (obj) {
                  var sheet = template.render(obj);
                  $('.card-columns', $contentElem).append(sheet);
                });
            }
        });
    }

    function getCharacterIdFromKey(key) {
        return key.replace(/^.*[\\\/]/, '').replace('.character', '');
    }

    function getCharacterInfo(id) {
      // Create DynamoDB document client
      var docClient = getDBClient();

      var params = {
          TableName: fs_char.config.charactertable,
          Key: {
            'character_owner_id': fatesheet.config.userId,
            'character_id': id
          },
      }

      docClient.get(params, function (err, data) {
          if (err) {
              console.log("Error", err);
          } else {
              console.log("Success", data.Item);

              $('form').populate(data.Item);

              //check if there is an autocalc function and runit
              if (typeof autocalc !== "undefined") {
                  autocalc();
              }
          }
      });
    }

    fs_char.listCharacters = function ($contentElem) {

        /// show a list of the users characters
        $contentElem.empty();

        $('.hide-on-detail').removeClass('hidden');

        // Create DynamoDB document client
        var docClient = getDBClient();

        var params = {
            TableName: fs_char.config.charactertable,
            Select: 'ALL_ATTRIBUTES',
            ExpressionAttributeValues: {':owner_id' : fatesheet.config.userId },
            FilterExpression: 'character_owner_id = :owner_id'
        }

        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Items);

                //https://www.jsviews.com/
                var template = $.templates("#tmplCharacterList");

                //list the sheets
                $contentElem.append("<div class='card-columns'></div>");
                data.Items.forEach(function (obj) {
                  var character = template.render(obj);
                  $('.card-columns', $contentElem).append(character);
                });
            }
        });
    }

    fs_char.showSheet = function (id, character, $contentElem) {

        $('.hide-on-detail').addClass('hidden');

        // if we are showing a blank sheet then null out the character
        // so we properly create a new one if needed
        if (!character) {
          fs_char.config.characterId = null;
        }
        else {
          fs_char.config.characterId = character;
        }

        /// show a list of available character sheets
        $contentElem.empty();

        // Create DynamoDB document client
        var docClient = getDBClient();

        var params = {
            TableName: fs_char.config.charactersheettable,
            Key: {
             'charactersheetname': id
            },
        }

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Item);
                $contentElem.html(data.Item.charactersheetcontent);

                // add navigation
                if (character != null) {
                    getCharacterInfo(character);
                    fatesheet.addNav(fs_char.navigation.character);
                }
                else {
                    fatesheet.addNav(fs_char.navigation.sheet);
                }
            }
        });
    }

    fs_char.saveCharacter = function () {
        if (fatesheet.config.isAuthenticated) {
            /// save a character
            var data = $('form').serializeJSON();
            var characterData = JSON.parse(data);

            // make sure we have a proper user id key
            characterData.character_owner_id = fatesheet.config.userId;

            //create a new characterId if we don't have one
            var isNew = false;
            if (!fs_char.config.characterId) {
                isNew = true;
                fs_char.config.characterId = fatesheet.generateUUID();
                fatesheet.logAnalyticEvent('createdACharacter' + characterData.sheetname);
            }
            characterData.character_id = fs_char.config.characterId;

            //dynamodb won't let us have empty attributes
            fatesheet.removeEmptyObjects(characterData);

            var docClient = getDBClient();

            // create/update a  character
            // we always use the put operation because the data can change depending on your character sheet
            var params = {
                TableName: fs_char.config.charactertable,
                Item: characterData
            };

            docClient.put(params, function (err, data) {
                if (err) {
                    $.notify(err.code, 'error');
                    console.error("Unable to save item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    $.notify('Character saved.', 'success');
                    console.log("Added item:", JSON.stringify(data, null, 2));

                }
            });
        }
        else {
            window.print();
        }
    }

    fs_char.deleteCharacter = function (characterId) {
      var docClient = getDBClient();

      var params = {
          TableName: fs_char.config.charactertable,
          Key: {
            'character_owner_id': fatesheet.config.userId,
            'character_id': characterId
          }
      };

      console.log("Deleting a character...");
      docClient.delete(params, function (err, data) {
          if (err) {
              $.notify(err.code, 'error');
              console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              $('#modalDeleteCharacterConfirm').modal('hide');
              $.notify('Character deleted.', 'success');
              console.log("Added item:", JSON.stringify(data, null, 2));

              //back to the character list screen
              setTimeout(fs_char.listCharacters(fatesheet.config.content), 1000);
          }
      });
    }

    function domEvents() {
        $(document).on('click', '.js-delete-character', function (e) {
            e.preventDefault();

            var key = $(this).data('id');
            fs_char.deleteCharacter(key);
        });

        $(document).on('click', '.js-create-character', function (e) {
            e.preventDefault();
            fs_char.saveCharacter();
        });

        $(document).on('click', '.js-save-character', function (e) {
            e.preventDefault();
            fs_char.saveCharacter();
        });

        $(document).on('show.bs.modal', '#modalDeleteCharacterConfirm', function (event) {
            var button = $(event.relatedTarget) // Button that triggered the modal
            var characterId = button.data('id') // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this);
            $(modal.find('.js-delete-character')).data('id', characterId);
        });
    }

    function configEnvironment(env) {
      switch (env) {
          case 'develop':
          case 'beta':
              fs_char.config.charactersheettable = 'fate_charactersheet_dev';
              fs_char.config.charactertable = 'fate_character_dev';
              break;

          default:
              fs_char.config.charactersheettable = 'fate_charactersheet';
              fs_char.config.charactertable = 'fate_character';
      }
    }

    function configureRoutes() {
        //String rule with param:
        //match '/news/123' passing "123" as param to handler

        if (location.pathname === '/charactersheets.htm') {
            var csRoute1 = crossroads.addRoute('/{id}', function (id) {
                var title = id.replace(/-/g,' ').toTitleCase();
                fatesheet.setTitle(title);

                // update metadata based on the sheet
                var ogImage = 'https://fatecharactersheet.com/' + id + '/sheets/logo.png';

                $('meta[property="og:title"]').attr('content', title);
                $('meta[property="og:image"]').attr('content', ogImage);
                $('meta[property="og:url"]').attr('content', window.location.href);


                fs_char.showSheet(id, null, fatesheet.config.content);
            });

            var csRoute2 = crossroads.addRoute('/', function () {
                fatesheet.setTitle('Character Sheets');

                // update metadata based on the sheet
                var ogImage = "https://fatecharactersheet.com/big-logo.png";

                $('meta[property="og:title"]').attr('content', 'Character Sheets');
                $('meta[property="og:image"]').attr('content', ogImage);
                $('meta[property="og:url"]').attr('content', window.location.href);

                fs_char.listSheets(fatesheet.config.content);
            });
        }

        if (location.pathname === '/characters.htm') {
            var charRoute1 = crossroads.addRoute('/{sheetid}/{id}', function (sheetid, id) {
                fs_char.showSheet(sheetid, id, fatesheet.config.content)
            });

            var charRoute2 = crossroads.addRoute('/', function () {
                fs_char.listCharacters(fatesheet.config.content);
            });
        }

    }

    fs_char.init = function () {
        domEvents();
        configEnvironment(fatesheet.config.environment);
        configureRoutes();
    }

})(window.fs_char = window.fs_char || {}, jQuery);

$(function () {
  fs_char.init();
});

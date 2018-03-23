

/***********************************
  CORE FateCharacterSheet Library
***********************************/

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
        userId: null,
        diceRoller: new DiceRoller(),
        adversarytable: '',
    }

    function configAWS() {
        AWS.config.region = 'us-east-1';
    }

    fatesheet.getDBClient = function() {
      // Create DynamoDB document client
      var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
      docClient.service.config.credentials = fatesheet.config.credentials;

      return docClient;
    }

    /***********************************
            DICE TRAY
    ***********************************/

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

    fatesheet.addNav = function(navBar) {
        /// add nav bars to a character sheet so we know what actions are available
        $('.sheet', fatesheet.config.content).append(fatesheet.config.isAuthenticated ? navBar.auth : navBar.noauth);
        $('.sheet', fatesheet.config.content).wrap('<form></form>')
    }


    fatesheet.generateUUID = function() { // Public Domain/MIT
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

    fatesheet.generateShortUID = function() {
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

    function domEvents() {

        $(document).on('keyup', '#search-text', function (event) {
            if (event.keyCode === 13) {
                $("#search-button").click();
            }
        });

        $(document).on('click', '.js-clear-search', function (e) {
            $("#search-text").val('');
            $("#search-button").click();
        });

        $(document).on('click', '#search-button', function () {
          var searchText = $('#search-text').val(); // get the value of the input, which we filter on
          fatesheet.search(searchText);
        });
    }

    fatesheet.logAnalyticEvent = function(event) {
      if (FB)
      {
        FB.AppEvents.logEvent('createdACharacter' + characterData.sheetname);
      }
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
        fs_adversary.listAdversaries(searchText); //adversary search
    	}

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
        fatesheet.config.credentials = new AWS.Credentials('AKIAIHABKVJBZUFCVWLA', 'WA/7JhLy6SOS9G/XuG4DBu7zCvxRdLZhkY3ag2C5');

        var sts = new AWS.STS();
        sts.config.credentials = new AWS.Credentials('AKIAIHABKVJBZUFCVWLA', 'WA/7JhLy6SOS9G/XuG4DBu7zCvxRdLZhkY3ag2C5');
        sts.getSessionToken(function (err, data) {
            if (err) console.log("Error getting credentials");
            else {
                fatesheet.config.credentials = sts.credentialsFrom(data, fatesheet.config.credentials);
            }
        });

        $('.requires-auth').addClass('hidden');
        $('.requires-noauth').removeClass('hidden');

        // setup hashes and routes here so we have credentials set
        configureRoutes();
    }

    fatesheet.setupAuthorizedUser = function (response) {
        fatesheet.config.isAuthenticated = true;

        fatesheet.config.credentials = new AWS.WebIdentityCredentials({
            ProviderId: 'graph.facebook.com',
            RoleArn: fatesheet.config.roleArn,
            WebIdentityToken: response.authResponse.accessToken
        });
        fatesheet.config.userId = response.authResponse.userID;
        $('.requires-auth').removeClass('hidden');
        $('.requires-noauth').addClass('hidden');

        // setup hashes and routes here so we have credentials set
        configureRoutes();
    }

    fatesheet.logout = function () {
        FB.logout(function (response) {
            fatesheet.setupUnAuthorizedUser();
        });
        document.location.href = 'home.htm';
    };

    fatesheet.authenticateFacebook = function () {
        FB.login(function (response) {
            fatesheet.setupAuthorizedUser(response);
        });
        document.location.href = 'home.htm';
    }

    fatesheet.setupForEnvironment = function (env) {
        fatesheet.config.environment = env;

        switch (env) {
            case 'develop':
                fatesheet.config.userId = '1764171710312177';
                fatesheet.config.adversarytable = 'fate_adversary_dev';
                $('body').prepend('<h1 class="d-print-none">DEVELOPMENT</h1>');

                fatesheet.init();
                break;

            case 'beta':
                fatesheet.config.adversarytable = 'fate_adversary_dev';
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

        switch(location.pathname)
        {
          case '/home.htm':
            break;
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

var server = 'localhost';
var BOSH_SERVICE = 'http://ubox19:7075/http-bind/';
var ROOM = 'localhost@conference.' + server;
var ROOM_SERVICE = 'conference.' + server;
var connection = null;

function log(msg) {
    $('#log').append('<div></div>').append(document.createTextNode(msg));
    console.log(msg);
}

function onConnect(status) {
    if (status == Strophe.Status.CONNECTING) {
        log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
        log('Strophe failed to connect.');
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
        log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
        log('Strophe is disconnected.');
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
        log('Strophe is connected.');
        log(`${$('#jid').get(0).value}`)
        $('#to').get(0).value = connection.jid; // full JID
        fetchChatHistory($('#jid').get(0).value); // for chat purpose
        // set presence
        connection.send($pres());
        // set handlers
        connection.addHandler(onMessage, null, 'message', null, null, null);
        connection.addHandler(onSubscriptionRequest, null, "presence", "subscribe");
        connection.addHandler(onPresence, null, "presence");
    }
}

function onMessage(msg) {
    var to = msg.getAttribute('to');
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');

    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        log('CHAT: I got a message from ' + from + ': ' + Strophe.getText(body));
    }
    // we must return true to keep the handler alive.  
    // returning false would remove it after it finishes.
    return true;
}

function sendMessage(msg) {
    log('CHAT: Send a message to ' + $('#to').get(0).value + ': ' + msg);

    var m = $msg({
        to: $('#to').get(0).value,
        from: $('#jid').get(0).value,
        type: 'chat'
    }).c("body").t(msg);
    connection.send(m);
}

function onPresence(presence) {
    log('onPresence:');
    var presence_type = $(presence).attr('type');
    var from = $(presence).attr('from');
    if (!presence_type) presence_type = "online";
    log(' >' + from + ' --> ' + presence_type);
    if (presence_type != 'error') {
        if (presence_type === 'unavailable') {
            // Making contact as offline
        } else {
            var show = $(presence).find("show").text();
            if (show === 'chat' || show === '') {
                // Making contact as online
            } else {
                // etc...
            }
        }
    }
    return true;
}

function rawInput(data) {
    console.log('RECV: ' + data);

    // Parse the XML data
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'application/xml');
    const forwardedElements = xmlDoc.querySelectorAll('forwarded');

    // Process each forwarded element
    forwardedElements.forEach((forwardedElement, index) => {
        const delayElement = forwardedElement.querySelector('delay');
        const timestamp = delayElement ? delayElement.getAttribute('stamp') : 'N/A';

        const messageElement = forwardedElement.querySelector('message');
        const from = messageElement.getAttribute('from');
        const to = messageElement.getAttribute('to');
        const bodyElement = messageElement.querySelector('body');
        const body = bodyElement ? bodyElement.textContent : '';

        // Display the message information
        if (from) {
            console.log(`Message ${index + 1}: From ${from}, TO ${to}, Timestamp: ${timestamp}, Body: ${body}`);
        }
    });
}
function rawOutput(data) {
    console.log('SENT: ' + data);
}

$(document).ready(function () {

    $('#jid').get(0).value = "arjit@ubox19";
    $('#pass').get(0).value = "arjit";

    $('#connect').bind('click', function () {
        var url = BOSH_SERVICE;
        connection = new Strophe.Connection(url);
        connection.rawInput = rawInput;
        connection.rawOutput = rawOutput;
        var button = $('#connect').get(0);
        if (button.value == 'connect') {
            button.value = 'disconnect';
            connection.connect($('#jid').get(0).value, $('#pass').get(0).value, onConnect);
        } else {
            button.value = 'connect';
            connection.disconnect();
        }
    });

    $('#send').bind('click', function () {
        var msg = $('#msg').val();
        sendMessage(msg);
    });
});
//==================================FETCHING CHATS=============================
function fetchChatHistory(jid) {
    const iq = $iq({
        type: 'set',
        id: 'fetch-history'
    }).c('query', { xmlns: 'urn:xmpp:mam:2', queryid: 'fetch-history' })
        .c('x', { xmlns: 'jabber:x:data', type: 'submit' })
        .c('field', { 'var': 'FORM_TYPE', type: 'hidden' })
        .c('value').t('urn:xmpp:mam:2').up().up()
        .c('set', { xmlns: 'http://jabber.org/protocol/rsm' })
        .c('max').t('30').up()  // Maximum number of messages to retrieve
        .c('with').t(jid);  // JID for which you want to fetch history
    connection.sendIQ(iq, onFetchHistoryResponse);
    
}

function onFetchHistoryResponse(iq) {
    const forwardedMessages = iq.querySelectorAll('result forwarded message');
    console.log('Chat History:');

    forwardedMessages.forEach((message, index) => {
        const from = message.getAttribute('from');
        const body = message.querySelector('body').textContent;

        console.log(`Message ${index + 1}: From ${from}, Body: ${body}`);
    });
}


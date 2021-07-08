agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
agent.add(new Card({
    title: `Title: this is a card title`,
    imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    buttonText: 'This is a button',
    buttonUrl: 'https://assistant.google.com/'
  })
);
agent.add(new Suggestion(`Quick Reply`));
agent.add(new Suggestion(`Suggestion`));

    // function welcome(agent) {
    //     var payloadData = {
    //         "richContent": [
    //           [
    //             {
    //               "type": "accordion",
    //               "title": "Accordion title",
    //               "subtitle": "Accordion subtitle",
    //               "image": {
    //                 "src": {
    //                   "rawUrl": "https://example.com/images/logo.png"
    //                 }
    //               },
    //               "text": "Accordion text"
    //             }
    //           ]
    //         ]
    //       }

    //       agent.add(new Payload(agent.UNSPECIFIED, payloadData, {sendAsMessage: true, rawPayLoad: true}));
    // }

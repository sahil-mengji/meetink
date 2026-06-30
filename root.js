const data = [
    {
        "speaker": "Prisha",
        "start": 3.274,
        "end": 6.514,
        "text": "their own input, it's not like they'll tell that.",
        "raw_text": "<v Prisha Behera>their own input,\nit's not like they'll tell that.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 7.874,
        "end": 8.434,
        "text": "Oh.",
        "raw_text": "<v Prisha Behera>Oh.</v>"
    },
    {
        "speaker": "Anish",
        "start": 8.034,
        "end": 10.5,
        "text": "Okay, and then when they're testing or this one",
        "raw_text": "<v Anish Sai Nimmagadda>Okay,\nand then when they're testing or this one,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 9.714,
        "end": 10.674,
        "text": "To try something.",
        "raw_text": "<v Prisha Behera>To try something.</v>"
    },
    {
        "speaker": "Anish",
        "start": 10.5,
        "end": 13.722,
        "text": "they'll test it on the, like they'll test it on the inputs that",
        "raw_text": "<v Anish Sai Nimmagadda>they'll test it on the,\nlike they'll test it on the inputs that</v>"
    },
    {
        "speaker": "Anish",
        "start": 13.722,
        "end": 16.994,
        "text": "we've told them the format or whatever that we're trying to use.",
        "raw_text": "<v Anish Sai Nimmagadda>we've told them the format or whatever\nthat we're trying to use.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 17.794,
        "end": 20.274,
        "text": "Yeah, like they said that they might ask",
        "raw_text": "<v Prisha Behera>Yeah,\nlike they said that they might ask</v>"
    },
    {
        "speaker": "Prisha",
        "start": 20.274,
        "end": 23.662,
        "text": "questions like, okay, if the format input is like this",
        "raw_text": "<v Prisha Behera>questions like, okay,\nif the format input is like this,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 23.662,
        "end": 27.474,
        "text": "then how will your product or like, , react, but then.",
        "raw_text": "<v Prisha Behera>then how will your product or like,\nyou know, react, but then.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 28.594,
        "end": 30.434,
        "text": "They won't test it.",
        "raw_text": "<v Prisha Behera>They won't actually test it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 31.394,
        "end": 34.114,
        "text": "So if they do ask, we don't have an answer for that, I know.",
        "raw_text": "<v Anish Sai Nimmagadda>So if they do ask,\nwe don't have an answer for that, I know.</v>"
    },
    {
        "speaker": "Anish",
        "start": 36.354,
        "end": 36.674,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 43.714,
        "end": 45.114,
        "text": "Just give me one second.",
        "raw_text": "<v Anish Sai Nimmagadda>Just give me one second.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 54.994,
        "end": 58.935,
        "text": "She told about the nature of the input, like example",
        "raw_text": "<v Sahil Mengji>She told about the nature of the input,\nlike example,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 58.935,
        "end": 62.877,
        "text": "if there is a very long meeting, like expire 6 hours",
        "raw_text": "<v Sahil Mengji>if there is a very long meeting,\nlike expire 6 hours,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 62.877,
        "end": 64.994,
        "text": "how well it is doing its job.",
        "raw_text": "<v Sahil Mengji>how well it is doing its job.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 66.474,
        "end": 68.114,
        "text": "It told us to demonstrate that.",
        "raw_text": "<v Sahil Mengji>It told us to demonstrate that.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 69.434,
        "end": 69.554,
        "text": "Yeah.",
        "raw_text": "<v Sahil Mengji>Yeah.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 72.394,
        "end": 73.314,
        "text": "I am not audible.",
        "raw_text": "<v Sahil Mengji>I am not audible.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 77.634,
        "end": 77.954,
        "text": "Yeah.",
        "raw_text": "<v Sahil Mengji>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 149.834,
        "end": 154.622,
        "text": "Do we have any idea about how we're going to break the multi-topic meetings into",
        "raw_text": "<v Anish Sai Nimmagadda>Do we have any idea about how we're going\nto break the multi-topic meetings into</v>"
    },
    {
        "speaker": "Anish",
        "start": 154.622,
        "end": 157.874,
        "text": "themes or whatever they said in the problem statement?",
        "raw_text": "<v Anish Sai Nimmagadda>themes or whatever they said in the\nproblem statement?</v>"
    },
    {
        "speaker": "Anish",
        "start": 162.434,
        "end": 162.554,
        "text": "Yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 170.114,
        "end": 175.474,
        "text": "So, for dividing into topics, I think I have only seen about LLM.",
        "raw_text": "<v Gurram Vamsi Krishna>So, for dividing into topics,\nI think I have only seen about LLM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 176.434,
        "end": 178.594,
        "text": "Calling an LLM and dividing it into topics.",
        "raw_text": "<v Gurram Vamsi Krishna>Calling an LLM and dividing it into\ntopics.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 179.874,
        "end": 185.874,
        "text": "And there is no particular algorithm that can perfectly do this, so we can use LLM.",
        "raw_text": "<v Gurram Vamsi Krishna>And there is no particular algorithm that\ncan perfectly do this, so we can use LLM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 186.914,
        "end": 188.194,
        "text": "Okay, okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 190.674,
        "end": 191.154,
        "text": "So...",
        "raw_text": "<v Anish Sai Nimmagadda>So...</v>"
    },
    {
        "speaker": "Anish",
        "start": 192.114,
        "end": 195.676,
        "text": "I think one, at least we should get a hint from the",
        "raw_text": "<v Anish Sai Nimmagadda>I think one,\nat least we should get a hint from the</v>"
    },
    {
        "speaker": "Anish",
        "start": 195.676,
        "end": 199.718,
        "text": "meeting name, right? A lot of times meetings have at least",
        "raw_text": "<v Anish Sai Nimmagadda>meeting name, right?\nA lot of times meetings have at least</v>"
    },
    {
        "speaker": "Anish",
        "start": 199.718,
        "end": 204.034,
        "text": "relevant names in order to further classify the topics, right?",
        "raw_text": "<v Anish Sai Nimmagadda>relevant names in order to further\nclassify the topics, right?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 206.834,
        "end": 211.954,
        "text": "Meeting name, OK.",
        "raw_text": "<v Gurram Vamsi Krishna>Meeting name, OK.</v>"
    },
    {
        "speaker": "Anish",
        "start": 209.794,
        "end": 213.168,
        "text": "If it is useful, then we should have a, we should use it, correct?",
        "raw_text": "<v Anish Sai Nimmagadda>If it is useful, then we should have a,\nwe should use it, correct?</v>"
    },
    {
        "speaker": "Anish",
        "start": 213.168,
        "end": 216.795,
        "text": "Like if it says that, okay, hey, the meeting is going to be about this",
        "raw_text": "<v Anish Sai Nimmagadda>Like if it says that, okay, hey,\nthe meeting is going to be about this,</v>"
    },
    {
        "speaker": "Anish",
        "start": 216.795,
        "end": 220.724,
        "text": "then at least you can get a rough idea about what your meeting topics may be",
        "raw_text": "<v Anish Sai Nimmagadda>then at least you can get a rough idea\nabout what your meeting topics may be,</v>"
    },
    {
        "speaker": "Anish",
        "start": 220.724,
        "end": 223.394,
        "text": "even before any discussion has taken place.",
        "raw_text": "<v Anish Sai Nimmagadda>even before any discussion has actually\ntaken place.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 223.794,
        "end": 228.348,
        "text": "Yeah, we can include that in our input, but what if they ask why did you include",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, we can include that in our input,\nbut what if they ask why did you include</v>"
    },
    {
        "speaker": "Gurram",
        "start": 228.348,
        "end": 232.959,
        "text": "in the in your input that you are already providing something like the meeting is",
        "raw_text": "<v Gurram Vamsi Krishna>in the in your input that you are already\nproviding something like the meeting is</v>"
    },
    {
        "speaker": "Sahil",
        "start": 229.194,
        "end": 229.314,
        "text": "Yeah.",
        "raw_text": "<v Sahil Mengji>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 232.074,
        "end": 235.443,
        "text": "No, no, so, so you can have a, you can have a suppose",
        "raw_text": "<v Anish Sai Nimmagadda>No, no, so, so you can have a,\nyou can have a suppose,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 232.959,
        "end": 233.634,
        "text": "going to be?",
        "raw_text": "<v Gurram Vamsi Krishna>going to be?</v>"
    },
    {
        "speaker": "Anish",
        "start": 235.443,
        "end": 238.812,
        "text": "so like you can have like a whatever if state.",
        "raw_text": "<v Anish Sai Nimmagadda>so like you can have like a whatever if\nstate. I mean,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 236.834,
        "end": 237.154,
        "text": "There.",
        "raw_text": "<v Gurram Vamsi Krishna>There.</v>"
    },
    {
        "speaker": "Anish",
        "start": 238.812,
        "end": 241.507,
        "text": "I I don't know how we'd code this",
        "raw_text": "<v Anish Sai Nimmagadda>I I don't know how we'd actually code\nthis,</v>"
    },
    {
        "speaker": "Anish",
        "start": 241.507,
        "end": 244.938,
        "text": "but suppose suppose the meeting name was useful enough",
        "raw_text": "<v Anish Sai Nimmagadda>but suppose suppose the meeting name was\nuseful enough,</v>"
    },
    {
        "speaker": "Anish",
        "start": 244.938,
        "end": 249.716,
        "text": "like suppose it's like 4:30 meeting, then obviously don't use it as an input",
        "raw_text": "<v Anish Sai Nimmagadda>like suppose it's like 4:30 meeting,\nthen obviously don't use it as an input,</v>"
    },
    {
        "speaker": "Anish",
        "start": 249.716,
        "end": 251.554,
        "text": "but suppose it had more depth.",
        "raw_text": "<v Anish Sai Nimmagadda>but suppose it had more depth.</v>"
    },
    {
        "speaker": "Anish",
        "start": 251.714,
        "end": 253.794,
        "text": "to it, then we could probably use it, right?",
        "raw_text": "<v Anish Sai Nimmagadda>to it, then we could probably use it,\nright?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 254.714,
        "end": 258.306,
        "text": "Yeah, yeah, using it is not a problem, but who provided it?",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, yeah, using it is not a problem,\nbut who provided it?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 256.274,
        "end": 256.514,
        "text": "S.",
        "raw_text": "<v Sahil Mengji>S.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 258.306,
        "end": 261.598,
        "text": "So if we provided that in our input, what if they ask",
        "raw_text": "<v Gurram Vamsi Krishna>So if we provided that in our input,\nwhat if they ask,</v>"
    },
    {
        "speaker": "Anish",
        "start": 260.114,
        "end": 265.314,
        "text": "Oh, okay, like that. Got it, got it. , understood, understood.",
        "raw_text": "<v Anish Sai Nimmagadda>Oh, okay, like that. Got it, got it. Hmm,\nunderstood, understood.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 261.598,
        "end": 263.874,
        "text": "why did you provide that in the input?",
        "raw_text": "<v Gurram Vamsi Krishna>why did you provide that in the input?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 266.674,
        "end": 267.154,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 266.754,
        "end": 269.954,
        "text": "So we have only the transcription to the meeting itself, right?",
        "raw_text": "<v Anish Sai Nimmagadda>So we have only the transcription to the\nmeeting itself, right?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 268.034,
        "end": 268.274,
        "text": "Bing.",
        "raw_text": "<v Sahil Mengji>Bing.</v>"
    },
    {
        "speaker": "Anish",
        "start": 269.954,
        "end": 274.054,
        "text": "Maybe not other details about what time, when, who was invited, things like that",
        "raw_text": "<v Anish Sai Nimmagadda>Maybe not other details about what time,\nwhen, who was invited, things like that,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 271.154,
        "end": 271.474,
        "text": "S.",
        "raw_text": "<v Sahil Mengji>S.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 272.834,
        "end": 272.954,
        "text": "MUM.",
        "raw_text": "<v Gurram Vamsi Krishna>MUM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 275.314,
        "end": 276.594,
        "text": "Yeah, I know.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, I know.</v>"
    },
    {
        "speaker": "Anish",
        "start": 276.194,
        "end": 278.314,
        "text": "Okay, okay, good. Bye-bye.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, okay, good. Bye-bye.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 279.314,
        "end": 281.154,
        "text": "And also, he asked to...",
        "raw_text": "<v Gurram Vamsi Krishna>And also, he asked to...</v>"
    },
    {
        "speaker": "Sahil",
        "start": 280.354,
        "end": 281.394,
        "text": "We can't try it.",
        "raw_text": "<v Sahil Mengji>We can't try it.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 282.674,
        "end": 283.634,
        "text": "Yeah, yeah, speak.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, yeah, speak.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 284.354,
        "end": 288.678,
        "text": "We can't write the whole transcript as input and tell the LLM to classify",
        "raw_text": "<v Sahil Mengji>We can't write the whole transcript as\ninput and tell the LLM to classify</v>"
    },
    {
        "speaker": "Sahil",
        "start": 288.678,
        "end": 291.074,
        "text": "because the transcript would be too much.",
        "raw_text": "<v Sahil Mengji>because the transcript would be too much.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 293.794,
        "end": 296.434,
        "text": "Yeah, so I like.",
        "raw_text": "<v Sahil Mengji>Yeah, so I like.</v>"
    },
    {
        "speaker": "Anish",
        "start": 294.834,
        "end": 297.528,
        "text": "So, so maybe our first step should be to",
        "raw_text": "<v Anish Sai Nimmagadda>So,\nso maybe our first step should be to</v>"
    },
    {
        "speaker": "Anish",
        "start": 297.528,
        "end": 301.339,
        "text": "compress the no, but compressing maybe you lose important",
        "raw_text": "<v Anish Sai Nimmagadda>compress the no,\nbut compressing maybe you lose important</v>"
    },
    {
        "speaker": "Sahil",
        "start": 297.554,
        "end": 297.754,
        "text": "Okay.",
        "raw_text": "<v Sahil Mengji>Okay.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 300.914,
        "end": 307.173,
        "text": "Even though, even after, no, no, even after, even after compressing",
        "raw_text": "<v Sahil Mengji>Even though, even after, no, no,\neven after, even after compressing,</v>"
    },
    {
        "speaker": "Anish",
        "start": 301.339,
        "end": 302.194,
        "text": "stuff, right?",
        "raw_text": "<v Anish Sai Nimmagadda>stuff, right?</v>"
    },
    {
        "speaker": "Prisha",
        "start": 301.634,
        "end": 304.034,
        "text": "You might lose important information.",
        "raw_text": "<v Prisha Behera>You might lose important information.</v>"
    },
    {
        "speaker": "Anish",
        "start": 303.474,
        "end": 304.034,
        "text": "Yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 307.173,
        "end": 312.979,
        "text": "it might be too easy, so we can do like a sliding with the kind",
        "raw_text": "<v Sahil Mengji>it might be too easy,\nso we can do like a sliding with the kind</v>"
    },
    {
        "speaker": "Anish",
        "start": 311.474,
        "end": 311.954,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 311.714,
        "end": 313.554,
        "text": "Or we can do 2 passes.",
        "raw_text": "<v Gurram Vamsi Krishna>Or we can do 2 passes.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 312.979,
        "end": 318.603,
        "text": "of thing. We would extract the, extract the points and check",
        "raw_text": "<v Sahil Mengji>of thing. We would extract the,\nextract the points and check,</v>"
    },
    {
        "speaker": "Anish",
        "start": 316.994,
        "end": 317.394,
        "text": "Ohh.",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 318.603,
        "end": 319.874,
        "text": "identify that.",
        "raw_text": "<v Sahil Mengji>identify that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 318.634,
        "end": 318.754,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 320.354,
        "end": 325.586,
        "text": "topic of discussion for those points and store the topic of discussion somewhere.",
        "raw_text": "<v Sahil Mengji>topic of discussion for those points and\nstore the topic of discussion somewhere.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 325.586,
        "end": 329.733,
        "text": "And in the next upcoming thing, we will cheque from the topic of",
        "raw_text": "<v Sahil Mengji>And in the next upcoming thing,\nwe will cheque from the topic of</v>"
    },
    {
        "speaker": "Sahil",
        "start": 329.733,
        "end": 333.944,
        "text": "discussion if those points are related to that thing. If nothing",
        "raw_text": "<v Sahil Mengji>discussion if those points are related to\nthat thing. If nothing,</v>"
    },
    {
        "speaker": "Anish",
        "start": 333.794,
        "end": 334.674,
        "text": "Okay, okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, okay.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 333.944,
        "end": 336.114,
        "text": "then we will create a newer topic.",
        "raw_text": "<v Sahil Mengji>then we will create a newer topic.</v>"
    },
    {
        "speaker": "Anish",
        "start": 337.074,
        "end": 341.794,
        "text": "Okay, so then, then in so.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, so then, then in so.</v>"
    },
    {
        "speaker": "Anish",
        "start": 343.474,
        "end": 347.137,
        "text": "Instead of having like a sliding window of maybe a fixed size",
        "raw_text": "<v Anish Sai Nimmagadda>Instead of having like a sliding window\nof maybe a fixed size,</v>"
    },
    {
        "speaker": "Anish",
        "start": 347.137,
        "end": 351.847,
        "text": "you can just start from the top and then you can work your way until the LLM can",
        "raw_text": "<v Anish Sai Nimmagadda>you can just start from the top and then\nyou can work your way until the LLM can</v>"
    },
    {
        "speaker": "Anish",
        "start": 351.847,
        "end": 356.092,
        "text": "figure out, okay, at least still here, this is the point of whatever the",
        "raw_text": "<v Anish Sai Nimmagadda>figure out, okay, at least still here,\nthis is the point of whatever the</v>"
    },
    {
        "speaker": "Anish",
        "start": 356.092,
        "end": 359.523,
        "text": "conversation or the transcript. And as soon as we get one",
        "raw_text": "<v Anish Sai Nimmagadda>conversation or the transcript.\nAnd as soon as we get one,</v>"
    },
    {
        "speaker": "Anish",
        "start": 359.523,
        "end": 363.07,
        "text": "maybe we can put a, we can resume from that point onwards to",
        "raw_text": "<v Anish Sai Nimmagadda>maybe we can put a,\nwe can resume from that point onwards to</v>"
    },
    {
        "speaker": "Anish",
        "start": 363.07,
        "end": 363.594,
        "text": "the next.",
        "raw_text": "<v Anish Sai Nimmagadda>the next.</v>"
    },
    {
        "speaker": "Anish",
        "start": 363.954,
        "end": 366.655,
        "text": "Similarly, until you get a next point of topic or",
        "raw_text": "<v Anish Sai Nimmagadda>Similarly,\nuntil you get a next point of topic or</v>"
    },
    {
        "speaker": "Anish",
        "start": 366.655,
        "end": 368.114,
        "text": "next point of conversation.",
        "raw_text": "<v Anish Sai Nimmagadda>next point of conversation.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 371.314,
        "end": 375.554,
        "text": "But like, how exactly would you demark it?",
        "raw_text": "<v Prisha Behera>But like, how exactly would you demark it?</v>"
    },
    {
        "speaker": "Anish",
        "start": 372.474,
        "end": 372.754,
        "text": "But.",
        "raw_text": "<v Anish Sai Nimmagadda>But.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 376.474,
        "end": 380.834,
        "text": "When one topic ends and the other starts, 'cause like sometimes the...",
        "raw_text": "<v Prisha Behera>When one topic ends and the other starts,\n'cause like sometimes the...</v>"
    },
    {
        "speaker": "Anish",
        "start": 380.034,
        "end": 384.127,
        "text": "No, you can't perfectly do that, right? So when the LLM has enough confidence",
        "raw_text": "<v Anish Sai Nimmagadda>No, you can't perfectly do that, right?\nSo when the LLM has enough confidence</v>"
    },
    {
        "speaker": "Anish",
        "start": 384.127,
        "end": 387.223,
        "text": "that, okay, hey, I've understood that this still here till",
        "raw_text": "<v Anish Sai Nimmagadda>that, okay, hey,\nI've understood that this still here till</v>"
    },
    {
        "speaker": "Anish",
        "start": 387.223,
        "end": 390.687,
        "text": "this point in the meeting, they were probably talking about this.",
        "raw_text": "<v Anish Sai Nimmagadda>this point in the meeting,\nthey were probably talking about this.</v>"
    },
    {
        "speaker": "Anish",
        "start": 390.687,
        "end": 393.154,
        "text": "At some point it'll gather enough information.",
        "raw_text": "<v Anish Sai Nimmagadda>At some point it'll gather enough\ninformation.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 391.874,
        "end": 395.801,
        "text": "No, it can be like it can be like I will be",
        "raw_text": "<v Sahil Mengji>No,\nit can be like it can be like I will be</v>"
    },
    {
        "speaker": "Anish",
        "start": 394.314,
        "end": 394.434,
        "text": "Team.",
        "raw_text": "<v Anish Sai Nimmagadda>Team.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 395.801,
        "end": 400.354,
        "text": "jumping to and throw towards two different topics.",
        "raw_text": "<v Sahil Mengji>jumping to and throw towards two\ndifferent topics.</v>"
    },
    {
        "speaker": "Anish",
        "start": 402.674,
        "end": 403.794,
        "text": "Can you repeat your voice?",
        "raw_text": "<v Anish Sai Nimmagadda>Can you repeat your voice?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 405.354,
        "end": 408.463,
        "text": "No, it can be that I would be jumping across",
        "raw_text": "<v Sahil Mengji>No,\nit can be that I would be jumping across</v>"
    },
    {
        "speaker": "Sahil",
        "start": 408.463,
        "end": 410.674,
        "text": "to Enterprise to a remote topic.",
        "raw_text": "<v Sahil Mengji>to Enterprise to a remote topic.</v>"
    },
    {
        "speaker": "Anish",
        "start": 409.634,
        "end": 410.274,
        "text": "Ohh.",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh.</v>"
    },
    {
        "speaker": "Anish",
        "start": 411.474,
        "end": 413.314,
        "text": "Oh, yeah, yeah, you could.",
        "raw_text": "<v Anish Sai Nimmagadda>Oh, yeah, yeah, you could.</v>"
    },
    {
        "speaker": "Anish",
        "start": 416.434,
        "end": 417.074,
        "text": "Ohh.",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh.</v>"
    },
    {
        "speaker": "Anish",
        "start": 421.394,
        "end": 421.954,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 424.754,
        "end": 427.299,
        "text": "So okay, what do you guys think we should do then",
        "raw_text": "<v Anish Sai Nimmagadda>So okay,\nwhat do you guys think we should do then</v>"
    },
    {
        "speaker": "Anish",
        "start": 427.299,
        "end": 427.554,
        "text": "here?",
        "raw_text": "<v Anish Sai Nimmagadda>here?</v>"
    },
    {
        "speaker": "Anish",
        "start": 429.034,
        "end": 429.154,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 478.354,
        "end": 478.834,
        "text": "Hello?",
        "raw_text": "<v Gurram Vamsi Krishna>Hello?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 480.514,
        "end": 483.429,
        "text": "Yeah, I'm thinking something like in compilers",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\nI'm thinking something like in compilers</v>"
    },
    {
        "speaker": "Gurram",
        "start": 483.429,
        "end": 486.034,
        "text": "we will do multi-pass optimization, right?",
        "raw_text": "<v Gurram Vamsi Krishna>we will do multi-pass optimization, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 484.234,
        "end": 484.354,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 486.594,
        "end": 487.074,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 488.194,
        "end": 492.514,
        "text": "So maybe we will try the same here.",
        "raw_text": "<v Gurram Vamsi Krishna>So maybe we will try the same here.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 493.954,
        "end": 497.154,
        "text": "We will pass some context to the LLM in one pass.",
        "raw_text": "<v Gurram Vamsi Krishna>We will pass some context to the LLM in\none pass.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 498.154,
        "end": 503.738,
        "text": "Until the end of the means by breaking it, passing it multiple times until we reach",
        "raw_text": "<v Gurram Vamsi Krishna>Until the end of the means by breaking it,\npassing it multiple times until we reach</v>"
    },
    {
        "speaker": "Anish",
        "start": 498.194,
        "end": 498.674,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 501.714,
        "end": 501.874,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 502.954,
        "end": 503.074,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 503.738,
        "end": 507.128,
        "text": "the end, and maybe second time we will do the same",
        "raw_text": "<v Gurram Vamsi Krishna>the end,\nand maybe second time we will do the same</v>"
    },
    {
        "speaker": "Gurram",
        "start": 507.128,
        "end": 512.114,
        "text": "thing from another point or from the same point somewhere like multi-pass.",
        "raw_text": "<v Gurram Vamsi Krishna>thing from another point or from the same\npoint somewhere like multi-pass.</v>"
    },
    {
        "speaker": "Anish",
        "start": 513.474,
        "end": 514.034,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 515.074,
        "end": 516.674,
        "text": "Yeah, that's one option.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, that's one option.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 515.314,
        "end": 521.106,
        "text": "Maybe on every pass we will try to collect what is the gist of that context",
        "raw_text": "<v Gurram Vamsi Krishna>Maybe on every pass we will try to\ncollect what is the gist of that context</v>"
    },
    {
        "speaker": "Gurram",
        "start": 521.106,
        "end": 524.994,
        "text": "and overall we can maybe try to collect something.",
        "raw_text": "<v Gurram Vamsi Krishna>and overall we can maybe try to collect\nsomething.</v>"
    },
    {
        "speaker": "Anish",
        "start": 527.314,
        "end": 530.514,
        "text": "Okay, just give me a second, I'll ask.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, just give me a second, I'll ask.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 529.754,
        "end": 530.914,
        "text": "Yeah, the true dingy.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, the true dingy.</v>"
    },
    {
        "speaker": "Anish",
        "start": 532.274,
        "end": 537.086,
        "text": "Okay, I asked, so it gave a couple of... Okay, a transcript long sequence.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, I asked, so it gave a couple of...\nOkay, a transcript long sequence.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 536.434,
        "end": 536.754,
        "text": "So.",
        "raw_text": "<v Gurram Vamsi Krishna>So.</v>"
    },
    {
        "speaker": "Anish",
        "start": 537.086,
        "end": 541.578,
        "text": "You need to detect boundaries, group segments, name topics, attached.",
        "raw_text": "<v Anish Sai Nimmagadda>You need to detect boundaries,\ngroup segments, name topics, attached.</v>"
    },
    {
        "speaker": "Anish",
        "start": 541.578,
        "end": 546.711,
        "text": "Okay, approach one is sliding window. Split transcript into overlapping windows",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, approach one is sliding window.\nSplit transcript into overlapping windows</v>"
    },
    {
        "speaker": "Anish",
        "start": 546.711,
        "end": 550.754,
        "text": "of 10 to 15 turns or two to three minutes. Okay, one is, yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>of 10 to 15 turns or two to three minutes.\nOkay, one is, yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 550.034,
        "end": 554.274,
        "text": "Okay, 10 to 15 times maybe, yeah, that's what it is, multi-pass.",
        "raw_text": "<v Gurram Vamsi Krishna>Okay, 10 to 15 times maybe, yeah,\nthat's what it is, multi-pass.</v>"
    },
    {
        "speaker": "Anish",
        "start": 554.754,
        "end": 560.602,
        "text": "Multipass correct approach to embedding plus clustering often better",
        "raw_text": "<v Anish Sai Nimmagadda>Multipass correct approach to embedding\nplus clustering often better,</v>"
    },
    {
        "speaker": "Anish",
        "start": 560.602,
        "end": 565.114,
        "text": "but I think I could share this chat one sec.",
        "raw_text": "<v Anish Sai Nimmagadda>but I think I could share this chat\nactually one sec.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 566.114,
        "end": 567.074,
        "text": "You can.",
        "raw_text": "<v Gurram Vamsi Krishna>You can.</v>"
    },
    {
        "speaker": "Anish",
        "start": 566.154,
        "end": 566.274,
        "text": "Yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 567.954,
        "end": 568.234,
        "text": "Ohh.",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 568.834,
        "end": 570.034,
        "text": "Maybe share your screen.",
        "raw_text": "<v Gurram Vamsi Krishna>Maybe share your screen.</v>"
    },
    {
        "speaker": "Anish",
        "start": 569.074,
        "end": 571.074,
        "text": "Okay, wait, do you want me to just, yeah, I can do.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, wait, do you want me to just, yeah,\nI can do.</v>"
    },
    {
        "speaker": "Anish",
        "start": 573.394,
        "end": 573.914,
        "text": "One sec.",
        "raw_text": "<v Anish Sai Nimmagadda>One sec.</v>"
    },
    {
        "speaker": "Anish",
        "start": 579.714,
        "end": 580.754,
        "text": "How can you guys see?",
        "raw_text": "<v Anish Sai Nimmagadda>How can you guys see?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 579.914,
        "end": 580.034,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 584.034,
        "end": 584.994,
        "text": "Yeah, we can see.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, we can see.</v>"
    },
    {
        "speaker": "Anish",
        "start": 585.314,
        "end": 592.587,
        "text": "Huh, so, so one was this right, which we said split transcript into",
        "raw_text": "<v Anish Sai Nimmagadda>Huh, so, so one was this right,\nwhich we said split transcript into</v>"
    },
    {
        "speaker": "Anish",
        "start": 592.587,
        "end": 599.325,
        "text": "overlapping windows of 10 to 15 turns or two to three minutes",
        "raw_text": "<v Anish Sai Nimmagadda>overlapping windows of 10 to 15 turns or\ntwo to three minutes,</v>"
    },
    {
        "speaker": "Anish",
        "start": 599.325,
        "end": 604.994,
        "text": "then approach to embedding plus clustering chunk by.",
        "raw_text": "<v Anish Sai Nimmagadda>then approach to embedding plus\nclustering chunk by.</v>"
    },
    {
        "speaker": "Anish",
        "start": 605.034,
        "end": 610.019,
        "text": "Speaker turns, not by fixed time, three to five consecutive turns per chunk",
        "raw_text": "<v Anish Sai Nimmagadda>Speaker turns, not by fixed time,\nthree to five consecutive turns per chunk,</v>"
    },
    {
        "speaker": "Anish",
        "start": 610.019,
        "end": 612.674,
        "text": "embed each chunk. Yes, it's back in, I...",
        "raw_text": "<v Anish Sai Nimmagadda>embed each chunk. Yes, it's back in, I...</v>"
    },
    {
        "speaker": "Anish",
        "start": 612.874,
        "end": 612.994,
        "text": "In.",
        "raw_text": "<v Anish Sai Nimmagadda>In.</v>"
    },
    {
        "speaker": "Anish",
        "start": 614.354,
        "end": 617.812,
        "text": "I think your team was one minute, like two bus. OK",
        "raw_text": "<v Anish Sai Nimmagadda>I think your team was one minute,\nlike two bus. OK,</v>"
    },
    {
        "speaker": "Anish",
        "start": 617.812,
        "end": 622.335,
        "text": "what's strong submission? What do you want me to share like a bunch",
        "raw_text": "<v Anish Sai Nimmagadda>what's strong submission?\nWhat do you want me to share like a bunch</v>"
    },
    {
        "speaker": "Anish",
        "start": 622.335,
        "end": 625.794,
        "text": "of screenshots of the same, or do you are you guys?",
        "raw_text": "<v Anish Sai Nimmagadda>of screenshots of the same,\nor do you are you guys?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 624.674,
        "end": 625.474,
        "text": "Ohh.",
        "raw_text": "<v Gurram Vamsi Krishna>Ohh.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 624.914,
        "end": 625.474,
        "text": "Perfect.",
        "raw_text": "<v Sahil Mengji>Perfect.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 627.234,
        "end": 628.194,
        "text": "Yeah, share it.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, share it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 628.994,
        "end": 634.287,
        "text": "Okay, yeah, give me one second, I'll check. Okay",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, yeah, give me one second,\nI'll check. Okay,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 629.314,
        "end": 629.714,
        "text": "Sure.",
        "raw_text": "<v Sahil Mengji>Sure.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 631.794,
        "end": 631.914,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 634.287,
        "end": 643.074,
        "text": "so otherwise this is what we're thinking of, like one of these similar approaches.",
        "raw_text": "<v Anish Sai Nimmagadda>so otherwise this is what we're thinking\nof, like one of these similar approaches.</v>"
    },
    {
        "speaker": "Anish",
        "start": 644.674,
        "end": 644.834,
        "text": "Yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 651.554,
        "end": 657.197,
        "text": "Maybe we can try two to three of them by taking some sample inputs and we decide",
        "raw_text": "<v Gurram Vamsi Krishna>Maybe we can try two to three of them by\ntaking some sample inputs and we decide</v>"
    },
    {
        "speaker": "Anish",
        "start": 656.594,
        "end": 659.954,
        "text": "Okay, yeah, good idea. Yep, we can do that.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, yeah, good idea. Yep,\nwe can do that.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 657.197,
        "end": 658.034,
        "text": "what to use.",
        "raw_text": "<v Gurram Vamsi Krishna>what to use.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 659.314,
        "end": 659.674,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 660.754,
        "end": 660.874,
        "text": "MUM.",
        "raw_text": "<v Gurram Vamsi Krishna>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 663.074,
        "end": 663.434,
        "text": "OK.",
        "raw_text": "<v Anish Sai Nimmagadda>OK.</v>"
    },
    {
        "speaker": "Anish",
        "start": 667.794,
        "end": 670.86,
        "text": "So, okay, what if, let's at least come up with what are the",
        "raw_text": "<v Anish Sai Nimmagadda>So, okay, what if,\nlet's at least come up with what are the</v>"
    },
    {
        "speaker": "Anish",
        "start": 670.86,
        "end": 673.314,
        "text": "potential issues we face in our project, right?",
        "raw_text": "<v Anish Sai Nimmagadda>potential issues we face in our project,\nright?</v>"
    },
    {
        "speaker": "Anish",
        "start": 674.914,
        "end": 678.594,
        "text": "One is definitely that, , we can break that transcripts into",
        "raw_text": "<v Anish Sai Nimmagadda>One is definitely that, you know,\nwe can break that transcripts into</v>"
    },
    {
        "speaker": "Anish",
        "start": 678.594,
        "end": 680.514,
        "text": "different, like, if you can think...",
        "raw_text": "<v Anish Sai Nimmagadda>different, like, if you can think...</v>"
    },
    {
        "speaker": "Anish",
        "start": 681.714,
        "end": 683.874,
        "text": "At least going into the next meeting, or.. .",
        "raw_text": "<v Anish Sai Nimmagadda>At least going into the next meeting, or..\n.</v>"
    },
    {
        "speaker": "Anish",
        "start": 685.194,
        "end": 687.389,
        "text": "Like whenever the next time it is that we meet",
        "raw_text": "<v Anish Sai Nimmagadda>Like whenever the next time it is that we\nmeet,</v>"
    },
    {
        "speaker": "Anish",
        "start": 687.389,
        "end": 690.729,
        "text": "we can think about what potential solutions or we can do a little bit of",
        "raw_text": "<v Anish Sai Nimmagadda>we can think about what potential\nsolutions or we can do a little bit of</v>"
    },
    {
        "speaker": "Anish",
        "start": 690.729,
        "end": 693.474,
        "text": "research, right? If not, assign anything to everyone today.",
        "raw_text": "<v Anish Sai Nimmagadda>research, right? If not,\nassign anything to everyone today.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 700.914,
        "end": 704.194,
        "text": "May not be this contents in larger context.",
        "raw_text": "<v Sahil Mengji>May not be this contents in larger\ncontext.</v>"
    },
    {
        "speaker": "Anish",
        "start": 706.354,
        "end": 706.834,
        "text": "Per.",
        "raw_text": "<v Anish Sai Nimmagadda>Per.</v>"
    },
    {
        "speaker": "Anish",
        "start": 711.434,
        "end": 712.594,
        "text": ".",
        "raw_text": "<v Anish Sai Nimmagadda>Mhm.</v>"
    },
    {
        "speaker": "Anish",
        "start": 720.034,
        "end": 723.24,
        "text": "OK, I've sent the screen, so I'm also reading it",
        "raw_text": "<v Anish Sai Nimmagadda>OK, I've sent the screen,\nso I'm also reading it,</v>"
    },
    {
        "speaker": "Anish",
        "start": 723.24,
        "end": 728.434,
        "text": "just like we can probably take 5 minutes, just read about this, and then we can.",
        "raw_text": "<v Anish Sai Nimmagadda>just like we can probably take 5 minutes,\njust read about this, and then we can.</v>"
    },
    {
        "speaker": "Anish",
        "start": 730.954,
        "end": 731.554,
        "text": "Discuss.",
        "raw_text": "<v Anish Sai Nimmagadda>Discuss.</v>"
    },
    {
        "speaker": "Anish",
        "start": 947.794,
        "end": 948.754,
        "text": "See, I think.",
        "raw_text": "<v Anish Sai Nimmagadda>See, I think.</v>"
    },
    {
        "speaker": "Anish",
        "start": 949.794,
        "end": 954.301,
        "text": "One other thing that we can keep in mind is, see, normally in a meeting",
        "raw_text": "<v Anish Sai Nimmagadda>One other thing that we can keep in mind\nis, see, normally in a meeting,</v>"
    },
    {
        "speaker": "Anish",
        "start": 954.301,
        "end": 958.747,
        "text": "you'd have people who have different expertise, right? Like one person",
        "raw_text": "<v Anish Sai Nimmagadda>you'd have people who have different\nexpertise, right? Like one person,</v>"
    },
    {
        "speaker": "Anish",
        "start": 958.747,
        "end": 962.204,
        "text": "for the most part, might talk about one topic, correct?",
        "raw_text": "<v Anish Sai Nimmagadda>for the most part,\nmight talk about one topic, correct?</v>"
    },
    {
        "speaker": "Anish",
        "start": 962.204,
        "end": 967.514,
        "text": "Maybe be giving an update about one topic, maybe speaking a lot about the same topic.",
        "raw_text": "<v Anish Sai Nimmagadda>Maybe be giving an update about one topic,\nmaybe speaking a lot about the same topic.</v>"
    },
    {
        "speaker": "Anish",
        "start": 967.514,
        "end": 968.194,
        "text": "But then...",
        "raw_text": "<v Anish Sai Nimmagadda>But then...</v>"
    },
    {
        "speaker": "Anish",
        "start": 969.634,
        "end": 972.445,
        "text": "See again, like you may have two types of meetings",
        "raw_text": "<v Anish Sai Nimmagadda>See again,\nlike you may have two types of meetings</v>"
    },
    {
        "speaker": "Anish",
        "start": 972.445,
        "end": 975.863,
        "text": "where everybody's like, it's like a brainstorming session and",
        "raw_text": "<v Anish Sai Nimmagadda>where everybody's like,\nit's like a brainstorming session and</v>"
    },
    {
        "speaker": "Anish",
        "start": 975.863,
        "end": 980.493,
        "text": "everybody's speaking about the same thing. Then the topic would be only one, right?",
        "raw_text": "<v Anish Sai Nimmagadda>everybody's speaking about the same thing.\nThen the topic would be only one, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 980.493,
        "end": 984.959,
        "text": "But then when you start to have multiple people speaking about different topics",
        "raw_text": "<v Anish Sai Nimmagadda>But then when you start to have multiple\npeople speaking about different topics,</v>"
    },
    {
        "speaker": "Anish",
        "start": 984.959,
        "end": 989.314,
        "text": "maybe we can try to note the speaker change as like a change in topic or like.",
        "raw_text": "<v Anish Sai Nimmagadda>maybe we can try to note the speaker\nchange as like a change in topic or like.</v>"
    },
    {
        "speaker": "Anish",
        "start": 989.354,
        "end": 992.834,
        "text": "at least a hint in that direction, something like that.",
        "raw_text": "<v Anish Sai Nimmagadda>at least a hint in that direction,\nsomething like that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 994.114,
        "end": 995.154,
        "text": "Does that make sense?",
        "raw_text": "<v Anish Sai Nimmagadda>Does that make sense?</v>"
    },
    {
        "speaker": "Anish",
        "start": 999.314,
        "end": 999.354,
        "text": "I.",
        "raw_text": "<v Anish Sai Nimmagadda>I.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1003.954,
        "end": 1006.45,
        "text": "Yeah, but ultimately the input is going to be",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\nbut ultimately the input is going to be</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1006.45,
        "end": 1010.411,
        "text": "ours. We can deal with either case. The worst case is everyone speaking.",
        "raw_text": "<v Gurram Vamsi Krishna>ours. We can deal with either case.\nThe worst case is everyone speaking.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1010.411,
        "end": 1011.714,
        "text": "We have different terms.",
        "raw_text": "<v Gurram Vamsi Krishna>We have different terms.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1013.394,
        "end": 1013.714,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1014.634,
        "end": 1015.074,
        "text": "Yeah, we should.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, we should.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1014.834,
        "end": 1019.074,
        "text": "If everyone speaking about different talk, oh, everyone speaking about now.",
        "raw_text": "<v Anish Sai Nimmagadda>If everyone speaking about different talk,\noh, everyone speaking about now.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1018.194,
        "end": 1020.114,
        "text": "No, not different, yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>No, not different, yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1020.514,
        "end": 1022.274,
        "text": "About the same topic, right? Yeah, same.",
        "raw_text": "<v Anish Sai Nimmagadda>About the same topic, right? Yeah, same.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1023.554,
        "end": 1025.7,
        "text": "maybe they can switch in between the",
        "raw_text": "<v Gurram Vamsi Krishna>Uh,\nmaybe they can switch in between the</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1025.7,
        "end": 1026.434,
        "text": "topics, right?",
        "raw_text": "<v Gurram Vamsi Krishna>topics, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1027.154,
        "end": 1029.699,
        "text": "Okay, okay. Like A brainstorming session would be",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, okay.\nLike A brainstorming session would be</v>"
    },
    {
        "speaker": "Anish",
        "start": 1029.699,
        "end": 1032.194,
        "text": "very hard for this one to take care of, correct?",
        "raw_text": "<v Anish Sai Nimmagadda>very hard for this one to take care of,\ncorrect?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1034.794,
        "end": 1039.961,
        "text": "Where people are just throwing different ideas together and it becomes hard to",
        "raw_text": "<v Anish Sai Nimmagadda>Where people are just throwing different\nideas together and it becomes hard to</v>"
    },
    {
        "speaker": "Anish",
        "start": 1039.961,
        "end": 1040.354,
        "text": "track.",
        "raw_text": "<v Anish Sai Nimmagadda>track.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1040.474,
        "end": 1045.154,
        "text": "It is working for a multiple people speaking conversation.",
        "raw_text": "<v Gurram Vamsi Krishna>It is working for a multiple people\nspeaking conversation.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1046.354,
        "end": 1047.314,
        "text": "Not a single speaker.",
        "raw_text": "<v Gurram Vamsi Krishna>Not a single speaker.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1051.754,
        "end": 1052.354,
        "text": "Outlook.",
        "raw_text": "<v Anish Sai Nimmagadda>Outlook.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1053.474,
        "end": 1053.874,
        "text": "To.",
        "raw_text": "<v Anish Sai Nimmagadda>To.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1055.074,
        "end": 1059.554,
        "text": "And also I think the first approach is something we can try.",
        "raw_text": "<v Gurram Vamsi Krishna>And also I think the first approach is\nsomething we can try.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1060.994,
        "end": 1062.954,
        "text": "The sliding window and multiple parts.",
        "raw_text": "<v Gurram Vamsi Krishna>The sliding window and multiple parts.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1061.554,
        "end": 1065.01,
        "text": "Yeah, even I think so, right? Refine boundaries in a second pass on the",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, even I think so, right?\nRefine boundaries in a second pass on the</v>"
    },
    {
        "speaker": "Anish",
        "start": 1065.01,
        "end": 1066.114,
        "text": "merge points, it seems.",
        "raw_text": "<v Anish Sai Nimmagadda>merge points, it seems.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1066.274,
        "end": 1073.025,
        "text": "Yeah, and also in the third screenshot, I think there is something called the",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, and also in the third screenshot,\nI think there is something called the</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1073.025,
        "end": 1076.834,
        "text": "structured JSON format from the transcript.",
        "raw_text": "<v Gurram Vamsi Krishna>structured JSON format from the\ntranscript.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1077.954,
        "end": 1078.674,
        "text": "Correct, yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Correct, yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1078.514,
        "end": 1082.514,
        "text": "Have you seen the the utterance ID and the text on the speaker?",
        "raw_text": "<v Gurram Vamsi Krishna>Have you seen the the utterance ID and\nthe text on the speaker?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1079.874,
        "end": 1082.194,
        "text": "Ask for structured JSON, yes, yes.",
        "raw_text": "<v Anish Sai Nimmagadda>Ask for structured JSON, yes, yes.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1083.074,
        "end": 1083.554,
        "text": "Yep.",
        "raw_text": "<v Anish Sai Nimmagadda>Yep.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1083.794,
        "end": 1089.074,
        "text": "Yeah, yeah, I have worked on something, means just cleaning the input.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, yeah, I have worked on something,\nmeans just cleaning the input.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1090.754,
        "end": 1097.212,
        "text": "Yeah, whenever we get a R transcript, it will convert into a structured JSON",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, whenever we get a R transcript,\nit will convert into a structured JSON</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1097.212,
        "end": 1101.909,
        "text": "containing the utterance ID, the speaker, and the text.",
        "raw_text": "<v Gurram Vamsi Krishna>containing the utterance ID, the speaker,\nand the text.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1101.909,
        "end": 1106.522,
        "text": "So I think we can clean it like that. And then we can",
        "raw_text": "<v Gurram Vamsi Krishna>So I think we can clean it like that.\nAnd then we can,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1104.034,
        "end": 1105.714,
        "text": "Okay, so then, then...",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, so then, then...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1106.522,
        "end": 1109.794,
        "text": "and then we can try the first approach.",
        "raw_text": "<v Gurram Vamsi Krishna>and then we can try the first approach.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1107.954,
        "end": 1113.522,
        "text": "So we could, sorry, yeah. Okay, so then our step one would be to convert",
        "raw_text": "<v Anish Sai Nimmagadda>So we could, sorry, yeah. Okay,\nso then our step one would be to convert</v>"
    },
    {
        "speaker": "Anish",
        "start": 1113.522,
        "end": 1117.794,
        "text": "the input to like a structured JSON, right? And then...",
        "raw_text": "<v Anish Sai Nimmagadda>the input to like a structured JSON,\nright? And then...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1113.714,
        "end": 1113.834,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1115.554,
        "end": 1115.674,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1117.874,
        "end": 1118.354,
        "text": "Yes.",
        "raw_text": "<v Gurram Vamsi Krishna>Yes.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1119.394,
        "end": 1120.274,
        "text": "Just sliding.",
        "raw_text": "<v Anish Sai Nimmagadda>Just sliding.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1122.714,
        "end": 1126.354,
        "text": "Yeah, I think I'm okay with that. What about the rest of me?",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, I think I'm okay with that.\nWhat about the rest of me?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1128.514,
        "end": 1132.655,
        "text": "I think second would be better, because we were also talking on the",
        "raw_text": "<v Sahil Mengji>I think second would be better,\nbecause we were also talking on the</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1132.655,
        "end": 1136.431,
        "text": "knowledge liability thing that we are also implementing that",
        "raw_text": "<v Sahil Mengji>knowledge liability thing that we are\nalso implementing that,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1136.431,
        "end": 1140.634,
        "text": "then that approach would be helpful to implement that in the future.",
        "raw_text": "<v Sahil Mengji>then that approach would be helpful to\nimplement that in the future.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1147.794,
        "end": 1150.898,
        "text": "Yeah, I think after cleaning the input we can",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\nI think after cleaning the input we can</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1150.898,
        "end": 1154.744,
        "text": "try both of them. Or we can start with trying the second",
        "raw_text": "<v Gurram Vamsi Krishna>try both of them.\nOr we can start with trying the second</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1154.744,
        "end": 1155.554,
        "text": "one as well.",
        "raw_text": "<v Gurram Vamsi Krishna>one as well.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1157.234,
        "end": 1157.354,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1166.114,
        "end": 1169.375,
        "text": "Okay, so then let's at least, okay, today we can keep",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, so then let's at least, okay,\ntoday we can keep,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1169.375,
        "end": 1173.941,
        "text": "let's at least get a rough idea of, no, okay, this would be step one for us",
        "raw_text": "<v Anish Sai Nimmagadda>let's at least get a rough idea of, no,\nokay, this would be step one for us,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1173.941,
        "end": 1178.744,
        "text": "given a transcript, try to clean it up, change it to the structured JSON format",
        "raw_text": "<v Anish Sai Nimmagadda>given a transcript, try to clean it up,\nchange it to the structured JSON format,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1178.744,
        "end": 1181.412,
        "text": "and then, again, approach one, approach two",
        "raw_text": "<v Anish Sai Nimmagadda>and then, again, approach one,\napproach two,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1181.412,
        "end": 1186.394,
        "text": "we can finalise on such details, I think, once we start to write the code.",
        "raw_text": "<v Anish Sai Nimmagadda>we can finalise on such details, I think,\nonce we actually start to write the code.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1186.914,
        "end": 1190.004,
        "text": "Does is that OK? Like, can we do we can come up with a plan",
        "raw_text": "<v Anish Sai Nimmagadda>Does is that OK? Like,\ncan we do we can come up with a plan</v>"
    },
    {
        "speaker": "Anish",
        "start": 1190.004,
        "end": 1190.674,
        "text": "today, right?",
        "raw_text": "<v Anish Sai Nimmagadda>today, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1193.714,
        "end": 1195.634,
        "text": "Following again the same.",
        "raw_text": "<v Anish Sai Nimmagadda>Following again the same.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1196.514,
        "end": 1198.434,
        "text": "Flow that Sahil sent the other day.",
        "raw_text": "<v Anish Sai Nimmagadda>Flow that Sahil sent the other day.</v>"
    },
    {
        "speaker": "Sai",
        "start": 1199.714,
        "end": 1200.594,
        "text": "Yeah, we can.",
        "raw_text": "<v Sai Nishanth Segu>Yeah, we can.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1201.634,
        "end": 1202.114,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1203.794,
        "end": 1207.714,
        "text": "Shah, see what's up?",
        "raw_text": "<v Anish Sai Nimmagadda>Shah, see what's up?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1208.834,
        "end": 1212.514,
        "text": "Rishay, Rishay, you had taken some notes, right? Where in the note yesterday?",
        "raw_text": "<v Sahil Mengji>Rishay, Rishay, you had taken some notes,\nright? Where in the note yesterday?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1217.154,
        "end": 1217.274,
        "text": "So.",
        "raw_text": "<v Sahil Mengji>So.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1217.794,
        "end": 1221.234,
        "text": "Wait, , they weren't really like nodes, just a few points.",
        "raw_text": "<v Prisha Behera>Wait, uh, they weren't really like nodes,\njust a few points.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1219.674,
        "end": 1219.874,
        "text": "So.",
        "raw_text": "<v Sahil Mengji>So.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 1221.354,
        "end": 1225.594,
        "text": "Some, some, you can say.",
        "raw_text": "<v Sahil Mengji>Some, some, you can say.</v>"
    },
    {
        "speaker": "Sai",
        "start": 1224.754,
        "end": 1228.754,
        "text": "Did you try to cheque how the facilitator is working and what all",
        "raw_text": "<v Sai Nishanth Segu>Did you try to cheque how the facilitator\nis actually working and what all</v>"
    },
    {
        "speaker": "Sai",
        "start": 1228.754,
        "end": 1231.954,
        "text": "shortcomings we have in that thing? What have we mentioned?",
        "raw_text": "<v Sai Nishanth Segu>shortcomings we have in that thing?\nWhat have we mentioned?</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1240.434,
        "end": 1249.234,
        "text": "Yeah, wait. So yesterday in the meeting, he said, yeah, I think in the flow",
        "raw_text": "<v Prisha Behera>Yeah, wait. So yesterday in the meeting,\nhe said, yeah, I think in the flow,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1250.354,
        "end": 1255.999,
        "text": "We mentioned something like it should detect the intent. So if it",
        "raw_text": "<v Prisha Behera>We mentioned something like it should\ndetect the intent. So if it,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1255.999,
        "end": 1262.572,
        "text": "we have to define what exactly intentions are there. Like if it's like, okay",
        "raw_text": "<v Prisha Behera>we have to define what exactly intentions\nare there. Like if it's like, okay,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1262.572,
        "end": 1269.314,
        "text": "we need to schedule a meeting or we want to make a JIRA thing or make a ticket.",
        "raw_text": "<v Prisha Behera>we need to schedule a meeting or we want\nto make a JIRA thing or make a ticket.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1269.634,
        "end": 1275.255,
        "text": "So like, we can't just accept everything, any intent or like action item we",
        "raw_text": "<v Prisha Behera>So like, we can't just accept everything,\nany kind of intent or like action item we</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1275.255,
        "end": 1276.594,
        "text": "have to like define.",
        "raw_text": "<v Prisha Behera>have to like define.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1277.754,
        "end": 1281.963,
        "text": "like a couple and then stick to that. And yeah",
        "raw_text": "<v Prisha Behera>like a couple and then stick to that.\nAnd yeah,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1281.963,
        "end": 1286.874,
        "text": "he said in Microsoft facilitator, right now it doesn't",
        "raw_text": "<v Prisha Behera>he said in Microsoft facilitator,\nright now it doesn't,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1286.874,
        "end": 1292.925,
        "text": "it only takes like the transcript from the meeting or like whatever",
        "raw_text": "<v Prisha Behera>it only takes like the transcript from\nthe meeting or like whatever,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1292.925,
        "end": 1297.573,
        "text": "but it doesn't, if there's any like files or PPTs or",
        "raw_text": "<v Prisha Behera>but it doesn't,\nif there's any like files or PPTs or</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1297.573,
        "end": 1300.994,
        "text": "something shared in the chat, it can't.",
        "raw_text": "<v Prisha Behera>something shared in the chat, it can't.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1301.034,
        "end": 1305.943,
        "text": "use that. So he was like, we should try to like use that as extra",
        "raw_text": "<v Prisha Behera>use that. So he was like,\nwe should try to like use that as extra</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1305.943,
        "end": 1309.514,
        "text": "context as well while making the summaries and.",
        "raw_text": "<v Prisha Behera>context as well while making the\nsummaries and.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1310.834,
        "end": 1314.114,
        "text": "Meeting points, whatever, and.",
        "raw_text": "<v Prisha Behera>Meeting points, whatever, and.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1316.034,
        "end": 1318.914,
        "text": "Yeah, and here's like when we're doing the",
        "raw_text": "<v Prisha Behera>Yeah,\nand here's like when we're doing the</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1318.914,
        "end": 1322.128,
        "text": "presentation, we should show the like use case",
        "raw_text": "<v Prisha Behera>presentation,\nwe should show the like use case,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1322.128,
        "end": 1327.152,
        "text": "like we should take easy, medium, and complex use cases and just show that",
        "raw_text": "<v Prisha Behera>like we should take easy, medium,\nand complex use cases and just show that</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1327.152,
        "end": 1332.644,
        "text": "on the day of the presentation so that it can show that it's handling any",
        "raw_text": "<v Prisha Behera>on the day of the presentation so that it\ncan show that it's handling any kind of</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1332.644,
        "end": 1335.859,
        "text": "input. It's not like only straightforward input",
        "raw_text": "<v Prisha Behera>input.\nIt's not like only straightforward input</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1335.859,
        "end": 1339.074,
        "text": "that's relatively easy to classify or whatever.",
        "raw_text": "<v Prisha Behera>that's relatively easy to classify or\nwhatever.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1339.874,
        "end": 1341.874,
        "text": "Yeah, that's all I've written.",
        "raw_text": "<v Prisha Behera>Yeah, that's all I've written.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1344.594,
        "end": 1348.254,
        "text": "Ohh, one more thing. I think I think it should be important",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh, one more thing.\nI think I think it should be important,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1348.254,
        "end": 1351.734,
        "text": "like it's it's off topic, it's not related to what he is.",
        "raw_text": "<v Anish Sai Nimmagadda>like it's it's off topic,\nit's not related to what he is.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1351.734,
        "end": 1356.234,
        "text": "I think any time or date or day or something along the lines of two weeks",
        "raw_text": "<v Anish Sai Nimmagadda>I think any time or date or day or\nsomething along the lines of two weeks,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1356.234,
        "end": 1359.954,
        "text": "two months is mentioned. RLM should just note it down and the",
        "raw_text": "<v Anish Sai Nimmagadda>two months is mentioned.\nRLM should just note it down and the</v>"
    },
    {
        "speaker": "Anish",
        "start": 1359.954,
        "end": 1363.014,
        "text": "timestamp, and then grab information from",
        "raw_text": "<v Anish Sai Nimmagadda>timestamp,\nand then you know grab information from</v>"
    },
    {
        "speaker": "Anish",
        "start": 1363.014,
        "end": 1363.794,
        "text": "maybe like...",
        "raw_text": "<v Anish Sai Nimmagadda>maybe like...</v>"
    },
    {
        "speaker": "Anish",
        "start": 1363.874,
        "end": 1366.633,
        "text": "Five context, five turns before, five turns after",
        "raw_text": "<v Anish Sai Nimmagadda>Five context, five turns before,\nfive turns after,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1366.633,
        "end": 1370.15,
        "text": "and try to figure out what date that is for, and then so",
        "raw_text": "<v Anish Sai Nimmagadda>and try to figure out what date that is\nfor, and then so I mean,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1370.15,
        "end": 1374.425,
        "text": "if it's extremely crucial, , you can add it to calendar if it's just a",
        "raw_text": "<v Anish Sai Nimmagadda>if it's extremely crucial, you know,\nyou can add it to calendar if it's just a</v>"
    },
    {
        "speaker": "Anish",
        "start": 1374.425,
        "end": 1377.13,
        "text": "discussion about, hey, within the next two weeks",
        "raw_text": "<v Anish Sai Nimmagadda>discussion about, hey,\nwithin the next two weeks,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1377.13,
        "end": 1380.594,
        "text": "let's try and complete this. Maybe you don't have the calendar.",
        "raw_text": "<v Anish Sai Nimmagadda>let's try and complete this.\nMaybe you don't have the calendar.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1382.674,
        "end": 1384.114,
        "text": "Yeah, I think that's a good idea.",
        "raw_text": "<v Prisha Behera>Yeah, I think that's a good idea.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1387.634,
        "end": 1391.3,
        "text": "I think the dates have to be noted that",
        "raw_text": "<v Anish Sai Nimmagadda>Actually,\nI think the dates have to be noted that</v>"
    },
    {
        "speaker": "Anish",
        "start": 1391.3,
        "end": 1392.914,
        "text": "been written.",
        "raw_text": "<v Anish Sai Nimmagadda>actually been written.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1431.474,
        "end": 1434.644,
        "text": "Yeah, one more thing he mentioned was if there",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\none more thing he mentioned was if there</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1434.644,
        "end": 1440.176,
        "text": "are two meetings and if they have taken some decisions about the work to complete",
        "raw_text": "<v Gurram Vamsi Krishna>are two meetings and if they have taken\nsome decisions about the work to complete</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1440.176,
        "end": 1444.764,
        "text": "it before the next meeting, and in the next meeting if they say the",
        "raw_text": "<v Gurram Vamsi Krishna>it before the next meeting,\nand in the next meeting if they say the</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1444.764,
        "end": 1448.61,
        "text": "work is completed, he asked us to track like the work is",
        "raw_text": "<v Gurram Vamsi Krishna>work is completed,\nhe asked us to track like the work is</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1448.61,
        "end": 1450.634,
        "text": "completed, we should track it.",
        "raw_text": "<v Gurram Vamsi Krishna>completed, we should track it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1453.074,
        "end": 1455.154,
        "text": "But then our thing is only...",
        "raw_text": "<v Anish Sai Nimmagadda>But then our thing is only...</v>"
    },
    {
        "speaker": "Anish",
        "start": 1457.314,
        "end": 1459.899,
        "text": "Oh, so say something already exists on",
        "raw_text": "<v Anish Sai Nimmagadda>Oh,\nso say something already exists on</v>"
    },
    {
        "speaker": "Anish",
        "start": 1459.899,
        "end": 1465.334,
        "text": "somebody's calendar and then during the meeting they discussed that that work has",
        "raw_text": "<v Anish Sai Nimmagadda>somebody's calendar and then during the\nmeeting they discussed that that work has</v>"
    },
    {
        "speaker": "Anish",
        "start": 1465.334,
        "end": 1466.594,
        "text": "been completed. Oh.",
        "raw_text": "<v Anish Sai Nimmagadda>been completed. Oh.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1465.434,
        "end": 1468.954,
        "text": "Yeah, you should be able to capture that, and...",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, you should be able to capture that,\nand...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1471.154,
        "end": 1472.434,
        "text": "Change the status, yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Change the status, yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1471.634,
        "end": 1476.452,
        "text": "So then remove it off of everyone's calendar who was part of that meeting or",
        "raw_text": "<v Anish Sai Nimmagadda>So then remove it off of everyone's\ncalendar who was part of that meeting or</v>"
    },
    {
        "speaker": "Anish",
        "start": 1476.452,
        "end": 1477.954,
        "text": "like, dude, that's hard.",
        "raw_text": "<v Anish Sai Nimmagadda>like, dude, that's hard.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1479.274,
        "end": 1481.656,
        "text": "Yeah, he mentioned it as one of the points, but.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\nhe mentioned it as one of the points, but.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1481.656,
        "end": 1481.754,
        "text": "..",
        "raw_text": "<v Gurram Vamsi Krishna>..</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1482.954,
        "end": 1483.274,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1483.514,
        "end": 1486.114,
        "text": "That's hard, OK.",
        "raw_text": "<v Anish Sai Nimmagadda>That's hard, OK.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1490.594,
        "end": 1492.994,
        "text": "Okay, how would we do that?",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, how would we do that?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1492.474,
        "end": 1493.034,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1494.394,
        "end": 1497.021,
        "text": "I don't have any idea, just he mentioned it",
        "raw_text": "<v Gurram Vamsi Krishna>I don't have any idea,\njust he mentioned it,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1497.021,
        "end": 1498.714,
        "text": "so that's why I mentioned it.",
        "raw_text": "<v Gurram Vamsi Krishna>so that's why I mentioned it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1499.754,
        "end": 1501.234,
        "text": "See, the thing is, this...",
        "raw_text": "<v Anish Sai Nimmagadda>See, the thing is, this...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1500.394,
        "end": 1501.754,
        "text": "And also, another thing is...",
        "raw_text": "<v Gurram Vamsi Krishna>And also, another thing is...</v>"
    },
    {
        "speaker": "Anish",
        "start": 1502.274,
        "end": 1503.234,
        "text": "Ha, Delta.",
        "raw_text": "<v Anish Sai Nimmagadda>Ha, Delta.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 1502.994,
        "end": 1504.514,
        "text": "I don't think it was like, okay.",
        "raw_text": "<v Prisha Behera>I don't think it was like, okay.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1503.114,
        "end": 1503.514,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1506.394,
        "end": 1511.517,
        "text": "Yeah, in the facilitator, he told the action items will be captured",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, in the facilitator,\nhe told the action items will be captured,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1511.517,
        "end": 1517.754,
        "text": "but there is no attribution to who it was assigned to. He told something like that.",
        "raw_text": "<v Gurram Vamsi Krishna>but there is no attribution to who it was\nassigned to. He told something like that.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1518.714,
        "end": 1523.731,
        "text": "So we can cheque on the pattern. So but it is already there in the problem",
        "raw_text": "<v Gurram Vamsi Krishna>So we can cheque on the pattern.\nSo but it is already there in the problem</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1523.731,
        "end": 1526.474,
        "text": "statement. We must attribute the speaker.",
        "raw_text": "<v Gurram Vamsi Krishna>statement. We must attribute the speaker.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1524.594,
        "end": 1526.034,
        "text": "Okay, sure, let's it.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, sure, let's it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1530.914,
        "end": 1535.967,
        "text": "Okay, so this adding to the calendar part, right? Let's say two, three team meeting",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, so this adding to the calendar part,\nright? Let's say two, three team meeting,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1535.967,
        "end": 1540.188,
        "text": "like not just one, let's say two, three teams are in the same meeting.",
        "raw_text": "<v Anish Sai Nimmagadda>like not just one, let's say two,\nthree teams are in the same meeting.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1540.188,
        "end": 1543.458,
        "text": "Like maybe the AI team is on the meet with, let's say",
        "raw_text": "<v Anish Sai Nimmagadda>Like maybe the AI team is on the meet\nwith, let's say,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1543.458,
        "end": 1546.371,
        "text": "a data and analytics team. And then in the call",
        "raw_text": "<v Anish Sai Nimmagadda>a data and analytics team.\nAnd then in the call,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1546.371,
        "end": 1550.829,
        "text": "they say for the AI team, , we have a deadline for this within two",
        "raw_text": "<v Anish Sai Nimmagadda>they say for the AI team, you know,\nwe have a deadline for this within two</v>"
    },
    {
        "speaker": "Anish",
        "start": 1550.829,
        "end": 1552.554,
        "text": "weeks or something like that.",
        "raw_text": "<v Anish Sai Nimmagadda>weeks or something like that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1553.794,
        "end": 1554.674,
        "text": "Then...",
        "raw_text": "<v Anish Sai Nimmagadda>Then...</v>"
    },
    {
        "speaker": "Anish",
        "start": 1557.154,
        "end": 1560.305,
        "text": "bro, this will need so much more access to be",
        "raw_text": "<v Anish Sai Nimmagadda>I mean, bro,\nthis will need so much more access to be</v>"
    },
    {
        "speaker": "Anish",
        "start": 1560.305,
        "end": 1563.982,
        "text": "able to add to calendar. Like that's how are we planning to do",
        "raw_text": "<v Anish Sai Nimmagadda>able to add to calendar.\nLike that's how are we planning to do</v>"
    },
    {
        "speaker": "Anish",
        "start": 1563.982,
        "end": 1564.274,
        "text": "that?",
        "raw_text": "<v Anish Sai Nimmagadda>that?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1726.074,
        "end": 1729.653,
        "text": "Hey, by the way, I sent something in the group, right?",
        "raw_text": "<v Anish Sai Nimmagadda>Hey, by the way,\nI sent something in the group, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 1729.653,
        "end": 1733.102,
        "text": "So based on whatever little we had discussed so far",
        "raw_text": "<v Anish Sai Nimmagadda>So based on whatever little we had\ndiscussed so far,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1733.102,
        "end": 1736.616,
        "text": "I gave that input to Lord, and then I said",
        "raw_text": "<v Anish Sai Nimmagadda>I gave that input to Lord,\nand then I said, you know,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1736.616,
        "end": 1741.757,
        "text": "I gave the project statement also as well. I gave Sahil, and I said",
        "raw_text": "<v Anish Sai Nimmagadda>I gave the project statement also as well.\nI gave Sahil, and I said, you know,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1741.757,
        "end": 1746.834,
        "text": "give us a skeleton for as to how we can get started on the work and.",
        "raw_text": "<v Anish Sai Nimmagadda>give us a skeleton for as to how we can\nactually get started on the work and.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1747.234,
        "end": 1752.259,
        "text": "I don't think it's it seems pretty good to have thread till phase",
        "raw_text": "<v Anish Sai Nimmagadda>I don't think it's actually it seems\npretty good to have thread till phase</v>"
    },
    {
        "speaker": "Anish",
        "start": 1752.259,
        "end": 1752.594,
        "text": "four.",
        "raw_text": "<v Anish Sai Nimmagadda>four.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1753.434,
        "end": 1757.376,
        "text": "If you guys can also take a look at it once, we can at least decide",
        "raw_text": "<v Anish Sai Nimmagadda>If you guys can also take a look at it\nonce, we can at least decide, you know,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1757.376,
        "end": 1760.819,
        "text": "whether we want to follow this, add some things, remove some things.",
        "raw_text": "<v Anish Sai Nimmagadda>whether we want to follow this,\nadd some things, remove some things.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1760.819,
        "end": 1764.262,
        "text": "And then we can get a rough idea of at least what we're going to do",
        "raw_text": "<v Anish Sai Nimmagadda>And then we can get a rough idea of at\nleast what we're going to do,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1764.262,
        "end": 1767.755,
        "text": "how we're going to approach it, and then we can generally get started",
        "raw_text": "<v Anish Sai Nimmagadda>how we're going to approach it,\nand then we can generally get started</v>"
    },
    {
        "speaker": "Anish",
        "start": 1767.755,
        "end": 1768.354,
        "text": "pretty soon.",
        "raw_text": "<v Anish Sai Nimmagadda>pretty soon.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1915.914,
        "end": 1916.474,
        "text": "Hello?",
        "raw_text": "<v Gurram Vamsi Krishna>Hello?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1920.874,
        "end": 1921.354,
        "text": "Hello!",
        "raw_text": "<v Gurram Vamsi Krishna>Hello!</v>"
    },
    {
        "speaker": "Anish",
        "start": 1920.874,
        "end": 1922.634,
        "text": "Yeah, yeah, yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, yeah, yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1922.794,
        "end": 1928.125,
        "text": "Yeah, yeah, the plan looks good, but I think we should start doing",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, yeah, the plan looks good,\nbut I think we should start doing</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1928.125,
        "end": 1933.535,
        "text": "something so that if we face any problems, we can think what to do.",
        "raw_text": "<v Gurram Vamsi Krishna>something so that if we face any problems,\nwe can think what to do.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1933.535,
        "end": 1937.594,
        "text": "We have not started it. So the plan is good. Okay.",
        "raw_text": "<v Gurram Vamsi Krishna>We have not started it.\nSo the plan is good. Okay.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1938.954,
        "end": 1940.634,
        "text": "And, and also...",
        "raw_text": "<v Gurram Vamsi Krishna>And, and also...</v>"
    },
    {
        "speaker": "Anish",
        "start": 1939.674,
        "end": 1941.786,
        "text": "Oh, so you want to start earlier so that we",
        "raw_text": "<v Anish Sai Nimmagadda>Oh,\nso you want to start earlier so that we</v>"
    },
    {
        "speaker": "Anish",
        "start": 1941.786,
        "end": 1943.994,
        "text": "don't face any problems going forward, right?",
        "raw_text": "<v Anish Sai Nimmagadda>don't face any problems going forward,\nright?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1945.194,
        "end": 1950.565,
        "text": "Or else, if we face any problem, we can think what to do next. If we",
        "raw_text": "<v Gurram Vamsi Krishna>Or else, if we face any problem,\nwe can think what to do next. If we,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1950.565,
        "end": 1955.399,
        "text": "if we just keep on planning, then yeah, in the implementation",
        "raw_text": "<v Gurram Vamsi Krishna>if we just keep on planning, then yeah,\nin the implementation,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1953.034,
        "end": 1954.154,
        "text": "Again, okay, okay, yeah.",
        "raw_text": "<v Anish Sai Nimmagadda>Again, okay, okay, yeah.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1955.399,
        "end": 1960.234,
        "text": "maybe we can face some problems which do not plan, yeah, yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>maybe we can face some problems which do\nnot plan, yeah, yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1957.634,
        "end": 1958.794,
        "text": "Yeah, fair enough, that's it.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, fair enough, that's it.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1961.034,
        "end": 1963.738,
        "text": "Yeah, so that's what I was just trying to get",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah,\nso that's what I was just trying to get</v>"
    },
    {
        "speaker": "Anish",
        "start": 1963.738,
        "end": 1967.794,
        "text": "out a rough skeleton or whatever to give us an idea of how to start",
        "raw_text": "<v Anish Sai Nimmagadda>out a rough skeleton or whatever to give\nus an idea of how to start,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1966.154,
        "end": 1967.274,
        "text": "Yeah, that is good.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, that is good.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1967.794,
        "end": 1971.204,
        "text": "where to start. So, , if this is okay with you all",
        "raw_text": "<v Anish Sai Nimmagadda>where to start. So, I mean,\nif this is okay with you all,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1969.394,
        "end": 1969.514,
        "text": "MUM.",
        "raw_text": "<v Gurram Vamsi Krishna>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 1971.204,
        "end": 1975.025,
        "text": "then maybe we can generally get started. Again, today, tomorrow",
        "raw_text": "<v Anish Sai Nimmagadda>then maybe we can generally get started.\nAgain, today, tomorrow,</v>"
    },
    {
        "speaker": "Anish",
        "start": 1975.025,
        "end": 1976.554,
        "text": "that we'll need to decide.",
        "raw_text": "<v Anish Sai Nimmagadda>that we'll need to decide.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1977.034,
        "end": 1983.319,
        "text": "Yeah, and before that, one thing we need to search how we can",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, and before that,\none thing we need to search how we can</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1983.319,
        "end": 1987.274,
        "text": "inject the PDFs or something PPT and...",
        "raw_text": "<v Gurram Vamsi Krishna>inject the PDFs or something PPT and...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1989.914,
        "end": 1994.706,
        "text": "how we can process them because he expected not only text but also PBTs and",
        "raw_text": "<v Gurram Vamsi Krishna>how we can process them because he\nexpected not only text but also PBTs and</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1994.706,
        "end": 1999.876,
        "text": "PowerPoints and if the speakers mentioned something from them he expected that it",
        "raw_text": "<v Gurram Vamsi Krishna>PowerPoints and if the speakers mentioned\nsomething from them he expected that it</v>"
    },
    {
        "speaker": "Gurram",
        "start": 1999.876,
        "end": 2002.714,
        "text": "would be it should be able to capture those.",
        "raw_text": "<v Gurram Vamsi Krishna>would be it should be able to capture\nthose.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2011.274,
        "end": 2011.754,
        "text": "Hello!",
        "raw_text": "<v Gurram Vamsi Krishna>Hello!</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2013.034,
        "end": 2014.314,
        "text": "Wait, can you repeat that?",
        "raw_text": "<v Prisha Behera>Wait, can you repeat that?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2015.274,
        "end": 2019.006,
        "text": "Yeah, he mentioned that if we upload any PDF or",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah,\nhe mentioned that if we upload any PDF or</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2019.006,
        "end": 2023.594,
        "text": "PPT and if the speaker speaks something based on that PDF.",
        "raw_text": "<v Gurram Vamsi Krishna>PPT and if the speaker speaks something\nbased on that PDF.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2025.194,
        "end": 2028.234,
        "text": "So he told that that should be taken care of.",
        "raw_text": "<v Gurram Vamsi Krishna>So he told that that should be taken care\nof.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2031.194,
        "end": 2031.554,
        "text": "Yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2031.194,
        "end": 2036.954,
        "text": "I, yeah, my bad. I could not hear what happened last one.",
        "raw_text": "<v Anish Sai Nimmagadda>Uh, I, yeah, my bad.\nI could not hear what happened last one.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2035.594,
        "end": 2039.114,
        "text": "Yeah, you could not hear. OK, yeah, I can repeat again.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, you could not hear. OK, yeah,\nI can repeat again.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2040.234,
        "end": 2041.834,
        "text": "Sorry, sorry, did you say hello it?",
        "raw_text": "<v Anish Sai Nimmagadda>Sorry, sorry, did you say hello it?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2041.354,
        "end": 2045.354,
        "text": "No, no, no, no problem. OK, so what he mentioned was...",
        "raw_text": "<v Gurram Vamsi Krishna>No, no, no, no problem. OK,\nso what he mentioned was...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2046.474,
        "end": 2051.481,
        "text": "Don't take only text or raw transcript or raw speaking.",
        "raw_text": "<v Gurram Vamsi Krishna>Don't take only text or raw transcript or\nraw speaking.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2051.481,
        "end": 2058.634,
        "text": "So if you take any file that is uploaded during the meeting and if any speaker.",
        "raw_text": "<v Gurram Vamsi Krishna>So if you take any file that is uploaded\nduring the meeting and if any speaker.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2059.434,
        "end": 2063.289,
        "text": "speaks based on the content in the PDF or PBT",
        "raw_text": "<v Gurram Vamsi Krishna>speaks based on the content in the PDF or\nPBT,</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2063.289,
        "end": 2069.523,
        "text": "then we should be able to capture that. So he's speaking based on that PDF.",
        "raw_text": "<v Gurram Vamsi Krishna>then we should be able to capture that.\nSo he's speaking based on that PDF.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2064.234,
        "end": 2064.634,
        "text": "Ohh.",
        "raw_text": "<v Anish Sai Nimmagadda>Ohh.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2069.523,
        "end": 2072.394,
        "text": "And so he told something like that.",
        "raw_text": "<v Gurram Vamsi Krishna>And so he told something like that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2070.874,
        "end": 2071.594,
        "text": "Food.",
        "raw_text": "<v Anish Sai Nimmagadda>Food.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2075.434,
        "end": 2078.128,
        "text": "How would our, how would we even get access?",
        "raw_text": "<v Anish Sai Nimmagadda>How would our,\nhow would we even get access?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2078.128,
        "end": 2081.241,
        "text": "Let's say some, what does upload in a meeting mean?",
        "raw_text": "<v Anish Sai Nimmagadda>Let's say some,\nwhat does upload in a meeting mean?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2081.241,
        "end": 2084.474,
        "text": "Like he uploaded to that that Team chat or something?",
        "raw_text": "<v Anish Sai Nimmagadda>Like he uploaded to that that Team chat\nor something?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2083.194,
        "end": 2084.474,
        "text": "Yeah, during a meeting, we...",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, during a meeting, we...</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2087.194,
        "end": 2087.834,
        "text": "Yeah, yeah.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, yeah.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2090.874,
        "end": 2093.794,
        "text": "I don't think that's doable, dude.",
        "raw_text": "<v Anish Sai Nimmagadda>I don't think that's doable, dude.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2097.114,
        "end": 2100.314,
        "text": "It seems very difficult, no?",
        "raw_text": "<v Anish Sai Nimmagadda>It seems very difficult, no?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2098.634,
        "end": 2100.954,
        "text": "Also, do it once.",
        "raw_text": "<v Gurram Vamsi Krishna>Also, do it once.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2102.074,
        "end": 2102.954,
        "text": "So how to do that?",
        "raw_text": "<v Gurram Vamsi Krishna>So how to do that?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2104.154,
        "end": 2104.714,
        "text": "MUM.",
        "raw_text": "<v Gurram Vamsi Krishna>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2104.714,
        "end": 2107.954,
        "text": "I'll ask, but that seems very difficult.",
        "raw_text": "<v Anish Sai Nimmagadda>I'll ask, but that seems very difficult.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2110.354,
        "end": 2111.434,
        "text": "Okay.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2116.474,
        "end": 2116.874,
        "text": "Teacher.",
        "raw_text": "<v Anish Sai Nimmagadda>Teacher.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2151.274,
        "end": 2151.914,
        "text": "Support.",
        "raw_text": "<v Anish Sai Nimmagadda>Support.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2288.554,
        "end": 2291.254,
        "text": "The thing is for this to work specially, right",
        "raw_text": "<v Anish Sai Nimmagadda>The thing is for this to work specially,\nright,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2291.254,
        "end": 2295.754,
        "text": "you'll need to have a lot more added permissions. That's all I'm thinking like.",
        "raw_text": "<v Anish Sai Nimmagadda>you'll need to have a lot more added\npermissions. That's all I'm thinking like.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2297.274,
        "end": 2301.875,
        "text": "In implementation also, you'll need to sync what is being said to",
        "raw_text": "<v Anish Sai Nimmagadda>In implementation also,\nyou'll need to sync what is being said to</v>"
    },
    {
        "speaker": "Anish",
        "start": 2301.875,
        "end": 2307.523,
        "text": "maybe information deciding in the files. And unless someone explicitly mentions",
        "raw_text": "<v Anish Sai Nimmagadda>maybe information deciding in the files.\nAnd unless someone explicitly mentions,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2307.523,
        "end": 2312.474,
        "text": "it's hard to make that connexion even for humans, right? I don't know.",
        "raw_text": "<v Anish Sai Nimmagadda>it's hard to make that connexion even for\nhumans, right? I don't know.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2313.674,
        "end": 2316.554,
        "text": "How are LLM is going to be able to do that?",
        "raw_text": "<v Anish Sai Nimmagadda>How are LLM is going to be able to do\nthat?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2325.514,
        "end": 2328.02,
        "text": "See, I guess maybe he was trying to just guide",
        "raw_text": "<v Anish Sai Nimmagadda>See,\nI guess maybe he was trying to just guide</v>"
    },
    {
        "speaker": "Anish",
        "start": 2328.02,
        "end": 2330.42,
        "text": "us, right? Is it necessary that we implement",
        "raw_text": "<v Anish Sai Nimmagadda>us, right?\nIs it necessary that we implement</v>"
    },
    {
        "speaker": "Anish",
        "start": 2330.42,
        "end": 2332.234,
        "text": "everything he said in the meeting?",
        "raw_text": "<v Anish Sai Nimmagadda>everything he said in the meeting?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2342.194,
        "end": 2347.229,
        "text": "It is not fully necessary, but maybe implementing some of them might",
        "raw_text": "<v Gurram Vamsi Krishna>It is not fully necessary,\nbut maybe implementing some of them might</v>"
    },
    {
        "speaker": "Sai",
        "start": 2343.914,
        "end": 2346.954,
        "text": "Then he just gave it as a suggestion.",
        "raw_text": "<v Sai Nishanth Segu>Then he just gave it as a suggestion.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2347.229,
        "end": 2347.594,
        "text": "help.",
        "raw_text": "<v Gurram Vamsi Krishna>help.</v>"
    },
    {
        "speaker": "Sai",
        "start": 2348.394,
        "end": 2352.411,
        "text": "He just gave it a suggestion like we can tell him like we can schedule another",
        "raw_text": "<v Sai Nishanth Segu>He just gave it a suggestion like we can\ntell him like we can schedule another</v>"
    },
    {
        "speaker": "Sai",
        "start": 2352.411,
        "end": 2355.514,
        "text": "meeting and we can tell why this is impossible or something.",
        "raw_text": "<v Sai Nishanth Segu>meeting and we can tell why this is\nimpossible or something.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2384.554,
        "end": 2386.439,
        "text": "Hey, even I think he was probably just",
        "raw_text": "<v Anish Sai Nimmagadda>Hey,\neven I think he was probably just</v>"
    },
    {
        "speaker": "Anish",
        "start": 2386.439,
        "end": 2389.775,
        "text": "suggesting how we can make our thing better. And once we start also",
        "raw_text": "<v Anish Sai Nimmagadda>suggesting how we can make our thing\nbetter. And once we start also,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2389.775,
        "end": 2393.015,
        "text": "we'll probably get an idea, like every time we implement a certain",
        "raw_text": "<v Anish Sai Nimmagadda>we'll probably get an idea,\nlike every time we implement a certain</v>"
    },
    {
        "speaker": "Anish",
        "start": 2393.015,
        "end": 2396.544,
        "text": "part of this skeleton or the structure we're trying to follow",
        "raw_text": "<v Anish Sai Nimmagadda>part of this skeleton or the structure\nwe're trying to follow, you know,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2396.544,
        "end": 2399.832,
        "text": "we'll get obvious ideas like, hey, , we could also do this",
        "raw_text": "<v Anish Sai Nimmagadda>we'll get obvious ideas like, hey,\nyou know, we could also do this,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2399.832,
        "end": 2403.314,
        "text": "maybe we could also do this, we can see that this, something like that.",
        "raw_text": "<v Anish Sai Nimmagadda>maybe we could also do this,\nwe can see that this, something like that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2403.754,
        "end": 2406.839,
        "text": "I think for now, it's more important for us to get started.",
        "raw_text": "<v Anish Sai Nimmagadda>I think for now,\nit's more important for us to get started.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2406.839,
        "end": 2408.074,
        "text": "I think like Vamsi said.",
        "raw_text": "<v Anish Sai Nimmagadda>I think like Vamsi said.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2417.674,
        "end": 2418.474,
        "text": "Are you guys there?",
        "raw_text": "<v Anish Sai Nimmagadda>Are you guys there?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2423.714,
        "end": 2423.994,
        "text": ".",
        "raw_text": "<v Anish Sai Nimmagadda>Mm.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2425.194,
        "end": 2429.354,
        "text": "So do we get started today or do we procrastinate and start tomorrow?",
        "raw_text": "<v Anish Sai Nimmagadda>So do we get started today or do we\nprocrastinate and start tomorrow?</v>"
    },
    {
        "speaker": "Sai",
        "start": 2435.434,
        "end": 2436.954,
        "text": "We start today itself, I guess.",
        "raw_text": "<v Sai Nishanth Segu>We start today itself, I guess.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2438.394,
        "end": 2441.117,
        "text": "Okay, so one other thing I was thinking about",
        "raw_text": "<v Anish Sai Nimmagadda>Okay,\nso one other thing I was thinking about</v>"
    },
    {
        "speaker": "Anish",
        "start": 2441.117,
        "end": 2445.913,
        "text": "just instead of splitting work randomly, maybe we assign two guys or like we are",
        "raw_text": "<v Anish Sai Nimmagadda>just instead of splitting work randomly,\nmaybe we assign two guys or like we are</v>"
    },
    {
        "speaker": "Anish",
        "start": 2445.913,
        "end": 2450.472,
        "text": "assigning work on the same phase so that we can just complete phase by phase",
        "raw_text": "<v Anish Sai Nimmagadda>assigning work on the same phase so that\nwe can just complete phase by phase</v>"
    },
    {
        "speaker": "Anish",
        "start": 2450.472,
        "end": 2454.735,
        "text": "rather than just completing and then trying to put everything together.",
        "raw_text": "<v Anish Sai Nimmagadda>rather than just completing and then\ntrying to put everything together.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2454.735,
        "end": 2457.874,
        "text": "I feel that will be very, very haphazard at the end.",
        "raw_text": "<v Anish Sai Nimmagadda>I feel that will be very,\nvery haphazard at the end.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2460.874,
        "end": 2462.074,
        "text": "Yeah, integrating.",
        "raw_text": "<v Prisha Behera>Yeah, integrating.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2461.834,
        "end": 2461.994,
        "text": "T.",
        "raw_text": "<v Anish Sai Nimmagadda>T.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2463.514,
        "end": 2466.714,
        "text": "All of those pieces would be hard. Like if we...",
        "raw_text": "<v Prisha Behera>All of those pieces would be hard.\nLike if we...</v>"
    },
    {
        "speaker": "Anish",
        "start": 2464.314,
        "end": 2464.474,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2465.914,
        "end": 2469.194,
        "text": "Yeah, yeah, so that's what, sorry to speak.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, yeah, so that's what,\nsorry to speak.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2469.274,
        "end": 2473.033,
        "text": "Yeah, yeah, that one we like, if we try to everyone works on a",
        "raw_text": "<v Prisha Behera>Yeah, yeah, that one we like,\nif we try to everyone works on a</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2473.033,
        "end": 2476.972,
        "text": "different part and then in the end to integrate everyone's thing",
        "raw_text": "<v Prisha Behera>different part and then in the end to\nintegrate everyone's thing,</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2476.972,
        "end": 2480.314,
        "text": "it would be hard because the assumptions are something.",
        "raw_text": "<v Prisha Behera>it would be hard because the assumptions\nare something.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2481.354,
        "end": 2482.394,
        "text": "Might it be different?",
        "raw_text": "<v Prisha Behera>Might it be different?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2483.514,
        "end": 2484.394,
        "text": "Okay, so...",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, so...</v>"
    },
    {
        "speaker": "Anish",
        "start": 2486.714,
        "end": 2490.67,
        "text": "Then, what do we start with? Let's say we're gonna follow this plan",
        "raw_text": "<v Anish Sai Nimmagadda>Then, what do we start with?\nLet's say we're gonna follow this plan</v>"
    },
    {
        "speaker": "Anish",
        "start": 2490.67,
        "end": 2493.288,
        "text": "only, then our phase one would ideally be to",
        "raw_text": "<v Anish Sai Nimmagadda>only,\nthen our phase one would ideally be to</v>"
    },
    {
        "speaker": "Anish",
        "start": 2493.288,
        "end": 2496.954,
        "text": "ingest and normalise input to so input to our structured JSON.",
        "raw_text": "<v Anish Sai Nimmagadda>ingest and normalise input to so input to\nour structured JSON.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2498.114,
        "end": 2499.434,
        "text": "One sec, bye-bye.",
        "raw_text": "<v Anish Sai Nimmagadda>One sec, bye-bye.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2605.914,
        "end": 2608.071,
        "text": "Okay, so how do we split the work?",
        "raw_text": "<v Anish Sai Nimmagadda>Okay,\nso how do we actually split the work?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2608.071,
        "end": 2610.474,
        "text": "How do we, like, how do we get started?",
        "raw_text": "<v Anish Sai Nimmagadda>How do we, like,\nhow do we actually get started?</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2628.234,
        "end": 2632.234,
        "text": "So before that, do you have any idea about how?",
        "raw_text": "<v Gurram Vamsi Krishna>So before that,\ndo you have any idea about how?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2630.314,
        "end": 2630.474,
        "text": "MUM.",
        "raw_text": "<v Anish Sai Nimmagadda>MUM.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2633.274,
        "end": 2637.963,
        "text": "We should provide the input, yeah. , should we search any data sets that",
        "raw_text": "<v Gurram Vamsi Krishna>We should provide the input, yeah. I mean,\nshould we search any data sets that</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2637.963,
        "end": 2640.634,
        "text": "already contain some real world transcripts?",
        "raw_text": "<v Gurram Vamsi Krishna>already contain some real world\ntranscripts?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2642.874,
        "end": 2646.1,
        "text": "wait, Sahil had started the transcript of this",
        "raw_text": "<v Anish Sai Nimmagadda>I mean, wait,\nSahil had started the transcript of this</v>"
    },
    {
        "speaker": "Anish",
        "start": 2646.1,
        "end": 2647.274,
        "text": "meeting only, right?",
        "raw_text": "<v Anish Sai Nimmagadda>meeting only, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2648.354,
        "end": 2652.634,
        "text": "Would we be able to access that? We should be able to access that, right?",
        "raw_text": "<v Anish Sai Nimmagadda>Would we be able to access that?\nWe should be able to access that, right?</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2649.114,
        "end": 2649.674,
        "text": "Yeah.",
        "raw_text": "<v Sahil Mengji>Yeah.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2653.034,
        "end": 2653.274,
        "text": "This.",
        "raw_text": "<v Sahil Mengji>This.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2654.514,
        "end": 2656.794,
        "text": "I had done that using that.",
        "raw_text": "<v Sahil Mengji>I had done that using that.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2654.714,
        "end": 2655.354,
        "text": "So, we can...",
        "raw_text": "<v Anish Sai Nimmagadda>So, we can...</v>"
    },
    {
        "speaker": "Anish",
        "start": 2657.674,
        "end": 2659.434,
        "text": "We can feed this as input, correct?",
        "raw_text": "<v Anish Sai Nimmagadda>We can feed this as input, correct?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2661.034,
        "end": 2662.234,
        "text": "Can cheque how it's done.",
        "raw_text": "<v Anish Sai Nimmagadda>Can cheque how it's done.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2661.354,
        "end": 2665.794,
        "text": "Yeah, but for the initial time, this is so long right for the moment.",
        "raw_text": "<v Gurram Vamsi Krishna>Yeah, but for the initial time,\nthis is so long right for the moment.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2666.794,
        "end": 2668.714,
        "text": "Ha, okay, like that, maybe.",
        "raw_text": "<v Anish Sai Nimmagadda>Ha, okay, like that, maybe.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2668.394,
        "end": 2670.394,
        "text": "To test, we need something small.",
        "raw_text": "<v Gurram Vamsi Krishna>To test, we need something small.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2671.674,
        "end": 2674.723,
        "text": "Honestly, bro, at that point we can just fake it, right?",
        "raw_text": "<v Anish Sai Nimmagadda>Honestly, bro,\nat that point we can just fake it, right?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2674.723,
        "end": 2679.003,
        "text": "We can just use AI to create some short speech or some conversation between two",
        "raw_text": "<v Anish Sai Nimmagadda>We can just use AI to create some short\nspeech or some conversation between two</v>"
    },
    {
        "speaker": "Anish",
        "start": 2679.003,
        "end": 2680.394,
        "text": "or three different people.",
        "raw_text": "<v Anish Sai Nimmagadda>or three different people.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2682.074,
        "end": 2686.048,
        "text": "Decrease, describe, decrease the transcript size",
        "raw_text": "<v Sahil Mengji>Decrease, describe,\ndecrease the transcript size,</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2686.048,
        "end": 2688.274,
        "text": "split it into half, so long.",
        "raw_text": "<v Sahil Mengji>split it into half, so long.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2689.634,
        "end": 2690.874,
        "text": "Yeah, we could do that.",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, we could do that.</v>"
    },
    {
        "speaker": "Gurram",
        "start": 2693.674,
        "end": 2694.954,
        "text": "OK, we can OK.",
        "raw_text": "<v Gurram Vamsi Krishna>OK, we can OK.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2701.274,
        "end": 2701.914,
        "text": "So.",
        "raw_text": "<v Anish Sai Nimmagadda>So.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2702.794,
        "end": 2706.694,
        "text": "Yeah, so , anyways, even though looking for data set up",
        "raw_text": "<v Anish Sai Nimmagadda>Yeah, so I mean, anyways,\neven though looking for data set up,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2706.694,
        "end": 2707.994,
        "text": "in fact, if we can...",
        "raw_text": "<v Anish Sai Nimmagadda>in fact, if we can...</v>"
    },
    {
        "speaker": "Anish",
        "start": 2708.954,
        "end": 2713.053,
        "text": "We can look for how to test it or things to test it with after we've",
        "raw_text": "<v Anish Sai Nimmagadda>We can look for how to test it or things\nto test it with after we've actually</v>"
    },
    {
        "speaker": "Anish",
        "start": 2713.053,
        "end": 2717.311,
        "text": "written this or written the code or at least implemented something for this part",
        "raw_text": "<v Anish Sai Nimmagadda>written this or written the code or at\nleast implemented something for this part</v>"
    },
    {
        "speaker": "Anish",
        "start": 2717.311,
        "end": 2719.834,
        "text": "of the phase, right? Or this phase, what is it?",
        "raw_text": "<v Anish Sai Nimmagadda>of the phase, right? Or this phase,\nwhat is it?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2860.954,
        "end": 2864.756,
        "text": "Hey, honestly, I think we we can take a little time",
        "raw_text": "<v Anish Sai Nimmagadda>Hey, honestly,\nI think we we can take a little time,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2864.756,
        "end": 2867.554,
        "text": "right? Our submission is 27th, correct?",
        "raw_text": "<v Anish Sai Nimmagadda>right? Our submission is 27th, correct?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2868.554,
        "end": 2871.803,
        "text": "We can take a little time today, we can do a little bit more research",
        "raw_text": "<v Anish Sai Nimmagadda>We can take a little time today,\nwe can do a little bit more research</v>"
    },
    {
        "speaker": "Anish",
        "start": 2871.803,
        "end": 2875.377,
        "text": "about how we can get started on phase one. Maybe tomorrow we can meet and we",
        "raw_text": "<v Anish Sai Nimmagadda>about how we can get started on phase one.\nMaybe tomorrow we can meet and we</v>"
    },
    {
        "speaker": "Anish",
        "start": 2875.377,
        "end": 2878.394,
        "text": "generally split the work and get started tomorrow. Is that okay?",
        "raw_text": "<v Anish Sai Nimmagadda>generally split the work and get started\ntomorrow. Is that okay?</v>"
    },
    {
        "speaker": "Anish",
        "start": 2885.914,
        "end": 2886.394,
        "text": "Hello?",
        "raw_text": "<v Anish Sai Nimmagadda>Hello?</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2888.714,
        "end": 2890.474,
        "text": "Yeah, works.",
        "raw_text": "<v Prisha Behera>Yeah, works.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2891.274,
        "end": 2893.674,
        "text": "Okay, I also drop off.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, I also drop off.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2895.594,
        "end": 2898.954,
        "text": "But should we decide to meet time now, or else it's hard to...",
        "raw_text": "<v Prisha Behera>But should we decide to meet time now,\nor else it's hard to...</v>"
    },
    {
        "speaker": "Anish",
        "start": 2899.674,
        "end": 2900.554,
        "text": "For tomorrow.",
        "raw_text": "<v Anish Sai Nimmagadda>For tomorrow.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2901.274,
        "end": 2901.514,
        "text": "MUM.",
        "raw_text": "<v Prisha Behera>MUM.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2902.634,
        "end": 2906.787,
        "text": "Sure, , I'm okay with anything. Too late in the night",
        "raw_text": "<v Anish Sai Nimmagadda>Sure, I mean, I'm okay with anything.\nToo late in the night,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2906.787,
        "end": 2911.69,
        "text": "I and around lunch is difficult. If you guys want to do morning, I can",
        "raw_text": "<v Anish Sai Nimmagadda>I and around lunch is difficult.\nIf you guys want to do morning, I can,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2911.69,
        "end": 2914.074,
        "text": "we can do that. I want to say 8, 9.",
        "raw_text": "<v Anish Sai Nimmagadda>we can do that. I want to say 8, 9.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2913.994,
        "end": 2919.532,
        "text": "I think morning would be better so that like at least we can get started.",
        "raw_text": "<v Prisha Behera>I think morning would be better so that\nlike at least we can get started.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2919.532,
        "end": 2924.695,
        "text": "Like I feel like once we start, then it's easier to like work on it.",
        "raw_text": "<v Prisha Behera>Like I feel like once we start,\nthen it's easier to like work on it.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2924.695,
        "end": 2925.594,
        "text": "But once so.",
        "raw_text": "<v Prisha Behera>But once so.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2926.714,
        "end": 2930.273,
        "text": "Okay, , I'm okay with 830 or 9. You guys let me know.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, I mean, I'm okay with 830 or 9.\nYou guys let me know.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2930.273,
        "end": 2934.662,
        "text": "So I put a message in the group. You guys just either respond or say yes",
        "raw_text": "<v Anish Sai Nimmagadda>So I put a message in the group.\nYou guys just either respond or say yes,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2934.662,
        "end": 2937.866,
        "text": "no, say, , maybe this time and say something",
        "raw_text": "<v Anish Sai Nimmagadda>no, say, you know,\nmaybe this time and say something,</v>"
    },
    {
        "speaker": "Anish",
        "start": 2937.866,
        "end": 2942.908,
        "text": "at least if we start talking, maybe some, , we can get a response from this.",
        "raw_text": "<v Anish Sai Nimmagadda>at least if we start talking, maybe some,\nyou know, we can get a response from this.</v>"
    },
    {
        "speaker": "Anish",
        "start": 2942.908,
        "end": 2944.154,
        "text": "Okay, fine then. Bye.",
        "raw_text": "<v Anish Sai Nimmagadda>Okay, fine then. Bye.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2943.474,
        "end": 2943.634,
        "text": "MUM.",
        "raw_text": "<v Prisha Behera>MUM.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2946.714,
        "end": 2947.114,
        "text": "Bye.",
        "raw_text": "<v Prisha Behera>Bye.</v>"
    },
    {
        "speaker": "Sahil",
        "start": 2949.994,
        "end": 2950.394,
        "text": "Go.",
        "raw_text": "<v Sahil Mengji>Go.</v>"
    },
    {
        "speaker": "Prisha",
        "start": 2954.874,
        "end": 2955.194,
        "text": "Support.",
        "raw_text": "<v Prisha Behera>Support.</v>"
    }
];

const newData = data.map(item => {
    return {
        speaker: item.speaker,
        text: item.text
    }
})

import fs from "fs";

fs.writeFileSync("newData.json", JSON.stringify(newData));
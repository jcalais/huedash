# Huedash
Philips Hue dashboard to be run on a Raspberry pi or similar.

Using Python, Flask, Bootstrap 3, jQuery, noUiSlider, AdminLTE2 theme.

## Changelog
2017-08-26: Added rudimentary Hue motion sensor support. This will show up as a temperature and battery percentage on the sensors page.

!["Screenshot of temperature sensors"](http://i.imgur.com/nlANUY4.png "Temperature")

## Getting started
One prerequisite is having a conf.json file. For your convenience I have left mine in. It contains my super secret Hue App Id assigned by the Hue hub. I don't think there's much you can do to abuse it.

Follow these steps to fulfill all prerequisites:

* Install **python-pip** and **flask** on your Raspberry or similar computer.
* Find out your Hue Hub ip address. Mine is 10.0.0.101, because that is what I've set it to. One easy way to find it is to log on to your router and view all attached devices. Philips hue doesn't have wi-fi, so you'd find it under wired devices.
* Once you know your Hue ip address, verify it works by directing your browser to http://[bridge ip address]/debug/clip.html. If you see the Debug Api tool, you're good to go!
* Fill in the word "api" in the URL: field of the debug interface and {"devicetype":"huedash#iphone peter"} in the Message Body field and press the POST -button in the Api debug tool. This sends a POST request to the Hue Hub to allow a new app access to the hub.
* This is where the Hue Hub says you haven't pressed the link button. Go on and run to your Hue Hub and press the button and return to your computer.
* Press the POST -button once again and you should get a response with "success" and your username. **Copy the username**!
* Now change conf.json to include your Device name, your IP and your new username.

## Start the dashboard

The Hue Dashboard runs on port 80, which on a Unix-system (such as a Raspberry) requires a privileged user (root access), since only root can create services that use ports below 1024. So if you want to make it easy for yourself, you can start the server with root access:

> sudo python hue.py

This should of course be executed in the folder with hue.py.

If you don't want to use port 80 (and sudo), just edit hue.py's last line.

## Navigate to it

The final step is to fire up your favorite browser and direct it to http://[your raspberry ip]

This is more or less what you should see (with your lights):

!["Screenshot of Huedash"](http://i.imgur.com/XFo6KSU.png "Hue dash")

!["Mobile screenshot of Huedash"](http://i.imgur.com/WmT2oxp.png "Hue dash mobile")

_The buttons at the top are for activating scenes (such as "the kids have gone to bed") and the tabs are rooms. "Vardagsrum" = living room. The topmost slider in every room affects all lights in the room. A yellow light in a tab means all lights are on. A blue (or teal or whatever) light means some lights are on._

## Scenes

In order to see the scenes as in the screenshot, you need to add them with the username you just created as the owner.

The easiest way is to just use your Api Debug tool (that we discussed above). 

* First set the lights you wish to make a scene for to the correct brightness and state (on/off).
* Then issue the following URL / Body and press the POST-button in the Api debug tool:

> Url: api/[username]/scenes

> Body: {"name":"Romantic dinner", "lights":["1","2"], "recycle":false, "transitiontime":50}

This would create a Scene called "Romantic dinner" containing lights 1 and 2 with a transitiontime of 5 seconds.

### Deleting scenes

When you create a scene you dislike, you unfortunately have to remove it yourself. In the future I might add a scene creation tool, but until then, just issue the api url api/[username]/scenes/sceneId and press the DELETE-button in the Api Debug tool.

## Making your Hue Hub ip static

In order to make your ip static, follow these instructions carefully:

In your Hue Api debug tool, enter the following:

> Url: api/[username]/config

> Body: {"ipaddress":"10.0.0.101", "dhcp":false, "netmask": "255.255.255.0", "gateway": "10.0.0.1" } 

Obviously you need to carefully modify the parameters above to your environment. When you're confident your params are correct, go ahead and press the PUT-button in the Api Debug tool. Your Hue ip should change immediately. You can test it by navigating to https://[new ip you just specified].

## Known issues

* At the moment, the Hue Api calls are made using javascript between client and hub. This means it won't work outside of your local network. In the future I plan to have all communication happen between the Pi and the Hue Hub, which will make it work from anywhere you can reach the Pi.
* Light states are not replicated when using scenes, so when you press a scene button, the interface might say lights are still on, even though the scene turned them off. This can be fixed by refreshing and in the future I will probably add some kind of light state refresh on tab change.
* Please note that sliding a light's brightness slider to zero doesn't mean it's off. It means it's at its lowest visible brightness. The brightness works independently of the on/off state, so a light can be both off and have a brightness of 50% at the same time.

## Read more

The full Philips Hue Api documentation can be found at

> https://www.developers.meethue.com/philips-hue-api



---
layout: default
---

# Instructions

* The "Deploy to Heroku" button to the left starts the installation process. Heroku is a service that will host your own, personal copy of Streakeeper. Please read the instructions fully before proceeding.
* You may have to log in or create a Heroku account. See the [FAQ](#frequently-asked-questions) for more info.
* After you've set up or logged in to Heroku, you'll see the "Create New App" page. "App name" can be left blank. The USERNAME and PASSWORD fields must be updated with your Duolingo credentials for Streakeeper to work. Your credentials are never stored anywhere except *your* copy of Streakeeper. All the same, we strongly recommend against re-using passwords. See [Security](#security) for more info.
* After you click "Deploy app", Heroku will provision your instance of Streakeeper. Once it's done, you'll see a "View" button that will take you to the setup page for your new Streakeeper instance.
* *You must click the "View" button or Streakeeper will not function properly*

# Frequently Asked Questions

## How does Streakeeper work?

Streakeeper runs every day at a time you specify during setup. By default, it runs at 10:45 EST (11:45 EDT). When it runs, it logs into Duolingo using the username and password you provide. It checks to see if you've met your daily goal. If you haven't, it tries to buy a Streak Freeze (an in-game item that extends your streak for one day of inactivity).

## Why is Heroku asking for a credit card?

Unfortunately, Heroku doesn't allow any use of their service without a credit card on file. The good news: Streakeeper falls within their [free tier](https://www.heroku.com/pricing), so you will not be billed.

## What does Heroku have to do with Streakeeper?

Heroku only hosts the copy of Streakeeper that you use. Your Heroku account information is not associated with Streakeeper in any way.

## How do I turn off Streakeeper?

Streakeeper is hosted on Heroku, using your personal account. To manage or turn off your instance of Streakeeper, [log in to Heroku](https://dashboard.heroku.com/apps), and find the corresponding app. Heroku gives random names to personal apps, so don't worry if the names don't make sense. Click on the app, go to "Settings" and scroll down to find the "Delete app..." button. Click the button, confirm, and you're all set. Streakeeper will no longer run for you.

## I've changed my Duolingo password and now Streakeeper doesn't work. Why?

Streakeeper has to be updated with the new Duolingo password. This can be done by [logging into Heroku](https://dashboard.heroku.com/apps) and navigating to "Settings", as above. There should be a "Reveal Config Vars" button that, when clicked, allows the password to be updated.

## Have a question that's not listed here?

Check our [issues](https://github.com/streakeeper/streakeeper/issues).

Still no luck? [Open a new issue](https://github.com/streakeeper/streakeeper/issues/new)

# Security

Duolingo doesn't have a public API, as of the time of writing. Streakeeper must store your password to have access to your account. This means you are trusting Heroku with your password. Don't re-use your password, *especially* for anything important or sensitive.

The PASSWORD field in the "Create New App" page is not obfuscated due to a technical limitation of Heroku's platform API.

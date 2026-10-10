# @datacircle/node-red-datacircle

A [Node-RED](https://nodered.org) node for [Datacircle](https://datacircle.dev): a LinkedIn profile by its URL, through Up2Data or HarvestAPI, and your balance.

Datacircle is a data co-op.

Step 1: Query your favorite B2B data APIs through us. Same request, same price, no markup.
Step 2: You're DONE. Every morning, you get the flat file of your data plus everyone else's.

You send the provider's own request to api.datacircle.dev, with your Datacircle key. That's the only change.

## Install

In Node-RED: Menu, Manage palette, Install, then search for `@datacircle/node-red-datacircle`. Or in your Node-RED user directory (usually `~/.node-red`):

```
npm install @datacircle/node-red-datacircle
```

Node-RED 3.0 or later, Node.js 18 or later.

## Your API key

Sign up at datacircle.dev with your work email: a $5 credit, that's 2,105 LinkedIn profiles at $2.375 per 1,000. Your API key is on the page once you're in.

In the node, add a **Datacircle API** config and paste the key. Node-RED keeps it in its credentials file, never in the flow.

## Use

- **LinkedIn profile**: the profile's URL in `msg.payload` (or `msg.url`, or the node's URL field). Provider **Up2Data** (the default) or **HarvestAPI**; `msg.provider` overrides it.
- **Balance**: your balance in dollars, and the credits it holds.

The answer is in `msg.payload`: the provider's own JSON plus `datacircle_meta`, with `provider`, `cost_usd` (what this call cost) and `balance_usd` (what is left). `msg.statusCode` is the HTTP status. The node's status shows what is left.

Each request goes to the provider and gets the profile as it is today. You send the profile's URL with your Datacircle key: no LinkedIn login, no cookies, no browser.

A status other than 2xx is an error: a Catch node gets the message, with `msg.statusCode` and `msg.payload`.

- `402`: a call your balance can't cover answers 402. Add funds, from $5, on your dashboard.
- `429`: Up2Data takes $1 a day per account (421 profiles), with a shared daily limit for all customers, then answers 429 until 00:00 UTC; HarvestAPI has no daily limit.
- `422`: Up2Data can't reach that profile (private or deleted). Not charged.

## Example

Menu, Import, Examples, `@datacircle/node-red-datacircle`, **Get a LinkedIn profile**: an Inject with a profile URL, the Datacircle node, a Debug, and a Catch for the errors.

## Links

- [LinkedIn profile API](https://docs.datacircle.dev/linkedin-profile)
- [Pricing](https://docs.datacircle.dev/pricing)
- [Docs](https://docs.datacircle.dev)
- Contact: wayne@datacircle.dev

## License

MIT

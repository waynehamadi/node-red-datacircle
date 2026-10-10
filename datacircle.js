const API = "https://api.datacircle.dev";
const PROVIDERS = ["up2data", "harvestapi", "fetchin"];

module.exports = function (RED) {
    function DatacircleConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
    }
    RED.nodes.registerType("datacircle-config", DatacircleConfigNode, {
        credentials: { apiKey: { type: "password" } }
    });

    function request(apiKey, operation, provider, url) {
        const headers = { Authorization: "Token " + apiKey, "User-Agent": "node-red-datacircle" };
        if (operation === "balance") {
            return fetch(API + "/balance/", { headers, signal: AbortSignal.timeout(60000) });
        }
        headers["X-Data-Provider"] = provider;
        if (provider === "harvestapi") {
            return fetch(API + "/linkedin/profile?url=" + encodeURIComponent(url), { headers, signal: AbortSignal.timeout(60000) });
        }
        if (provider === "fetchin") {
            return fetch(API + "/api/v1/profile?profileUrlOrUrn=" + encodeURIComponent(url), { headers, signal: AbortSignal.timeout(60000) });
        }
        headers["Content-Type"] = "application/json";
        return fetch(API + "/v1/profiles/enrich", {
            method: "POST",
            headers,
            body: JSON.stringify({ url }),
            signal: AbortSignal.timeout(60000)
        });
    }

    function DatacircleNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.account = RED.nodes.getNode(config.account);
        node.operation = config.operation || "profile";
        node.provider = config.provider || "up2data";
        node.url = config.url || "";

        node.on("input", async function (msg, send, done) {
            const apiKey = node.account && node.account.credentials && node.account.credentials.apiKey;
            if (!apiKey) {
                node.status({ fill: "red", shape: "ring", text: "no API key" });
                done(new Error("Datacircle: add a Datacircle API config with your API key"));
                return;
            }
            const operation = msg.operation || node.operation;
            const provider = String(msg.provider || node.provider).trim().toLowerCase();
            const url = String(msg.url || node.url || (typeof msg.payload === "string" ? msg.payload : "")).trim();
            if (operation !== "balance") {
                if (!PROVIDERS.includes(provider)) {
                    done(new Error("Datacircle: provider must be one of " + PROVIDERS.join(", ") + ", not " + provider));
                    return;
                }
                if (!url) {
                    node.status({ fill: "red", shape: "ring", text: "no URL" });
                    done(new Error("Datacircle: put the LinkedIn profile URL in msg.payload, msg.url or the node"));
                    return;
                }
            }
            node.status({ fill: "blue", shape: "dot", text: operation === "balance" ? "balance" : provider });
            try {
                const res = await request(apiKey, operation, provider, url);
                const text = await res.text();
                let body;
                try {
                    body = JSON.parse(text);
                } catch (e) {
                    body = text;
                }
                msg.payload = body;
                msg.statusCode = res.status;
                const meta = body && (body.datacircle_meta || body);
                const left = meta && typeof meta.balance_usd === "number" ? "$" + meta.balance_usd.toFixed(2) + " left" : "";
                if (!res.ok) {
                    node.status({ fill: "red", shape: "dot", text: res.status + (left ? ", " + left : "") });
                    const detail = body && typeof body === "object" ? body.error || body.detail || body.message : body;
                    done(new Error("Datacircle " + res.status + ": " + (typeof detail === "string" ? detail : JSON.stringify(detail || ""))));
                    return;
                }
                node.status({ fill: "green", shape: "dot", text: left || String(res.status) });
                send(msg);
                done();
            } catch (err) {
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                done(err);
            }
        });
    }
    RED.nodes.registerType("datacircle", DatacircleNode);
};

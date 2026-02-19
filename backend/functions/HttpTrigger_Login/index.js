
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

// This function validates the incoming token and checks SharePoint
module.exports = async function (context, req) {
    context.log('Login Request received.');

    // 1. Get Access Token from Request Header (Level 1 Auth)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        context.res = { status: 401, body: "Missing Authorization Header" };
        return;
    }
    const accessToken = authHeader.split(" ")[1];

    // 2. Extract Email from Token (verify signature in real prod)
    // Simplified for reference:
    const email = req.body.email; // Or decode from token

    try {
        // 3. Connect to SharePoint via Graph (Using App Registration Credentials)
        const client = Client.init({
            authProvider: (done) => {
                done(null, process.env.GRAPH_API_TOKEN); // You would use a ClientCredentialAuthProvider here
            }
        });

        // 4. Query "AppUsers" List
        // Filter by MicrosoftEmail
        const siteId = process.env.SHAREPOINT_SITE_ID;
        const listId = process.env.SHAREPOINT_USER_LIST_ID;

        const response = await client.api(`/sites/${siteId}/lists/${listId}/items`)
            .filter(`fields/MicrosoftEmail eq '${email}'`)
            .expand('fields')
            .get();

        if (!response.value || response.value.length === 0) {
            context.res = {
                status: 403,
                body: { error: "User not recognized in SharePoint AppUsers list." }
            };
            return;
        }

        const userItem = response.value[0].fields;

        // 5. Check Status
        if (userItem.Status === 'inactive') {
            context.res = {
                status: 403,
                body: { error: "Account inactive." }
            };
            return;
        }

        // 6. Check Password Change (if applicable)
        const needsPasswordChange = userItem.MustChangePassword;

        // 7. Success
        context.res = {
            body: {
                user: {
                    id: userItem.id,
                    Title: userItem.Title,
                    Role: userItem.Role,
                    Status: userItem.Status,
                    // ... map other fields
                },
                needsPasswordChange: needsPasswordChange
            }
        };

    } catch (error) {
        context.log.error(error);
        context.res = { status: 500, body: "Internal Server Error" };
    }
};

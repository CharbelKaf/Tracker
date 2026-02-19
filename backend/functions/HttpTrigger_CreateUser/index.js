
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

// This function creates a user in SharePoint and sends an invite
module.exports = async function (context, req) {
    const { microsoftEmail, role, firstName, lastName } = req.body;

    // 1. Permission Check (Middleware simulation)
    // Verify requester is Admin...

    try {
        // 2. Service Principal Client
        const client = Client.init({ /* Auth Provider */ });
        const siteId = process.env.SHAREPOINT_SITE_ID;
        const listId = process.env.SHAREPOINT_USER_LIST_ID;

        // 3. Helper: Generate Temp Password
        const tempPass = Math.random().toString(36).slice(-8) + "!";

        // 4. Create Item in SharePoint
        const newItem = {
            fields: {
                Title: `${firstName} ${lastName}`,
                MicrosoftEmail: microsoftEmail,
                Role: role,
                Status: 'pending',
                TemporaryPassword: tempPass,
                MustChangePassword: true,
                CreatedDate: new Date().toISOString()
            }
        };

        await client.api(`/sites/${siteId}/lists/${listId}/items`).post(newItem);

        // 5. Send Email via Graph (User: sendMail)
        const mail = {
            message: {
                subject: "Bienvenue sur Tracker",
                body: {
                    contentType: "HTML",
                    content: `<h1>Bienvenue!</h1><p>Votre mot de passe temporaire est : <strong>${tempPass}</strong></p>`
                },
                toRecipients: [
                    { emailAddress: { address: microsoftEmail } }
                ]
            }
        };

        await client.api('/users/admin-email@tracker.app/sendMail').post(mail);

        context.res = { body: { success: true, message: "User created and email sent." } };

    } catch (error) {
        context.res = { status: 500, body: error.message };
    }
};


